interface ToolErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ToolErrorState({
  message = 'No se pudieron cargar los datos de esta herramienta.',
  onRetry,
}: ToolErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <p className="text-sm text-[#6B6560] max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 px-4 rounded-lg border border-[#C8860A] text-[#C8860A] text-xs font-medium hover:bg-[#C8860A]/10 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
