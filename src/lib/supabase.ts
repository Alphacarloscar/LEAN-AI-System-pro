// ============================================================
// LEAN AI System — Cliente Supabase
//
// Punto único de conexión a Supabase (mitigación lock-in — D5).
// NUNCA importar @supabase/supabase-js directamente en componentes.
// Siempre pasar por este módulo o por src/services/.
//
// Tipos generados automáticamente desde Supabase CLI:
//   supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.types.ts
// Se ejecutará en Sprint 1 cuando exista el schema real.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variables de entorno no configuradas. ' +
    'Copia .env.example como .env.local y rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistir sesión en localStorage — comportamiento por defecto, explicitado para claridad
    persistSession: true,
    // MFA: se requiere enrollment al primer login (configurado en Supabase Auth settings)
    // La lógica de enforcement está en useAuth hook (src/shared/hooks/useAuth.ts)
  },
})

export type { Database }
