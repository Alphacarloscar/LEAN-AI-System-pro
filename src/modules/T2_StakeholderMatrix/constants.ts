// ============================================================
// T2 — Constantes: arquetipos, preguntas, scoring
// ============================================================

import type {
  ArchetypeCode, ArchetypeConfig, ResistanceLevel,
  InterviewQuestion, InterviewResult, InterviewAnswerCode,
} from './types'

// ── Configuración de arquetipos ───────────────────────────────

export const ARCHETYPE_CONFIG: Record<ArchetypeCode, ArchetypeConfig> = {
  adoptador: {
    code:        'adoptador',
    label:       'Adoptador',
    tagline:     'Usa IA y quiere más. No lidera, pero multiplica.',
    description: 'Perfil de usuario activo o entusiasta. Adopta herramientas rápido, genera evidencia de uso, pero necesita que otros marquen la dirección estratégica.',
    badgeBg:     'bg-success-light',
    badgeText:   'text-success-dark',
    dotBg:       'bg-success-dark',
    interventions: {
      baja:  [
        'Incluirle en el piloto desde el día 1 — generará evidencia de uso que acelera la adopción del resto.',
        'Pedirle que documente sus quick wins con IA para usarlos como casos internos.',
      ],
      media: [
        'Identificar qué fricción específica frena su adopción (¿procesos? ¿herramientas? ¿permisos?).',
        'Darle acceso anticipado a la herramienta piloto para que gane confianza antes del lanzamiento.',
      ],
      alta:  [
        'Sesión individual para entender el bloqueante concreto — suele ser miedo al error, no rechazo.',
        'Asignarle un buddy más avanzado en IA para aprendizaje peer-to-peer.',
      ],
    },
  },

  ambassador: {
    code:        'ambassador',
    label:       'Ambassador',
    tagline:     'Conecta IT y Negocio. El activo más escaso.',
    description: 'Perfil puente. Tiene influencia organizacional y adopta activamente. Traduce la IA en valor de negocio para otros y arrastra a su entorno. El perfil de mayor multiplicación.',
    badgeBg:     'bg-info-light',
    badgeText:   'text-info-dark',
    dotBg:       'bg-info-dark',
    interventions: {
      baja:  [
        'Designarle como sponsor visible del piloto — su endorsement reduce la resistencia del grupo.',
        'Darle acceso a datos de impacto del piloto para que los difunda internamente.',
        'Invitarle al comité de seguimiento del sprint LEAN.',
      ],
      media: [
        'Entender qué le frena a tomar el rol de sponsor — suele ser capacidad de tiempo, no voluntad.',
        'Proponer una participación acotada: una comunicación interna, una reunión con su equipo.',
      ],
      alta:  [
        'Revisar si el arquetipo es correcto — un Ambassador con resistencia alta puede ser un Decisor mal clasificado.',
        'Sesión 1:1 para entender el cambio de actitud antes de asignarle responsabilidad.',
      ],
    },
  },

  decisor: {
    code:        'decisor',
    label:       'Decisor',
    tagline:     'Firma el presupuesto. Necesita ROI, no demos.',
    description: 'Autoridad de decisión sobre inversión tecnológica. Su apoyo desbloquea recursos; su oposición bloquea el proyecto. Evalúa en términos de riesgo, coste y resultado de negocio.',
    badgeBg:     'bg-navy/10 dark:bg-navy/20',
    badgeText:   'text-navy dark:text-warm-100',
    dotBg:       'bg-navy',
    interventions: {
      baja:  [
        'Presentarle el Executive Briefing Pack (QW1) con datos de su área específica.',
        'Incluirle en la definición del criterio de éxito del piloto — ownership desde el inicio.',
      ],
      media: [
        'Construir un caso de negocio cuantificado antes de la reunión de presupuesto.',
        'Proponer un piloto de alcance mínimo con métrica de éxito acordada en 30 días.',
        'Identificar qué riesgo específico le preocupa y abordarlo directamente.',
      ],
      alta:  [
        'Sesión 1:1 con sponsor ejecutivo de Alpha antes de cualquier otro movimiento.',
        'Quick win visible en su área en menos de 30 días — necesita evidencia antes de comprometerse.',
        'Evitar demos técnicas hasta tener el caso de negocio validado con su lenguaje.',
      ],
    },
  },

  critico: {
    code:        'critico',
    label:       'Crítico',
    tagline:     'Bloquea por convicción. Escucharle es la palanca.',
    description: 'Escéptico activo con influencia organizacional. Hace preguntas difíciles, señala riesgos reales y puede frenar decisiones. Ignorarle garantiza resistencia pasiva post-piloto.',
    badgeBg:     'bg-danger-light',
    badgeText:   'text-danger-dark',
    dotBg:       'bg-danger-dark',
    interventions: {
      baja:  [
        'Invitarle al proceso de definición de requisitos — su ojo crítico mejora el diseño del piloto.',
        'Darle el rol de evaluador de riesgos oficial — canaliza su escepticismo de forma constructiva.',
      ],
      media: [
        'Reunión 1:1 antes del kick-off para escuchar sus objeciones concretas.',
        'Responder sus preguntas con datos, no con promesas — es su único lenguaje de confianza.',
        'No forzar adopción en su área en el primer piloto; dejar que vea resultados de otros primero.',
      ],
      alta:  [
        'Nunca empezar un piloto en su área sin su alineación previa — el coste de su resistencia activa supera cualquier quick win.',
        'Identificar si hay una preocupación legítima de fondo (riesgo real de su área, precedente negativo) antes de diseñar la intervención.',
        'Considerar una demo con datos reales de su área — sin promesas — para reducir la desconfianza epistémica.',
      ],
    },
  },

  especialista: {
    code:        'especialista',
    label:       'Especialista',
    tagline:     'Sabe más que nadie. Teme que la IA lo reemplace.',
    description: 'Conocimiento técnico o de dominio profundo. Puede aportar más que ningún otro al diseño del piloto, pero teme que la IA amenace su valor o su rol. La intervención correcta lo convierte en el mayor activo del proyecto.',
    badgeBg:     'bg-warning-light',
    badgeText:   'text-warning-dark',
    dotBg:       'bg-warning-dark',
    interventions: {
      baja:  [
        'Asignarle el rol de experto de dominio en el piloto — la IA trabaja con su conocimiento, no en su contra.',
        'Pedirle que valide y corrija los outputs de IA — es el árbitro de calidad, no el reemplazado.',
      ],
      media: [
        'Sesión específica sobre cómo la IA amplifica al experto versus reemplazar al genérico.',
        'Mostrar casos de rol análogo donde el especialista ganó relevancia con IA, no la perdió.',
        'Involucrarle en el diseño del prompt o del flujo de trabajo — su input es irremplazable.',
      ],
      alta:  [
        'No lanzar ningún piloto en su área sin su participación activa en el diseño.',
        'Sesión 1:1 sobre su visión del impacto de la IA en su rol específico — escuchar antes de hablar.',
        'Proponer una prueba de concepto controlada donde él tiene control total sobre el proceso y los datos.',
      ],
    },
  },
}

// ── Etiquetas de resistencia ──────────────────────────────────

export const RESISTANCE_CONFIG: Record<ResistanceLevel, {
  label: string; badgeBg: string; badgeText: string; dotBg: string
}> = {
  baja:  { label: 'Resistencia Baja',  badgeBg: 'bg-success-light', badgeText: 'text-success-dark', dotBg: 'bg-success-dark' },
  media: { label: 'Resistencia Media', badgeBg: 'bg-warning-light',  badgeText: 'text-warning-dark',  dotBg: 'bg-warning-dark' },
  alta:  { label: 'Resistencia Alta',  badgeBg: 'bg-danger-light',   badgeText: 'text-danger-dark',   dotBg: 'bg-danger-dark' },
}

// ── Preguntas de la entrevista ────────────────────────────────

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id:   1,
    text: '¿Cómo describirías tu relación actual con las herramientas de IA en tu trabajo diario?',
    hint: 'ChatGPT, Copilot, herramientas de análisis IA, automatización…',
    answers: [
      { code: 'A', text: 'Las uso activamente y busco nuevas aplicaciones',           scores: { adoption: 4, influence: 0, openness: 3, connector: 0 } },
      { code: 'B', text: 'Las he probado, pero no es algo habitual',                  scores: { adoption: 2, influence: 0, openness: 2, connector: 0 } },
      { code: 'C', text: 'Las conozco, pero prefiero no depender de ellas',           scores: { adoption: 1, influence: 0, openness: 1, connector: 0 } },
      { code: 'D', text: 'No las uso — no creo que sean necesarias en mi rol',        scores: { adoption: 0, influence: 0, openness: 0, connector: 0 } },
    ],
  },
  {
    id:   2,
    text: '¿Qué impacto esperas que tenga la IA en tu área en los próximos 2 años?',
    answers: [
      { code: 'A', text: 'Transformador — cambiará cómo trabajamos fundamentalmente',  scores: { adoption: 0, influence: 0, openness: 2, connector: 0 } },
      { code: 'B', text: 'Mejoras incrementales en tareas concretas',                  scores: { adoption: 0, influence: 0, openness: 2, connector: 0 } },
      { code: 'C', text: 'Incierto — no tengo claro si aportará valor real',           scores: { adoption: 0, influence: 0, openness: 1, connector: 0 } },
      { code: 'D', text: 'Limitado o negativo — no encaja con nuestro trabajo',        scores: { adoption: 0, influence: 0, openness: 0, connector: 0 } },
    ],
  },
  {
    id:   3,
    text: 'Cuando tu organización adopta una nueva tecnología, ¿cuál es habitualmente tu posición?',
    answers: [
      { code: 'A', text: 'La impulso activamente y conecto equipos para adoptarla',    scores: { adoption: 2, influence: 2, openness: 0, connector: 2 } },
      { code: 'B', text: 'La adopto pronto y sirvo de referencia para otros',          scores: { adoption: 2, influence: 1, openness: 0, connector: 0 } },
      { code: 'C', text: 'Espero a que esté probada y validada antes de adoptarla',   scores: { adoption: 0, influence: 0, openness: 1, connector: 0 } },
      { code: 'D', text: 'Evalúo riesgos y freno si no está suficientemente justificado', scores: { adoption: 0, influence: 2, openness: 0, connector: 0 } },
    ],
  },
  {
    id:   4,
    text: '¿En qué medida participas en las decisiones de inversión tecnológica de tu área?',
    answers: [
      { code: 'A', text: 'Tengo autoridad de decisión o influencia determinante',      scores: { adoption: 0, influence: 4, openness: 0, connector: 0 } },
      { code: 'B', text: 'Participo activamente con voz relevante',                    scores: { adoption: 0, influence: 2, openness: 0, connector: 0 } },
      { code: 'C', text: 'Me consultan, pero la decisión la toman otros',              scores: { adoption: 0, influence: 1, openness: 0, connector: 0 } },
      { code: 'D', text: 'No participo en estas decisiones',                           scores: { adoption: 0, influence: 0, openness: 0, connector: 0 } },
    ],
  },
  {
    id:   5,
    text: '¿Cómo reaccionarías si un proceso clave de tu área se automatizara parcialmente con IA?',
    answers: [
      { code: 'A', text: 'Lo impulsaría — es una oportunidad de hacer trabajo de mayor valor', scores: { adoption: 1, influence: 0, openness: 3, connector: 0 } },
      { code: 'B', text: 'Me adaptaría — me formaría para trabajar junto con la IA',            scores: { adoption: 0, influence: 0, openness: 2, connector: 0 } },
      { code: 'C', text: 'Me generaría incertidumbre — necesitaría entender bien el impacto',  scores: { adoption: 0, influence: 0, openness: 1, connector: 0 } },
      { code: 'D', text: 'Lo vería con preocupación — afecta a mi rol o al de mi equipo',      scores: { adoption: 0, influence: 0, openness: 0, connector: 0 } },
    ],
  },
]

// Máximos posibles por dimensión (para normalizar a 0-4)
const MAX_ADOPTION  = 4 + 0 + 2 + 0 + 1   // = 7
const MAX_INFLUENCE = 0 + 0 + 2 + 4 + 0   // = 6
const MAX_OPENNESS  = 3 + 2 + 1 + 0 + 3   // = 9
const MAX_CONNECTOR = 2

// ── Algoritmo de scoring ──────────────────────────────────────

export function computeInterviewResult(
  answers: Record<number, InterviewAnswerCode>
): Omit<InterviewResult, 'computedAt'> {
  // Acumular puntos brutos
  let rawAdoption = 0, rawInfluence = 0, rawOpenness = 0, rawConnector = 0

  INTERVIEW_QUESTIONS.forEach((q) => {
    const answerCode = answers[q.id]
    if (!answerCode) return
    const option = q.answers.find((a) => a.code === answerCode)
    if (!option) return
    rawAdoption  += option.scores.adoption
    rawInfluence += option.scores.influence
    rawOpenness  += option.scores.openness
    rawConnector += option.scores.connector
  })

  // Normalizar a escala 0-4
  const adoptionScore  = parseFloat(((rawAdoption  / MAX_ADOPTION)  * 4).toFixed(2))
  const influenceScore = parseFloat(((rawInfluence / MAX_INFLUENCE) * 4).toFixed(2))
  const opennessScore  = parseFloat(((rawOpenness  / MAX_OPENNESS)  * 4).toFixed(2))
  const connectorScore = parseFloat(((rawConnector / MAX_CONNECTOR) * 4).toFixed(2))

  // ── Asignación de arquetipo (priority-ordered rules) ──────
  let archetype: ArchetypeCode

  if (connectorScore >= 3 && influenceScore >= 2.5 && adoptionScore >= 2) {
    archetype = 'ambassador'
  } else if (influenceScore >= 2.5 && adoptionScore >= 2) {
    archetype = 'decisor'
  } else if (influenceScore >= 2.5 && adoptionScore < 2) {
    archetype = 'critico'
  } else if (adoptionScore < 1.5 && opennessScore < 1.5) {
    archetype = 'especialista'
  } else {
    archetype = 'adoptador'
  }

  // ── Nivel de resistencia ──────────────────────────────────
  const resistance: ResistanceLevel =
    opennessScore >= 2.5 ? 'baja' :
    opennessScore >= 1.5 ? 'media' :
                           'alta'

  return { answers, adoptionScore, influenceScore, opennessScore: opennessScore + connectorScore * 0, archetype, resistance }
  //                                                               ^^ opennessScore ya normalizado, connector solo afecta archetype
}

// Exportar scores normalizados también (para la UI del panel)
export function getInterviewScores(result: InterviewResult) {
  return {
    adoption:  result.adoptionScore,
    influence: result.influenceScore,
    openness:  result.opennessScore,
  }
}
