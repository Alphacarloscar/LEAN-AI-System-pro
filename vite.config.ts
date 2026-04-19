import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
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
          supabase: ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
          charts: ['recharts'],
          ui: ['lucide-react'],
          forms: ['react-hook-form', 'zod'],
          state: ['zustand'],
        },
      },
    },
  },
})
