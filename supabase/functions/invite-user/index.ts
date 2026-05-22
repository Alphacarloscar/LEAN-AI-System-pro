// ============================================================
// Edge Function: invite-user
//
// Crea un usuario vía Supabase Auth Admin API y le envía
// un email de invitación para que establezca su contraseña.
//
// Seguridad:
//   - Solo puede llamarla un usuario autenticado con role='superadmin'
//   - Valida el JWT del caller antes de cualquier acción admin
//   - El service role key nunca sale del servidor
//
// Body JSON esperado:
//   { email: string, name: string, companyId: string, role: string }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Preflight CORS (requerido por los navegadores antes de toda petición)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── 1. Verificar JWT del caller ───────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return err('No autorizado', 401)

    // Cliente con los permisos del usuario que llama (para leer su rol)
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
    const { email, name, companyId, role } = await req.json()

    if (!email || !name || !companyId || !role) {
      return err('Campos obligatorios: email, name, companyId, role', 400)
    }

    const validRoles = ['superadmin', 'consultant', 'client_editor', 'client_viewer']
    if (!validRoles.includes(role)) {
      return err(`Rol no válido: ${role}`, 400)
    }

    // ── 4. Enviar invitación con la Admin API (service role) ──
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // redirectTo lleva al usuario a /reset-password para que fije su contraseña
    const siteUrl    = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
    const redirectTo = `${siteUrl}/reset-password`

    const { data, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      // Estos campos los recoge el trigger handle_new_user() y los graba en profiles
      data: { name, company_id: companyId, role },
    })

    if (inviteErr) {
      // Email ya registrado — error específico y legible para el frontend
      if (inviteErr.message.toLowerCase().includes('already')) {
        return err('Este email ya está registrado en la plataforma.', 409)
      }
      throw inviteErr
    }

    return ok({ userId: data.user?.id })

  } catch (e) {
    console.error('[invite-user] error inesperado:', e)
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
