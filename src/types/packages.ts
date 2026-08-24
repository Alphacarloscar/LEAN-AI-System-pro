// ============================================================
// Tipos de paquetes (ADR-029)
//
// PackageId mapea exactamente al enum package_id de BD.
// Debe mantenerse sincronizado con PackageEnum en database.types.ts
// y con la migración: supabase/migrations/20260824_governance_domains_and_package_config.sql
// ============================================================

import type { PackageEnum } from './database.types'

export type PackageId = PackageEnum
