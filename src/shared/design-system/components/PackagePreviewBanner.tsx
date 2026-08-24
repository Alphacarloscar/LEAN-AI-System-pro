// ============================================================
// PackagePreviewBanner — Preview para paneles no contratados
//
// Overlay sobre un panel cuando el paquete no está en
// contracted_packages del proyecto activo.
// Muestra nombre del paquete + módulos incluidos + CTA.
// ============================================================

import { Mail } from 'lucide-react'

export interface PackagePreviewBannerProps {
  packageName: string  // ej: "Legal & Compliance"
  moduleCodes: string[] // ej: ['T6', 'T12']
}

export function PackagePreviewBanner({
  packageName,
  moduleCodes,
}: PackagePreviewBannerProps) {
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
      <div className="bg-warm-900/95 border border-warm-700/50 rounded-lg px-6 py-6 max-w-sm text-center shadow-md">
        {/* Ícono + título */}
        <div className="mb-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gold"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-warm-100">
            Paquete no disponible
          </h3>
        </div>

        {/* Mensaje */}
        <p className="text-sm text-warm-300 mb-4">
          Este panel requiere el paquete <strong>{packageName}</strong>
        </p>

        {/* Lista de módulos */}
        {moduleCodes.length > 0 && (
          <div className="mb-5 inline-flex flex-wrap gap-1.5 justify-center">
            {moduleCodes.map((code) => (
              <span
                key={code}
                className="px-2 py-1 bg-warm-800/60 border border-warm-600/40 rounded text-[10px] font-mono font-semibold text-warm-200 uppercase tracking-widest"
              >
                {code}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <a
          href="mailto:info@consultoriaalpha.com"
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded text-sm font-medium text-gold transition-colors"
        >
          <Mail width="14" height="14" />
          <span>Contactar para activar</span>
        </a>

        {/* Footer hint */}
        <p className="text-[11px] text-warm-400 mt-3">
          Incluye acceso a todos los módulos del paquete
        </p>
      </div>
    </div>
  )
}
