import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@services': path.resolve(__dirname, './src/services'),
      '@modules': path.resolve(__dirname, './src/modules'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/modules/**/constants.ts', 'src/modules/**/types.ts', 'src/services/**/*.ts'],
      exclude: ['src/__tests__/**'],
      thresholds: {
        statements: 59,  // baseline real rama fix/adr011-finish (DEBT-009)
        branches:   55,
        functions:  72,
        lines:      65,
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('test'),
    __GIT_COMMIT__:  JSON.stringify('test'),
    __BUILD_TIME__:  JSON.stringify('2026-01-01T00:00:00.000Z'),
  },
})
