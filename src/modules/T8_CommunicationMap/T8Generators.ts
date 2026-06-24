// ============================================================
// T8 — Generators & Config (funciones puras, sin React)
// ============================================================

import { ARCHETYPE_CONFIG } from '@/modules/T2_StakeholderMatrix/constants'
import type { Stakeholder, ArchetypeCode, ResistanceLevel } from '@/modules/T2_StakeholderMatrix/types'
import type { CommAction, CommPhase, CommType, CommChannel, DeptKit, MaterialTemplate, ArchetypeMessage } from './types'

export { ARCHETYPE_CONFIG }

// ── Rogers segment ────────────────────────────────────────────

export type RogersSegment = 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards'

export const ARCHETYPE_BASE_SEG: Record<string, RogersSegment> = {
  adoptador:    'early_adopters',
  ambassador:   'early_majority',
  decisor:      'early_majority',
  reticente:    'late_majority',
  especialista: 'late_majority',  // compat: datos antiguos en localStorage
  critico:      'laggards',
}

export function getSegment(archetype: ArchetypeCode, resistance: ResistanceLevel): RogersSegment {
  const base = ARCHETYPE_BASE_SEG[archetype]
  if (resistance === 'alta') {
    const order: RogersSegment[] = ['innovators','early_adopters','early_majority','late_majority','laggards']
    return order[Math.min(order.indexOf(base) + 1, 4)]
  }
  return base
}

// ── Colores / labels ──────────────────────────────────────────

export const PHASE_CFG: Record<CommPhase, { label: string; period: string; color: string; bg: string; border: string }> = {
  phase1: { label: 'Fase 1', period: 'Mes 1–2', color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  phase2: { label: 'Fase 2', period: 'Mes 3–4', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
  phase3: { label: 'Fase 3', period: 'Mes 5–6', color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200'},
}

export const TYPE_CFG: Record<CommType, { label: string; icon: string }> = {
  anuncio:                 { label: 'Anuncio',          icon: '📢' },
  formacion:               { label: 'Formación',         icon: '🎓' },
  actualizacion:           { label: 'Actualización',     icon: '📊' },
  sesion_bilateral:        { label: 'Sesión bilateral',  icon: '🤝' },
  workshop:                { label: 'Workshop',           icon: '⚡' },
  newsletter:              { label: 'Newsletter',         icon: '📰' },
  presentacion_ejecutiva:  { label: 'Pres. ejecutiva',   icon: '📋' },
}

export const CHANNEL_CFG: Record<CommChannel, { label: string; icon: string }> = {
  email:              { label: 'Email',             icon: '✉️' },
  reunion_presencial: { label: 'Reunión',           icon: '🏢' },
  teams_slack:        { label: 'Teams / Slack',     icon: '💬' },
  presentacion:       { label: 'Presentación',      icon: '🖥️' },
  video:              { label: 'Video',              icon: '🎬' },
  documento:          { label: 'Documento',          icon: '📄' },
}

export const PRIORITY_CFG = {
  alta:  { label: 'Alta',  color: 'text-danger-dark bg-danger-light'   },
  media: { label: 'Media', color: 'text-warning-dark bg-warning-light' },
  baja:  { label: 'Baja',  color: 'text-success-dark bg-success-light' },
} as const

// ── Generador de acciones de comunicación ─────────────────────

export function generateCommPlan(
  stakeholders: Stakeholder[],
  companyName:  string,
  goUseCases:   string[],
): CommAction[] {
  const ambassadors  = stakeholders.filter(s => s.archetype === 'ambassador')
  const decisors     = stakeholders.filter(s => s.archetype === 'decisor')
  const critics      = stakeholders.filter(s => s.archetype === 'critico')
  const specialists  = stakeholders.filter(s => s.archetype === 'reticente')
  const adopters     = stakeholders.filter(s => s.archetype === 'adoptador')

  const topUseCase   = goUseCases[0] ?? 'la iniciativa de IA'
  const ambassNames  = ambassadors.map(s => s.name.split(' ')[0]).join(', ') || 'los ambassadors'
  const decisorNames = decisors.map(s => s.name.split(' ')[0]).join(', ') || 'los decisores'

  const actions: CommAction[] = []
  let idCounter = 1
  const id = () => `t8-action-${idCounter++}`

  // ── FASE 1: Mes 1–2 — Activar agentes de cambio ─────────────

  actions.push({
    id: id(), phase: 'phase1', week: 'Semana 1', type: 'anuncio',
    title: 'Kick-off ejecutivo — Lanzamiento del programa IA',
    audience: `Comité de Dirección${decisors.length ? ` (${decisorNames})` : ''}`,
    message: `Presentar el roadmap de adopción IA de ${companyName}, el alcance del sprint de 6 meses y los primeros casos de uso priorizados. Énfasis en gobierno, control y ROI esperado.`,
    channel: 'presentacion', owner: 'Consultor LEAN', priority: 'alta',
    materials: ['Deck ejecutivo Sprint L.E.A.N.', 'T4 — Casos priorizados (export)'],
  })

  actions.push({
    id: id(), phase: 'phase1', week: 'Semana 1-2', type: 'sesion_bilateral',
    title: 'Briefing de ambassadors — Co-diseño del sprint',
    audience: `${ambassNames} (Ambassadors identificados en T2)`,
    message: `Explicar el rol de ambassador en el sprint: no son ejecutores, son facilitadores internos. Consensuar criterios de éxito del piloto y calendario de participación.`,
    channel: 'reunion_presencial', owner: 'Consultor LEAN + Ambassador líder', priority: 'alta',
    materials: ['Guía del ambassador (T8 Kit)', 'Agenda de participación 6M'],
  })

  if (adopters.length > 0) {
    actions.push({
      id: id(), phase: 'phase1', week: 'Semana 2', type: 'sesion_bilateral',
      title: 'Sesión de alineación con Early Adopters',
      audience: `${adopters.map(s => s.name.split(' ')[0]).join(', ')} — Adoptadores internos`,
      message: `Involucrarlos como validadores del piloto. Recoger sus expectativas y preocupaciones reales antes de comunicar al resto de la organización.`,
      channel: 'reunion_presencial', owner: ambassadors.length ? ambassNames : 'Consultor LEAN', priority: 'media',
    })
  }

  actions.push({
    id: id(), phase: 'phase1', week: 'Semana 3', type: 'anuncio',
    title: `Comunicación interna de lanzamiento — Toda la organización`,
    audience: 'Todos los empleados de ' + companyName,
    message: `Anuncio del programa de adopción IA. Mensaje: "Estamos iniciando un proceso estructurado para identificar cómo la IA puede ayudarnos a trabajar mejor. Vuestro input es parte del proceso." Evitar lenguaje de sustitución de puestos.`,
    channel: 'email', owner: 'Dirección General', priority: 'alta',
    materials: ['Plantilla email lanzamiento CEO (T8 Materiales)'],
  })

  actions.push({
    id: id(), phase: 'phase1', week: 'Semana 4-6', type: 'formacion',
    title: 'Sesión de formación inicial — ¿Qué es y qué no es la IA?',
    audience: 'Mandos intermedios y responsables de área',
    message: `Formación de 2h. Objetivo: eliminar miedos infundados y alinear expectativas reales. Incluye: casos de uso priorizados en ${companyName}, impacto esperado en sus áreas y proceso de feedback.`,
    channel: 'reunion_presencial', owner: ambassadors.length ? ambassNames : 'Consultor LEAN', priority: 'alta',
    materials: ['Agenda formación inicial 2h (T8 Materiales)', 'FAQ empleados'],
  })

  // ── FASE 2: Mes 3–4 — Evidencia y reducción de fricción ─────

  actions.push({
    id: id(), phase: 'phase2', week: 'Semana 9-10', type: 'actualizacion',
    title: 'Informe de progreso — Primeros resultados del piloto',
    audience: `Comité de Dirección + mandos intermedios`,
    message: `Presentar datos reales del piloto de "${topUseCase}": métricas de adopción, primeros resultados cuantificados, obstáculos encontrados y plan de resolución. Sin narrativa optimista no respaldada por datos.`,
    channel: 'presentacion', owner: 'Consultor LEAN', priority: 'alta',
    materials: ['T4 — Dashboard de ROI', 'T9 — Gantt actualizado'],
  })

  actions.push({
    id: id(), phase: 'phase2', week: 'Semana 10', type: 'newsletter',
    title: 'Newsletter interno — Mes 3: qué hemos aprendido',
    audience: 'Toda la organización',
    message: `Comunicación interna mensual. Tono: honesto y directo. Incluir: 1 resultado concreto del piloto, 1 obstáculo que superamos y cómo, y próximo hito. Los ambassadors son los firmantes — no el consultor.`,
    channel: 'email', owner: ambassadors.length ? ambassNames : 'Dirección General', priority: 'media',
    materials: ['Plantilla update mensual (T8 Materiales)'],
  })

  if (specialists.length > 0) {
    actions.push({
      id: id(), phase: 'phase2', week: 'Semana 11-12', type: 'sesion_bilateral',
      title: 'Sesiones individuales con perfiles reticentes',
      audience: specialists.map(s => s.name).join(', '),
      message: `Reuniones 1:1 para clarificar el rol de cada perfil reticente en el entorno con IA. Mensaje clave: "La IA asume el volumen rutinario — tu expertise se vuelve más valioso, no menos relevante."`,
      channel: 'reunion_presencial', owner: 'Consultor LEAN', priority: 'alta',
      materials: ['Guía de conversación difícil (T8 Kit)'],
    })
  }

  actions.push({
    id: id(), phase: 'phase2', week: 'Semana 13-14', type: 'workshop',
    title: 'Workshop de casos de uso — Expansión del piloto',
    audience: 'Responsables operativos por departamento',
    message: `Workshop de 3h. Objetivo: co-identificar nuevas oportunidades de IA en cada área a partir de los resultados del piloto. Los participantes salen con 1-2 propuestas concretas por departamento.`,
    channel: 'reunion_presencial', owner: 'Consultor LEAN + Ambassadors', priority: 'media',
  })

  if (critics.length > 0) {
    actions.push({
      id: id(), phase: 'phase2', week: 'Semana 14', type: 'sesion_bilateral',
      title: 'Gestión de críticos — Sesión de evidencia y escucha',
      audience: critics.map(s => s.name).join(', '),
      message: `No confrontar. Presentar datos reales del piloto y escuchar sus objeciones. Incorporar sus críticas válidas como mejoras del proceso. Objetivo: neutralizar, no convertir.`,
      channel: 'reunion_presencial', owner: 'Consultor LEAN', priority: 'alta',
    })
  }

  // ── FASE 3: Mes 5–6 — Escalar y normalizar ──────────────────

  actions.push({
    id: id(), phase: 'phase3', week: 'Semana 19-20', type: 'formacion',
    title: 'Formación operativa — Uso habitual de IA en el día a día',
    audience: 'Equipos de Mayoría Tardía (segmentos late majority)',
    message: `Formación práctica de 2h. El objetivo es integrar las herramientas IA en los flujos de trabajo diarios. No es opcional — pasa de ser un proyecto a ser la forma de trabajar.`,
    channel: 'reunion_presencial', owner: ambassadors.length ? ambassNames : 'Consultor LEAN', priority: 'alta',
    materials: ['Guía de usuario rápida por herramienta'],
  })

  actions.push({
    id: id(), phase: 'phase3', week: 'Semana 22', type: 'newsletter',
    title: 'Newsletter interno — Mes 5: el camino recorrido',
    audience: 'Toda la organización',
    message: `Comunicación de cierre de fase. Incluir: métricas acumuladas de los 5 meses, historias reales de impacto en personas del equipo, y qué cambia a partir de ahora en los procesos.`,
    channel: 'email', owner: ambassadors.length ? ambassNames : 'Dirección General', priority: 'media',
    materials: ['Plantilla update mensual (T8 Materiales)'],
  })

  actions.push({
    id: id(), phase: 'phase3', week: 'Semana 23-24', type: 'presentacion_ejecutiva',
    title: 'Presentación de resultados al Comité de Dirección',
    audience: `Comité de Dirección de ${companyName}`,
    message: `Presentación de cierre del sprint. Datos reales: ROI alcanzado vs. objetivo, nivel de adopción por departamento, mapa de continuidad post-sprint y propuesta de gobernanza interna permanente.`,
    channel: 'presentacion', owner: 'Consultor LEAN', priority: 'alta',
    materials: ['T4 — ROI final', 'T9 — Roadmap continuidad', 'T7 — Mapa adopción final'],
  })

  actions.push({
    id: id(), phase: 'phase3', week: 'Semana 24', type: 'anuncio',
    title: 'Comunicación de cierre — Normalización del modelo IA',
    audience: 'Toda la organización',
    message: `Anuncio de que el programa de adopción IA se integra en la operación permanente. Agradecer a los ambassadors públicamente. Comunicar el modelo de gobernanza que continuará.`,
    channel: 'email', owner: 'CEO / Director General', priority: 'alta',
    materials: ['Plantilla email resultados finales (T8 Materiales)'],
  })

  return actions
}

// ── Generador de mensajes por arquetipo ───────────────────────

export function generateArchetypeMessages(stakeholders: Stakeholder[]): ArchetypeMessage[] {
  const presentArchetypes = [...new Set(stakeholders.map(s => s.archetype))]

  return presentArchetypes.map(arch => {
    const cfg = ARCHETYPE_CONFIG[arch]
    const shs = stakeholders.filter(s => s.archetype === arch)
    const dominantResistance = shs.filter(s => s.resistance === 'alta').length > shs.length / 2
      ? 'alta' : shs.filter(s => s.resistance === 'media').length > 0 ? 'media' : 'baja'

    const messages = {
      adoptador: {
        headline: 'Sois los primeros en ver el impacto real — necesitamos vuestra perspectiva para que funcione.',
        keyPoints: [
          'Sois los validadores del piloto: vuestro feedback real es la base del ajuste.',
          'El éxito del programa depende de que documentéis lo que funciona y lo que no.',
          'No esperamos que sea perfecto desde el día 1 — esperamos que sea honesto.',
        ],
        doNotSay: 'No decir: "Necesitamos que os entusiasmeis con esto." → Provoca presión artificial.',
        openingLine: '"Quiero entender cómo afecta esto a tu trabajo real — no el caso ideal, el real."',
        channel: 'reunion_presencial' as CommChannel,
        resistanceNote: dominantResistance === 'alta'
          ? 'Alta resistencia detectada: empezar por escuchar sus objeciones antes de presentar soluciones.'
          : 'Resistencia baja: canal directo para convertirles en co-diseñadores del piloto.',
      },
      ambassador: {
        headline: 'Tu rol no es convencer — es ser el puente entre el proyecto y tu equipo.',
        keyPoints: [
          'No eres el vendedor del proyecto: eres quien traduce el lenguaje técnico al operativo.',
          'Cuando alguien te pregunta con escepticismo, tu respuesta es compartir datos, no argumentar.',
          'Tienes autoridad para decir "no sé" — y comprometerte a buscar la respuesta.',
        ],
        doNotSay: 'No decir: "Tienes que defender este proyecto internamente." → Genera rechazo y fatiga.',
        openingLine: '"¿Cuáles son las dos preguntas que más te hace tu equipo sobre esto?"',
        channel: 'reunion_presencial' as CommChannel,
        resistanceNote: dominantResistance === 'alta'
          ? 'Ambassador con resistencia alta: aclarar primero su propio rol y beneficio antes de pedirle que facilite.'
          : 'Ambassador motivado: definir con claridad el tiempo de dedicación esperado y los canales de apoyo.',
      },
      decisor: {
        headline: 'Los datos que buscas para decidir son exactamente lo que este sprint está diseñado para generar.',
        keyPoints: [
          'El riesgo de no actuar es cuantificable: los competidores que ya lo hacen te lo explico con datos.',
          'El piloto está diseñado para que puedas parar si los datos no justifican continuar.',
          'No te pido confianza ciega — te pido un criterio de éxito acordado antes de empezar.',
        ],
        doNotSay: 'No decir: "La IA es el futuro y hay que subirte al tren." → Es argumento de presión, no de negocio.',
        openingLine: '"¿Cuál es el número que, si lo consiguiéramos en 6 meses, considerarías esto un éxito?"',
        channel: 'presentacion' as CommChannel,
        resistanceNote: dominantResistance === 'alta'
          ? 'Decisor resistente: centrarse en el control (pueden parar el piloto) y en el modelo de gobierno, no en el entusiasmo.'
          : 'Decisor alineado: convertirle en sponsor público del programa — su visibilidad acelera la adopción interna.',
      },
      reticente: {
        headline: 'La IA asume el volumen rutinario. Tu expertise se vuelve más escaso y más valioso, no menos.',
        keyPoints: [
          'Nadie está quitando trabajo — estamos quitando el trabajo que consume tiempo sin aportar valor.',
          'Tu criterio experto es lo que valida que la IA funciona bien. Sin ti, el modelo no tiene control.',
          'Los perfiles reticentes que entienden IA antes que sus pares son los más solicitados del mercado.',
        ],
        doNotSay: 'No decir: "No te preocupes, tu trabajo no corre peligro." → Suena defensivo y poco creíble.',
        openingLine: '"¿Qué parte de tu trabajo actual consume más tiempo sin que sientas que aporta lo que sabes hacer?"',
        channel: 'reunion_presencial' as CommChannel,
        resistanceNote: dominantResistance === 'alta'
          ? 'Alta resistencia: sesiones individuales obligatorias. No intentar convencer en grupo — es contraproducente.'
          : 'Resistencia media: incluirles como revisores técnicos del modelo IA. Darles un rol de control refuerza la confianza.',
      },
      critico: {
        headline: 'Tus dudas son legítimas. Queremos que las plantees formalmente — son parte del proceso de control.',
        keyPoints: [
          'No pedimos que estés de acuerdo — pedimos que tus objeciones estén documentadas y respondidas con datos.',
          'Si el piloto no cumple los criterios acordados, la decisión de continuar o parar es vuestra, no nuestra.',
          'Los críticos que tienen razón son los que hacen que los proyectos funcionen a largo plazo.',
        ],
        doNotSay: 'No decir: "Ya verás que funciona." → Genera confrontación y refuerza la posición crítica.',
        openingLine: '"¿Cuál es la condición mínima que debería cumplir el piloto para que lo consideraras válido?"',
        channel: 'reunion_presencial' as CommChannel,
        resistanceNote: 'Crítico con alta resistencia: NO intentar cambiar su postura en grupo. Sesión privada, escucha activa, incorporar sus criterios de éxito en el diseño del piloto.',
      },
    }

    const msg = messages[arch as keyof typeof messages]
    return {
      archetypeCode:  arch,
      archetypeLabel: cfg.label,
      ...msg,
    }
  })
}

// ── Generador de materiales ───────────────────────────────────

export function generateMaterials(companyName: string, goUseCases: string[]): MaterialTemplate[] {
  const uc1 = goUseCases[0] ?? 'automatización de procesos'
  const uc2 = goUseCases[1] ?? 'análisis avanzado de datos'

  return [
    {
      id: 'email-launch',
      title: 'Email lanzamiento CEO',
      subtitle: 'Anuncio inicial a toda la organización — Semana 3',
      icon: '📢',
      tags: ['Fase 1', 'Email', 'Alta prioridad'],
      content: `Asunto: Iniciamos nuestro camino hacia la adopción de Inteligencia Artificial

Equipo de ${companyName},

Hoy arrancamos un proceso que llevamos tiempo preparando: un programa estructurado para identificar y poner en marcha las primeras aplicaciones de Inteligencia Artificial en nuestra organización.

¿Por qué ahora?
Porque nuestros competidores ya lo están haciendo y porque tenemos la madurez interna para hacerlo bien — con criterio, con datos y sin comprometer lo que somos.

¿Qué significa esto en la práctica?
Durante los próximos 6 meses vamos a:
— Identificar qué procesos se benefician realmente de la IA (no todos — solo los correctos).
— Pilotar las primeras soluciones con los equipos directamente implicados.
— Medir el impacto antes de escalar.

¿Qué no va a pasar?
— No se tomará ninguna decisión sobre estructura de equipos basada en este programa sin comunicación previa.
— No se implementará nada sin la validación de las personas que trabajan en esos procesos.

Los primeros casos en los que vamos a trabajar son: ${uc1} y ${uc2}.

Cada departamento tendrá representación en el proceso. Si tienes preguntas, [nombre ambassador] es el punto de contacto interno.

Un saludo,
[Nombre del CEO/Director General]
${companyName}`,
    },
    {
      id: 'faq-employees',
      title: 'FAQ para empleados',
      subtitle: 'Respuestas a las 6 preguntas más frecuentes — distribuir en Semana 3-4',
      icon: '❓',
      tags: ['Fase 1', 'Documento', 'Toda la organización'],
      content: `PREGUNTAS FRECUENTES — Programa de adopción IA en ${companyName}

P1: ¿La IA va a sustituir mi puesto de trabajo?
R: No. El programa está diseñado para identificar tareas repetitivas que consumen tiempo sin aportar valor. El objetivo es liberar capacidad para trabajos de mayor impacto, no reducir plantilla.

P2: ¿Tengo que aprender a programar o a usar herramientas complejas?
R: No. Las herramientas se seleccionan precisamente por su facilidad de uso. Recibirás formación específica antes de que cualquier herramienta llegue a tu flujo de trabajo.

P3: ¿Quién toma las decisiones sobre qué se implementa?
R: Las decisiones pasan por el Comité de Dirección y se basan en datos del piloto. Ninguna implementación se escala sin resultados reales que la justifiquen.

P4: ¿Puedo dar mi opinión sobre cómo afecta esto a mi trabajo?
R: Sí, y es necesario que lo hagas. [Nombre ambassador] es el canal interno para recoger feedback. También habrá sesiones por departamento donde poder plantear preguntas y preocupaciones directamente.

P5: ¿Qué pasa si el piloto no funciona?
R: Se para. El diseño del programa incluye criterios de éxito acordados antes de empezar. Si el piloto no los cumple, no se continúa. No hay compromiso de escalar algo que no demuestre su valor.

P6: ¿Cuándo voy a ver el impacto en mi día a día?
R: Los primeros resultados del piloto se comunicarán en el Mes 3. Las implementaciones que afecten a tu área directamente se comunicarán con al menos 4 semanas de antelación, con formación incluida.

Para cualquier duda adicional: [nombre ambassador] — [email/canal interno]`,
    },
    {
      id: 'training-agenda',
      title: 'Agenda formación inicial 2h',
      subtitle: 'Para mandos intermedios y responsables de área — Semana 4-6',
      icon: '🎓',
      tags: ['Fase 1', 'Formación', 'Mandos intermedios'],
      content: `AGENDA — Sesión de formación inicial: "IA en ${companyName}: qué es, qué no es, y qué viene"

Duración: 2 horas | Presencial + Teams para remote
Facilitador: [Nombre Ambassador / Consultor LEAN]
Audiencia: Mandos intermedios y responsables de área

──────────────────────────────────
00:00 – 00:15 | Contexto y por qué ahora
──────────────────────────────────
- Por qué ${companyName} está iniciando este proceso
- Qué significa "adopción estructurada" vs. experimentación ad-hoc
- El sprint de 6 meses: fases, hitos y quién decide qué

──────────────────────────────────
00:15 – 00:45 | Qué es (y qué no es) la IA que nos importa
──────────────────────────────────
- Desmitificando: no es robots, no es ChatGPT para todo, no es magia
- Taxonomía práctica: automatización, análisis predictivo, generación de contenido
- Casos reales en empresas similares a ${companyName} (sector, tamaño)

──────────────────────────────────
00:45 – 01:15 | Los casos de uso priorizados en ${companyName}
──────────────────────────────────
- ${uc1}: qué es, por qué lo priorizamos, qué impacto esperamos
- ${uc2}: qué es, por qué lo priorizamos, qué impacto esperamos
- Cómo se midió la priorización (T4 — scoring stakeholders)
- Preguntas y respuestas sobre los casos

──────────────────────────────────
01:15 – 01:45 | Vuestro rol en el proceso
──────────────────────────────────
- Qué se espera de cada área durante el piloto
- Cómo dar feedback que se incorpore al proceso
- Cuándo y cómo se comunicará el impacto en cada departamento

──────────────────────────────────
01:45 – 02:00 | Próximos pasos y canal de comunicación
──────────────────────────────────
- Hoja de ruta de los próximos 60 días
- Canal de preguntas: [Ambassador / canal interno]
- Compromiso: respuesta en 48h a cualquier pregunta formulada`,
    },
    {
      id: 'monthly-update',
      title: 'Plantilla update mensual (Mes 3-4)',
      subtitle: 'Newsletter interno — firmado por ambassador, no por el consultor',
      icon: '📊',
      tags: ['Fase 2', 'Email', 'Toda la organización'],
      content: `Asunto: Actualización del programa IA — [Mes X]: lo que hemos aprendido

Equipo,

Han pasado [X] semanas desde que arrancamos el programa de adopción IA. Os cuento, sin filtros, cómo va.

✅ LO QUE ESTÁ FUNCIONANDO
[Resultado 1 concreto con dato: ej. "Hemos reducido el tiempo de triaje de incidencias de 4h a 45min en el equipo de IT."]
[Resultado 2 concreto con dato]

⚠️ LO QUE TUVIMOS QUE AJUSTAR
[Obstáculo honesto: ej. "La integración con el sistema de RRHH tardó 2 semanas más de lo previsto. Ya está resuelta."]
[Cómo lo resolvimos]

📅 PRÓXIMO HITO
[Hito concreto con fecha: ej. "El 15 de [mes] presentamos los resultados del piloto al Comité de Dirección."]
[Lo que significa para vosotros]

💬 VUESTRA OPINIÓN NOS IMPORTA
Si tenéis preguntas, observaciones o algo que no cuadra con lo que veis en vuestro día a día — escribidme directamente. No hace falta que sea formal.

[Nombre Ambassador]
[Rol] — ${companyName}`,
    },
    {
      id: 'results-email',
      title: 'Email de resultados finales',
      subtitle: 'Comunicación de cierre del sprint — Semana 24',
      icon: '🏁',
      tags: ['Fase 3', 'Email', 'Alta prioridad'],
      content: `Asunto: 6 meses después: resultados del programa IA en ${companyName}

Equipo de ${companyName},

Hace 6 meses anunciamos el inicio de nuestro programa de adopción de Inteligencia Artificial. Hoy os presentamos los resultados.

LO QUE LOGRAMOS
[Resultado principal con datos reales: ej. "Reducción del 40% en tiempo de procesamiento de incidencias TI."]
[Resultado secundario: ej. "3 departamentos con flujos de trabajo IA integrados de forma permanente."]
[Resultado cualitativo: ej. "85 personas formadas en el uso de herramientas IA en su trabajo diario."]

LO QUE NO ALCANZAMOS — Y POR QUÉ
[Objetivo que no se cumplió y explicación honesta]
[Cómo lo abordaremos en la siguiente fase]

QUÉ CAMBIA A PARTIR DE AHORA
El programa de adopción pasa de ser un proyecto puntual a ser parte de la forma en que trabajamos. [Nombre o equipo responsable de la gobernanza interna] se encargará de la continuidad.

GRACIAS
Este programa no funciona sin las personas que han participado activamente: [nombres de ambassadors]. Han sido el puente entre el proyecto y la organización. Gracias por ello.

Un saludo,
[Nombre del CEO/Director General]
${companyName}`,
    },
  ]
}

// ── Generador de kits por departamento ────────────────────────

export function generateDeptKits(stakeholders: Stakeholder[]): DeptKit[] {
  const depts = [...new Set(stakeholders.map(s => s.department))]

  return depts.map(dept => {
    const deptShs = stakeholders.filter(s => s.department === dept)

    const positive = deptShs.filter(s => {
      const seg = getSegment(s.archetype, s.resistance)
      return seg === 'innovators' || seg === 'early_adopters' || seg === 'early_majority'
    }).length
    const readiness = Math.round((positive / deptShs.length) * 100)
    const readinessLabel = readiness >= 65 ? 'Alta' : readiness >= 35 ? 'Media' : 'Baja'

    const ambassadorsInDept = deptShs
      .filter(s => s.archetype === 'ambassador')
      .map(s => s.name)

    const critics = deptShs.filter(s => s.archetype === 'critico')
    const specialists = deptShs.filter(s => s.archetype === 'reticente')
    const hasHighResistance = deptShs.some(s => s.resistance === 'alta')

    // Concern principal
    let mainConcern = 'Integración en flujos de trabajo actuales'
    if (critics.length > 0) mainConcern = `Resistencia activa: ${critics.map(s => s.name).join(', ')}`
    else if (specialists.length > 0 && hasHighResistance) mainConcern = 'Preocupación por relevancia del rol experto'
    else if (readiness < 35) mainConcern = 'Baja predisposición general al cambio'

    // Enfoque comunicativo
    let approach = ''
    if (readiness >= 65) {
      approach = 'Canal directo y técnico. Este departamento está listo para co-diseñar — implícales en el piloto como validadores activos, no como receptores pasivos.'
    } else if (readiness >= 35) {
      approach = 'Comunicación basada en beneficio operativo concreto para su área. Mostrar datos de impacto en departamentos similares antes de pedir compromiso.'
    } else {
      approach = 'Comunicación individualizada. Evitar mensajes de grupo hasta tener conversaciones 1:1 con los perfiles más resistentes. Usar datos, no narrativa.'
    }

    // Acciones concretas
    const actions: string[] = []
    if (ambassadorsInDept.length > 0) {
      actions.push(`Brief individualizado a ${ambassadorsInDept.join(' y ')} — primer punto de contacto del departamento.`)
    }
    if (critics.length > 0) {
      actions.push(`Sesión 1:1 con ${critics.map(s => s.name).join(' y ')} antes de comunicar al grupo — escuchar sus criterios de éxito.`)
    }
    if (readiness >= 65) {
      actions.push('Incluir representante del departamento como validador técnico del piloto — rol con visibilidad real.')
    } else if (readiness < 35) {
      actions.push('Formación prioritaria en semana 4-5 — antes de que el piloto arranque visible.')
    }
    actions.push('Reunión de departamento en Mes 3 para presentar primeros resultados del piloto con datos específicos de impacto en su área.')

    // Canal recomendado
    let channel: CommChannel = 'reunion_presencial'
    if (readiness >= 65) channel = 'teams_slack'
    if (critics.length > deptShs.length / 2) channel = 'reunion_presencial'

    return {
      department: dept,
      readiness,
      readinessLabel,
      mainConcern,
      approach,
      actions,
      channel,
      ambassadors: ambassadorsInDept,
    }
  })
}
