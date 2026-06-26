import { Spinner } from '@shared/design-system/components'

interface ToolLoadingScreenProps {
  toolCode: string
  label?: string
}

export function ToolLoadingScreen({ toolCode, label = 'Cargando…' }: ToolLoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="flex items-center gap-3 text-[#C8860A]">
        <Spinner size="lg" />
        <span className="text-sm font-medium text-[#6B6560]">{label}</span>
      </div>
      <span className="text-xs text-[#9B9590] font-mono">{toolCode}</span>
    </div>
  )
}
