/// <reference types="vite/client" />

// Variables de entorno tipadas — deben coincidir con .env.example
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_FEATURE_DARK_MODE: string
  readonly VITE_FEATURE_PDF_EXPORT: string
  readonly VITE_FEATURE_AI_ENGINE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
