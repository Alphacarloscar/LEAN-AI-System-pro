import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'storybook-static'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  // ADR-021: Design System enforcement — prohibir clases Tailwind frías, sombras excesivas,
  // bordes redondeados exagerados y strokeWidth={2} en iconos.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/**/*PDF*.tsx',
      'src/**/*PDF*.ts',
      'src/**/chartTokens.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/\\b(bg|text|border)-(gray|slate|red|blue|emerald|amber|purple|violet|orange|yellow|green|indigo|pink|cyan|fuchsia)-/]',
          message: 'ADR-021: Usar tokens warm-* o semánticos del DS. Ver VISUAL-SYSTEM-V2.md §B.',
        },
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/shadow-(lg|xl|2xl)/]',
          message: 'ADR-021: Máximo shadow-md. Ver VISUAL-SYSTEM-V2.md §E.1.',
        },
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/rounded-(2xl|3xl)/]',
          message: 'ADR-021: Usar rounded-xl para cards. Ver VISUAL-SYSTEM-V2.md §E.1.',
        },
        {
          selector: 'JSXAttribute[name.name="strokeWidth"] Literal[value=2]',
          message: 'DS: usar strokeWidth={1.5}. Ver VISUAL-SYSTEM-V2.md §F.2.',
        },
      ],
    },
  },
  // ADR-011: acceso a datos solo vía src/services/
  // Excluir: services (destino correcto), lib (donde vive supabase.ts),
  //          Auth hooks/stores (supabase.auth.* es excepción documentada),
  //          useEdgeFunctionInvoke (supabase.functions.invoke, ADR-014),
  //          Engagement store (supabase.auth.getUser en createAndSelect),
  //          tests (necesitan mockear @/lib/supabase directamente).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/services/**',
      'src/lib/**',
      'src/modules/Auth/**',
      'src/hooks/useEdgeFunctionInvoke.ts',
      'src/modules/Engagement/store.ts',
      'src/__tests__/**',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: '@/lib/supabase',
            message: 'ADR-011: acceso a datos solo vía src/services/. Ver docs/decisions/technical/ADR-011-service-layer-supabase-isolation.md',
          },
        ],
        patterns: [
          {
            group: ['**/lib/supabase'],
            message: 'ADR-011: acceso a datos solo vía src/services/. Ver docs/decisions/technical/ADR-011-service-layer-supabase-isolation.md',
          },
        ],
      }],
    },
  },
  // ADR-029 Fase 2: T4 como Shared Kernel
  // Prohibir useT4Store fuera del módulo T4.
  // Consumidores (T5, T6, T7) deben importar useT4Kernel desde index.public.ts
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/modules/T4_UseCasePriorityBoard/**',
      'src/__tests__/**',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/modules/T4_UseCasePriorityBoard'],
            importNames: ['useT4Store'],
            message: 'ADR-029: useT4Store es privado a T4. Usar useT4Kernel desde "@/modules/T4_UseCasePriorityBoard/index.public" en su lugar. Ver docs/decisions/FASE2-PASO-B-INTERFAZ.md',
          },
        ],
      }],
    },
  },
)
