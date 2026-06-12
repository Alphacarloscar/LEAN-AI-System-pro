import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'
import { execSync } from 'child_process'

// Inyección de metadatos de build — disponibles en runtime como constantes globales
function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__:  JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    __GIT_COMMIT__:   JSON.stringify(getGitCommit()),
    __BUILD_TIME__:   JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    // Upload sourcemaps to Sentry on production builds.
    // Requires SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT env vars in Vercel.
    // No-op when SENTRY_AUTH_TOKEN is absent (local and PRE builds are safe).
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org:       process.env.SENTRY_ORG,
            project:   process.env.SENTRY_PROJECT,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@services': path.resolve(__dirname, './src/services'),
      '@modules': path.resolve(__dirname, './src/modules'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,   // Recharts es ~540KB minificado — expected
    // Separar chunks por módulo para mejor caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          ui: ['lucide-react'],
          forms: ['react-hook-form', 'zod'],
          state: ['zustand'],
        },
      },
    },
  },
})
