import type { Config } from 'tailwindcss'

/**
 * LEAN AI System — Design System Tokens (D9 · Sprint 4 Rev2)
 * ARQUITECTURA.md sección 7 — Source of truth.
 *
 * Paleta: Obsidian Amber + Grises Metálicos
 * Modo por defecto: LIGHT (ivory cálido + acentos ámbar)
 * Modo oscuro: Carbón cálido + titanio metálico
 *
 * REGLA: los componentes NUNCA hardcodean valores de color, tamaño o radio.
 * Siempre usan tokens de este archivo. Si necesitas un nuevo token, añádelo aquí.
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

        // ── Tier 1: Branding base ──
        'lean-white': '#FFFFFF',
        'lean-black': '#1C1A16',   // negro cálido (warm near-black)

        // ── Escala oscura cálida — modo dark ──
        // Undertone marrón cálido — evita el frío del navy
        'warm-950': '#16140F',     // fondo raíz dark
        'warm-900': '#22201C',     // fondo app dark
        'warm-800': '#2A2822',     // sidebar dark
        'warm-700': '#333028',     // navbar/header dark
        'warm-600': '#3E3B35',     // card surface dark
        'warm-500': '#4A4740',     // card hover dark
        'warm-400': '#565250',     // border activo dark
        'warm-300': '#6B6864',     // texto muted dark
        'warm-200': '#9A9790',     // texto sutil dark / placeholder
        'warm-100': '#C4C0B8',     // texto secundario dark
        'warm-50':  '#F0EDE8',     // texto primario dark (warm white)

        // ── Acento principal — Oro mate ──
        'gold':       '#C8860A',   // acento primario
        'gold-hover': '#D4940F',   // hover del acento
        'gold-muted': '#8B6A30',   // acento atenuado / estados deshabilitados
        'gold-faint': '#2A1E08',   // fondo muy sutil sobre gold (dark mode)

        // ── Plata cálida — metales secundarios ──
        'silver':      '#C4C0B8',  // plata cálida — datos secundarios
        'silver-warm': '#9A9790',  // plata oscura — placeholder

        // ── Compatibilidad legacy — navy redirigido a carbón cálido ──
        // Permite que bg-navy existente mapee al nuevo token sin cambiar archivos
        'navy':        '#2A2822',  // era #1B2A4E — ahora carbón cálido
        'navy-dark':   '#16140F',  // era #0A1530 — ahora fondo raíz

        // ── Tier 2: Semánticos (sin cambios) ──
        'success-soft': '#86C7A8',
        'warning-soft': '#E8C281',
        'danger-soft':  '#D89090',
        'info-soft':    '#9BB5D9',

        success: {
          DEFAULT: '#86C7A8',
          light:   '#D4EDE3',
          dark:    '#5FAF8A',
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

        // ── Tier 3: Superficies light mode (ivory cálido) ──
        'surface':     '#F7F4EE',  // era #F9FAFB — ivory cálido
        'border':      '#D4D0C8',  // era #E5E7EB — beige cálido
        'text-muted':  '#6B6864',  // era #6B7280 — marrón cálido medio
        'text-subtle': '#9A9790',  // era #9CA3AF — marrón cálido sutil
      },

      // ─────────────────────────────────────────────────────────────
      // GRADIENTES METÁLICOS — D9 sección 7.2
      // ─────────────────────────────────────────────────────────────
      backgroundImage: {
        // Botón primario — titanio cálido (reemplaza navy frío)
        // Todos los bg-navy-metallic existentes actualizan automáticamente
        'navy-metallic':
          'linear-gradient(180deg, #4A4540 0%, #3E3B35 18%, #333028 55%, #2A2822 100%)',
        'navy-metallic-hover':
          'linear-gradient(180deg, #565250 0%, #4A4740 18%, #3E3B35 55%, #333028 100%)',

        // Oro mate — acento principal / highlights activos
        'gold-metallic':
          'linear-gradient(180deg, #D4940F 0%, #C8860A 40%, #A06808 100%)',
        'gold-metallic-hover':
          'linear-gradient(180deg, #E0A018 0%, #D4940F 40%, #B87808 100%)',

        // Card surface dark — titanio con luz cenital sutil
        'warm-card':
          'linear-gradient(145deg, #3E3B35 0%, #35322C 50%, #2E2B26 100%)',

        // Plata cálida — para datos secundarios / silver accent
        'silver-metallic':
          'linear-gradient(135deg, #D8D4CC 0%, #C4C0B8 50%, #A8A4A0 100%)',
        'silver-metallic-hover':
          'linear-gradient(135deg, #E8E4DC 0%, #D4D0C8 50%, #B8B4AC 100%)',
      },

      // ─────────────────────────────────────────────────────────────
      // TIPOGRAFÍA — D9 sección 7.3
      // ─────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      fontSize: {
        'xs':    ['0.75rem',   { lineHeight: '1rem',     letterSpacing: '0.01em' }],
        'sm':    ['0.875rem',  { lineHeight: '1.375rem', letterSpacing: '0' }],
        'base':  ['0.9375rem', { lineHeight: '1.5rem',   letterSpacing: '0' }],
        'label': ['0.8125rem', { lineHeight: '1.25rem',  letterSpacing: '0.01em' }],
        'lg':    ['1.125rem',  { lineHeight: '1.75rem',  letterSpacing: '0' }],
        'xl':    ['1.5rem',    { lineHeight: '2rem',     letterSpacing: '0' }],
        '2xl':   ['2rem',      { lineHeight: '2.5rem',   letterSpacing: '-0.01em' }],
        '3xl':   ['3rem',      { lineHeight: '3.5rem',   letterSpacing: '-0.02em' }],
        '4xl':   ['4rem',      { lineHeight: '4.5rem',   letterSpacing: '-0.02em' }],
      },

      fontWeight: {
        regular:  '400',
        medium:   '500',
        semibold: '600',
      },

      // ─────────────────────────────────────────────────────────────
      // BORDER RADIUS — D9 sección 7.4
      // ─────────────────────────────────────────────────────────────
      borderRadius: {
        'none': '0',
        'sm':   '4px',
        DEFAULT: '8px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '16px',
        '2xl':  '20px',
        'full': '9999px',
      },

      // ─────────────────────────────────────────────────────────────
      // SOMBRAS — D9 sección 7.5
      // ─────────────────────────────────────────────────────────────
      boxShadow: {
        'border':      '0 0 0 1px #D4D0C8',                          // warm border light
        'border-dark': '0 0 0 1px rgba(240, 237, 232, 0.07)',        // warm border dark
        'line-bottom': '0 1px 0 rgba(28, 26, 22, 0.06)',
        'line-top':    '0 -1px 0 rgba(28, 26, 22, 0.06)',
        'sm':    '0 1px 3px 0 rgba(28, 26, 22, 0.06), 0 1px 2px -1px rgba(28, 26, 22, 0.04)',
        DEFAULT: '0 4px 6px -1px rgba(28, 26, 22, 0.07), 0 2px 4px -2px rgba(28, 26, 22, 0.04)',
        'md':    '0 4px 6px -1px rgba(28, 26, 22, 0.07), 0 2px 4px -2px rgba(28, 26, 22, 0.04)',
        'lg':    '0 10px 15px -3px rgba(28, 26, 22, 0.08), 0 4px 6px -4px rgba(28, 26, 22, 0.05)',
        'xl':    '0 20px 25px -5px rgba(28, 26, 22, 0.08), 0 8px 10px -6px rgba(28, 26, 22, 0.04)',
        'none':  'none',
        // Dark mode card — bisel metálico cálido
        'warm-card': '0 0 0 0.5px rgba(240, 237, 232, 0.07), inset 0 1px 0 rgba(240, 237, 232, 0.08), 0 4px 24px rgba(22, 20, 15, 0.4)',
      },

      // ─────────────────────────────────────────────────────────────
      // TRANSICIONES
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
      // ANIMACIONES
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
        shimmer:          'shimmer 1.5s infinite linear',
        'fade-in':        'fade-in 150ms ease-out',
        'fade-out':       'fade-out 150ms ease-in',
        'slide-in-right': 'slide-in-right 200ms ease-out',
      },

      // ─────────────────────────────────────────────────────────────
      // Z-INDEX
      // ─────────────────────────────────────────────────────────────
      zIndex: {
        'base':     '0',
        'raised':   '10',
        'dropdown': '100',
        'sticky':   '200',
        'overlay':  '300',
        'modal':    '400',
        'toast':    '500',
      },
    },
  },

  plugins: [],
}

export default config
