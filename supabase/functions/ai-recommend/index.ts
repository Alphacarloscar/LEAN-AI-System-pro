// ================================================================
// Edge Function: ai-recommend
// Runtime: Supabase Edge (Deno)
//
// Flujo de 10 pasos (security-first):
//   1.  Validar JWT → extraer user
//   2.  Validar payload (engagementId/projectId, tool, context size)
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
// Response shape: { data: <GeneratedContent>, persistence: { saved: boolean, error?: string } }
// ================================================================

import { createClient }           from 'npm:@supabase/supabase-js@2'
import type { SupabaseClient }    from 'npm:@supabase/supabase-js@2'
import type { AIAuditEntry }      from '../_shared/audit-types.ts'

// ── CORS — Allowlist exacta de orígenes permitidos ───────────
// Lista cerrada: cualquier origen fuera de esta lista no recibirá
// el header Access-Control-Allow-Origin y el navegador bloqueará
// la respuesta. No se usan wildcards ni regex.

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',               // desarrollo Vite
  'http://localhost:3000',               // alternativa dev
  'http://localhost:4173',               // vite preview
  'https://lean-ai-system.vercel.app',   // legacy (pre-Sprint 8)
  'https://v0-lean-ai-system.vercel.app', // legacy preview
  'https://gobytech-prod.vercel.app',    // producción GOBY (main)
  'https://gobytech-prod-git-develop-carlos-projects-52e64d02.vercel.app', // preview develop
  'https://lean-ai-system-pro-git-develop-carlos-projects-52e64d02.vercel.app', // lean preview
])

function resolveOrigin(origin: string | null): string | null {
  if (!origin) return null
  return ALLOWED_ORIGINS.has(origin) ? origin : null
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = resolveOrigin(origin)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary':                         'Origin',
  }
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin
  }
  return headers
}

// Headers CORS neutros para respuestas pre-handler (env check, method check)
// donde aún no tenemos el Origin de la request.
const CORS_FALLBACK: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const LLM_TOOLS = new Set([
  // Generic RecommendationPanel tools (T1-T11)
  't1', 't2', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11',
  // Dedicated generation tools
  't3_opportunities', 't6_policy', 't7_plan', 't8_comms',
])

// Timeout de llamada a Anthropic: 55 segundos.
// Inferior al timeout de Supabase Edge (150s) para que la función pueda
// limpiar antes de que la plataforma la mate. El cliente tiene sus propios
// timeouts (62s T7, 90s T8) que actúan como red de seguridad adicional.
const ANTHROPIC_TIMEOUT_MS = 55_000

// Stale after: 90 días para outputs LLM (recomendación de regeneración)
const STALE_AFTER_DAYS = 90

// Versión del schema del payload (bump cuando cambie la estructura del JSON)
const PAYLOAD_VERSION = 1

// Versión de la Edge Function — visible en la respuesta para diagnóstico
const FUNCTION_VERSION = 'ai-recommend-2026-06-04-v2'

// Tamaño máximo del objeto context serializado (50 KB).
// Evita payloads maliciosos o accidentalmente grandes que agoten la memoria.
const CONTEXT_MAX_BYTES = 50_000


// ── Helpers ───────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200, corsH: Record<string, string> = CORS_FALLBACK): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsH, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status: number, corsH: Record<string, string> = CORS_FALLBACK): Response {
  return jsonResponse({ error: message, version: FUNCTION_VERSION }, status, corsH)
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


// ── Lectura de prompts desde BD (Fase 5 ADR-029) ──────────────
//
// Fallback: prompts originales hardcodeados para garantizar resiliencia
// si llm_prompt_templates no está poblada o hay error de BD.

const T1_SYSTEM_PROMPT_FALLBACK = `Eres un consultor senior especializado en adopción estratégica de IA en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar una evaluación de madurez IA (escala 0–4) y generar recomendaciones ejecutivas específicas, priorizadas y accionables.

PRINCIPIOS DE TRABAJO:
1. Las recomendaciones deben ser específicas al sector, tamaño y ecosistema tecnológico de la empresa.
2. Prioriza las brechas críticas, no las dimensiones que ya funcionan bien.
3. Si hay brecha IT/Negocio significativa (diferencia > 0.5 puntos), debe aparecer en las recomendaciones.
4. Conecta dimensiones relacionadas cuando la solución es la misma (no repitas acciones similares).
5. Usa lenguaje ejecutivo directo. El destinatario es un CIO o COO, no un técnico.
6. Si el ecosistema tecnológico es específico (Microsoft, SAP, Salesforce...), recomienda dentro de ese ecosistema cuando sea posible.
7. El horizonte temporal debe ser coherente con el horizonte de valor declarado por la empresa.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: strategy|data|technology|talent|processes|governance",
      "rationale": "Por qué esta acción es prioritaria para ESTA empresa específicamente (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en esta evaluación, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto potencial.`

const T6_SYSTEM_PROMPT_FALLBACK = `Eres un experto en gobernanza de IA y derecho tecnológico europeo. Tu tarea es redactar una política corporativa de adopción de IA personalizada, aplicando el marco de la EU AI Act y las mejores prácticas del sector indicado.

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

async function getSystemPrompt(
  supabase: SupabaseClient,
  domainId: string,
  moduleSlug: string,
  fallback: string,
  domainLabel: string,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('llm_prompt_templates')
      .select('template')
      .eq('domain_id', domainId)
      .eq('module_slug', moduleSlug)
      .eq('prompt_key', 'system_prompt')
      .eq('is_active', true)
      .single()

    if (error) {
      console.warn(`[ai-recommend] getSystemPrompt failed (using fallback): ${moduleSlug}`, error.message)
      return fallback.replace(/\{\{domain_label\}\}/g, domainLabel)
    }

    const template = data?.template ?? fallback
    return template.replace(/\{\{domain_label\}\}/g, domainLabel)
  } catch (err) {
    console.error(`[ai-recommend] getSystemPrompt exception (using fallback): ${moduleSlug}`, err)
    return fallback.replace(/\{\{domain_label\}\}/g, domainLabel)
  }
}


// ── Prompts de sistema por tool ───────────────────────────────

/**
 * T6 — Política Corporativa de IA
 * Modelo: claude-sonnet-4-6 (2000 tokens)
 * Output: GeneratedPolicyContent (sin generatedAt/sector/tamano, añadidos por el hook)
 *
 * Fase 5: System prompt se lee de BD (llm_prompt_templates) con fallback hardcodeado.
 */
async function buildT6Prompt(
  context: Record<string, unknown>,
  supabase: SupabaseClient,
  domainId: string,
  domainLabel: string,
): Promise<{ system: string; user: string }> {
  const system = await getSystemPrompt(supabase, domainId, 't6_risk', T6_SYSTEM_PROMPT_FALLBACK, domainLabel)
  const user = `Genera la política corporativa de IA para esta empresa:\n\n${JSON.stringify(context, null, 2)}`
  return { system, user }
}

/**
 * T7 — Plan de Cambio por fases Rogers
 * Modelo: claude-sonnet-4-6 (2500 tokens)
 * Output: GeneratedChangePlan (sin generatedAt, añadido por el hook)
 */
async function buildT7Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
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
async function buildT8Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
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


/**
 * T3 — Oportunidades IA por proceso (Value Stream)
 * Modelo: claude-haiku-4-5-20251001 (1500 tokens)
 * Output: { opportunities: [{ title, description, effort, impact }] }
 *
 * effort: "bajo" | "medio" | "alto"
 * impact: "bajo" | "medio" | "alto" | "critico"
 */
async function buildT3Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en transformación digital y automatización de procesos empresariales con IA. Tu tarea es identificar oportunidades concretas de aplicación de IA en un proceso de negocio específico.

INSTRUCCIONES DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.
- Todos los campos son obligatorios.
- Redacta en español. Las oportunidades deben ser concretas y aplicables, no genéricas.
- Adapta las oportunidades al sector, tamaño de empresa, ecosistema tecnológico y nivel de madurez indicados.
- El campo effort debe ser exactamente uno de: bajo · medio · alto
- El campo impact debe ser exactamente uno de: bajo · medio · alto · critico

SCHEMA JSON OBLIGATORIO:
{
  "opportunities": [
    {
      "title": "Nombre de la oportunidad IA (5-8 palabras, accionable)",
      "description": "Descripción de cómo aplicar IA en este proceso concreto (2-3 frases). Menciona qué herramienta o técnica de IA aplica y qué resultado de negocio genera.",
      "effort": "bajo|medio|alto",
      "impact": "bajo|medio|alto|critico"
    }
  ]
}

REGLAS:
- Genera entre 3 y 5 oportunidades ordenadas de mayor a menor impacto.
- Prioriza oportunidades que aprovechen los sistemas tecnológicos ya en uso (stages[].system).
- Si la madurez IA es baja (<2.0), sugiere oportunidades de bajo esfuerzo primero.
- Si la categoría IA es "Agentes autónomos", incluye al menos una oportunidad agéntica.`

  const user = `Identifica oportunidades de IA para este proceso:\n\n${JSON.stringify(context, null, 2)}`
  return { system, user }
}


// ── Prompts genéricos (RecommendationPanel) ───────────────────
//
// Todos comparten el mismo output schema:
//   { recommendations: T1Recommendation[], contextualNote: string }
//
// T1Recommendation: { title, dimension, rationale, effort, horizon }
//   effort:  "bajo" | "medio" | "alto"
//   horizon: texto libre (ej. "Semana 1–2", "Mes 3", "Largo plazo")

const GENERIC_REC_SCHEMA = `SCHEMA JSON OBLIGATORIO:
{
  "recommendations": [
    {
      "title": "Título de la recomendación (5-8 palabras, imperativo)",
      "dimension": "Área o categoría de la recomendación (3-4 palabras)",
      "rationale": "Por qué esta recomendación es prioritaria en este contexto específico (2-3 frases concretas)",
      "effort": "bajo|medio|alto",
      "horizon": "Corto plazo (mes 1-2)|Medio plazo (mes 3-4)|Largo plazo (mes 5-6)"
    }
  ],
  "contextualNote": "Observación diagnóstica sobre el estado actual del cliente y el patrón más relevante detectado (2-3 frases directas)"
}

REGLAS:
- Genera entre 3 y 5 recomendaciones ordenadas por prioridad descendente.
- Las recomendaciones deben ser específicas al contexto recibido, no genéricas.
- No repitas información que ya está en el contexto — aporta valor interpretativo.
- Redacta en español. Tono ejecutivo y accionable.`

/**
 * T1 — Diagnóstico de Madurez IA
 * Recibe: T1RecommendationContext (scores por dimensión, gaps, fortalezas, perfil empresa)
 *
 * Fase 5: System prompt se lee de BD (llm_prompt_templates) con fallback hardcodeado.
 */
async function buildT1Prompt(
  context: Record<string, unknown>,
  supabase: SupabaseClient,
  domainId: string,
  domainLabel: string,
): Promise<{ system: string; user: string }> {
  const baseSystem = await getSystemPrompt(supabase, domainId, 't1_radar', T1_SYSTEM_PROMPT_FALLBACK, domainLabel)
  const system = `${baseSystem}

INSTRUCCIONES ADICIONALES:
- Usa assessment.gaps para priorizar las dimensiones con mayor brecha.
- Cruza los gaps con el sector y objetivo principal de {{domain_label}} de la empresa.
- Si hay brecha IT/Negocio significativa (delta > 0.5), incluye una recomendación de alineación.
- Si maturityTier es "Fundacional" (score < 1.5), prioriza quick wins de bajo esfuerzo.`.replace(/\{\{domain_label\}\}/g, domainLabel)

  return { system, user: `Analiza este diagnóstico de madurez {{domain_label}} y genera recomendaciones:\n\n${JSON.stringify(context, null, 2)}`.replace(/\{\{domain_label\}\}/g, domainLabel) }
}

/**
 * T2 — Mapa de Stakeholders
 * Recibe: T2RecommendationContext (distribución por arquetipo/resistencia, críticos, cobertura)
 */
async function buildT2Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en gestión de stakeholders y change management para proyectos de adopción IA. Identificas riesgos de resistencia y tácticas de engagement específicas para cada perfil de organización.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Si hay stakeholders críticos (resistencia alta o arquetipo "critico"), prioriza acciones sobre ellos.
- Si faltan arquetipos clave (coverage.missingArchetypes), recomienda ampliar el mapa.
- Si coverage.hasSponsor es false, incluye siempre una recomendación para identificar o designar sponsor.
- Adapta las tácticas al sector y tamaño de empresa.`

  return { system, user: `Analiza este mapa de stakeholders y genera recomendaciones:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T4 — Portfolio de Casos de Uso IA
 * Recibe: T4RecommendationContext (distribución por estado/categoría, top cases, economics, riesgo AI Act)
 */
async function buildT4Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en priorización de inversiones IA y gestión de portfolios tecnológicos. Evalúas la composición y equilibrio de portfolios de casos de uso IA y recomiendas acciones para maximizar el retorno y minimizar el riesgo regulatorio.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Si risk.highRiskCount > 0, incluye recomendación sobre gestión de riesgo AI Act.
- Si economics.avgPaybackMonths > 18, recomienda revisar la selección del portfolio.
- Si coverage.casesWithoutGoNoGo > 0, recomienda cerrar las decisiones pendientes.
- Usa portfolio.topCases para ser específico en las recomendaciones (cita nombres si es relevante).`

  return { system, user: `Analiza este portfolio de casos de uso IA y genera recomendaciones:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T5 — AI Taxonomy Canvas (Dominios IA)
 * Recibe: T5RecommendationContext (dominios con scores, secuencia de activación, nivel de madurez)
 */
async function buildT5Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en arquitectura IA empresarial y estrategia de dominios tecnológicos. Evalúas la distribución de capacidades IA por dominio y recomiendas la secuencia óptima de activación y desarrollo.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Usa canvas.activationSequence para contextualizar las recomendaciones de orden.
- Prioriza dominios con alto businessValue pero baja technicalReady (oportunidad + brecha).
- Si algún dominio tiene riskLevel alto, recomienda acciones de mitigación previas a su activación.
- Adapta la secuencia al objetivo principal de IA de la empresa.`

  return { system, user: `Analiza este canvas de dominios IA y genera recomendaciones:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T6 — Gobernanza y Riesgo IA (Recomendaciones generales)
 * Recibe: T6RecommendationContext (perfil AI Act, dominios T5, estado portfolio)
 * Nota: t6_policy genera la política completa. t6 genera recomendaciones de governance.
 */
async function buildT6RecPrompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en gobernanza de IA, EU AI Act y compliance tecnológico. Identificas brechas de governance y acciones prioritarias para que las empresas cumplan con la regulación vigente y establezcan una estructura de supervisión robusta.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Si aiActRisk.prohibido > 0, genera una recomendación urgente (esfuerzo alto, corto plazo).
- Si aiActRisk.sinClasificar > total/3, recomienda completar la clasificación como prioridad.
- Si aiActRisk.alto > 0, incluye recomendaciones sobre evaluación de conformidad.
- Considera el sector para identificar regulaciones sectoriales adicionales.`

  return { system, user: `Analiza el perfil de riesgo IA y genera recomendaciones de gobernanza:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T7 — Mapa de Adopción (Heatmap Rogers)
 * Recibe: T7RecommendationContext (distribución por segmento Rogers, ratios early/laggard)
 * Nota: t7_plan genera el plan de cambio completo. t7 genera recomendaciones de adopción.
 */
async function buildT7RecPrompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en gestión del cambio y adopción tecnológica. Analizas perfiles de adopción usando el modelo de Rogers e identificas estrategias diferenciadas para acelerar la difusión de la IA en organizaciones.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Si heatmap.laggardRatio > 40, prioriza estrategias para reducir la resistencia del segmento tardío.
- Si heatmap.earlyAdopterRatio > 30, sugiere activar una red de embajadores formales.
- Genera recomendaciones diferenciadas por segmento Rogers cuando el contexto lo justifique.
- Sé específico sobre departamentos o perfiles si los datos del contexto lo permiten.`

  return { system, user: `Analiza este mapa de adopción y genera recomendaciones:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T8 — Plan de Comunicación IA
 * Recibe: T8RecommendationContext (acciones por fase, canales, mensajes por arquetipo)
 * Nota: t8_comms genera los mensajes por arquetipo. t8 genera recomendaciones del plan.
 */
async function buildT8RecPrompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en comunicación corporativa y gestión del cambio para proyectos de transformación IA. Evalúas planes de comunicación y recomiendas mejoras para aumentar la efectividad y cobertura.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Si commMap.highPriorityCount es bajo (< 20% del total), recomienda revisar la priorización.
- Si hay fases sin acciones (byPhase con count 0), recomienda completar esas fases.
- Si commMap.totalActions es 0, las recomendaciones deben ser fundacionales (cómo empezar).
- Sugiere canales adicionales si el mix de canales es pobre o desequilibrado.`

  return { system, user: `Analiza este plan de comunicación IA y genera recomendaciones:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T9 — Roadmap IA
 * Recibe: T9RecommendationContext (items del roadmap, distribución por mes/riesgo/dept)
 */
async function buildT9Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en planificación y ejecución de programas de transformación IA. Analizas roadmaps de implementación e identificas riesgos de ejecución, solapamientos de capacidad y oportunidades de aceleración.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Si roadmap.withoutOwner > 0, incluye recomendación sobre asignación de responsables.
- Detecta concentraciones de riesgo (byRisk con alto count) y recomienda mitigaciones.
- Si hay concentración de items en pocos meses (byMonth), recomienda redistribuir carga.
- Si roadmap.freeItemCount > roadmap.t4ImportedCount, verifica alineación con el portfolio validado.`

  return { system, user: `Analiza este roadmap IA y genera recomendaciones de ejecución:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T10 — Dashboard Ejecutivo IA (Visión global del programa)
 * Recibe: T10RecommendationContext (madurez, portfolio, adopción, gobernanza agregados)
 */
async function buildT10Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un asesor estratégico de transformación IA. Analizas el estado global de un programa de adopción IA desde una perspectiva ejecutiva y generas recomendaciones transversales de alto impacto para la dirección.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Prioriza recomendaciones que tengan impacto cruzado en múltiples dimensiones del programa.
- Usa dashboard.maturity.criticalGap para identificar la dimensión que más frena el programa.
- Si dashboard.adoption.earlyAdopterRatio < 25, incluye recomendación sobre masa crítica de adopción.
- Si dashboard.portfolio.highRiskCases > 0, incluye recomendación de compliance.
- El tono debe ser directivo y ejecutivo: para CIO/COO, no para técnicos.`

  return { system, user: `Analiza el estado global de este programa IA y genera recomendaciones ejecutivas:\n\n${JSON.stringify(context, null, 2)}` }
}

/**
 * T11 — Modelo Operativo IA (Governance Rhythm)
 * Recibe: T11RecommendationContext (eventos cadencia, decisiones, KPIs, tier de madurez)
 */
async function buildT11Prompt(context: Record<string, unknown>): Promise<{ system: string; user: string }> {
  const system = `Eres un experto en diseño de modelos operativos para programas de IA empresarial. Evalúas la cadencia de governance, la estructura de decisión y los KPIs de seguimiento para garantizar la sostenibilidad del programa.

INSTRUCCIONES:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

${GENERIC_REC_SCHEMA}

INSTRUCCIONES ADICIONALES:
- Si model.adaptiveMode es "basic", recomienda acciones para evolucionar hacia "standard".
- Si model.decisions tiene entradas sin owner, recomienda clarificar la RACI.
- Si model.activeEventCount < 3, recomienda activar más puntos de cadencia críticos.
- Adapta las recomendaciones al maturityTier: las empresas en tier bajo necesitan estructura básica primero.`

  return { system, user: `Analiza este modelo operativo IA y genera recomendaciones:\n\n${JSON.stringify(context, null, 2)}` }
}


// ── Configuración por tool ────────────────────────────────────

interface ToolConfig {
  model:       string
  maxTokens:   number
  buildPrompt: (
    ctx: Record<string, unknown>,
    supabase?: SupabaseClient,
    domainId?: string,
    domainLabel?: string
  ) => Promise<{ system: string; user: string }>
}

const TOOL_CONFIG: Record<string, ToolConfig> = {
  // ── Generic RecommendationPanel tools ──────────────────────
  t1:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1500, buildPrompt: buildT1Prompt },
  t2:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1200, buildPrompt: buildT2Prompt },
  t4:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1500, buildPrompt: buildT4Prompt },
  t5:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1200, buildPrompt: buildT5Prompt },
  t6:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1200, buildPrompt: buildT6RecPrompt },
  t7:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1200, buildPrompt: buildT7RecPrompt },
  t8:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1200, buildPrompt: buildT8RecPrompt },
  t9:  { model: 'claude-haiku-4-5-20251001', maxTokens: 1200, buildPrompt: buildT9Prompt },
  t10: { model: 'claude-sonnet-4-6',         maxTokens: 1500, buildPrompt: buildT10Prompt },
  t11: { model: 'claude-haiku-4-5-20251001', maxTokens: 1200, buildPrompt: buildT11Prompt },
  // ── Dedicated generation tools ──────────────────────────────
  t3_opportunities: { model: 'claude-haiku-4-5-20251001', maxTokens: 1500, buildPrompt: buildT3Prompt },
  t6_policy:        { model: 'claude-sonnet-4-6',         maxTokens: 2000, buildPrompt: buildT6Prompt },
  t7_plan:          { model: 'claude-sonnet-4-6',         maxTokens: 2500, buildPrompt: buildT7Prompt },
  t8_comms:         { model: 'claude-haiku-4-5-20251001', maxTokens: 3000, buildPrompt: buildT8Prompt },
}


// ── Llamada a Anthropic Claude API ────────────────────────────

interface AnthropicMessage {
  role:    'user' | 'assistant'
  content: string
}

/** Resultado completo de la llamada a Claude — incluye métricas de consumo. */
interface ClaudeResult {
  text:             string
  modelResponded:   string   // modelo real en la respuesta (puede diferir del solicitado)
  inputTokens:      number   // prompt_tokens en nomenclatura estándar
  outputTokens:     number   // completion_tokens
  cacheWriteTokens: number   // tokens escritos a prompt cache (0 si no aplica)
  cacheReadTokens:  number   // tokens leídos de prompt cache (0 si no aplica)
  stopReason:       string
}

async function callClaude(
  apiKey:    string,
  model:     string,
  maxTokens: number,
  system:    string,
  messages:  AnthropicMessage[],
): Promise<ClaudeResult> {
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
      model:       string
      usage: {
        input_tokens:                 number
        output_tokens:                number
        cache_creation_input_tokens?: number
        cache_read_input_tokens?:     number
      }
    }

    if (!result.content?.[0]?.text) {
      throw new Error('Anthropic devolvió una respuesta vacía o malformada.')
    }

    if (result.stop_reason === 'max_tokens') {
      console.warn(`[ai-recommend] stop_reason=max_tokens para model=${model}. Considera aumentar maxTokens.`)
    }

    return {
      text:             result.content[0].text,
      modelResponded:   result.model,
      inputTokens:      result.usage.input_tokens,
      outputTokens:     result.usage.output_tokens,
      cacheWriteTokens: result.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens:  result.usage.cache_read_input_tokens     ?? 0,
      stopReason:       result.stop_reason,
    }

  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La llamada a Anthropic superó el timeout de 55 segundos.')
    }
    throw err
  }
}


// ── Audit log de métricas de IA — fire-and-forget ─────────────
//
// Inserta en audit_logs las métricas de consumo de tokens de cada
// llamada a Anthropic. Usa el cliente admin (service_role) para que
// la inserción no dependa de permisos RLS del usuario.
// Su propio try/catch garantiza que un fallo de logging NUNCA
// interrumpa ni retrase la respuesta al frontend.
//
// El tipo AIAuditEntry se importa desde ../_shared/audit-types.ts
// para mantener SSOT entre Edge Functions (ADR-017).

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logAIAudit(supabaseAdmin: any, entry: AIAuditEntry): void {
  // Guardia defensiva: user_id es obligatorio para atribución de costes (ADR-017).
  // Si llega vacío, es un bug de llamada — se registra el error y se aborta el log
  // en lugar de insertar un registro huérfano con user_id = NULL.
  if (!entry.userId) {
    console.error('[ai-recommend][audit_log] Aborted: entry.userId is empty — JWT extraction failed before logAIAudit call.')
    return
  }

  const totalTokens = (entry.inputTokens !== null && entry.outputTokens !== null)
    ? entry.inputTokens + entry.outputTokens
    : null

  void (async () => {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id:          entry.userId,
          user_email:       entry.userEmail,
          user_role:        null,
          service_name:     'edge.ai-recommend',
          method_name:      entry.tool,
          args_payload:     { project_id: entry.projectId, context_bytes: entry.contextBytes },
          status:           entry.status,
          response_payload: entry.status === 'success'
            ? { model_responded: entry.modelResponded, chars: null }
            : null,
          error_message:    entry.errorMessage,
          error_stack:      null,
          duration_ms:      entry.durationMs,
          resource_id:      entry.projectId,
          metadata: {
            provider:           'anthropic',
            model_requested:    entry.modelRequested,
            model_responded:    entry.modelResponded,
            input_tokens:       entry.inputTokens,
            output_tokens:      entry.outputTokens,
            total_tokens:       totalTokens,
            cache_write_tokens: entry.cacheWriteTokens,
            cache_read_tokens:  entry.cacheReadTokens,
            stop_reason:        entry.stopReason,
            function_version:   FUNCTION_VERSION,
          },
        })

      if (error) {
        console.warn('[ai-recommend][audit_log] Insert failed (non-critical):', error.message)
      }
    } catch (err) {
      console.warn('[ai-recommend][audit_log] Unexpected error (non-critical):', err)
    }
  })()
}


// ── Handler principal ─────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {

  // Capturar Origin al inicio para construir CORS headers dinámicos
  const origin = req.headers.get('Origin')
  const corsH  = buildCorsHeaders(origin)

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsH })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsH)
  }

  // ── Variables de entorno ──────────────────────────────────────
  const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
  const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
    console.error('[ai-recommend] Missing required environment variables')
    return errorResponse('Server misconfiguration', 500, corsH)
  }


  // ── PASO 1 — Validar JWT ──────────────────────────────────────
  // Cliente admin temporal SOLO para auth.getUser(). No se usa para datos.

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Missing or invalid Authorization header', 401, corsH)
  }
  const jwt = authHeader.slice(7)

  const supabaseAuth = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt)
  if (authError || !user) {
    console.warn('[ai-recommend] JWT inválido:', authError?.message)
    return errorResponse('Unauthorized: token inválido o expirado', 401, corsH)
  }

  console.log(`[ai-recommend] User: ${user.id}`)


  // ── PASO 2 — Validar payload ──────────────────────────────────

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse('Request body inválido: se esperaba JSON', 400, corsH)
  }

  // Acepta engagementId (nombre legacy en hooks) o projectId (nombre canónico)
  const projectId = (body.projectId ?? body.engagementId) as string | undefined
  const tool      = body.tool                             as string | undefined
  const context   = body.context                          as Record<string, unknown> | undefined

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return errorResponse('Payload inválido: falta engagementId (o projectId)', 400, corsH)
  }
  if (!tool || !LLM_TOOLS.has(tool)) {
    return jsonResponse(
      {
        error:      `Payload inválido: tool "${tool ?? '(vacío)'}" no soportado.`,
        error_code: 'unsupported_tool_code',
        tool:        tool ?? null,
        valid_tools: [...LLM_TOOLS],
        version:     FUNCTION_VERSION,
      },
      400,
      corsH,
    )
  }
  if (!context || typeof context !== 'object') {
    return errorResponse('Payload inválido: falta context', 400, corsH)
  }

  // Validar tamaño del context (max 50 KB serializado)
  const contextBytes = JSON.stringify(context).length
  if (contextBytes > CONTEXT_MAX_BYTES) {
    console.warn(`[ai-recommend] context demasiado grande: ${contextBytes} bytes (max ${CONTEXT_MAX_BYTES})`)
    return errorResponse(
      `Payload inválido: el contexto supera el tamaño máximo permitido (${CONTEXT_MAX_BYTES / 1000} KB).`,
      400,
      corsH,
    )
  }

  const toolConfig = TOOL_CONFIG[tool]!
  console.log(`[ai-recommend] tool=${tool} project=${projectId} context_bytes=${contextBytes}`)


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
    return errorResponse('Error al verificar permisos de proyecto', 500, corsH)
  }

  if (!canEdit) {
    console.warn(`[ai-recommend] 403: user=${user.id} no puede editar project=${projectId}`)
    return errorResponse(
      'Forbidden: no tienes permiso de escritura en este proyecto (se requiere rol editor o superior).',
      403,
      corsH,
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
    console.error('[ai-recommend][rate_limit_check_failed]', {
      message: rateError.message,
      code:    (rateError as Record<string, unknown>).code,
      details: (rateError as Record<string, unknown>).details,
      hint:    (rateError as Record<string, unknown>).hint,
      tool,
      projectId,
    })
    return jsonResponse(
      {
        error:      'Error al verificar límite de llamadas',
        error_code: 'rate_limit_check_failed',
        stage:      'rate_limit',
        tool,
        version:    FUNCTION_VERSION,
      },
      500,
      corsH,
    )
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
          ...corsH,
          'Content-Type': 'application/json',
          'Retry-After':  String(rateCheck?.retry_after_seconds ?? 60),
        },
      },
    )
  }

  console.log(`[ai-recommend] Rate OK: ${rateCheck.calls_in_window}/${rateCheck.limit}`)


  // ── Leer domain_id y domain_label para interpolación de prompts ────
  // Fase 5: prompts se parametrizan por dominio. Necesitamos leer domain_id
  // del proyecto para buscar el prompt correcto en llm_prompt_templates.

  const { data: projectData, error: projectError } = await supabaseUser
    .from('projects')
    .select('domain_id, domain_label: governance_domains(label)')
    .eq('id', projectId)
    .single()

  const domainId = projectData?.domain_id ?? '00000000-0000-0000-0000-000000000000'
  const domainLabel = (projectData?.domain_label as { label?: string } | null)?.label ?? 'IA'

  if (projectError) {
    console.warn('[ai-recommend] Error leyendo domain_id:', projectError.message)
  }


  // ── PASO 9 — Llamar a Anthropic Claude API ────────────────────
  // El timer mide solo la latencia de la llamada LLM, no el paso de guardado.
  // logAIAudit se dispara inmediatamente tras callClaude (éxito o error) para
  // garantizar que ningún token quede sin registrar aunque falle el paso 10.

  const { system, user: userMessage } = await toolConfig.buildPrompt(context, supabaseUser, domainId, domainLabel)

  const llmStartedAt = Date.now()
  let claudeResult: ClaudeResult
  try {
    claudeResult = await callClaude(
      ANTHROPIC_API_KEY,
      toolConfig.model,
      toolConfig.maxTokens,
      system,
      [{ role: 'user', content: userMessage }],
    )
  } catch (err) {
    const durationMs = Date.now() - llmStartedAt
    const msg        = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[ai-recommend] Error Anthropic:', msg)

    logAIAudit(supabaseAdmin, {
      userId:           user.id,
      userEmail:        user.email ?? null,
      projectId,
      tool,
      status:           'error',
      durationMs,
      contextBytes,
      errorMessage:     msg,
      modelRequested:   toolConfig.model,
      modelResponded:   null,
      inputTokens:      null,
      outputTokens:     null,
      cacheWriteTokens: null,
      cacheReadTokens:  null,
      stopReason:       null,
    })

    return errorResponse(`Error al generar contenido con IA: ${msg}`, 502, corsH)
  }

  const llmDurationMs = Date.now() - llmStartedAt
  const rawLLMText    = claudeResult.text

  // Registrar consumo de tokens ANTES de cualquier procesamiento posterior.
  // Si el JSON parse o el guardado fallan, los tokens ya están registrados.
  logAIAudit(supabaseAdmin, {
    userId:           user.id,
    userEmail:        user.email ?? null,
    projectId,
    tool,
    status:           'success',
    durationMs:       llmDurationMs,
    contextBytes,
    errorMessage:     null,
    modelRequested:   toolConfig.model,
    modelResponded:   claudeResult.modelResponded,
    inputTokens:      claudeResult.inputTokens,
    outputTokens:     claudeResult.outputTokens,
    cacheWriteTokens: claudeResult.cacheWriteTokens,
    cacheReadTokens:  claudeResult.cacheReadTokens,
    stopReason:       claudeResult.stopReason,
  })

  console.log(
    `[ai-recommend] Anthropic OK (${rawLLMText.length} chars) ${llmDurationMs}ms` +
    ` | in=${claudeResult.inputTokens} out=${claudeResult.outputTokens}` +
    ` total=${claudeResult.inputTokens + claudeResult.outputTokens}` +
    ` model=${claudeResult.modelResponded}`,
  )


  // ── Parsear y validar JSON ────────────────────────────────────
  // Validación obligatoria ANTES de guardar. Si el JSON es basura, se devuelve
  // 502 controlado — no se persiste nada y el frontend recibe un error claro.

  let generatedData: Record<string, unknown>
  try {
    generatedData = JSON.parse(extractJSON(rawLLMText))
  } catch {
    console.error('[ai-recommend] JSON parse error. Raw (500 chars):', rawLLMText.slice(0, 500))
    return errorResponse(
      'La IA devolvió una respuesta que no pudo procesarse. Inténtalo de nuevo.',
      502,
      corsH,
    )
  }

  // Validación mínima de estructura por tool
  if (tool === 't6_policy' && (!generatedData.declaracion_opening || !Array.isArray(generatedData.principios))) {
    return errorResponse('La IA no devolvió una política válida. Inténtalo de nuevo.', 502, corsH)
  }
  if (tool === 't7_plan' && (!Array.isArray(generatedData.phases) || (generatedData.phases as unknown[]).length === 0)) {
    return errorResponse('La IA no devolvió un plan de cambio válido. Inténtalo de nuevo.', 502, corsH)
  }
  if (tool === 't8_comms' && (!Array.isArray(generatedData.archetypeMessages) || (generatedData.archetypeMessages as unknown[]).length === 0)) {
    return errorResponse('La IA no devolvió mensajes por arquetipo válidos. Inténtalo de nuevo.', 502, corsH)
  }


  // ── PASO 10 — Guardar output en Supabase (user-scoped) ─────────
  //
  // Usamos el cliente user-scoped para que auth.uid() dentro de save_tool_output
  // sea el del usuario real (no service_role). La función archiva el output
  // anterior (LLM tools) e inserta la nueva versión activa.
  //
  // Error de guardado: no bloquea la respuesta al frontend, pero SÍ se comunica
  // explícitamente vía persistence.saved = false. La UI debe mostrar un aviso
  // al usuario — no hay fallback silencioso a localStorage.

  const { error: saveError } = await supabaseUser.rpc('save_tool_output', {
    p_project_id:      projectId,
    p_tool_code:       tool,
    p_payload:         generatedData,
    p_stale_after:     staleAfterISO(STALE_AFTER_DAYS),
    p_payload_version: PAYLOAD_VERSION,
  })

  const persistence = saveError
    ? { saved: false, error: saveError.message }
    : { saved: true }

  if (saveError) {
    console.error('[ai-recommend] save_tool_output error (non-blocking):', saveError.message)
  } else {
    console.log(`[ai-recommend] Guardado en DB: project=${projectId} tool=${tool}`)
  }


  // ── Respuesta al frontend ─────────────────────────────────────
  // Shape: { data: <GeneratedContent>, persistence: { saved: boolean, error?: string } }
  // Los hooks añaden generatedAt (y sector/tamano para T6) en el cliente.
  // La UI debe usar persistence.saved para mostrar aviso si el guardado falló.

  return jsonResponse({ data: generatedData, persistence, version: FUNCTION_VERSION }, 200, corsH)
})
