// ============================================================
// CompanyProfile Service — Supabase
//
// Capa de acceso a datos para company_profiles + frictions.
// El store llama estas funciones; los componentes no las importan
// directamente (siempre pasan por el store).
//
// Mapeo:
//   CompanyProfileRow (BD, snake_case) ↔ CompanyProfile (dominio, camelCase)
//   FrictionRow       (BD, snake_case) ↔ Friction       (dominio, camelCase)
// ============================================================

import { supabase }         from '@/lib/supabase'
import { makeAuditable }      from '@/lib/audit'
import type { Json, CompanyProfileRow, FrictionRow } from '@/types/database.types'
import type { CompanyProfile, Friction } from '@/modules/CompanyProfile/types'

// ── Helpers de cast ──────────────────────────────────────────

function cast<T>(v: unknown): T { return v as T }

function toJson<T>(v: T): Json { return v as unknown as Json }

// ── Mapeo BD → dominio ───────────────────────────────────────

export function rowToCompanyProfile(row: CompanyProfileRow): CompanyProfile {
  return {
    engagementName:          row.project_name,
    // sector/tamanoEmpresa: se leen de company_profiles para backward compat.
    // La fuente de verdad es companies.sector / companies.company_size.
    // Tab Empresa en CompanyProfileView.tsx escribe directamente a companies.
    // profileToUpsert NO escribe estos campos — son readonly desde aquí.
    sector:                  row.sector          ?? '',
    tamanoEmpresa:           row.tamano_empresa  ?? '',
    objetivoPrincipalIA:     row.objetivo_principal_ia,
    horizonteEsperadoValor:  row.horizonte_valor,
    ecosistemaTecnologico:   row.ecosistema_tecnologico,
    restriccionesRelevantes: row.restricciones,
    areasPrioritarias:       cast<string[]>(row.areas_prioritarias),
    fricciones:              [],  // se cargan por separado desde la tabla frictions
    savedAt:                 row.saved_at,
  }
}

export function rowToFriction(row: FrictionRow): Friction {
  return {
    id:            row.id,
    tipo:          row.tipo,
    areaFuncional: row.area_funcional,
    frecuencia:    cast<Friction['frecuencia']>(row.frecuencia),
    impacto:       cast<Friction['impacto']>(row.impacto),
    notas:         row.notas,
  }
}

// ── Mapeo dominio → BD ───────────────────────────────────────

function profileToUpsert(profile: CompanyProfile, projectId: string) {
  return {
    project_id:          projectId,
    project_name:        profile.engagementName ?? '',
    // sector y tamano_empresa NO se escriben aquí — viven en `companies` tabla.
    objetivo_principal_ia:  profile.objetivoPrincipalIA,
    horizonte_valor:        profile.horizonteEsperadoValor,
    ecosistema_tecnologico: profile.ecosistemaTecnologico,
    restricciones:          profile.restriccionesRelevantes,
    areas_prioritarias:     toJson(profile.areasPrioritarias),
    saved_at:               profile.savedAt ?? new Date().toISOString(),
    updated_at:             new Date().toISOString(),
  }
}

function frictionToInsert(f: Friction, projectId: string) {
  return {
    id:            f.id,
    project_id: projectId,
    tipo:          f.tipo,
    area_funcional: f.areaFuncional,
    frecuencia:    f.frecuencia ?? null,
    impacto:       f.impacto    ?? null,
    notas:         f.notas,
  }
}

// ── Implementación privada ───────────────────────────────────

const _impl = {
  /**
   * Carga el perfil de empresa de un engagement.
   * Devuelve null si aún no se ha creado (proyecto nuevo).
   */
  async fetchCompanyProfile(
    projectId: string,
  ): Promise<{ profile: CompanyProfile; frictions: Friction[] } | null> {
    const [profileResult, frictionsResult] = await Promise.all([
      supabase
        .from('company_profiles')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle(),
      supabase
        .from('frictions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true }),
    ])

    if (profileResult.error) {
      throw new Error(`[CompanyProfile] fetchCompanyProfile: ${profileResult.error.message}`)
    }
    if (frictionsResult.error) {
      throw new Error(`[CompanyProfile] fetchFrictions: ${frictionsResult.error.message}`)
    }

    if (!profileResult.data) return null

    const profile   = rowToCompanyProfile(profileResult.data)
    const frictions = (frictionsResult.data ?? []).map(rowToFriction)

    return { profile, frictions }
  },

  /**
   * Guarda el perfil en Supabase (UPSERT por project_id).
   * Sincroniza frictions: elimina las existentes y re-inserta las actuales.
   * Estrategia delete+insert es segura aquí — máximo ~10 filas por proyecto.
   */
  async upsertCompanyProfile(
    profile: CompanyProfile,
    projectId: string,
  ): Promise<void> {
    // 1. Upsert perfil principal
    const { error: profileError } = await supabase
      .from('company_profiles')
      .upsert(profileToUpsert(profile, projectId), { onConflict: 'project_id' })

    if (profileError) {
      throw new Error(`[CompanyProfile] upsertCompanyProfile: ${profileError.message}`)
    }

    // 2. Sincronizar frictions: delete all + re-insert current list
    const { error: deleteError } = await supabase
      .from('frictions')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      throw new Error(`[CompanyProfile] syncFrictions (delete): ${deleteError.message}`)
    }

    if (profile.fricciones.length > 0) {
      const rows = profile.fricciones.map((f) => frictionToInsert(f, projectId))
      const { error: insertError } = await supabase.from('frictions').insert(rows)
      if (insertError) {
        throw new Error(`[CompanyProfile] syncFrictions (insert): ${insertError.message}`)
      }
    }
  },
}

// ── Punto de exportación auditado ────────────────────────────

const _service = makeAuditable(_impl, 'services.company-profile')

export const {
  fetchCompanyProfile,
  upsertCompanyProfile,
} = _service
