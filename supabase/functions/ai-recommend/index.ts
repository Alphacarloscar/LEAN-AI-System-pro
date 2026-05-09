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
// PROMPT T2 — Stakeholder Matrix
// ═══════════════════════════════════════════════════════════════

const T2_SYSTEM_PROMPT = `Eres un consultor senior especializado en gestión del cambio y adopción de IA en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar el mapa de stakeholders de un proyecto de adopción IA y generar recomendaciones ejecutivas específicas, priorizadas y accionables para el consultor que gestiona el engagement.

PRINCIPIOS DE TRABAJO:
1. Prioriza siempre los stakeholders con resistencia alta y rol de decisor o crítico — son los que pueden matar el proyecto.
2. Un sponsor ejecutivo (decisor con bajo bloqueo) es el activo más valioso. Si falta, recomienda cómo conseguirlo.
3. Los stakeholders con manualOverride tienen asignación manual del consultor — úsalos con mayor peso en el análisis.
4. Si hay pocos stakeholders entrevistados, señala explícitamente que el mapa tiene cobertura baja y las recomendaciones son provisionales.
5. Conecta las recomendaciones con el sector y objetivo IA de la empresa cuando sea relevante.
6. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: sponsor|blockers|coverage|communication|coalition",
      "rationale": "Por qué esta acción es prioritaria para ESTE mapa de stakeholders (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este mapa de stakeholders, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor riesgo/impacto para el proyecto.`

function buildT2UserMessage(ctx: Record<string, unknown>): string {
  const company      = (ctx.company      ?? {}) as Record<string, unknown>
  const stakeholders = (ctx.stakeholders ?? {}) as Record<string, unknown>
  const coverage     = (ctx.coverage     ?? {}) as Record<string, unknown>

  const critical     = (stakeholders.critical     as unknown[]) ?? []
  const byArchetype  = (stakeholders.byArchetype  as unknown[]) ?? []
  const byResistance = (stakeholders.byResistance as unknown[]) ?? []

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}
Horizonte de valor esperado: ${company.valueHorizon || 'No especificado'}`

  const archLines = (byArchetype as Record<string, unknown>[])
    .map(a => `  ${a.label} (${a.archetype}): ${a.count} — resistencia promedio: ${a.avgResistance}`)
    .join('\n')

  const resistLines = (byResistance as Record<string, unknown>[])
    .map(r => `  ${r.level}: ${r.count}`)
    .join('\n')

  const criticalLines = (critical as Record<string, unknown>[])
    .map(s => {
      const override = s.manualOverride ? ' [asignación manual]' : ''
      const interview = s.hasInterview ? ' ✓ entrevistado' : ' ✗ sin entrevista'
      return `  - ${s.name} (${s.role}, ${s.department}) → ${s.archetype} / resistencia ${s.resistance}${override}${interview}`
    })
    .join('\n')

  const missingArchetypes = (coverage.missingArchetypes as string[]) ?? []

  const stakeholderBlock = `## MAPA DE STAKEHOLDERS

Total stakeholders: ${stakeholders.total ?? 0}
Con entrevista completada: ${stakeholders.withInterview ?? 0}
Con asignación manual (override): ${stakeholders.withManualOverride ?? 0}

Distribución por arquetipo:
${archLines || '  Sin datos'}

Distribución por resistencia:
${resistLines || '  Sin datos'}

Stakeholders críticos (alta resistencia o bloqueadores potenciales):
${criticalLines || '  Ninguno identificado'}

## COBERTURA DEL MAPA

Sponsor ejecutivo identificado: ${coverage.hasSponsor ? 'SÍ' : 'NO — riesgo crítico'}
Departamentos representados: ${(coverage.departmentsRepresented as string[])?.join(', ') || 'No especificado'}
Arquetipos sin representación: ${missingArchetypes.length > 0 ? missingArchetypes.join(', ') : 'Ninguno — mapa completo'}`

  return `${companyBlock}\n\n${stakeholderBlock}\n\nGenera las recomendaciones de gestión del cambio para este mapa de stakeholders.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T4 — Use Case Priority Board
// ═══════════════════════════════════════════════════════════════

const T4_SYSTEM_PROMPT = `Eres un consultor senior especializado en priorización de casos de uso IA y diseño de portfolios de transformación digital en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar el portfolio de casos de uso IA de un cliente y generar recomendaciones ejecutivas específicas, priorizadas y accionables para el consultor que gestiona el engagement.

PRINCIPIOS DE TRABAJO:
1. Focaliza en los casos "go" con mayor ROI potencial — son la prueba de valor del proyecto.
2. Si hay casos de alto riesgo AI Act (alto o prohibido) sin governance documentado, señálalo explícitamente.
3. Si el porcentaje de casos sin scoring de stakeholders es alto (>50%), recomienda completarlo antes de tomar decisiones go/no-go.
4. Conecta las recomendaciones con el sector y objetivo IA principal de la empresa.
5. Si el payback medio supera los 12 meses, propón quick wins concretos para mejorar el business case.
6. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: prioritization|roi|governance|coverage|roadmap",
      "rationale": "Por qué esta acción es prioritaria para ESTE portfolio (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este portfolio, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto potencial.`

function buildT4UserMessage(ctx: Record<string, unknown>): string {
  const company   = (ctx.company   ?? {}) as Record<string, unknown>
  const portfolio = (ctx.portfolio ?? {}) as Record<string, unknown>
  const economics = (ctx.economics ?? {}) as Record<string, unknown>
  const risk      = (ctx.risk      ?? {}) as Record<string, unknown>
  const coverage  = (ctx.coverage  ?? {}) as Record<string, unknown>

  const byStatus     = (portfolio.byStatus     as unknown[]) ?? []
  const byAICategory = (portfolio.byAICategory as unknown[]) ?? []
  const topCases     = (portfolio.topCases     as unknown[]) ?? []

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}
Horizonte de valor esperado: ${company.valueHorizon || 'No especificado'}`

  const statusLines = (byStatus as Record<string, unknown>[])
    .map(s => `  ${s.status}: ${s.count}`)
    .join('\n')

  const catLines = (byAICategory as Record<string, unknown>[])
    .map(c => `  ${c.category}: ${c.count} total (${c.goCount} go)`)
    .join('\n')

  const topLines = (topCases as Record<string, unknown>[])
    .map(c => {
      const eco = c.annualSaving ? ` | Ahorro: €${Number(c.annualSaving).toLocaleString('es')} / año` : ''
      const payback = c.paybackMonths ? ` | Payback: ${c.paybackMonths}m` : ''
      const risk = c.aiActRisk ? ` | AI Act: ${c.aiActRisk}` : ''
      return `  - ${c.name} (${c.department}) → Score: ${c.priorityScore}/100 | ${c.status}${eco}${payback}${risk}`
    })
    .join('\n')

  const fmtEur = (n: number) => n >= 1_000_000 ? `€${(n/1_000_000).toFixed(1)}M` : `€${Math.round(n/1_000)}k`

  const portfolioBlock = `## PORTFOLIO DE CASOS DE USO

Total casos: ${portfolio.total ?? 0}

Por estado:
${statusLines || '  Sin datos'}

Por categoría IA:
${catLines || '  Sin datos'}

Top casos por prioridad:
${topLines || '  Sin datos'}

## ANÁLISIS ECONÓMICO

Ahorro anual estimado (portfolio go): ${economics.totalAnnualSaving ? fmtEur(Number(economics.totalAnnualSaving)) : 'Sin datos'}
Inversión estimada total: ${economics.totalImplCost ? fmtEur(Number(economics.totalImplCost)) : 'Sin datos'}
Payback medio: ${economics.avgPaybackMonths ? `${economics.avgPaybackMonths} meses` : 'Sin datos'}
Casos con modelo económico: ${economics.casesWithEconomics ?? 0} de ${portfolio.total ?? 0}

## RIESGO AI ACT

Casos de alto riesgo / prohibido: ${risk.highRiskCount ?? 0}
Casos sin clasificar: ${risk.unclassifiedCount ?? 0}
Distribución: ${(risk.aiActDistribution as Record<string, unknown>[] ?? []).map((r: Record<string, unknown>) => `${r.level}: ${r.count}`).join(', ') || 'Sin datos'}

## COBERTURA

Casos con scoring de stakeholders: ${coverage.casesWithScoring ?? 0} de ${portfolio.total ?? 0}
Casos con hoja de ruta definida: ${coverage.casesWithRoadmap ?? 0} de ${portfolio.total ?? 0}
Casos pendientes de decisión go/no-go: ${coverage.casesWithoutGoNoGo ?? 0}`

  return `${companyBlock}\n\n${portfolioBlock}\n\nGenera las recomendaciones de priorización para este portfolio.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T5 — AI Domain Architecture Canvas
// ═══════════════════════════════════════════════════════════════

const T5_SYSTEM_PROMPT = `Eres un consultor senior especializado en arquitectura de dominios IA y diseño de estrategias de adopción tecnológica en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar el canvas de dominios IA de un cliente y generar recomendaciones ejecutivas específicas sobre la secuencia de activación, governance y maduración de capacidades IA.

PRINCIPIOS DE TRABAJO:
1. La secuencia de activación importa — no todos los dominios se activan simultáneamente.
2. Dominios con recomendación "gobernar_primero" son señal de riesgo de governance; señálalo explícitamente.
3. Conecta la secuencia recomendada con el nivel de madurez IA de la organización.
4. Si hay dominios con alto valor de negocio pero baja preparación técnica, propón un camino de habilitación concreto.
5. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: activation|governance|sequencing|foundations|scaling",
      "rationale": "Por qué esta acción es prioritaria para ESTE canvas (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este canvas, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto estratégico.`

function buildT5UserMessage(ctx: Record<string, unknown>): string {
  const company  = (ctx.company  ?? {}) as Record<string, unknown>
  const canvas   = (ctx.canvas   ?? {}) as Record<string, unknown>

  const domains   = (canvas.domains   as unknown[]) ?? []
  const sequence  = (canvas.activationSequence as string[]) ?? []

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}
Nivel de madurez IA: ${canvas.maturityLevel || 'No especificado'}`

  const domainLines = (domains as Record<string, unknown>[])
    .map(d => {
      const s = (d.scores ?? {}) as Record<string, unknown>
      return `  - ${d.domainCode}: Valor negocio ${s.businessValue}/100 | Madurez técnica ${s.technicalReady}/100 | Preparación org ${s.orgReadiness}/100 | Riesgo ${s.riskLevel}/100 → ${d.recommendation}`
    })
    .join('\n')

  const canvasBlock = `## CANVAS DE DOMINIOS IA

Nivel de madurez global: ${canvas.maturityLevel || 'Sin datos'}
Secuencia de activación recomendada: ${sequence.join(' → ') || 'Sin definir'}

Evaluación por dominio:
${domainLines || '  Sin datos'}`

  return `${companyBlock}\n\n${canvasBlock}\n\nGenera las recomendaciones estratégicas para este canvas de dominios IA.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T7 — Adoption Heatmap
// ═══════════════════════════════════════════════════════════════

const T7_SYSTEM_PROMPT = `Eres un consultor senior especializado en gestión del cambio y adopción tecnológica usando la curva de Rogers en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar la segmentación de adopción del mapa de calor del cliente y generar recomendaciones para acelerar la difusión de la IA a través de la organización.

PRINCIPIOS DE TRABAJO:
1. Los "Early Adopters" son el activo más valioso — son los multiplicadores de adopción.
2. Si hay demasiados "Laggards" o "Late Majority" en posiciones de poder, el cambio se bloquea.
3. La distancia entre "Innovators" y "Early Majority" indica el riesgo de chasm de adopción.
4. Conecta los segmentos con los arquetipos T2 cuando sea relevante.
5. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: accelerators|blockers|coalition|communication|enablement",
      "rationale": "Por qué esta acción es prioritaria para ESTE mapa (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este mapa de adopción, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto en velocidad de adopción.`

function buildT7UserMessage(ctx: Record<string, unknown>): string {
  const company  = (ctx.company  ?? {}) as Record<string, unknown>
  const heatmap  = (ctx.heatmap  ?? {}) as Record<string, unknown>

  const bySegment = (heatmap.bySegment as unknown[]) ?? []
  const totalMapped = (heatmap.totalMapped as number) ?? 0

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}`

  const segLines = (bySegment as Record<string, unknown>[])
    .map(s => `  ${s.segment}: ${s.count} personas (${s.pct}%)${s.names ? ` — ${s.names}` : ''}`)
    .join('\n')

  const heatmapBlock = `## MAPA DE ADOPCIÓN (Curva Rogers)

Total stakeholders mapeados: ${totalMapped}

Distribución por segmento:
${segLines || '  Sin datos'}

Ratio adoptadores tempranos (Innovators + Early Adopters): ${heatmap.earlyAdopterRatio ?? 'Sin datos'}%
Ratio resistentes (Late Majority + Laggards): ${heatmap.laggardRatio ?? 'Sin datos'}%`

  return `${companyBlock}\n\n${heatmapBlock}\n\nGenera las recomendaciones para acelerar la adopción en esta organización.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T8 — Communication Map
// ═══════════════════════════════════════════════════════════════

const T8_SYSTEM_PROMPT = `Eres un consultor senior especializado en comunicación del cambio y gestión de la narrativa IA en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar el mapa de comunicación del proyecto IA y generar recomendaciones para mejorar la estrategia de comunicación y maximizar el engagement de los stakeholders clave.

PRINCIPIOS DE TRABAJO:
1. La comunicación debe llegar primero a los decisores y críticos — son los que más impactan el proyecto.
2. Si hay arquetipos sin mensajes diferenciados, la comunicación será ineficaz.
3. Los canales deben ser coherentes con la cultura de la empresa (digital vs presencial).
4. Las fases de comunicación deben estar alineadas con la hoja de ruta del proyecto.
5. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: messaging|channels|timing|audience|materials",
      "rationale": "Por qué esta acción es prioritaria para ESTE plan de comunicación (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este plan de comunicación, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto en efectividad del cambio.`

function buildT8UserMessage(ctx: Record<string, unknown>): string {
  const company  = (ctx.company  ?? {}) as Record<string, unknown>
  const commMap  = (ctx.commMap  ?? {}) as Record<string, unknown>

  const actions          = (commMap.actions          as unknown[]) ?? []
  const archetypeMessages = (commMap.archetypeMessages as unknown[]) ?? []
  const byPhase          = (commMap.byPhase           as unknown[]) ?? []

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}`

  const phaseLines = (byPhase as Record<string, unknown>[])
    .map(p => `  ${p.phase}: ${p.count} acciones`)
    .join('\n')

  const archetypeLines = (archetypeMessages as Record<string, unknown>[])
    .map(a => `  ${a.archetypeLabel}: canal principal ${a.channel}`)
    .join('\n')

  const commBlock = `## MAPA DE COMUNICACIÓN

Total acciones de comunicación: ${actions.length}

Por fase:
${phaseLines || '  Sin datos'}

Arquetipos con mensajes diferenciados:
${archetypeLines || '  Ninguno definido — riesgo de comunicación genérica'}

Canales utilizados: ${commMap.channelsUsed || 'Sin datos'}
Acciones de alta prioridad: ${commMap.highPriorityCount ?? 0}`

  return `${companyBlock}\n\n${commBlock}\n\nGenera las recomendaciones para este plan de comunicación del cambio.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T9 — AI Roadmap 6M
// ═══════════════════════════════════════════════════════════════

const T9_SYSTEM_PROMPT = `Eres un consultor senior especializado en planificación de roadmaps de transformación IA en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar el roadmap de 6 meses del proyecto IA y generar recomendaciones para optimizar la secuencia de implementación, gestionar dependencias y maximizar las probabilidades de éxito del proyecto.

PRINCIPIOS DE TRABAJO:
1. Los quick wins en los primeros 3 meses son críticos para mantener el sponsorship ejecutivo.
2. Si hay iniciativas de alto riesgo en los primeros 2 meses, recomienda moverlas o añadir governance.
3. La distribución de carga entre departamentos debe ser equilibrada para evitar cuellos de botella.
4. Las iniciativas sin responsable definido son un riesgo de ejecución inmediato.
5. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: sequencing|quickwins|risks|resources|governance",
      "rationale": "Por qué esta acción es prioritaria para ESTE roadmap (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este roadmap, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor riesgo para el proyecto.`

function buildT9UserMessage(ctx: Record<string, unknown>): string {
  const company  = (ctx.company  ?? {}) as Record<string, unknown>
  const roadmap  = (ctx.roadmap  ?? {}) as Record<string, unknown>

  const items        = (roadmap.items        as unknown[]) ?? []
  const byMonth      = (roadmap.byMonth      as unknown[]) ?? []
  const byRisk       = (roadmap.byRisk       as unknown[]) ?? []
  const byDept       = (roadmap.byDept       as unknown[]) ?? []

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}
Horizonte de valor esperado: ${company.valueHorizon || 'No especificado'}`

  const monthLines = (byMonth as Record<string, unknown>[])
    .map(m => `  Mes ${m.month}: ${m.count} iniciativas`)
    .join('\n')

  const riskLines = (byRisk as Record<string, unknown>[])
    .map(r => `  ${r.level}: ${r.count}`)
    .join('\n')

  const deptLines = (byDept as Record<string, unknown>[])
    .map(d => `  ${d.dept}: ${d.count} iniciativas`)
    .join('\n')

  const itemLines = (items as Record<string, unknown>[])
    .slice(0, 8)
    .map(i => `  - ${i.name} (${i.type}) → Mes ${i.startMonth+1}–${i.endMonth+1} | Riesgo: ${i.riskLevel}${i.responsible ? ` | Resp: ${i.responsible}` : ' | ⚠ Sin responsable'}`)
    .join('\n')

  const roadmapBlock = `## ROADMAP 6 MESES

Total iniciativas: ${roadmap.totalItems ?? 0}
  Importadas de T4 (casos de uso go): ${roadmap.t4ImportedCount ?? 0}
  Iniciativas libres: ${roadmap.freeItemCount ?? 0}
Sin responsable asignado: ${roadmap.withoutOwner ?? 0}

Distribución temporal:
${monthLines || '  Sin datos'}

Distribución por nivel de riesgo:
${riskLines || '  Sin datos'}

Distribución por departamento:
${deptLines || '  Sin datos'}

Iniciativas del roadmap:
${itemLines || '  Sin datos'}`

  return `${companyBlock}\n\n${roadmapBlock}\n\nGenera las recomendaciones para optimizar este roadmap de 6 meses.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T11 — AI Operating Rhythm
// ═══════════════════════════════════════════════════════════════

const T11_SYSTEM_PROMPT = `Eres un consultor senior especializado en diseño de modelos operativos de IA y governance en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar el modelo de gobierno operativo IA del cliente y generar recomendaciones para establecer un ritmo operativo sostenible que garantice la adopción y escalado de la IA.

PRINCIPIOS DE TRABAJO:
1. El modelo operativo debe ser proporcional a la madurez IA — no impongas SAFe completo a una empresa foundational.
2. Si faltan eventos críticos de revisión en los primeros 3 meses, el proyecto pierde momentum.
3. La cadena de decisiones debe estar clara antes de que el piloto entre en producción.
4. Los KPIs de gobernanza deben ser medibles desde el primer sprint, no aspiracionales.
5. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: cadence|decisions|kpis|governance|enablement",
      "rationale": "Por qué esta acción es prioritaria para ESTE modelo operativo (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este modelo operativo, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto en sostenibilidad del modelo.`

function buildT11UserMessage(ctx: Record<string, unknown>): string {
  const company  = (ctx.company  ?? {}) as Record<string, unknown>
  const model    = (ctx.model    ?? {}) as Record<string, unknown>

  const events    = (model.recommendedEvents as unknown[]) ?? []
  const decisions = (model.decisions         as unknown[]) ?? []
  const kpiGroups = (model.kpiGroups         as unknown[]) ?? []

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}`

  const eventLines = (events as Record<string, unknown>[])
    .slice(0, 6)
    .map(e => `  - ${e.title} (${e.level}): ${e.frequency} | Owner: ${e.owner}${e.isCritical ? ' ★ crítico' : ''}`)
    .join('\n')

  const decisionLines = (decisions as Record<string, unknown>[])
    .slice(0, 4)
    .map(d => `  - ${d.decision} → Owner: ${d.owner} | Escala a: ${d.escalateTo}`)
    .join('\n')

  const kpiLines = (kpiGroups as Record<string, unknown>[])
    .map(g => {
      const kpis = (g.kpis as Record<string, unknown>[]) ?? []
      return `  ${g.label}: ${kpis.map(k => k.name).join(', ')}`
    })
    .join('\n')

  const modelBlock = `## MODELO OPERATIVO IA

Tier de madurez actual: ${model.maturityTier || 'Sin datos'} (score: ${model.maturityAvg ?? 'N/A'}/4)

Eventos operativos recomendados (${events.length} total):
${eventLines || '  Sin datos'}

Cadena de decisiones clave (${decisions.length} total):
${decisionLines || '  Sin datos'}

KPIs por nivel de gobierno:
${kpiLines || '  Sin datos'}`

  return `${companyBlock}\n\n${modelBlock}\n\nGenera las recomendaciones para este modelo operativo de IA.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T10 — AI Value Dashboard
// ═══════════════════════════════════════════════════════════════

const T10_SYSTEM_PROMPT = `Eres un consultor senior especializado en medición de valor y reporting ejecutivo de programas de transformación IA en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar el estado global del programa de adopción IA del cliente (métricas de madurez, portfolio, adopción y governance) y generar recomendaciones ejecutivas para maximizar el valor demostrable y las probabilidades de continuidad del programa.

PRINCIPIOS DE TRABAJO:
1. El dashboard ejecutivo debe contar una historia de progreso, no solo mostrar métricas.
2. Las brechas entre madurez actual y objetivo son la base del business case para la siguiente fase.
3. Si el ROI demostrado es bajo en los primeros 6 meses, el sponsorship ejecutivo se pone en riesgo.
4. La coherencia entre herramientas (T1→T4→T9→T11) es el indicador de calidad del engagement.
5. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: value|maturity|adoption|governance|reporting",
      "rationale": "Por qué esta acción es prioritaria para ESTE programa (2–3 frases)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Patrón crítico observado en este programa, en 1–2 frases. Específico, no genérico."
}

Genera entre 4 y 5 recomendaciones. Ordénalas de mayor a menor impacto en continuidad del programa.`

function buildT10UserMessage(ctx: Record<string, unknown>): string {
  const company   = (ctx.company   ?? {}) as Record<string, unknown>
  const dashboard = (ctx.dashboard ?? {}) as Record<string, unknown>

  const maturity   = (dashboard.maturity   ?? {}) as Record<string, unknown>
  const portfolio  = (dashboard.portfolio  ?? {}) as Record<string, unknown>
  const adoption   = (dashboard.adoption   ?? {}) as Record<string, unknown>
  const governance = (dashboard.governance ?? {}) as Record<string, unknown>

  const companyBlock = `## PERFIL DE EMPRESA

Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}
Objetivo principal de IA: ${company.mainAIObjective || 'No especificado'}
Horizonte de valor esperado: ${company.valueHorizon || 'No especificado'}`

  const dashboardBlock = `## ESTADO DEL PROGRAMA IA

### Madurez IA (T1)
Score global: ${maturity.overallScore ?? 'Sin datos'} / 4.0
Dimensión más fuerte: ${maturity.topDimension || 'Sin datos'}
Brecha crítica: ${maturity.criticalGap || 'Sin datos'}

### Portfolio de casos de uso (T4)
Casos activos (go + piloto): ${portfolio.activeCases ?? 0}
Ahorro anual estimado: ${portfolio.totalAnnualSaving ? `€${Math.round(Number(portfolio.totalAnnualSaving)/1000)}k` : 'Sin datos'}
Casos de alto riesgo AI Act: ${portfolio.highRiskCases ?? 0}

### Adopción y stakeholders (T2/T7)
Total stakeholders mapeados: ${adoption.totalStakeholders ?? 0}
Ratio adoptadores tempranos: ${adoption.earlyAdopterRatio ?? 'Sin datos'}%
Stakeholders sin entrevistar: ${adoption.uninterviewedCount ?? 0}

### Governance operativo (T11)
Tier de madurez operativa: ${governance.maturityTier || 'Sin datos'}
Eventos críticos configurados: ${governance.criticalEventsCount ?? 0}
Decisiones con owner definido: ${governance.decisionsWithOwner ?? 0}`

  return `${companyBlock}\n\n${dashboardBlock}\n\nGenera las recomendaciones ejecutivas para este programa de adopción IA.`
}

// ═══════════════════════════════════════════════════════════════
// PROMPT T6 — Risk & Governance
// ═══════════════════════════════════════════════════════════════

const T6_SYSTEM_PROMPT = `Eres un consultor senior especializado en gobernanza de IA, cumplimiento normativo (AI Act europeo) e implementación de estándares ISO 42001 en empresas B2B medianas y grandes del mercado español y europeo.

Tu tarea es analizar la exposición de riesgo AI Act de la empresa, el nivel de implementación ISO 42001 y el portfolio de casos de uso activos, para generar recomendaciones de gobernanza específicas y accionables.

PRINCIPIOS DE TRABAJO:
1. El AI Act europeo es ya una realidad regulatoria. Los casos de uso de alto riesgo no son un problema futuro, son un problema hoy.
2. ISO 42001 no es una certificación decorativa. Los controles de liderazgo y planificación son pre-requisito para cualquier despliegue en producción.
3. Las brechas entre casos de uso aprobados y controles implementados son el principal riesgo de cumplimiento.
4. Una empresa con 0 controles implementados y 3 casos de uso en producción tiene un problema de gobernanza inmediato.
5. El destinatario es el consultor de Alpha Consulting, no el cliente. Tono directo, orientado a acción, sin suavizar riesgos.

DIMENSIONES DE ANÁLISIS:
- compliance: Cumplimiento AI Act — priorización por nivel de riesgo real
- iso42001: Implementación ISO 42001 — controles críticos con mayor impacto
- policy: Política IA corporativa — qué falta o debe reforzarse
- governance: Estructura de gobernanza — roles, decisiones, escalada
- riskMitigation: Mitigación de riesgos concretos de los casos activos

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin ningún texto adicional antes o después.

Estructura JSON requerida:
{
  "recommendations": [
    {
      "title": "Acción concreta en 8–12 palabras (imperativo)",
      "dimension": "código de dimensión: compliance|iso42001|policy|governance|riskMitigation",
      "rationale": "Por qué esta acción es prioritaria dado el estado real de este cliente (2–3 frases específicas)",
      "effort": "bajo|medio|alto",
      "horizon": "0–3m|3–6m|6–12m"
    }
  ],
  "contextualNote": "Evaluación directa del mayor riesgo de cumplimiento de este cliente en 1–2 frases. Sin eufemismos."
}

Genera entre 4 y 5 recomendaciones. Ordénalas por urgencia regulatoria y riesgo real, no por facilidad de implementación.`

function buildT6UserMessage(ctx: Record<string, unknown>): string {
  const company  = (ctx.company  ?? {}) as Record<string, unknown>
  const aiActRisk = (ctx.aiActRisk ?? {}) as Record<string, unknown>
  const iso42001  = (ctx.iso42001  ?? {}) as Record<string, unknown>
  const t5Domains = (ctx.t5Domains ?? {}) as Record<string, unknown>
  const useCases  = (ctx.useCases  ?? {}) as Record<string, unknown>

  const highRiskCases = (aiActRisk.highRiskCases ?? []) as Array<{ name: string; department: string }>
  const criticalGaps  = (iso42001.criticalGaps   ?? []) as Array<{ code: string; title: string; clause: string }>

  const companyBlock = `## PERFIL DE EMPRESA

Nombre: ${company.name || 'No especificado'}
Sector: ${company.sector || 'No especificado'}
Tamaño: ${company.size || 'No especificado'}`

  const riskBlock = `## EXPOSICIÓN AI ACT

Total casos de uso: ${aiActRisk.total ?? 0}
Casos prohibidos: ${aiActRisk.prohibido ?? 0}
Casos de alto riesgo: ${aiActRisk.alto ?? 0}
Casos de riesgo limitado: ${aiActRisk.limitado ?? 0}
Casos de riesgo mínimo: ${aiActRisk.minimo ?? 0}
Sin clasificar: ${aiActRisk.sinClasificar ?? 0}

Casos de alto/prohibido riesgo activos:
${highRiskCases.length > 0
  ? highRiskCases.map(c => `  - ${c.name} (${c.department})`).join('\n')
  : '  (ninguno clasificado como alto/prohibido)'}`

  const isoBlock = `## ISO 42001 — ESTADO DE IMPLEMENTACIÓN

Total controles: ${iso42001.totalControls ?? 0}
Implementados: ${iso42001.implemented ?? 0}
En progreso: ${iso42001.inProgress ?? 0}
No iniciados: ${iso42001.notStarted ?? 0}
Completitud estimada: ${iso42001.completionPercent ?? 0}%

Controles críticos sin iniciar (cláusulas de liderazgo, planificación, operación):
${criticalGaps.length > 0
  ? criticalGaps.map(g => `  - [${g.code}] ${g.title} (${g.clause})`).join('\n')
  : '  (sin brechas críticas identificadas en estas cláusulas)'}`

  const portfolioBlock = `## PORTFOLIO Y DOMINIOS

Casos de uso aprobados (go): ${useCases.go ?? 0}
Casos en piloto: ${useCases.piloto ?? 0}
Casos no aprobados: ${useCases.noGo ?? 0}
Sin priorizar: ${useCases.unclassified ?? 0}

Dominios T5 activos (secuencia de activación): ${(t5Domains.activationSequence as string[] ?? []).join(', ') || 'No definida'}
Dominios con casos de uso: ${t5Domains.domainsWithContent ?? 0} / ${t5Domains.totalDomains ?? 0}`

  return `${companyBlock}\n\n${riskBlock}\n\n${isoBlock}\n\n${portfolioBlock}\n\nGenera las recomendaciones de gobernanza y cumplimiento para este cliente.`
}

// ═══════════════════════════════════════════════════════════════
// ROUTER DE PROMPTS
// ═══════════════════════════════════════════════════════════════

function buildPrompt(tool: string, context: unknown): { system: string; user: string } {
  const ctx = context as Record<string, unknown>
  switch (tool) {
    case 't1':
      return { system: T1_SYSTEM_PROMPT, user: buildT1UserMessage(ctx) }
    case 't2':
      return { system: T2_SYSTEM_PROMPT, user: buildT2UserMessage(ctx) }
    case 't4':
      return { system: T4_SYSTEM_PROMPT, user: buildT4UserMessage(ctx) }
    case 't5':
      return { system: T5_SYSTEM_PROMPT, user: buildT5UserMessage(ctx) }
    case 't6':
      return { system: T6_SYSTEM_PROMPT, user: buildT6UserMessage(ctx) }
    case 't7':
      return { system: T7_SYSTEM_PROMPT, user: buildT7UserMessage(ctx) }
    case 't8':
      return { system: T8_SYSTEM_PROMPT, user: buildT8UserMessage(ctx) }
    case 't9':
      return { system: T9_SYSTEM_PROMPT, user: buildT9UserMessage(ctx) }
    case 't11':
      return { system: T11_SYSTEM_PROMPT, user: buildT11UserMessage(ctx) }
    case 't10':
      return { system: T10_SYSTEM_PROMPT, user: buildT10UserMessage(ctx) }
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
