// ============================================================
// T9 — AI Roadmap 6M — Vista principal
//
// Gantt de 6 meses con agrupación trimestral (Q1/Q2).
// Dos tipos de fila:
//   ai_import — casos de uso Go importados de T4 (status y
//               riesgo siempre live desde T4; posición y
//               responsable editables por el consultor)
//   free      — iniciativas libres del consultor
//
// Riesgo: mapeado desde aiActClassification.riskLevel de T4.
// Status ai_import: sincronizado automáticamente desde T4.
// Milestones: auto-generados al final de cada barra Go.
// Sprint 4: edición de milestones, drag & drop, export PDF.
// ============================================================

import { useState }     from 'react'
import { useT4Store }   from '@/modules/T4_UseCasePriorityBoard/store'
import { useT9Store }   from './store'
import { PhaseMiniMap } from '@/shared/components/PhaseMiniMap'
import type { AIActRiskLevel, UseCase } from '@/modules/T4_UseCasePriorityBoard/types'
import type {
  AddFreeForm,
  FreeItem,
  FreeItemStatus,
  RoadmapRiskLevel,
  T9ItemOverride,
} from './types'

// ── Props ─────────────────────────────────────────────────────

interface T9ViewProps {
  companyName: string
  onBack: () => void
}

// ── Tipos internos ────────────────────────────────────────────

type AIGanttRow   = { kind: 'ai';   uc: UseCase; override: T9ItemOverride }
type FreeGanttRow = { kind: 'free'; item: FreeItem }
type GanttRow     = AIGanttRow | FreeGanttRow

// ── Design System tokens (hex refs — source of truth: tailwind.config.ts) ──────
const DS = {
  navy:           '#2A2822',  // warm charcoal (era #1B2A4E)
  successLight:   '#D4EDE3',
  successDark:    '#5FAF8A',
  warningLight:   '#FAF0D7',
  warningDark:    '#D4A85C',
  dangerLight:    '#F5DEDE',
  dangerDark:     '#C06060',
  infoLight:      '#DDE8F5',
  infoDark:       '#6A90C0',
  surface:        '#F7F4EE',  // warm ivory (era #F9FAFB)
  textMuted:      '#6B6864',  // warm text-muted (era #6B7280)
  // Neutral decorative — free/initiative bars (warm gray, intentional)
  freeBarPending: '#D4D0C8',  // warm (era #D3D1C7)
  freeBar:        '#B4B0A8',  // warm (era #B4B2A9)
  freeBarText:    '#2C2A26',  // warm (era #2C2C2A)
  freeSourceColor:'#444441',
} as const

// ── Helpers de riesgo ─────────────────────────────────────────

function mapAIActRisk(r?: AIActRiskLevel): RoadmapRiskLevel {
  if (!r || r === 'minimo' || r === 'sin_clasificar') return 'bajo'
  if (r === 'limitado') return 'medio'
  return 'alto'  // 'alto' | 'prohibido'
}

const RISK_META: Record<RoadmapRiskLevel, { label: string; bg: string; color: string }> = {
  alto:  { label: 'Riesgo alto',  bg: DS.dangerLight,  color: DS.dangerDark  },
  medio: { label: 'Riesgo medio', bg: DS.warningLight, color: DS.warningDark },
  bajo:  { label: 'Riesgo bajo',  bg: DS.successLight, color: DS.successDark },
}

// ── Helpers de status ─────────────────────────────────────────

const T4_STATUS_META = {
  go:         { label: 'Aprobado',   bg: DS.successLight, color: DS.successDark },
  en_piloto:  { label: 'En piloto',  bg: DS.infoLight,    color: DS.infoDark   },
  completado: { label: 'Completado', bg: DS.successLight, color: DS.successDark },
  priorizado: { label: 'Priorizado', bg: DS.warningLight, color: DS.warningDark },
  candidato:  { label: 'Candidato',  bg: DS.surface,      color: DS.textMuted  },
  no_go:      { label: 'No Go',      bg: DS.dangerLight,  color: DS.dangerDark  },
} as const

const FREE_STATUS_META: Record<FreeItemStatus, { label: string; bg: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  bg: DS.surface,      color: DS.textMuted  },
  en_curso:   { label: 'En curso',   bg: DS.infoLight,    color: DS.infoDark   },
  completado: { label: 'Completado', bg: DS.successLight, color: DS.successDark },
}

// ── Helpers de posición ───────────────────────────────────────

function quarterToStartMonth(quarter?: string): number {
  if (!quarter) return 0
  const q = quarter.toUpperCase()
  if (q.includes('Q1')) return 0
  if (q.includes('Q2')) return 1
  if (q.includes('Q3')) return 3
  if (q.includes('Q4')) return 4
  return 0
}

function durationToSpan(duration?: string): number {
  if (!duration) return 1
  const lower = duration.toLowerCase()
  if (lower.includes('semana')) {
    return Math.max(1, Math.ceil((parseInt(lower, 10) || 2) / 4))
  }
  if (lower.includes('mes')) {
    return Math.max(1, parseInt(lower, 10) || 1)
  }
  return 1
}

function computeDefaultOverride(uc: UseCase): T9ItemOverride {
  const start = quarterToStartMonth(uc.roadmap?.quarter)
  const span  = durationToSpan(uc.roadmap?.estimatedDuration)
  return {
    useCaseId:   uc.id,
    startMonth:  start,
    endMonth:    Math.min(start + span - 1, 5),
    responsible: uc.roadmap?.owner ?? uc.sponsorName ?? '—',
  }
}

// ── Estilos de barra (posición dinámica) ─────────────────────

function barLeftPct(startMonth: number): string {
  return `${(startMonth / 6) * 100}%`
}

function barWidthPct(startMonth: number, endMonth: number): string {
  return `${Math.max(((endMonth - startMonth + 1) / 6) * 100, 8)}%`
}

function milestoneLeftPct(endMonth: number): string {
  // borde derecho del mes — centrado en el marcador (5px = mitad del dot)
  return `calc(${((endMonth + 1) / 6) * 100}% - 5px)`
}

// ── Badge ─────────────────────────────────────────────────────

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 10,
        padding: '1px 7px',
        borderRadius: 10,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

// ── GanttRow ──────────────────────────────────────────────────

interface GanttRowProps {
  row:           GanttRow
  isEditing:     boolean
  editValue:     string
  onEditStart:   (current: string) => void
  onEditChange:  (v: string) => void
  onEditSave:    () => void
}

function GanttRowItem({
  row, isEditing, editValue, onEditStart, onEditChange, onEditSave,
}: GanttRowProps) {

  // Extraer campos según tipo de fila
  let name:          string
  let department:    string
  let responsible:   string
  let startMonth:    number
  let endMonth:      number
  let riskMeta:      { label: string; bg: string; color: string }
  let statusBadge:   React.ReactNode
  let barBg:         string
  let barTextColor:  string
  let barOpacity:    number
  let showMilestone: boolean
  let sourceLabel:   string
  let sourceBg:      string
  let sourceColor:   string

  if (row.kind === 'ai') {
    const { uc, override } = row
    name          = uc.name
    department    = uc.department
    responsible   = override.responsible
    startMonth    = override.startMonth
    endMonth      = override.endMonth
    riskMeta      = RISK_META[mapAIActRisk(uc.aiActClassification?.riskLevel)]
    const sm      = T4_STATUS_META[uc.status] ?? T4_STATUS_META.candidato
    statusBadge   = <Badge label={sm.label} bg={sm.bg} color={sm.color} />
    barBg         = DS.navy
    barTextColor  = '#ffffff'
    barOpacity    = uc.status === 'completado' ? 0.45 : 1
    showMilestone = !!uc.roadmap?.quarter
    sourceLabel   = 'T4 · Go'
    sourceBg      = DS.infoLight
    sourceColor   = DS.infoDark
  } else {
    const { item } = row
    name          = item.name
    department    = item.department
    responsible   = item.responsible
    startMonth    = item.startMonth
    endMonth      = item.endMonth
    riskMeta      = RISK_META[item.riskLevel]
    const sm      = FREE_STATUS_META[item.status]
    statusBadge   = <Badge label={sm.label} bg={sm.bg} color={sm.color} />
    barBg         = item.status === 'pendiente' ? DS.freeBarPending : DS.freeBar
    barTextColor  = DS.freeBarText
    barOpacity    = item.status === 'completado' ? 0.5 : 1
    showMilestone = false
    sourceLabel   = 'Libre'
    sourceBg      = DS.surface
    sourceColor   = DS.freeSourceColor
  }

  return (
    <div
      className="grid border-t border-border dark:border-white/6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
      style={{ gridTemplateColumns: '260px 1fr', minHeight: 56 }}
    >
      {/* Columna izquierda: info */}
      <div className="px-4 py-2 flex flex-col justify-center gap-1 border-r border-border dark:border-white/6 min-w-0">
        <p
          className="text-xs font-medium text-lean-black dark:text-gray-100 truncate"
          style={{ maxWidth: 228 }}
          title={name}
        >
          {name}
        </p>

        {/* Badges: fuente + status + riesgo */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge label={sourceLabel} bg={sourceBg} color={sourceColor} />
          {statusBadge}
          <Badge label={riskMeta.label} bg={riskMeta.bg} color={riskMeta.color} />
        </div>

        {/* Departamento + responsable editable */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-text-muted"
            style={{ flexShrink: 0 }}
          >
            {department || '—'}
          </span>

          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  onEditSave()
                if (e.key === 'Escape') onEditSave()
              }}
              className="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 text-text-muted w-28 outline-none focus:ring-1 focus:ring-blue-300"
            />
          ) : (
            <button
              onClick={() => onEditStart(responsible)}
              className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-lean-black dark:hover:text-gray-100 transition-colors group"
            >
              <span>{responsible || '— sin responsable'}</span>
              {/* Icono lápiz */}
              <svg
                className="opacity-0 group-hover:opacity-50 ml-0.5 flex-shrink-0"
                width="9" height="9" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Columna derecha: barra Gantt */}
      <div className="relative flex items-center px-2 overflow-hidden">

        {/* Líneas de mes */}
        <div
          className="absolute inset-0 grid pointer-events-none"
          style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={i < 5 ? 'border-r border-border/25 dark:border-white/5' : ''}
            />
          ))}
        </div>

        {/* Divisor Q1/Q2 (mes 3 → mes 4) */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: '50%', width: 1, background: 'rgba(0,0,0,0.08)' }}
        />

        {/* Barra */}
        <div
          className="absolute h-[22px] rounded flex items-center px-2 overflow-hidden"
          style={{
            left:       barLeftPct(startMonth),
            width:      barWidthPct(startMonth, endMonth),
            background: barBg,
            opacity:    barOpacity,
            transition: 'opacity 200ms',
          }}
        >
          <span
            className="text-[10px] font-medium truncate"
            style={{ color: barTextColor }}
          >
            {name}
          </span>
        </div>

        {/* Hito al final de la barra */}
        {showMilestone && (
          <div
            className="absolute w-2.5 h-2.5 rounded-full z-10 pointer-events-none"
            style={{
              left:      milestoneLeftPct(endMonth),
              top:       '50%',
              transform: 'translateY(-50%)',
              background: DS.dangerDark,
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── AddFreeItemForm ───────────────────────────────────────────

const MONTH_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: i,
  label: `Mes ${i + 1}`,
}))

const SELECT_CLS =
  'w-full text-xs border border-border dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-lean-black dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-300'

const INPUT_CLS = SELECT_CLS

interface AddFormProps {
  form:      AddFreeForm
  onChange:  (updates: Partial<AddFreeForm>) => void
  onSave:    () => void
  onCancel:  () => void
}

function AddFreeItemForm({ form, onChange, onSave, onCancel }: AddFormProps) {
  return (
    <div className="border-t border-border dark:border-white/6 px-5 py-4 bg-gray-50 dark:bg-gray-800/30">
      <p className="text-xs font-medium text-lean-black dark:text-gray-100 mb-3">
        Nueva iniciativa libre
      </p>

      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Nombre — ocupa 2 columnas */}
        <div style={{ gridColumn: '1 / 3' }}>
          <label className="text-[10px] text-text-subtle block mb-1">
            Nombre de la iniciativa *
          </label>
          <input
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ej: Migración ERP, Formación interna..."
            className={INPUT_CLS}
          />
        </div>

        {/* Departamento */}
        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Departamento</label>
          <input
            value={form.department}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="IT, RRHH, Finanzas..."
            className={INPUT_CLS}
          />
        </div>

        {/* Responsable */}
        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Responsable</label>
          <input
            value={form.responsible}
            onChange={(e) => onChange({ responsible: e.target.value })}
            placeholder="Nombre y apellido"
            className={INPUT_CLS}
          />
        </div>

        {/* Mes inicio */}
        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Mes inicio</label>
          <select
            value={form.startMonth}
            onChange={(e) => {
              const s = Number(e.target.value)
              onChange({ startMonth: s, endMonth: Math.max(form.endMonth, s) })
            }}
            className={SELECT_CLS}
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Mes fin */}
        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Mes fin</label>
          <select
            value={form.endMonth}
            onChange={(e) => onChange({ endMonth: Number(e.target.value) })}
            className={SELECT_CLS}
          >
            {MONTH_OPTIONS.filter((o) => o.value >= form.startMonth).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Riesgo */}
        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Nivel de riesgo</label>
          <select
            value={form.riskLevel}
            onChange={(e) => onChange({ riskLevel: e.target.value as RoadmapRiskLevel })}
            className={SELECT_CLS}
          >
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Estado</label>
          <select
            value={form.status}
            onChange={(e) => onChange({ status: e.target.value as FreeItemStatus })}
            className={SELECT_CLS}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={!form.name.trim()}
          className="px-4 py-1.5 text-xs bg-navy-metallic text-white rounded-lg hover:bg-navy-metallic-hover disabled:opacity-40 transition-all shadow-sm"
        >
          Añadir al roadmap
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-xs border border-border dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── T9View ────────────────────────────────────────────────────

export function T9View({ companyName, onBack }: T9ViewProps) {
  const { useCases }                                    = useT4Store()
  const { overrides, freeItems, setOverride, addFreeItem, updateFreeItem } = useT9Store()

  // Solo casos con decisión Go confirmada
  const goCases = useCases.filter((uc) => uc.goNoGo?.decision === 'go')

  // Construir filas ai_import: merge T4 data + override persistido (o default calculado)
  const aiRows: AIGanttRow[] = goCases.map((uc) => {
    const persisted = overrides.find((o) => o.useCaseId === uc.id)
    const override  = persisted ?? computeDefaultOverride(uc)
    return { kind: 'ai' as const, uc, override }
  })

  // Filas libres
  const freeRows: FreeGanttRow[] = freeItems.map((item) => ({ kind: 'free' as const, item }))

  // Todas las filas ordenadas por startMonth ascendente
  const allRows: GanttRow[] = [...aiRows, ...freeRows].sort((a, b) => {
    const aS = a.kind === 'ai' ? a.override.startMonth : a.item.startMonth
    const bS = b.kind === 'ai' ? b.override.startMonth : b.item.startMonth
    return aS - bS
  })

  // ── Stats ────────────────────────────────────────────────────
  const inPilotOrDone = goCases.filter(
    (uc) => uc.status === 'en_piloto' || uc.status === 'completado'
  ).length

  const highRiskCount = allRows.filter((r) =>
    r.kind === 'ai'
      ? mapAIActRisk(r.uc.aiActClassification?.riskLevel) === 'alto'
      : r.item.riskLevel === 'alto'
  ).length

  // ── Edición de responsable (inline) ──────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function handleEditStart(rowId: string, current: string) {
    setEditingId(rowId)
    setEditValue(current)
  }

  function handleEditSave(rowId: string) {
    const aiRow = aiRows.find((r) => r.uc.id === rowId)
    if (aiRow) {
      const existing = overrides.find((o) => o.useCaseId === rowId)
        ?? computeDefaultOverride(aiRow.uc)
      setOverride({ ...existing, responsible: editValue })
    } else {
      updateFreeItem(rowId, { responsible: editValue })
    }
    setEditingId(null)
  }

  // ── Formulario añadir libre ───────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddFreeForm>({
    name:        '',
    department:  '',
    responsible: '',
    startMonth:  0,
    endMonth:    1,
    riskLevel:   'bajo',
    status:      'pendiente',
  })

  function handleAddFree() {
    if (!addForm.name.trim()) return
    addFreeItem(addForm)
    setAddForm({
      name: '', department: '', responsible: '',
      startMonth: 0, endMonth: 1, riskLevel: 'bajo', status: 'pendiente',
    })
    setShowAddForm(false)
  }

  const MONTHS = ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6']

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-lean-black dark:hover:text-gray-100 mb-1.5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Volver al dashboard
          </button>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-warm-100 uppercase tracking-wider">T9</span>
            <h1 className="text-base font-semibold text-lean-black dark:text-gray-100">Roadmap IA — 6 meses</h1>
            <PhaseMiniMap phaseId="activate" toolCode="T9" />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">{companyName} · Sprint L.E.A.N.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-xs bg-navy-metallic text-white rounded-lg hover:bg-navy-metallic-hover transition-all shadow-sm">
            Crear snapshot
          </button>
          <button
            onClick={() => { setShowAddForm(true) }}
            className="px-4 py-1.5 text-xs bg-navy-metallic text-white rounded-lg hover:bg-navy-metallic-hover transition-all shadow-sm"
          >
            + Añadir iniciativa
          </button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {([
          { n: goCases.length,  label: 'Casos Go (T4)' },
          { n: freeItems.length, label: 'Iniciativas libres' },
          { n: inPilotOrDone,   label: 'Activos o completados' },
          { n: highRiskCount,   label: 'Riesgos altos' },
        ] as const).map(({ n, label }) => (
          <div
            key={label}
            className="rounded-xl bg-white dark:bg-gray-900 px-5 py-4 border border-border dark:border-white/6"
          >
            <p className="text-2xl font-semibold text-lean-black dark:text-gray-100">{n}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Gantt ───────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 overflow-hidden">

        {/* Cabecera */}
        <div className="grid border-b border-border dark:border-white/6" style={{ gridTemplateColumns: '260px 1fr' }}>
          <div className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-text-subtle">
            Iniciativa / responsable
          </div>
          <div className="border-l border-border dark:border-white/6">
            {/* Trimestres */}
            <div className="grid border-b border-border dark:border-white/6" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div
                className="py-1.5 text-center text-[10px] font-medium uppercase tracking-widest border-r border-border dark:border-white/6"
                style={{ background: DS.infoLight, color: DS.infoDark }}
              >
                Q1 — Meses 1 a 3
              </div>
              <div
                className="py-1.5 text-center text-[10px] font-medium uppercase tracking-widest"
                style={{ background: DS.successLight, color: DS.successDark }}
              >
                Q2 — Meses 4 a 6
              </div>
            </div>
            {/* Meses */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {MONTHS.map((m, i) => (
                <div
                  key={m}
                  className={[
                    'py-1.5 text-center text-[11px] text-text-subtle',
                    i < 5 ? 'border-r border-border dark:border-white/6' : '',
                  ].join(' ')}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filas */}
        {allRows.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-text-muted">
            No hay casos de uso con decisión Go en T4. Añade iniciativas libres o completa el proceso de scoring en T4.
          </div>
        )}

        {allRows.map((row) => {
          const rowId = row.kind === 'ai' ? row.uc.id : row.item.id
          return (
            <GanttRowItem
              key={rowId}
              row={row}
              isEditing={editingId === rowId}
              editValue={editValue}
              onEditStart={(current) => handleEditStart(rowId, current)}
              onEditChange={setEditValue}
              onEditSave={() => handleEditSave(rowId)}
            />
          )
        })}

        {/* Formulario añadir / botón añadir */}
        {showAddForm ? (
          <AddFreeItemForm
            form={addForm}
            onChange={(updates) => setAddForm((prev) => ({ ...prev, ...updates }))}
            onSave={handleAddFree}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center gap-1.5 px-4 py-2.5 text-xs text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800/30 border-t border-border dark:border-white/6 transition-colors"
          >
            <span className="text-sm leading-none">+</span>
            Añadir iniciativa libre
          </button>
        )}
      </div>

      {/* ── Leyenda ──────────────────────────────────────────── */}
      <div className="flex items-center gap-5 flex-wrap pb-2">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <div className="w-6 h-2 rounded" style={{ background: DS.navy }} />
          Caso de uso IA (T4 · Go)
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <div className="w-6 h-2 rounded" style={{ background: DS.freeBar }} />
          Iniciativa libre
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: DS.dangerDark }} />
          Hito de entrega
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" />
          </svg>
          Clic en responsable para editar
        </div>
      </div>
    </div>
  )
}
