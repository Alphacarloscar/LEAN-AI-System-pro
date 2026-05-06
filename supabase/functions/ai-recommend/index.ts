// ============================================================
// Edge Function: ai-recommend  (archivo único — deploy por dashboard)
//
// Orquestador de recomendaciones LLM para el L.E.A.N. AI System.
// Recibe { tool, context } y devuelve recomendaciones estructuradas.
//
// Variables de entorno requeridas (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ── Config ───────────────────────────────────────────────────

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL   = 'claude-sonnet-4-6'
const MAX_TOKENS     = 1500

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T1 — Madurez IA
// ═══════════════════════════════════════════════════════════════

const T1_SYSTEM_PROMPT = `Eres un consultor senior especializado en adopción estratégica de IA en empresas B2B medianas y grandes del mercado español y europeo.

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

function buildT1UserMessage(ctx: Record<string, unknown>): string {
  const company    = (ctx.company    ?? {}) as Record<string, unknown>
  const assessment = (ctx.assessment ?? {}) as Record<string, unknown>

  const frictions = (company.frictions as unknown[]) ?? []
  const priorityAreas = (company.priorityAreas as string[]) ?? []
  const dimensions = (assessment.dimensions as unknown[]) ?? []
  const strengths  = (assessment.strengths  as unknown[]) ?? []
  const gaps       = (assessment.gaps       as unknown[]) ?? []

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}
Horizonte de valor esperado: ${company.valueHorizon || 'No especificado'}
Ecosistema tecnológico principal: ${company.techEcosystem || 'No especificado'}
Áreas prioritarias: ${priorityAreas.length > 0 ? priorityAreas.join(', ') : 'No especificadas'}
${company.restrictions ? `Restricciones relevantes: ${company.restrictions}` : ''}
${frictions.length > 0 ? `\nFricciones organizativas identificadas:\n${(frictions as Record<string, unknown>[]).map(f =>
  `  - ${f.tipo}${f.area ? ` (${f.area})` : ''}${f.impacto ? ` — Impacto: ${f.impacto}` : ''}`
).join('\n')}` : ''}`

  const dimLines = (dimensions as Record<string, unknown>[]).map(d => {
    const score = d.score !== null && d.score !== undefined ? Number(d.score).toFixed(2) : 'sin datos'
    const subs = ((d.subdimensions as Record<string, unknown>[]) ?? [])
    const subsWithEvidence = subs.filter(s => s.evidence && String(s.evidence).trim())
    const evidenceText = subsWithEvidence.length > 0
      ? `\n     Evidencias: ${subsWithEvidence.map(s => `"${String(s.evidence).trim()}"`).join(' | ')}`
      : ''
    const subScores = subs
      .filter(s => s.score !== null && s.score !== undefined)
      .map(s => `${s.label}: ${Number(s.score).toFixed(1)}`)
      .join(', ')
    return `  ${d.label} (${d.code}): ${score}${subScores ? `\n     Subdimensiones: ${subScores}` : ''}${evidenceText}`
  }).join('\n')

  const assessmentBlock = `## EVALUACIÓN DE MADUREZ IA

Score global: ${assessment.overallScore !== undefined ? Number(assessment.overallScore).toFixed(2) : 'N/A'} / 4.0 (${assessment.maturityLabel || ''})

Dimensiones evaluadas (score 0–4, null = sin datos):
${dimLines}

Fortalezas detectadas (top dimensiones):
${(strengths as Record<string, unknown>[]).map(s => `  - ${s.label}: ${Number(s.score).toFixed(2)}`).join('\n') || '  Ninguna con score suficiente'}

Brechas críticas (dimensiones con mayor gap vs objetivo 3.5):
${(gaps as Record<string, unknown>[]).map(g => `  - ${g.label}: ${Number(g.score).toFixed(2)} (gap: ${(3.5 - Number(g.score)).toFixed(2)})`).join('\n') || '  Sin brechas significativas'}`

  const itBizGap = assessment.itBizGap as Record<string, unknown> | null
  let itBizBlock = ''
  if (itBizGap) {
    const deltas = ((itBizGap.deltas as Record<string, unknown>[]) ?? [])
      .filter(d => Math.abs(Number(d.delta)) >= 0.5)
      .sort((a, b) => Math.abs(Number(b.delta)) - Math.abs(Number(a.delta)))
      .slice(0, 3)

    const itScore  = Number(itBizGap.itOverallScore)
    const bizScore = Number(itBizGap.bizOverallScore)
    const delta    = itScore - bizScore
    const direction = delta > 0 ? 'TI percibe mayor madurez que Negocio' : 'Negocio percibe mayor madurez que TI'

    itBizBlock = `\n## BRECHA PERCEPCIÓN IT / NEGOCIO

Score global TI: ${itScore.toFixed(2)} | Score global Negocio: ${bizScore.toFixed(2)}
Diferencia: ${Math.abs(delta).toFixed(2)} puntos — ${direction}

Mayores discrepancias por dimensión:
${deltas.length > 0
  ? deltas.map(d => `  - ${d.label}: TI ${Number(d.itScore).toFixed(1)} vs Negocio ${Number(d.bizScore).toFixed(1)} (Δ ${Number(d.delta) > 0 ? '+' : ''}${Number(d.delta).toFixed(1)})`).join('\n')
  : '  No hay discrepancias significativas por dimensión'}`
  }

  return `${companyBlock}\n\n${assessmentBlock}${itBizBlock}\n\nGenera las recomendaciones para esta empresa.`
}

// ═══════════════════════════════════════════════════════════════
// ROUTER DE PROMPTS
// ═══════════════════════════════════════════════════════════════

function buildPrompt(tool: string, context: unknown): { system: string; user: string } {
  const ctx = context as Record<string, unknown>
  switch (tool) {
    case 't1':
      return { system: T1_SYSTEM_PROMPT, user: buildT1UserMessage(ctx) }
    default:
      throw new Error(`Tool no soportado: ${tool}`)
  }
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE API
// ═══════════════════════════════════════════════════════════════

async function callClaude(system: string, user: string): Promise<unknown> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada en Supabase Secrets')

  const response = await fetch(CLAUDE_API_URL, {
    method:  'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = (data?.content?.[0]?.text ?? '') as string

  // Extraer JSON de la respuesta (por si Claude añade texto extra)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Claude no devolvió JSON válido. Respuesta: ${text.slice(0, 200)}`)

  return JSON.parse(jsonMatch[0])
}

// ═══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status:  405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { tool, context } = body

    if (!tool || !context) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros: tool y context son obligatorios' }), {
        status:  400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { system, user } = buildPrompt(tool, context)
    const result = await callClaude(system, user)

    return new Response(JSON.stringify({ data: result }), {
      status:  200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[ai-recommend]', message)
    return new Response(JSON.stringify({ error: message }), {
      status:  500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
