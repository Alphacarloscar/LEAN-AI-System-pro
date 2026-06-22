import { computeROIFromEconomics } from '../constants'
import { fmtEur } from './T4Badges.constants'
import { Card } from '@shared/design-system/components'
import type { UseCase } from '../types'

interface ExecDashboardProps {
  useCases: UseCase[]
}

export function ExecDashboard({ useCases }: ExecDashboardProps) {
  const totalGo = useCases.filter((uc) => uc.status === 'go').length
  const pending = useCases.filter(
    (uc) => uc.status === 'candidato' || uc.status === 'priorizado',
  ).length

  const roisWithData = useCases
    .filter((uc) => uc.economics)
    .map((uc) => computeROIFromEconomics(uc.economics!))

  const totalAnnualSaving = roisWithData.reduce((acc, r) => acc + r.annualSaving, 0)
  const avgPayback =
    roisWithData.length > 0
      ? roisWithData.reduce((acc, r) => acc + r.paybackMonths, 0) / roisWithData.length
      : null

  const kpis = [
    {
      label:    'Casos aprobados (GO)',
      value:    String(totalGo),
      subtext:  `de ${useCases.length} totales`,
      color:    'text-success-dark',
      dotColor: 'bg-success-dark',
    },
    {
      label:    'Ahorro anual estimado',
      value:    fmtEur(totalAnnualSaving),
      subtext:  `${roisWithData.length} casos con datos económicos`,
      color:    'text-lean-black dark:text-gray-100',
      dotColor: 'bg-navy',
    },
    {
      label:    'Payback promedio',
      value:    avgPayback !== null ? `${avgPayback.toFixed(1)} meses` : '—',
      subtext:  'recuperación de inversión',
      color:    'text-lean-black dark:text-gray-100',
      dotColor: 'bg-info-dark',
    },
    {
      label:    'Pendientes de decisión',
      value:    String(pending),
      subtext:  'candidatos + priorizados',
      color:    pending > 0 ? 'text-warning-dark' : 'text-text-muted',
      dotColor: pending > 0 ? 'bg-warning-dark' : 'bg-gray-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          variant="outlined"
          padding="none"
          className="rounded-xl px-5 py-4 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${kpi.dotColor}`} />
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle leading-tight">
              {kpi.label}
            </p>
          </div>
          <p className={`text-2xl font-bold tabular-nums leading-none ${kpi.color}`}>
            {kpi.value}
          </p>
          <p className="text-[10px] text-text-subtle">{kpi.subtext}</p>
        </Card>
      ))}
    </div>
  )
}
