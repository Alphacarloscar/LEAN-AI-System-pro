// ============================================================
// Edge Function: delete-user
//
// Elimina un usuario de Supabase Auth vía la Admin API.
// El perfil en la tabla profiles se borra automáticamente
// en cascada (FK profiles.id → auth.users.id ON DELETE CASCADE).
//
// Seguridad:
//   - Solo puede llamarla un usuario autenticado con role='superadmin'
//   - Valida el JWT del caller antes de cualquier acción admin
//   - Un superadmin no puede eliminarse a sí mismo
//   - El service role key nunca sale del servidor
//
// Body JSON esperado:
//   { userId: string }
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── 1. Verificar JWT del caller ───────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return err('No autorizado', 401)

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !caller) return err('Token inválido', 401)

    // ── 2. Verificar que el caller es superadmin ──────────────
    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'superadmin') {
      return err('Acceso denegado: se requiere rol superadmin', 403)
    }

    // ── 3. Parsear y validar el body ──────────────────────────
    const { userId } = await req.json()

    if (!userId || typeof userId !== 'string') {
      return err('Campo obligatorio: userId', 400)
    }

    // Prevenir auto-eliminación
    if (userId === caller.id) {
      return err('No puedes eliminar tu propia cuenta', 400)
    }

    // ── 4. Eliminar usuario con la Admin API (service role) ───
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteErr) {
      console.error('[delete-user] error al eliminar:', deleteErr)
      throw deleteErr
    }

    return ok({ deleted: userId })

  } catch (e) {
    console.error('[delete-user] error inesperado:', e)
    return err('Error interno del servidor', 500)
  }
})

// ── Helpers de respuesta ──────────────────────────────────────

function ok(body: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...body }), {
    status:  200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function err(message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
