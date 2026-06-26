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

import { useState, useMemo, useEffect }   from 'react'
import { useNavigate }                    from 'react-router-dom'
import { Button, Card, ToolHeader, EmptyState } from '@shared/design-system/components'
import { useT4Store }                     from '@/modules/T4_UseCasePriorityBoard/store'
import { useT9Store }                     from './store'
import { useCompanyProfileStore }         from '@/modules/CompanyProfile/store'
import { useEngagementStore }             from '@/modules/Engagement/store'
import { PhaseMiniMap }                   from '@/shared/components/PhaseMiniMap'
import { RecommendationPanel }            from '@/components/RecommendationPanel'
import { buildT9RecommendationContext }   from './t9ContextBuilder'
import { usePermissions, useAuthStore }   from '@/modules/Auth'
import { ViewerEmptyState }               from '@/shared/components/ViewerEmptyState'
import { GanttRowItem }                   from './components/GanttRowItem'
import { AddFreeItemForm }                from './components/AddFreeItemForm'
import { computeDefaultOverride, MONTH_NAMES } from './t9GanttHelpers'
import { DS, DS_DARK }                    from './components/GanttRowItem.constants'
import type { AIGanttRow, FreeGanttRow, GanttRow } from './components/GanttRowItem'
import type { AddFreeItemFormValues } from '@/lib/schemas/t9.schemas'
import { createSnapshot }                 from '@/services/t9.service'
import { reportError }                    from '@/lib/reportError'

// ── Props ─────────────────────────────────────────────────────

interface T9ViewProps {
  onBack: () => void
}

// ── T9View ────────────────────────────────────────────────────

export function T9View({ onBack }: T9ViewProps) {
  const navigate                    = useNavigate()
  const { isReadOnly } = usePermissions()
  const { useCases, engagementId: t4EngagementId, loadEngagement: loadT4 } = useT4Store()
  const { overrides, freeItems, setOverride, addFreeItem, updateFreeItem, syncEngagement: syncT9 } = useT9Store()
  const { profile: companyProfile }                     = useCompanyProfileStore()
  const engagementId                                    = useEngagementStore((s) => s.activeEngagementId)
  const { user }                                        = useAuthStore()
  const [snapshotLoading, setSnapshotLoading]           = useState(false)
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Scoping: si cambia el engagement, limpia overrides y freeItems del cliente anterior
  // stable Zustand action — mount-only: sincronizar al cambiar engagement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { syncT9(engagementId) }, [engagementId])

  // Cargar T4 al montar T9 si el engagement del store T4 no coincide con el activo
  // RC-3: condición engagement-aware — evita usar datos stale de un proyecto anterior
  // stable Zustand action (loadT4) — referencia estable, no debe re-disparar el efecto
  useEffect(() => {
    if (engagementId && t4EngagementId !== engagementId) loadT4(engagementId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, t4EngagementId])

  // ── Selector de año ───────────────────────────────────────────
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const goCases = useCases.filter((uc) => {
    if (!(uc.status === 'go' || uc.status === 'en_piloto' || uc.status === 'completado')) return false
    if (uc.roadmap?.startDate) {
      const startYear = new Date(uc.roadmap.startDate + 'T12:00:00').getFullYear()
      const endYear   = uc.roadmap?.endDate
        ? new Date(uc.roadmap.endDate + 'T12:00:00').getFullYear()
        : startYear
      return startYear <= selectedYear && endYear >= selectedYear
    }
    return selectedYear === currentYear
  })

  const t9LLMContext = useMemo(
    () => companyProfile
      ? buildT9RecommendationContext(goCases, freeItems, overrides, companyProfile)
      : null,
    [goCases, freeItems, overrides, companyProfile]
  )

  // Construir filas ai_import: merge T4 data + override persistido
  const aiRows: AIGanttRow[] = goCases.map((uc) => {
    const persisted = overrides.find((o) => o.useCaseId === uc.id)
    const computed  = computeDefaultOverride(uc)
    const override  = uc.roadmap?.startDate
      ? { ...computed, responsible: persisted?.responsible ?? computed.responsible }
      : (persisted ?? computed)
    return { kind: 'ai' as const, uc, override }
  })

  const freeRows: FreeGanttRow[] = freeItems.map((item) => ({ kind: 'free' as const, item }))

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
      ? (r.uc.aiActClassification?.riskLevel === 'alto' || r.uc.aiActClassification?.riskLevel === 'prohibido')
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
      const base = computeDefaultOverride(aiRow.uc)
      setOverride({ ...base, responsible: editValue })
    } else {
      updateFreeItem(rowId, { responsible: editValue })
    }
    setEditingId(null)
  }

  // ── Crear snapshot ────────────────────────────────────────────
  async function handleCreateSnapshot() {
    if (!engagementId || !user?.id) return
    setSnapshotLoading(true)
    try {
      const label = `Roadmap ${selectedYear} — ${new Date().toLocaleDateString('es-ES')}`
      await createSnapshot({ engagementId, createdBy: user.id, label, type: 'roadmap' })
    } catch (err) {
      reportError('T9.createSnapshot', err)
    } finally {
      setSnapshotLoading(false)
    }
  }

  // ── Formulario añadir libre ───────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false)

  function handleAddFree(data: AddFreeItemFormValues) {
    addFreeItem(data)
    setShowAddForm(false)
  }

  const MONTHS = MONTH_NAMES

  return (
    <div className="min-h-full bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <ToolHeader
        onBack={onBack}
        backLabel="Volver al dashboard"
        toolCode="T9"
        title="Roadmap IA — 6 meses"
        phaseMiniMap={<PhaseMiniMap phaseId="activate" toolCode="T9" />}
        maxWidth="max-w-7xl"
        cta={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 border border-border dark:border-white/10 rounded-lg px-2 py-1 bg-white dark:bg-warm-800">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-lean-black dark:hover:text-warm-50 transition-colors rounded"
                aria-label="Año anterior"
              >
                ‹
              </button>
              <span className="text-xs font-mono font-medium text-lean-black dark:text-warm-50 px-1.5 tabular-nums">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-lean-black dark:hover:text-warm-50 transition-colors rounded"
                aria-label="Año siguiente"
              >
                ›
              </button>
            </div>
            {!isReadOnly && (
              <>
                <Button variant="primary" size="sm" onClick={handleCreateSnapshot} disabled={snapshotLoading}>
                  {snapshotLoading ? 'Guardando…' : 'Crear snapshot'}
                </Button>
                <Button variant="primary" size="sm" onClick={() => { setShowAddForm(true) }}>
                  + Añadir iniciativa
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {([
          { n: goCases.length,   label: 'Casos Go (T4)' },
          { n: freeItems.length, label: 'Iniciativas libres' },
          { n: inPilotOrDone,    label: 'Activos o completados' },
          { n: highRiskCount,    label: 'Riesgos altos' },
        ] as const).map(({ n, label }) => (
          <Card key={label} variant="outlined" padding="none" className="rounded-xl px-5 py-4">
            <p className="text-2xl font-semibold text-lean-black dark:text-warm-50">{n}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* ── Gantt ── */}
      <Card variant="outlined" padding="none" className="rounded-xl overflow-hidden">

        {/* Cabecera */}
        <div className="grid border-b border-border dark:border-white/6" style={{ gridTemplateColumns: '260px 1fr' }}>
          <div className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-text-muted">
            Iniciativa / responsable
          </div>
          <div className="border-l border-border dark:border-white/6">
            {/* Trimestres */}
            <div className="grid border-b border-border dark:border-white/6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {([
                { q: 'Q1', months: 'Ene–Mar', bg: dark ? DS_DARK.infoLight    : DS.infoLight,    color: DS.infoDark    },
                { q: 'Q2', months: 'Abr–Jun', bg: dark ? DS_DARK.successLight : DS.successLight, color: DS.successDark },
                { q: 'Q3', months: 'Jul–Sep', bg: dark ? DS_DARK.warningLight : DS.warningLight, color: DS.warningDark },
                { q: 'Q4', months: 'Oct–Dic', bg: dark ? DS_DARK.dangerLight  : DS.dangerLight,  color: DS.dangerDark  },
              ]).map(({ q, months, bg, color }, i) => (
                <div
                  key={q}
                  className={['py-1.5 text-center text-[10px] font-medium uppercase tracking-widest', i < 3 ? 'border-r border-border dark:border-white/6' : ''].join(' ')}
                  style={{ background: bg, color }}
                >
                  {q} {selectedYear} · {months}
                </div>
              ))}
            </div>
            {/* Meses */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
              {MONTHS.map((m, i) => (
                <div
                  key={m}
                  className={['py-1.5 text-center text-[11px] text-text-muted', i < 11 ? 'border-r border-border dark:border-white/6' : ''].join(' ')}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filas vacías */}
        {allRows.length === 0 && (
          isReadOnly ? (
            <div className="px-6 py-10"><ViewerEmptyState /></div>
          ) : (
            <EmptyState
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="8" height="2.5" rx="1"/>
                  <rect x="6" y="11" width="10" height="2.5" rx="1"/>
                  <line x1="2" y1="3" x2="2" y2="17"/>
                </svg>
              }
              title="Roadmap vacío"
              description="Aprueba casos de uso en T4 o añade iniciativas libres para construir el roadmap de 6 meses."
              action={<Button variant="ghost" size="sm" onClick={() => navigate('/t4')}>Ir a T4</Button>}
              className="py-10"
            />
          )
        )}

        {allRows.map((row) => {
          const rowId = row.kind === 'ai' ? row.uc.id : row.item.id
          return (
            <GanttRowItem
              key={rowId}
              row={row}
              isEditing={editingId === rowId}
              editValue={editValue}
              isDirty={editingId === rowId && editValue !== (
                row.kind === 'ai' ? row.override.responsible : row.item.responsible
              )}
              onEditStart={(current) => handleEditStart(rowId, current)}
              onEditChange={setEditValue}
              onEditSave={() => handleEditSave(rowId)}
            />
          )
        })}

        {showAddForm && (
          <AddFreeItemForm
            onSave={handleAddFree}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </Card>

      {/* ── Leyenda ── */}
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

      {/* ── RECOMENDACIONES IA ── */}
      {t9LLMContext && (
        <RecommendationPanel
          tool="t9"
          title="Recomendaciones IA — Roadmap 6 Meses"
          subtitle="Generadas por Claude · Específicas para este roadmap"
          context={t9LLMContext}
          engagementId={engagementId}
        />
      )}
      </div>
    </div>
  )
}
