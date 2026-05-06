// ============================================================
// Prompt T1 — Madurez IA (Maturity Radar)
//
// Genera 4–5 recomendaciones priorizadas basadas en:
//   - Perfil de empresa (sector, tamaño, ecosistema tech, objetivo IA)
//   - Scores por dimensión y subdimensión (0–4)
//   - Brecha IT / Negocio (cuando hay datos de ambos tipos)
//   - Evidencias cualitativas del consultor (campo libre)
//
// Respuesta esperada: JSON estructurado, sin texto adicional.
// ============================================================

// ── Tipos de contexto ────────────────────────────────────────
// (Espejo del tipo T1RecommendationContext del frontend)

interface SubdimensionCtx {
  code:     string
  label:    string
  score:    number | null
  evidence: string
}

interface DimensionCtx {
  code:         string
  label:        string
  score:        number | null
  subdimensions: SubdimensionCtx[]
}

interface ITBizGap {
  itOverallScore:  number
  bizOverallScore: number
  deltas: { dimension: string; label: string; itScore: number; bizScore: number; delta: number }[]
}

interface FrictionCtx {
  tipo:       string
  area:       string
  frecuencia: string | null
  impacto:    string | null
}

interface T1Context {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
    valueHorizon:    string
    techEcosystem:   string
    restrictions:    string
    priorityAreas:   string[]
    frictions:       FrictionCtx[]
  }
  assessment: {
    overallScore:    number
    maturityTier:    string
    maturityLabel:   string
    strengths:       { code: string; label: string; score: number }[]
    gaps:            { code: string; label: string; score: number }[]
    dimensions:      DimensionCtx[]
    itBizGap:        ITBizGap | null
  }
}

// ── Sistema ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un consultor senior especializado en adopción estratégica de IA en empresas B2B medianas y grandes del mercado español y europeo.

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

// ── Constructor del mensaje de usuario ──────────────────────

export function buildT1Prompt(ctx: unknown): { system: string; user: string } {
  const c = ctx as T1Context

  const { company, assessment } = c

  // Sección empresa
  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}
Horizonte de valor esperado: ${company.valueHorizon || 'No especificado'}
Ecosistema tecnológico principal: ${company.techEcosystem || 'No especificado'}
Áreas prioritarias: ${company.priorityAreas.length > 0 ? company.priorityAreas.join(', ') : 'No especificadas'}
${company.restrictions ? `Restricciones relevantes: ${company.restrictions}` : ''}
${company.frictions.length > 0 ? `\nFricciones organizativas identificadas:\n${company.frictions.map(f =>
  `  - ${f.tipo}${f.area ? ` (${f.area})` : ''}${f.impacto ? ` — Impacto: ${f.impacto}` : ''}`
).join('\n')}` : ''}`

  // Sección evaluación
  const assessmentBlock = `## EVALUACIÓN DE MADUREZ IA

Score global: ${assessment.overallScore.toFixed(2)} / 4.0 (${assessment.maturityLabel})

Dimensiones evaluadas (score 0–4, null = sin datos):
${assessment.dimensions.map(d => {
  const score = d.score !== null ? d.score.toFixed(2) : 'sin datos'
  const subsWithEvidence = d.subdimensions.filter(s => s.evidence && s.evidence.trim())
  const evidenceText = subsWithEvidence.length > 0
    ? `\n     Evidencias: ${subsWithEvidence.map(s => `"${s.evidence.trim()}"`).join(' | ')}`
    : ''
  const subScores = d.subdimensions
    .filter(s => s.score !== null)
    .map(s => `${s.label}: ${s.score!.toFixed(1)}`)
    .join(', ')
  return `  ${d.label} (${d.code}): ${score}${subScores ? `\n     Subdimensiones: ${subScores}` : ''}${evidenceText}`
}).join('\n')}

Fortalezas detectadas (top dimensiones):
${assessment.strengths.map(s => `  - ${s.label}: ${s.score.toFixed(2)}`).join('\n') || '  Ninguna con score suficiente'}

Brechas críticas (dimensiones con mayor gap vs objetivo 3.5):
${assessment.gaps.map(g => `  - ${g.label}: ${g.score.toFixed(2)} (gap: ${(3.5 - g.score).toFixed(2)})`).join('\n') || '  Sin brechas significativas'}`

  // Sección brecha IT/Negocio (solo si existe)
  let itBizBlock = ''
  if (assessment.itBizGap) {
    const gap = assessment.itBizGap
    const delta = gap.itOverallScore - gap.bizOverallScore
    const direction = delta > 0 ? 'TI percibe mayor madurez que Negocio' : 'Negocio percibe mayor madurez que TI'
    itBizBlock = `\n## BRECHA PERCEPCIÓN IT / NEGOCIO

Score global TI: ${gap.itOverallScore.toFixed(2)} | Score global Negocio: ${gap.bizOverallScore.toFixed(2)}
Diferencia: ${Math.abs(delta).toFixed(2)} puntos — ${direction}

Mayores discrepancias por dimensión:
${gap.deltas
  .filter(d => Math.abs(d.delta) >= 0.5)
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  .slice(0, 3)
  .map(d => `  - ${d.label}: TI ${d.itScore.toFixed(1)} vs Negocio ${d.bizScore.toFixed(1)} (Δ ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(1)})`)
  .join('\n') || '  No hay discrepancias significativas por dimensión'}`
  }

  const user = `${companyBlock}

${assessmentBlock}${itBizBlock}

Genera las recomendaciones para esta empresa.`

  return { system: SYSTEM_PROMPT, user }
}
