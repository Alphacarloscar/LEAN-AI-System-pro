import type { Config } from 'tailwindcss'

/**
 * LEAN AI System — Design System Tokens (D9)
 * ARQUITECTURA.md sección 7 — Source of truth.
 *
 * REGLA: los componentes NUNCA hardcodean valores de color, tamaño o radio.
 * Siempre usan tokens de este archivo. Si necesitas un nuevo token, añádelo aquí.
 *
 * Guardian del sistema: Claude (Modelo A — MVP).
 * Evolución a Modelo C (diseñador puntual) con primer cliente SaaS pagando.
 */

const config: Config = {
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {

      // ─────────────────────────────────────────────────────────────
      // COLORES — D9 sección 7.2
      // ─────────────────────────────────────────────────────────────
      colors: {

        // ── Tier 1: Branding (estructura) ──
        // Valores sólidos — usables directamente en bg-*, text-*, border-*
        'lean-white':  '#FFFFFF',
        'lean-black':  '#0A0A0A',

        // Valor sólido del metallic (para borders, text, iconos)
        // El gradiente completo se aplica vía backgroundImage (ver abajo)
        'silver':      '#C0C0C5',   // silver-metallic — valor plano (también para PDFs)
        'navy':        '#1B2A4E',   // navy-metallic — valor plano (también para PDFs)
        'navy-dark':   '#0A1530',   // extremo oscuro del gradiente navy

        // ── Tier 2: Funcionales pastel ──
        'success-soft':  '#86C7A8',   // Readiness alto, ROI positivo, OK
        'warning-soft':  '#E8C281',   // Atención, score medio, en revisión
        'danger-soft':   '#D89090',   // Bloqueante, riesgo alto, non-conformity
        'info-soft':     '#9BB5D9',   // Informativo, neutral

        // Variantes semánticas alias (para uso en Alert, Badge, etc.)
        success: {
          DEFAULT: '#86C7A8',
          light:   '#D4EDE3',   // fondo sutil en alertas
          dark:    '#5FAF8A',   // hover, active
        },
        warning: {
          DEFAULT: '#E8C281',
          light:   '#FAF0D7',
          dark:    '#D4A85C',
        },
        danger: {
          DEFAULT: '#D89090',
          light:   '#F5DEDE',
          dark:    '#C06060',
        },
        info: {
          DEFAULT: '#9BB5D9',
          light:   '#DDE8F5',
          dark:    '#6A90C0',
        },

        // ── Tier 3: Grises neutros ──
        // Tailwind ya incluye la escala gray-50..gray-900.
        // Alias semánticos para comunicación en el equipo:
        'surface':     '#F9FAFB',   // gray-50 — fondos de sección
        'border':      '#E5E7EB',   // gray-200 — bordes estándar
        'text-muted':  '#6B7280',   // gray-500 — texto secundario
        'text-subtle': '#9CA3AF',   // gray-400 — texto terciario / placeholders
      },

      // ─────────────────────────────────────────────────────────────
      // GRADIENTES METÁLICOS — D9 sección 7.2
      // No son colores sino imágenes de fondo.
      // Uso: className="bg-silver-metallic" o "bg-navy-metallic"
      // ─────────────────────────────────────────────────────────────
      backgroundImage: {
        'silver-metallic':
          'linear-gradient(135deg, #E8E8EA 0%, #C0C0C5 50%, #A8A8AE 100%)',
        'navy-metallic':
          'linear-gradient(180deg, #3A5A9E 0%, #2B4580 18%, #1B2A4E 55%, #0F1E3D 100%)',
        // Variantes para hover / active
        'silver-metallic-hover':
          'linear-gradient(135deg, #D8D8DA 0%, #B0B0B5 50%, #989898 100%)',
        'navy-metallic-hover':
          'linear-gradient(180deg, #4A6AAE 0%, #3A5590 18%, #243660 55%, #192848 100%)',
      },

      // ─────────────────────────────────────────────────────────────
      // TIPOGRAFÍA — D9 sección 7.3
      // Familia: Inter (self-hosted vía @fontsource/inter)
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      fontSize: {
        // Caption — 12px, tracking +1%
        'xs':   ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.01em' }],
        // Body — 14px
        'sm':   ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0' }],
        // Body largo — 15px
        'base': ['0.9375rem',{ lineHeight: '1.5rem',  letterSpacing: '0' }],
        // Label UI — 13px, tracking +1%
        'label':['0.8125rem',{ lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        // H3 — 18px
        'lg':   ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        // H2 — 24px
        'xl':   ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '0' }],
        // H1 — 32px, tracking -1%
        '2xl':  ['2rem',     { lineHeight: '2.5rem',  letterSpacing: '-0.01em' }],
        // Display — 48px, tracking -2%
        '3xl':  ['3rem',     { lineHeight: '3.5rem',  letterSpacing: '-0.02em' }],
        // Display grande — 64px, tracking -2%
        '4xl':  ['4rem',     { lineHeight: '4.5rem',  letterSpacing: '-0.02em' }],
      },

      fontWeight: {
        regular:   '400',
        medium:    '500',
        semibold:  '600',
      },

      // ─────────────────────────────────────────────────────────────
      // BORDER RADIUS — D9 sección 7.4
      // ─────────────────────────────────────────────────────────────
      borderRadius: {
        'none':    '0',
        'sm':      '4px',
        DEFAULT:   '8px',    // Botones, inputs, badges
        'md':      '8px',    // alias explícito
        'lg':      '12px',   // Cards, modales, paneles — el "0.12"" de Carlos
        'xl':      '16px',   // Containers grandes
        '2xl':     '20px',
        'full':    '9999px', // Avatars, pills
      },

      // ─────────────────────────────────────────────────────────────
      // SOMBRAS Y BORDES — D9 sección 7.5
      // Líneas 1px gris claro en lugar de 0.5px negro (soluciona R5)
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        // Borde sutil estándar — reemplaza border-1px en la mayoría de componentes
        'border':        '0 0 0 1px #E5E7EB',
        'border-dark':   '0 0 0 1px rgba(255, 255, 255, 0.08)',
        // Línea inferior sutil — divisores, header de tabla
        'line-bottom':   '0 1px 0 rgba(10, 10, 10, 0.06)',
        'line-top':      '0 -1px 0 rgba(10, 10, 10, 0.06)',
        // Elevación — modales, dropdowns
        'sm':    '0 1px 3px 0 rgba(10, 10, 10, 0.06), 0 1px 2px -1px rgba(10, 10, 10, 0.04)',
        DEFAULT: '0 4px 6px -1px rgba(10, 10, 10, 0.07), 0 2px 4px -2px rgba(10, 10, 10, 0.04)',
        'md':    '0 4px 6px -1px rgba(10, 10, 10, 0.07), 0 2px 4px -2px rgba(10, 10, 10, 0.04)',
        'lg':    '0 10px 15px -3px rgba(10, 10, 10, 0.08), 0 4px 6px -4px rgba(10, 10, 10, 0.05)',
        'xl':    '0 20px 25px -5px rgba(10, 10, 10, 0.08), 0 8px 10px -6px rgba(10, 10, 10, 0.04)',
        'none':  'none',
      },

      // ─────────────────────────────────────────────────────────────
      // ESPACIADO — D9 sección 7.4
      // Base Tailwind es 4px (space-1 = 4px). No se modifica.
      // Alias semánticos para los más usados en el sistema:
      // p-2 = 8px | p-4 = 16px | p-6 = 24px | p-8 = 32px
      // ─────────────────────────────────────────────────────────────

      // ─────────────────────────────────────────────────────────────
      // TRANSICIONES — consistencia en hover/focus
      // ─────────────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        fast:    '100ms',
        slow:    '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ─────────────────────────────────────────────────────────────
      // ANIMACIONES — Skeleton loader (E4) y Toast (E4)
      // ─────────────────────────────────────────────────────────────
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%':   { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(4px)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        shimmer:         'shimmer 1.5s infinite linear',
        'fade-in':       'fade-in 150ms ease-out',
        'fade-out':      'fade-out 150ms ease-in',
        'slide-in-right':'slide-in-right 200ms ease-out',
      },

      // ─────────────────────────────────────────────────────────────
      // Z-INDEX — capas predecibles
      // ─────────────────────────────────────────────────────────────
      zIndex: {
        'base':    '0',
        'raised':  '10',
        'dropdown':'100',
        'sticky':  '200',
        'overlay': '300',
        'modal':   '400',
        'toast':   '500',
      },
    },
  },

  plugins: [],
}

export default config
