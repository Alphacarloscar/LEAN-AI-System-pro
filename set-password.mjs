// ============================================================
// Script temporal — actualizar contraseña vía admin API
// USO: node set-password.mjs
// BORRAR este archivo después de usarlo (no subir a GitHub)
// ============================================================

import { createClient } from '@supabase/supabase-js'

// ── PASO 1: Pega aquí tu Secret Key de Supabase ──────────────
const SECRET_KEY = 'sb_secret_7jF0HrvRiirJg9lTs9fNUA_qktydAer'

// ── PASO 2: Pon la contraseña que quieras usar ───────────────
const NEW_PASSWORD = 'LeanAI2026!'

// ── No toques nada de aquí para abajo ────────────────────────

const SUPABASE_URL = 'https://mkypmakmkxpecuezofkk.supabase.co'
const CARLOS_ID    = '350a04b7-50a4-46c3-bd3c-ed544110ce52'

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('Actualizando contraseña de Carlos...')
const { data, error } = await supabase.auth.admin.updateUserById(
  CARLOS_ID,
  { password: NEW_PASSWORD }
)

if (error) {
  console.error('❌ Error:', error.message)
  console.error('   Comprueba que la Secret Key sea correcta.')
} else {
  console.log('✅ Contraseña actualizada para:', data.user.email)
  console.log('   Contraseña:', NEW_PASSWORD)
  console.log('   Ya puedes hacer login en localhost:5173')
}
