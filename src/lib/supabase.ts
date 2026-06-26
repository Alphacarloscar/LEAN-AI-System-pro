// ============================================================
// GOBY — Cliente Supabase
//
// Punto único de conexión a Supabase (mitigación lock-in — D5).
// NUNCA importar @supabase/supabase-js directamente en componentes.
// Siempre pasar por este módulo o por src/services/.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL    as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variables de entorno no configuradas. ' +
    'Copia .env.example como .env.local y rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
})

export type { AuthChangeEvent, Session } from '@supabase/supabase-js'
