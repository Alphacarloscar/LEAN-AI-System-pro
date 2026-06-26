// EmptyStates — pantallas de guardia cuando no hay proyecto o datos T1

// ── EmptyNoProject — sin proyecto seleccionado ─────────────────

export function EmptyNoProject() {
  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center px-6">
      <div className="text-center max-w-sm space-y-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto bg-card dark:bg-warm-700 border border-border dark:border-warm-500">
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none" stroke="#C8860A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="10" height="10" rx="1" />
            <path d="M5 13V9h4v4M2 6h10" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-1.5">
            Selecciona un proyecto
          </h2>
          <p className="text-xs text-text-muted dark:text-warm-400 leading-relaxed">
            El dashboard de adopción IA está vinculado al proyecto activo.
            Usa el selector <span className="font-semibold text-lean-black dark:text-warm-100">▾ Proyecto</span> en la barra superior para seleccionar uno existente o crear uno nuevo.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── EmptyNoData — proyecto activo pero sin datos T1 ────────────

export function EmptyNoData({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center px-6">
      <div className="text-center max-w-md space-y-5">
        {/* Icono */}
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto bg-card dark:bg-warm-700 border border-border dark:border-warm-500">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeWidth="1.8" />
          </svg>
        </div>
        {/* Texto */}
        <div>
          <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-2">
            No hay datos suficientes para calcular el valor
          </h2>
          <p className="text-xs text-text-muted dark:text-warm-400 leading-relaxed">
            El dashboard se construye a partir de las herramientas del programa GOBY.
            Comienza completando el <span className="font-semibold text-lean-black dark:text-warm-100">Radar de Madurez (T1)</span> para que el sistema pueda calcular los indicadores de adopción IA de tu empresa.
          </p>
        </div>
        {/* Progress de herramientas completadas */}
        <div className="rounded-xl px-4 py-3 text-left space-y-1.5 border-l-4 border-l-gold bg-card dark:bg-warm-700">
          <p className="text-xs font-sans uppercase tracking-widest mb-2 text-gold">
            Ruta de activación recomendada
          </p>
          {[
            { code: 'T1', label: 'Radar de Madurez',          active: true  },
            { code: 'T2', label: 'Matriz de Stakeholders',     active: false },
            { code: 'T3', label: 'Mapa de Procesos',           active: false },
            { code: 'T4', label: 'Portfolio de Casos de Uso',  active: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  step.active
                    ? 'bg-gold text-white'
                    : 'bg-gold/8 text-gold border border-gold/25'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${step.active ? 'font-semibold text-lean-black dark:text-warm-50' : 'text-text-muted dark:text-warm-400'}`}>
                {step.code} · {step.label}
              </span>
            </div>
          ))}
        </div>
        {/* CTA */}
        <button
          onClick={() => onNavigate('/t1')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gold transition-all hover:opacity-90 shadow-sm"
        >
          Comenzar con T1 — Radar de Madurez
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
