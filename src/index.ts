// ============================================================
// Edge Function: log-audit-event
//
// Endpoint seguro para escribir en la tabla `audit_logs`.
//
// Lógica:
// 1. Valida el JWT del usuario que invoca.
// 2. Recibe el payload del log.
// 3. Usa el cliente de Admin (con service_role_key) para saltar RLS
//    y realizar la inserción.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // 1. Autenticar al usuario que invoca la función
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // 2. Obtener el payload del log
    const logEntry = await req.json()

    // 3. Forzar que el log corresponda al usuario autenticado y enriquecer el rol.
    //    Esto convierte a la Edge Function en la única fuente de verdad para el
    //    contexto de usuario, ignorando lo que el cliente pueda enviar.
    logEntry.user_id = user.id
    logEntry.user_email = user.email

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // No lanzar error, pero loguear la advertencia. El log se insertará sin rol.
      console.warn(`log-audit-event: Could not fetch role for user ${user.id}: ${profileError.message}`)
      logEntry.user_role = null
    } else {
      logEntry.user_role = profile.role
    }

    // 4. Usar el cliente Admin para insertar en la tabla, bypasseando RLS
    const { error: insertError } = await adminClient.from('audit_logs').insert(logEntry)
    if (insertError) throw insertError

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    console.error('Error in log-audit-event:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 })
  }
})