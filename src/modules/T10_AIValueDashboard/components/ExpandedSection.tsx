// ExpandedSection — wrapper con animación para contenido expandido

export function ExpandedSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 pt-3 border-t border-border dark:border-warm-500 animate-fade-in">
      {children}
    </div>
  )
}
