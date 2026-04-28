// ============================================================
// LEAN AI System — Cliente Supabase
//
// Punto único de conexión a Supabase (mitigación lock-in — D5).
// NUNCA importar @supabase/supabase-js directamente en componentes.
// Siempre pasar por este módulo o por src/services/.
//
// Sprint 3: cliente sin genérico Database — los servicios tipan
// las respuestas explícitamente. Sprint 5: generar tipos via CLI:
//   supabase gen types typescript --project-id PROJECT_ID \
//     > src/types/database.types.ts
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL    as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variables de entorno no configuradas. ' +
    'Copia .env.example como .env.local y rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
})
