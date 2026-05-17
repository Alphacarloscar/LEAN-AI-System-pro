// ============================================================
// Companies Service
//
// Sprint 8: nueva entidad empresa (multi-tenant).
// Gestiona el CRUD de companies y la invitación de usuarios.
//
// Modelo:
//   Company → Projects (1:N)
//   Company → Users via profiles.company_id (1:N)
//
// Solo el platform_admin (role='admin') puede crear empresas
// e invitar usuarios. Los consultores Alpha se añaden a
// proyectos específicos via addProjectMember.
// ============================================================

import { supabase }       from '@/lib/supabase'
import type { CompanyRow } from '@/types/database.types'

// ── Listar todas las empresas ────────────────────────────────
// (Solo accesible para autenticados — RLS lo limita)

export async function listCompanies(): Promise<CompanyRow[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(`[Companies] listCompanies: ${error.message}`)
  return data ?? []
}

// ── Crear empresa ────────────────────────────────────────────

export async function createCompany(params: {
  name: string
  slug?: string
}): Promise<CompanyRow> {
  const slug = params.slug
    ?? params.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { data, error } = await supabase
    .from('companies')
    .insert({ name: params.name, slug })
    .select()
    .single()

  if (error || !data) throw new Error(`[Companies] createCompany: ${error?.message}`)
  return data
}

// ── Invitar usuario a empresa ────────────────────────────────
// Usa Supabase inviteUserByEmail — el usuario recibe un email
// con un link mágico para establecer su propia contraseña.
// El company_id y role se pasan como metadata y el trigger
// handle_new_user() los aplica al perfil automáticamente.

export async function inviteUserToCompany(params: {
  email:     string
  name:      string
  companyId: string
  role?:     'consultant' | 'viewer'
}): Promise<void> {
  // redirectTo asegura que el link del email lleve a /reset-password
  // (sin esto Supabase redirige al Site URL raíz y el token expira sin procesarse)
  const redirectTo = `${window.location.origin}/reset-password`

  const { error } = await supabase.auth.admin.inviteUserByEmail(params.email, {
    redirectTo,
    data: {
      name:       params.name,
      company_id: params.companyId,
      role:       params.role ?? 'viewer',
    },
  })

  if (error) throw new Error(`[Companies] inviteUserToCompany: ${error.message}`)
}

// ── Listar usuarios de una empresa ──────────────────────────

export async function listCompanyUsers(companyId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (error) throw new Error(`[Companies] listCompanyUsers: ${error.message}`)
  return data ?? []
}

// ── Listar proyectos de una empresa ─────────────────────────

export async function listCompanyProjects(companyId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`[Companies] listCompanyProjects: ${error.message}`)
  return data ?? []
}
