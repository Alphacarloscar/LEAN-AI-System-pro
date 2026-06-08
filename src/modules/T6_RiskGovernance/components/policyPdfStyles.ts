// ============================================================
// policyPdfStyles — StyleSheet for PolicyPDF document
// ============================================================

import { StyleSheet } from '@react-pdf/renderer'

// ── Paleta de colores del design system ────────────────────────

export const NAVY    = '#2A2822'   // warm charcoal
export const WHITE   = '#FFFFFF'
export const GRAY_50 = '#F7F4EE'   // warm ivory
export const GRAY_200= '#D4D0C8'   // warm border
export const GRAY_400= '#9A9790'   // warm muted
export const GRAY_600= '#6B6864'   // warm text-muted
export const ORANGE  = '#C8860A'   // gold accent

export const RISK_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  prohibido:      { label: 'Prohibido',      bg: '#FEE2E2', color: '#991B1B' },
  alto:           { label: 'Alto Riesgo',    bg: '#FEF3C7', color: '#92400E' },
  limitado:       { label: 'Riesgo Limitado',bg: '#FFF7ED', color: '#9A3412' },
  minimo:         { label: 'Riesgo Mínimo',  bg: '#F0FDF4', color: '#166534' },
  sin_clasificar: { label: 'Sin clasificar', bg: '#F3F4F6', color: '#6B7280' },
}

export const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize:   9,
    color:      '#1C1A16',
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
