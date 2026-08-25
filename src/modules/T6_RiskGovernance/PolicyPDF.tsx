// ============================================================
// PolicyPDF — Documento PDF de Política IA
//
// Genera el PDF de la Política Corporativa de IA a partir de
// los datos de T4 (casos de uso) y T5 (dominios activos).
//
// Uso:
//   <PDFDownloadLink document={<PolicyPDF {...props} />} fileName="...">
//     {({ loading }) => loading ? 'Generando...' : '↓ Descargar PDF'}
//   </PDFDownloadLink>
// ============================================================

import {
  Document,
  Page,
  View,
  Text,
  BlobProvider,
} from '@react-pdf/renderer'
import type { UseCase }            from '@/modules/T4_UseCasePriorityBoard/types'
import type { T5DomainAssessment } from '@/modules/T5_AITaxonomyCanvas/types'
import { s, RISK_LABEL } from './components/policyPdfStyles'

// Paleta PDF centralizada — html2canvas/react-pdf no resuelve CSS vars.
// Mantener sincronizados con tailwind.config.ts + index.css tokens.
const PDF_PALETTE = {
  gold:         '#C8860A',
  goldText:     '#9B6408',
  ink:          '#1C1A16',
  inkMuted:     '#6B6864',
  inkSubtle:    '#9A9790',
  surface:      '#F7F4EE',
  surfaceWhite: '#FFFFFF',
  border:       '#D4D0C8',
  successDark:  '#5FAF8A',
  warningDark:  '#D4A85C',
  dangerDark:   '#C06060',
  infoDark:     '#6A90C0',
} as const

export interface PolicyPDFData {
  companyName:      string
  dateStr:          string
  nextReviewStr:    string
  approvedCases:    UseCase[]
  highRiskCases:    UseCase[]
  activeDomains:    Array<{ code: string; domain: T5DomainAssessment }>
  ownerDomains:     T5DomainAssessment[]
  riskLabel?:       string
  /** Contenido narrativo generado por LLM (opcional — si no existe, se usa plantilla) */
  generatedPolicy?: {
    declaracion_opening:  string
    declaracion_mandate:  string
    alcance_context:      string
    principios:           Array<{ title: string; desc: string }>
    contexto_sectorial:   string
    sector:               string
  } | null
}

function statusLabel(status: string): string {
  return status === 'go' ? '✓ Aprobado' : '→ En piloto'
}

// ── Componente PDF ─────────────────────────────────────────────

function PolicyPDFDocument({ data }: { data: PolicyPDFData }) {
  const {
    companyName, dateStr, nextReviewStr,
    approvedCases, highRiskCases,
    activeDomains, ownerDomains,
    generatedPolicy,
  } = data

  const gp = generatedPolicy ?? null
  const hasGenerated = !!gp
  const extraSection  = hasGenerated && gp.contexto_sectorial ? 1 : 0
  const sectionOffset = highRiskCases.length > 0 ? 1 : 0

  const principios = gp?.principios ?? [
    { title: 'Transparencia',        desc: 'Los usuarios deben saber cuándo interactúan con un sistema IA y comprender, en la medida de lo posible, cómo funciona.' },
    { title: 'Supervisión humana',   desc: 'Los sistemas IA de alto riesgo requieren supervisión humana efectiva antes de que sus decisiones tengan efecto.' },
    { title: 'Privacidad y datos',   desc: 'El tratamiento de datos personales por sistemas IA cumple el RGPD. Los datos sensibles requieren autorización explícita.' },
    { title: 'No discriminación',    desc: 'Los sistemas IA no pueden generar sesgos injustificados basados en características protegidas por la legislación.' },
    { title: 'Seguridad y robustez', desc: 'Los sistemas IA son seguros frente a manipulaciones y se monitorizan continuamente para detectar degradación del rendimiento.' },
    { title: 'Rendición de cuentas', desc: 'Cada sistema IA tiene un responsable designado (AI Owner) que garantiza su uso conforme a esta política.' },
  ]

  return (
    <Document
      title={`Política Corporativa de IA — ${companyName}`}
      author="Alpha Consulting Solutions S.L."
      subject="GOBY — T6 Risk & Governance"
      creator="GOBY"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerMono}>Política Corporativa de Inteligencia Artificial</Text>
            <Text style={s.headerTitle}>{companyName}</Text>
            <Text style={s.headerSub}>Versión 1.0 · {dateStr}</Text>
          </View>
          <Text style={s.headerBadge}>GOBY · T6</Text>
        </View>

        <View style={s.body}>

          {/* 1. Declaración */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>1. Declaración de Política</Text>
            <Text style={s.paragraph}>
              {gp?.declaracion_opening ?? `${companyName} se compromete a adoptar la Inteligencia Artificial de forma responsable, ética y conforme a la regulación aplicable, en particular el Reglamento Europeo de Inteligencia Artificial (EU AI Act, Reglamento UE 2024/1689) y el Reglamento General de Protección de Datos (RGPD). Esta política establece los principios, responsabilidades y controles que rigen el desarrollo, adquisición y despliegue de sistemas IA en la organización.`}
            </Text>
            <Text style={s.paragraph}>
              {gp?.declaracion_mandate ?? `Todo sistema de IA operativo en ${companyName} debe ser identificado, evaluado en términos de riesgo regulatorio y documentado en el catálogo corporativo de IA antes de su despliegue en producción.`}
            </Text>
            {hasGenerated && (
              <Text style={{ fontSize: 7, color: PDF_PALETTE.gold, marginTop: 4 }}>
                ✦ Contenido generado con IA · Sector: {gp?.sector}
              </Text>
            )}
          </View>

          {/* 2. Alcance */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>2. Alcance</Text>
            <Text style={s.paragraph}>
              {gp?.alcance_context ?? `Esta política aplica a todos los sistemas de IA desarrollados internamente, adquiridos a terceros o utilizados como servicio (AIaaS) por ${companyName}, independientemente del departamento o función de negocio.`}
            </Text>
            {activeDomains.length > 0 && (
              <View style={s.domainsBox}>
                <Text style={s.domainsLabel}>Dominios IA activos en el scope actual</Text>
                {activeDomains.map(({ code, domain }) => (
                  <View key={code} style={s.domainItem}>
                    <Text style={s.domainBullet}>▶</Text>
                    <Text style={s.domainText}>
                      <Text style={s.domainBold}>{code.replace(/_/g, ' ')}</Text>
                      {' '}— Prioridad {domain.priorityScore}/100
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 3. Principios */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>3. Principios de IA Responsable</Text>
            <View style={s.principlesGrid}>
              {principios.map(({ title, desc }) => (
                <View key={title} style={s.principleCard}>
                  <Text style={s.principleTitle}>{title}</Text>
                  <Text style={s.principleDesc}>{desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 3b. Contexto regulatorio sectorial */}
          {hasGenerated && gp?.contexto_sectorial ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>4. Contexto Regulatorio Sectorial</Text>
              <Text style={s.paragraph}>{gp.contexto_sectorial}</Text>
            </View>
          ) : null}

          {/* Catálogo */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{4 + extraSection}. Catálogo de IA Aprobada</Text>
            <Text style={s.paragraph}>
              Los siguientes sistemas IA han sido evaluados, aprobados (Go) e incorporados al
              pipeline de implementación de {companyName} a la fecha de emisión de esta política.
            </Text>
            {approvedCases.length === 0 ? (
              <Text style={{ ...s.paragraph, fontStyle: 'italic', color: PDF_PALETTE.inkSubtle }}>
                Sin casos de uso aprobados. Completa el proceso Go/No-Go en T4.
              </Text>
            ) : (
              <View>
                <View style={s.tableHeader}>
                  <Text style={[s.thCell, s.col1]}>Sistema IA</Text>
                  <Text style={[s.thCell, s.col2]}>Departamento</Text>
                  <Text style={[s.thCell, s.col3]}>{data.riskLabel ?? 'Riesgo AI Act'}</Text>
                  <Text style={[s.thCell, s.col4]}>Estado</Text>
                </View>
                {approvedCases.map((uc) => {
                  const level  = uc.aiActClassification?.riskLevel ?? 'sin_clasificar'
                  const rCfg   = RISK_LABEL[level] ?? RISK_LABEL.sin_clasificar
                  return (
                    <View key={uc.id} style={s.tableRow}>
                      <Text style={[s.tdName, s.col1]}>{uc.name}</Text>
                      <Text style={[s.tdCell, s.col2]}>{uc.department}</Text>
                      <View style={[s.col3, { flexDirection: 'row' }]}>
                        <View style={[s.badge, { backgroundColor: rCfg.bg }]}>
                          <Text style={{ color: rCfg.color }}>{rCfg.label}</Text>
                        </View>
                      </View>
                      <Text style={[s.tdCell, s.col4, { color: PDF_PALETTE.successDark, fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>
                        {statusLabel(uc.status)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* Controles de alto riesgo */}
          {highRiskCases.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>5. Medidas de Control — Sistemas de Alto Riesgo</Text>
              <Text style={s.paragraph}>
                Los siguientes sistemas han sido clasificados como alto riesgo según el Annex III del
                AI Act. Requieren las siguientes medidas antes de su despliegue en producción:
              </Text>
              {highRiskCases.map((uc) => (
                <View key={uc.id} style={s.highRiskCard}>
                  <Text style={s.highRiskTitle}>{uc.name} — {uc.department}</Text>
                  {[
                    'Evaluación de conformidad documentada',
                    'Sistema de gestión de riesgos operativo',
                    'Supervisión humana definida y comunicada al equipo',
                    'Registro en base de datos EU de sistemas IA de alto riesgo',
                  ].map((m) => (
                    <View key={m} style={s.highRiskItem}>
                      <Text style={s.highRiskBullet}>▶</Text>
                      <Text style={s.highRiskText}>{m}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Roles y responsabilidades */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{4 + extraSection + sectionOffset + 1}. Roles y Responsabilidades</Text>
            {ownerDomains.map((d) => (
              <View key={d.domainCode} style={s.ownerRow}>
                <Text style={s.ownerLabel}>AI Owner</Text>
                <View>
                  <Text style={s.ownerName}>{d.suggestedOwner}</Text>
                  <Text style={s.ownerDomain}>
                    Responsable del dominio: {d.domainCode.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Revisión */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{4 + extraSection + sectionOffset + 2}. Revisión y Vigencia</Text>
            <Text style={s.paragraph}>
              Esta política será revisada anualmente o ante cambios regulatorios significativos
              (nuevas disposiciones del AI Act, actualizaciones del RGPD o cambios en el catálogo
              de sistemas IA de {companyName}). La siguiente revisión programada es {nextReviewStr}.
            </Text>
            <View style={s.footer}>
              <Text style={s.footerText}>
                Documento generado automáticamente por el GOBY (T6 — Risk & Governance).{'\n'}
                Alpha Consulting Solutions S.L. · {dateStr}
              </Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  )
}

// ── Export: botón de descarga ──────────────────────────────────

interface PolicyDownloadButtonProps {
  data: PolicyPDFData
}

export function PolicyDownloadButton({ data }: PolicyDownloadButtonProps) {
  const fileName = `Politica-IA-${data.companyName.replace(/\s+/g, '-')}.pdf`

  return (
    <BlobProvider document={<PolicyPDFDocument data={data} />}>
      {({ blob, url, loading, error }) => {
        const handleClick = () => {
          if (!url || !blob) return
          const link = document.createElement('a')
          link.href  = url
          link.download = fileName
          link.click()
        }

        return (
          <button
            onClick={handleClick}
            disabled={loading || !!error}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors',
              error   ? 'bg-danger-dark cursor-not-allowed opacity-70'
              : loading ? 'bg-navy/50 cursor-wait'
              : 'bg-navy-metallic hover:bg-navy-metallic-hover shadow-sm',
            ].join(' ')}
          >
            {loading ? (
              <>
                <svg
                  style={{ animation: 'spin 1s linear infinite' }}
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                >
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="16 8"/>
                </svg>
                Generando PDF…
              </>
            ) : error ? (
              '! Error al generar'
            ) : (
              '↓ Descargar PDF'
            )}
          </button>
        )
      }}
    </BlobProvider>
  )
}
