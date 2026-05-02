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
  StyleSheet,
  BlobProvider,
} from '@react-pdf/renderer'

// ── Types de los datos que necesita el PDF ──────────────────────

interface UseCase {
  id:     string
  name:   string
  department: string
  status: string
  aiActClassification?: { riskLevel: string } | null
}

interface Domain {
  domainCode:     string
  priorityScore:  number
  suggestedOwner: string
}

export interface PolicyPDFData {
  companyName:      string
  dateStr:          string
  nextReviewStr:    string
  approvedCases:    UseCase[]
  highRiskCases:    UseCase[]
  activeDomains:    Array<{ code: string; domain: Domain }>
  ownerDomains:     Domain[]
}

// ── Paleta de colores del design system ────────────────────────

const NAVY    = '#1B2A4E'
const WHITE   = '#FFFFFF'
const GRAY_50 = '#F9FAFB'
const GRAY_200= '#E5E7EB'
const GRAY_400= '#9CA3AF'
const GRAY_600= '#4B5563'
const ORANGE  = '#EA580C'

// ── Estilos ────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize:   9,
    color:      '#374151',
    paddingTop: 0,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 40,
    paddingTop:   28,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerMono: {
    fontSize:      7,
    color:         'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom:  6,
  },
  headerTitle: {
    fontSize:   18,
    fontFamily: 'Helvetica-Bold',
    color:      WHITE,
    marginBottom: 3,
  },
  headerSub: {
    fontSize: 9,
    color:    'rgba(255,255,255,0.7)',
  },
  headerBadge: {
    fontSize:        8,
    color:           WHITE,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:     10,
  },

  // ── Body ──
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },

  // ── Sección ──
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize:   11,
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_200,
    marginBottom: 8,
  },
  paragraph: {
    fontSize:    9,
    color:       GRAY_600,
    lineHeight:  1.55,
    marginBottom: 6,
  },

  // ── Domains box ──
  domainsBox: {
    backgroundColor: GRAY_50,
    borderWidth:     0.5,
    borderColor:     GRAY_200,
    borderRadius:    6,
    paddingHorizontal: 12,
    paddingVertical:   8,
    marginTop:       6,
  },
  domainsLabel: {
    fontSize:      6.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color:         GRAY_400,
    marginBottom:  5,
  },
  domainItem: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  3,
    gap:           5,
  },
  domainBullet: {
    fontSize: 7,
    color:    NAVY,
    width:    8,
  },
  domainText: {
    fontSize: 8,
    color:    GRAY_600,
    flex:     1,
  },
  domainBold: {
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
  },

  // ── Principios grid ──
  principlesGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            6,
  },
  principleCard: {
    width:             '48%',
    backgroundColor:   GRAY_50,
    borderWidth:       0.5,
    borderColor:       GRAY_200,
    borderRadius:      5,
    paddingHorizontal: 10,
    paddingVertical:   7,
    marginBottom:      2,
  },
  principleTitle: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    color:        '#111827',
    marginBottom: 2,
  },
  principleDesc: {
    fontSize:   7.5,
    color:      GRAY_600,
    lineHeight: 1.45,
  },

  // ── Table ──
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_200,
    paddingBottom:     5,
    marginBottom:      3,
  },
  tableRow: {
    flexDirection:   'row',
    borderBottomWidth: 0.3,
    borderBottomColor: GRAY_200,
    paddingVertical:   4,
    alignItems:       'center',
  },
  thCell: {
    fontSize:      6.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color:         GRAY_400,
  },
  tdCell: {
    fontSize: 8.5,
    color:    GRAY_600,
  },
  tdName: {
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
    fontSize:   8.5,
  },
  col1: { flex: 3 },
  col2: { flex: 2 },
  col3: { flex: 2 },
  col4: { flex: 1.5 },

  // ── Risk badge ──
  badge: {
    paddingHorizontal: 5,
    paddingVertical:   2,
    borderRadius:      8,
    fontSize:          7,
    fontFamily:        'Helvetica-Bold',
  },

  // ── High risk card ──
  highRiskCard: {
    borderWidth:       0.5,
    borderColor:       '#FED7AA',
    backgroundColor:   '#FFF7ED',
    borderRadius:      5,
    paddingHorizontal: 12,
    paddingVertical:   8,
    marginBottom:      5,
  },
  highRiskTitle: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    color:        ORANGE,
    marginBottom: 4,
  },
  highRiskItem: {
    flexDirection: 'row',
    marginBottom:  2,
    gap:           4,
  },
  highRiskBullet: {
    fontSize: 7,
    color:    ORANGE,
    width:    8,
  },
  highRiskText: {
    fontSize:  7.5,
    color:     '#9A3412',
    flex:      1,
    lineHeight: 1.4,
  },

  // ── Owner rows ──
  ownerRow: {
    flexDirection:   'row',
    borderBottomWidth: 0.3,
    borderBottomColor: GRAY_200,
    paddingVertical:   5,
    gap:              12,
    alignItems:       'flex-start',
  },
  ownerLabel: {
    fontSize:      7,
    textTransform: 'uppercase',
    color:         GRAY_400,
    width:         48,
    paddingTop:    1,
  },
  ownerName: {
    fontSize:   8.5,
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
  },
  ownerDomain: {
    fontSize: 7.5,
    color:    GRAY_400,
    marginTop: 1,
  },

  // ── Footer ──
  footer: {
    marginTop:   16,
    paddingTop:  8,
    borderTopWidth: 0.5,
    borderTopColor: GRAY_200,
  },
  footerText: {
    fontSize: 7,
    color:    GRAY_400,
    lineHeight: 1.5,
  },
})

// ── Mapa de niveles de riesgo AI Act ───────────────────────────

const RISK_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  prohibido:      { label: 'Prohibido',      bg: '#FEE2E2', color: '#991B1B' },
  alto:           { label: 'Alto Riesgo',    bg: '#FEF3C7', color: '#92400E' },
  limitado:       { label: 'Riesgo Limitado',bg: '#FFF7ED', color: '#9A3412' },
  minimo:         { label: 'Riesgo Mínimo',  bg: '#F0FDF4', color: '#166534' },
  sin_clasificar: { label: 'Sin clasificar', bg: '#F3F4F6', color: '#6B7280' },
}

function statusLabel(status: string): string {
  return status === 'go' ? '✓ Aprobado' : '⟳ En piloto'
}

// ── Componente PDF ─────────────────────────────────────────────

function PolicyPDFDocument({ data }: { data: PolicyPDFData }) {
  const {
    companyName, dateStr, nextReviewStr,
    approvedCases, highRiskCases,
    activeDomains, ownerDomains,
  } = data

  const sectionOffset = highRiskCases.length > 0 ? 1 : 0

  return (
    <Document
      title={`Política Corporativa de IA — ${companyName}`}
      author="Alpha Consulting Solutions S.L."
      subject="L.E.A.N. AI System — T6 Risk & Governance"
      creator="L.E.A.N. AI System Enterprise"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerMono}>Política Corporativa de Inteligencia Artificial</Text>
            <Text style={s.headerTitle}>{companyName}</Text>
            <Text style={s.headerSub}>Versión 1.0 · {dateStr}</Text>
          </View>
          <Text style={s.headerBadge}>L.E.A.N. AI System · T6</Text>
        </View>

        <View style={s.body}>

          {/* 1. Declaración */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>1. Declaración de Política</Text>
            <Text style={s.paragraph}>
              {companyName} se compromete a adoptar la Inteligencia Artificial de forma responsable, ética
              y conforme a la regulación aplicable, en particular el Reglamento Europeo de Inteligencia
              Artificial (EU AI Act, Reglamento UE 2024/1689) y el Reglamento General de Protección de
              Datos (RGPD). Esta política establece los principios, responsabilidades y controles que
              rigen el desarrollo, adquisición y despliegue de sistemas IA en la organización.
            </Text>
            <Text style={s.paragraph}>
              Todo sistema de IA operativo en {companyName} debe ser identificado, evaluado en términos
              de riesgo regulatorio y documentado en el catálogo corporativo de IA antes de su
              despliegue en producción.
            </Text>
          </View>

          {/* 2. Alcance */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>2. Alcance</Text>
            <Text style={s.paragraph}>
              Esta política aplica a todos los sistemas de IA desarrollados internamente, adquiridos a
              terceros o utilizados como servicio (AIaaS) por {companyName}, independientemente del
              departamento o función de negocio.
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
              {[
                { title: 'Transparencia',        desc: 'Los usuarios deben saber cuándo interactúan con un sistema IA y comprender, en la medida de lo posible, cómo funciona.' },
                { title: 'Supervisión humana',   desc: 'Los sistemas IA de alto riesgo requieren supervisión humana efectiva antes de que sus decisiones tengan efecto.' },
                { title: 'Privacidad y datos',   desc: 'El tratamiento de datos personales por sistemas IA cumple el RGPD. Los datos sensibles requieren autorización explícita.' },
                { title: 'No discriminación',    desc: 'Los sistemas IA no pueden generar sesgos injustificados basados en características protegidas por la legislación.' },
                { title: 'Seguridad y robustez', desc: 'Los sistemas IA son seguros frente a manipulaciones y se monitorizan continuamente para detectar degradación del rendimiento.' },
                { title: 'Rendición de cuentas', desc: 'Cada sistema IA tiene un responsable designado (AI Owner) que garantiza su uso conforme a esta política.' },
              ].map(({ title, desc }) => (
                <View key={title} style={s.principleCard}>
                  <Text style={s.principleTitle}>{title}</Text>
                  <Text style={s.principleDesc}>{desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 4. Catálogo */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>4. Catálogo de IA Aprobada</Text>
            <Text style={s.paragraph}>
              Los siguientes sistemas IA han sido evaluados, aprobados (Go) e incorporados al
              pipeline de implementación de {companyName} a la fecha de emisión de esta política.
            </Text>
            {approvedCases.length === 0 ? (
              <Text style={{ ...s.paragraph, fontStyle: 'italic', color: GRAY_400 }}>
                Sin casos de uso aprobados. Completa el proceso Go/No-Go en T4.
              </Text>
            ) : (
              <View>
                <View style={s.tableHeader}>
                  <Text style={[s.thCell, s.col1]}>Sistema IA</Text>
                  <Text style={[s.thCell, s.col2]}>Departamento</Text>
                  <Text style={[s.thCell, s.col3]}>Riesgo AI Act</Text>
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
                      <Text style={[s.tdCell, s.col4, { color: '#166534', fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>
                        {statusLabel(uc.status)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 5 (condicional). Controles de alto riesgo */}
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
            <Text style={s.sectionTitle}>{4 + sectionOffset + 1}. Roles y Responsabilidades</Text>
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
            <Text style={s.sectionTitle}>{4 + sectionOffset + 2}. Revisión y Vigencia</Text>
            <Text style={s.paragraph}>
              Esta política será revisada anualmente o ante cambios regulatorios significativos
              (nuevas disposiciones del AI Act, actualizaciones del RGPD o cambios en el catálogo
              de sistemas IA de {companyName}). La siguiente revisión programada es {nextReviewStr}.
            </Text>
            <View style={s.footer}>
              <Text style={s.footerText}>
                Documento generado automáticamente por el L.E.A.N. AI System Enterprise (T6 — Risk & Governance).{'\n'}
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
              error   ? 'bg-red-600 cursor-not-allowed opacity-70'
              : loading ? 'bg-navy/50 cursor-wait'
              : 'bg-navy hover:bg-navy/90',
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
              '⚠ Error al generar'
            ) : (
              '↓ Descargar PDF'
            )}
          </button>
        )
      }}
    </BlobProvider>
  )
}
