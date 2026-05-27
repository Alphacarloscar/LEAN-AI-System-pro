// ================================================================
// Edge Function: ai-recommend
// Runtime: Supabase Edge (Deno)
//
// Flujo de 10 pasos (security-first):
//   1.  Validar JWT → extraer user
//   2.  Validar payload (engagementId/projectId, tool)
//   3.  Crear cliente user-scoped (ANON_KEY + JWT)
//   4.  Verificar permiso de edición: user_can_edit_project()
//   5.  403 si false o error
//   6.  Crear cliente admin (SERVICE_ROLE_KEY)
//   7.  Rate limiting: check_and_log_ai_call()
//   8.  429 si rate limit superado
//   9.  Llamar a Anthropic Claude API con prompt específico por tool
//   10. Guardar output en Supabase (save_tool_output) + responder al frontend
//
// Tools soportados: t6_policy · t7_plan · t8_comms
// Response shape: { data: <GeneratedContent> }
// ================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Constantes ────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const LLM_TOOLS = new Set(['t6_policy', 't7_plan', 't8_comms'])

// Timeout de llamada a Anthropic: 55 segundos.
// Inferior al timeout de Supabase Edge (150s) para que la función pueda
// limpiar antes de que la plataforma la mate. El cliente tiene sus propios
// timeouts (62s T7, 90s T8) que actúan como red de seguridad adicional.
const ANTHROPIC_TIMEOUT_MS = 55_000

// Stale after: 90 días para outputs LLM (recomendación de regeneración)
const STALE_AFTER_DAYS = 90

// Versión del schema del payload (bump cuando cambie la estructura del JSON)
const PAYLOAD_VERSION = 1


// ── Helpers ───────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status)
}

/**
 * Extrae el bloque JSON de la respuesta de Claude.
 * Claude a veces envuelve el JSON en ```json ... ``` — esto lo limpia.
 */
function extractJSON(text: string): string {
  const trimmed = text.trim()
  const fenced  = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i)
  if (fenced) return fenced[1].trim()
  return trimmed
}

/**
 * Calcula stale_after = ahora + N días en formato ISO 8601.
 */
function staleAfterISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}


// ── Prompts de sistema por tool ───────────────────────────────

/**
 * T6 — Política Corporativa de IA
 * Modelo: claude-sonnet-4-6 (2000 tokens)
 * Output: GeneratedPolicyContent (sin generatedAt/sector/tamano, añadidos por el hook)
 */
function buildT6Prompt(context: Record<string, unknown>): { system: string; user: string } {
  const system = `Eres un experto en gobernanza de IA y derecho tecnológico europeo. Tu tarea es redactar una política corporativa de adopción de IA personalizada, aplicando el marco de la EU AI Act y las mejores prácticas del sector indicado.

INSTRUCCIONES DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.
- Todos los campos son obligatorios.
- Redacta en español formal, con lenguaje corporativo preciso.
- Adapta cada sección al sector, tamaño de empresa y objetivo de IA específicos del contexto.

SCHEMA JSON OBLIGATORIO:
{
  "declaracion_opening": "Párrafo de apertura de la declaración de intenciones (3-4 frases). Contextualiza la política en el sector específico y menciona el compromiso con la EU AI Act.",
  "declaracion_mandate": "Párrafo del mandato de registro y evaluación (2-3 frases). Indica qué sistemas requieren evaluación de riesgo y quién es responsable.",
  "alcance_context": "Párrafo de contexto del alcance para este sector/empresa (3-4 frases). Define perimetrialmente qué sistemas y procesos quedan dentro y fuera de la política.",
  "principios": [
    { "title": "Nombre del principio", "desc": "Descripción de 2-3 frases aplicada específicamente al sector" }
  ],
  "contexto_sectorial": "Párrafo sobre riesgos regulatorios y oportunidades específicos del sector bajo la EU AI Act (3-4 frases). Menciona categorías de riesgo relevantes y normativa sectorial aplicable."
}

PRINCIPIOS: genera EXACTAMENTE 6 principios cubriendo: transparencia, responsabilidad, equidad, privacidad, supervisión humana, mejora continua.`

  const user = `Genera la política corporativa de IA para esta empresa:\n\n${JSON.stringify(context, null, 2)}`
  return { system, user }
}

/**
 * T7 — Plan de Cambio por fases Rogers
 * Modelo: claude-sonnet-4-6 (2500 tokens)
 * Output: GeneratedChangePlan (sin generatedAt, añadido por el hook)
 */
function buildT7Prompt(context: Record<string, unknown>): { system: string; user: string } {
  const system = `Eres un experto en gestión del cambio y adopción de IA empresarial. Utilizas el modelo de difusión de innovaciones de Rogers (Innovators, Early Adopters, Early Majority, Late Majority, Laggards) para diseñar planes de cambio por segmentos.

INSTRUCCIONES DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.
- Todos los campos son obligatorios.
- Redacta en español. Usa lenguaje ejecutivo y accionable.
- Las acciones deben ser concretas y realizables por un equipo interno, no genéricas.
- Basa la estrategia de cada fase en los datos reales de stakeholders y casos de uso del contexto.

SCHEMA JSON OBLIGATORIO:
{
  "phases": [
    {
      "phase": "Mes 1–2",
      "title": "Título de la fase (4-6 palabras)",
      "icon": "emoji representativo",
      "objective": "Objetivo principal de la fase (1-2 frases concretas)",
      "segments": ["segmento Rogers principal", "segmento secundario si aplica"],
      "actions": ["Acción concreta 1", "Acción concreta 2", "Acción concreta 3", "Acción concreta 4"],
      "risk": "Riesgo principal de esta fase y cómo mitigarlo (1 frase)"
    }
  ],
  "contextualNote": "Observación crítica sobre el patrón de adopción específico de esta empresa basada en los datos (2-3 frases diagnósticas y accionables)"
}

FASES: genera EXACTAMENTE 4 fases con los períodos: "Mes 1–2", "Mes 3", "Mes 4", "Mes 5–6".`

  const user = `Diseña el plan de cambio para esta organización:\n\n${JSON.stringify(context, null, 2)}`
  return { system, user }
}

/**
 * T8 — Mensajes por Arquetipo de Stakeholder
 * Modelo: claude-haiku-4-5-20251001 (3000 tokens)
 * Output: GeneratedT8Content (sin generatedAt, añadido por el hook)
 *
 * Archetype codes: adoptador · ambassador · decisor · reticente · critico
 * Channel values (exactos): email · reunion_presencial · teams_slack · presentacion · video · documento
 */
function buildT8Prompt(context: Record<string, unknown>): { system: string; user: string } {
  const system = `Eres un experto en comunicación corporativa y gestión del cambio. Tu especialidad es redactar mensajes persuasivos adaptados al perfil psicológico de cada stakeholder en procesos de adopción de IA empresarial.

INSTRUCCIONES DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.
- Todos los campos son obligatorios.
- Redacta en español. Los mensajes deben ser auténticos y directos, no corporativos vacíos.
- Genera un mensaje por cada arquetipo que aparezca en el array byArchetype del contexto.
- Si aparece archetypeCode "especialista", trátalo exactamente igual que "reticente".
- El canal (channel) DEBE ser exactamente uno de: email · reunion_presencial · teams_slack · presentacion · video · documento

SCHEMA JSON OBLIGATORIO:
{
  "archetypeMessages": [
    {
      "archetypeCode": "adoptador|ambassador|decisor|reticente|critico",
      "archetypeLabel": "Etiqueta legible del arquetipo",
      "headline": "Titular del mensaje (máx. 12 palabras, captura la propuesta de valor para este arquetipo)",
      "keyPoints": ["Punto clave 1 (1 frase)", "Punto clave 2 (1 frase)", "Punto clave 3 (1 frase)"],
      "doNotSay": "Lo que NUNCA debes decirle a este arquetipo (1 frase directa y específica)",
      "openingLine": "Primera frase de un email/mensaje real a este arquetipo. Debe capturar atención inmediatamente.",
      "channel": "canal más efectivo (exactamente uno de los valores válidos)",
      "resistanceNote": "Resistencia típica de este arquetipo y cómo abordarla (1-2 frases)"
    }
  ],
  "contextualNote": "Observación sobre el mix de arquetipos y la estrategia de comunicación prioritaria para esta organización (2-3 frases concretas)"
}`

  const user = `Genera los mensajes por arquetipo para esta organización:\n\n${JSON.stringify(context, null, 2)}`
  return { system, user }
}


// ── Configuración por tool ────────────────────────────────────

interface ToolConfig {
  model:       string
  maxTokens:   number
  buildPrompt: (ctx: Record<string, unknown>) => { system: string; user: string }
}

const TOOL_CONFIG: Record<string, ToolConfig> = {
  t6_policy: { model: 'claude-sonnet-4-6',          maxTokens: 2000, buildPrompt: buildT6Prompt },
  t7_plan:   { model: 'claude-sonnet-4-6',          maxTokens: 2500, buildPrompt: buildT7Prompt },
  t8_comms:  { model: 'claude-haiku-4-5-20251001',  maxTokens: 3000, buildPrompt: buildT8Prompt },
}


// ── Llamada a Anthropic Claude API ────────────────────────────

interface AnthropicMessage {
  role:    'user' | 'assistant'
  content: string
}

async function callClaude(
  apiKey:    string,
  model:     string,
  maxTokens: number,
  system:    string,
  messages:  AnthropicMessage[],
): Promise<string> {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '(no body)')
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`)
    }

    const result = await response.json() as {
      content:     Array<{ type: string; text: string }>
      stop_reason: string
    }

    if (!result.content?.[0]?.text) {
      throw new Error('Anthropic devolvió una respuesta vacía o malformada.')
    }

    if (result.stop_reason === 'max_tokens') {
      console.warn(`[ai-recommend] stop_reason=max_tokens para model=${model}. Considera aumentar maxTokens.`)
    }

    return result.content[0].text

  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La llamada a Anthropic superó el timeout de 55 segundos.')
    }
    throw err
  }
}


// ── Handler principal ─────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  // ── Variables de entorno ──────────────────────────────────────
  const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
  const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
    console.error('[ai-recommend] Missing required environment variables')
    return errorResponse('Server misconfiguration', 500)
  }


  // ── PASO 1 — Validar JWT ──────────────────────────────────────
  // Cliente admin temporal SOLO para auth.getUser(). No se usa para datos.

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Missing or invalid Authorization header', 401)
  }
  const jwt = authHeader.slice(7)

  const supabaseAuth = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt)
  if (authError || !user) {
    console.warn('[ai-recommend] JWT inválido:', authError?.message)
    return errorResponse('Unauthorized: token inválido o expirado', 401)
  }

  console.log(`[ai-recommend] User: ${user.id}`)


  // ── PASO 2 — Validar payload ──────────────────────────────────

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse('Request body inválido: se esperaba JSON', 400)
  }

  // Acepta engagementId (nombre legacy en hooks) o projectId (nombre canónico)
  const projectId = (body.projectId ?? body.engagementId) as string | undefined
  const tool      = body.tool                             as string | undefined
  const context   = body.context                          as Record<string, unknown> | undefined

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return errorResponse('Payload inválido: falta engagementId (o projectId)', 400)
  }
  if (!tool || !LLM_TOOLS.has(tool)) {
    return errorResponse(
      `Payload inválido: tool "${tool}" no soportado. Válidos: ${[...LLM_TOOLS].join(', ')}`,
      400,
    )
  }
  if (!context || typeof context !== 'object') {
    return errorResponse('Payload inválido: falta context', 400)
  }

  const toolConfig = TOOL_CONFIG[tool]!
  console.log(`[ai-recommend] tool=${tool} project=${projectId}`)


  // ── PASO 3 — Cliente user-scoped ─────────────────────────────
  // RLS activo con auth.uid() = user.id para todas las operaciones de datos.

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth:   { persistSession: false },
  })


  // ── PASOS 4 + 5 — Verificar permiso de edición ────────────────
  //
  // BLOQUEO DE TOKENS: esta verificación ocurre ANTES de llamar a Anthropic.
  // client_viewer + project_members[role=viewer] → 403 inmediato.
  // Ningún token de Claude se consume para usuarios sin permiso de escritura.

  const { data: canEdit, error: permError } = await supabaseUser.rpc(
    'user_can_edit_project',
    { p_project_id: projectId },
  )

  if (permError) {
    console.error('[ai-recommend] Error en user_can_edit_project:', permError.message)
    return errorResponse('Error al verificar permisos de proyecto', 500)
  }

  if (!canEdit) {
    console.warn(`[ai-recommend] 403: user=${user.id} no puede editar project=${projectId}`)
    return errorResponse(
      'Forbidden: no tienes permiso de escritura en este proyecto (se requiere rol editor o superior).',
      403,
    )
  }


  // ── PASO 6 — Cliente admin para rate limiting ─────────────────
  // Solo usado para check_and_log_ai_call (service_role only RPC).

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })


  // ── PASOS 7 + 8 — Rate limiting ───────────────────────────────
  // Advisory lock en la DB garantiza atomicidad: sin race conditions.

  const { data: rateCheck, error: rateError } = await supabaseAdmin.rpc(
    'check_and_log_ai_call',
    { p_user_id: user.id, p_project_id: projectId, p_tool_code: tool },
  )

  if (rateError) {
    console.error('[ai-recommend] Error en check_and_log_ai_call:', rateError.message)
    return errorResponse('Error al verificar límite de llamadas', 500)
  }

  if (!rateCheck?.allowed) {
    console.warn(`[ai-recommend] 429: user=${user.id} tool=${tool}`)
    return new Response(
      JSON.stringify({
        error:               'Demasiadas solicitudes. Espera un momento antes de intentarlo de nuevo.',
        calls_in_window:     rateCheck?.calls_in_window,
        limit:               rateCheck?.limit,
        retry_after_seconds: rateCheck?.retry_after_seconds ?? 60,
      }),
      {
        status:  429,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Retry-After':  String(rateCheck?.retry_after_seconds ?? 60),
        },
      },
    )
  }

  console.log(`[ai-recommend] Rate OK: ${rateCheck.calls_in_window}/${rateCheck.limit}`)


  // ── PASO 9 — Llamar a Anthropic Claude API ────────────────────

  const { system, user: userMessage } = toolConfig.buildPrompt(context)

  let rawLLMText: string
  try {
    rawLLMText = await callClaude(
      ANTHROPIC_API_KEY,
      toolConfig.model,
      toolConfig.maxTokens,
      system,
      [{ role: 'user', content: userMessage }],
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[ai-recommend] Error Anthropic:', msg)
    return errorResponse(`Error al generar contenido con IA: ${msg}`, 502)
  }

  console.log(`[ai-recommend] Anthropic OK (${rawLLMText.length} chars)`)


  // ── Parsear y validar JSON ────────────────────────────────────

  let generatedData: Record<string, unknown>
  try {
    generatedData = JSON.parse(extractJSON(rawLLMText))
  } catch {
    console.error('[ai-recommend] JSON parse error. Raw (500 chars):', rawLLMText.slice(0, 500))
    return errorResponse(
      'La IA devolvió una respuesta que no pudo procesarse. Inténtalo de nuevo.',
      502,
    )
  }

  // Validación mínima de estructura por tool
  if (tool === 't6_policy' && (!generatedData.declaracion_opening || !Array.isArray(generatedData.principios))) {
    return errorResponse('La IA no devolvió una política válida. Inténtalo de nuevo.', 502)
  }
  if (tool === 't7_plan' && (!Array.isArray(generatedData.phases) || (generatedData.phases as unknown[]).length === 0)) {
    return errorResponse('La IA no devolvió un plan de cambio válido. Inténtalo de nuevo.', 502)
  }
  if (tool === 't8_comms' && (!Array.isArray(generatedData.archetypeMessages) || (generatedData.archetypeMessages as unknown[]).length === 0)) {
    return errorResponse('La IA no devolvió mensajes por arquetipo válidos. Inténtalo de nuevo.', 502)
  }


  // ── PASO 10 — Guardar output en Supabase (user-scoped) ─────────
  //
  // Usamos el cliente user-scoped para que auth.uid() dentro de save_tool_output
  // sea el del usuario real (no service_role). La función archiva el output
  // anterior (LLM tools) e inserta la nueva versión activa.
  //
  // Error de guardado: no bloquea la respuesta.
  // El frontend recibirá el output aunque falle la persistencia en DB.
  // El localStorage del cliente actúa como fallback (mientras se migran los stores).

  const { error: saveError } = await supabaseUser.rpc('save_tool_output', {
    p_project_id:      projectId,
    p_tool_code:       tool,
    p_payload:         generatedData,
    p_stale_after:     staleAfterISO(STALE_AFTER_DAYS),
    p_payload_version: PAYLOAD_VERSION,
  })

  if (saveError) {
    console.error('[ai-recommend] save_tool_output error (non-blocking):', saveError.message)
  } else {
    console.log(`[ai-recommend] Guardado en DB: project=${projectId} tool=${tool}`)
  }


  // ── Respuesta al frontend ─────────────────────────────────────
  // Shape: { data: <GeneratedContent> }
  // Los hooks añaden generatedAt (y sector/tamano para T6) en el cliente.

  return jsonResponse({ data: generatedData })
})
