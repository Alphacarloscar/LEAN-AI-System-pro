// ============================================================
// Edge Function: log-audit-event
//
// Receptor fire-and-forget del sistema de auditoría (ADR-017).
//
// Responsabilidades:
//   1. Verifica el JWT del caller y extrae user_id, user_email, user_role.
//   2. Valida el shape mínimo del body (service_name, method_name, status).
//   3. Inserta en audit_logs usando service_role (bypass RLS).
//
// Seguridad:
//   - El cliente NUNCA envía user_id/email/role — se extraen server-side.
//   - Cualquier intento de inyectar esos campos en el body se ignora.
//   - El service role key nunca sale del servidor.
//
// Llamado desde: src/lib/audit/auditClient.ts → fireAuditLog()
// Relacionado: ADR-017 · migration 20260615_003_audit_system.sql
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── 1. Verificar JWT y extraer contexto de usuario ────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return err('Unauthorized', 401)

    // adminClient se crea temprano (service_role) para usarlo en la query de
    // profiles, evitando la evaluación de RLS (is_platform_admin()) que añade
    // latencia bajo alta concurrencia al requerir una query extra a profiles.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !user) return err('Invalid token', 401)

    // Role (fuente autoritativa: profiles) y body parse en paralelo para
    // reducir latencia bajo alta concurrencia — ambas operaciones son
    // independientes del resultado de la otra.
    const [{ data: profile }, bodyRaw] = await Promise.all([
      adminClient.from('profiles').select('role').eq('id', user.id).single(),
      req.json().catch(() => null as unknown),
    ])

    // ── 2. Parsear y validar el body ──────────────────────────
    if (bodyRaw === null) return err('Invalid JSON body', 400)
    const body = bodyRaw as Record<string, unknown>

    if (typeof body.service_name !== 'string' || !body.service_name) {
      return err('Missing required field: service_name', 400)
    }
    if (typeof body.method_name !== 'string' || !body.method_name) {
      return err('Missing required field: method_name', 400)
    }
    if (body.status !== 'success' && body.status !== 'error') {
      return err('Invalid status: must be "success" or "error"', 400)
    }

    // ── 3. Insertar en audit_logs con service_role ────────────
    //
    // Los campos de identidad (user_id, user_email, user_role) provienen
    // exclusivamente del JWT verificado — el cliente no puede falsificarlos.
    // Cualquier valor que el cliente haya enviado en esos campos es ignorado.

    // Extraer los campos conocidos del body; ignorar user_id/email/role del cliente
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      user_id: _uid, user_email: _uemail, user_role: _urole, id: _id, created_at: _cat,
      service_name, method_name, args_payload, status,
      response_payload, error_message, error_stack,
      duration_ms, resource_id, correlation_id, metadata,
    } = body

    const { error: insertErr } = await (adminClient as ReturnType<typeof createClient>)
      .from('audit_logs')
      .insert({
        user_id:          user.id,
        user_email:       user.email ?? null,
        user_role:        profile?.role ?? null,
        service_name:     service_name as string,
        method_name:      method_name as string,
        args_payload:     args_payload ?? {},
        status:           status as 'success' | 'error',
        response_payload: response_payload ?? null,
        error_message:    typeof error_message === 'string' ? error_message : null,
        error_stack:      typeof error_stack   === 'string' ? error_stack   : null,
        duration_ms:      typeof duration_ms   === 'number' ? Math.round(duration_ms) : 0,
        resource_id:      typeof resource_id   === 'string' ? resource_id   : null,
        correlation_id:   typeof correlation_id === 'string' ? correlation_id : null,
        metadata:         metadata ?? {},
      })

    if (insertErr) {
      console.error('[log-audit-event] insert failed:', insertErr)
      return err(`Insert failed: ${insertErr.message}`, 500)
    }

    return ok({ logged: true })

  } catch (e) {
    console.error('[log-audit-event] unexpected error:', e)
    return err('Internal server error', 500)
  }
})

// ── Helpers ───────────────────────────────────────────────────

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
