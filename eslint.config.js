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
)
