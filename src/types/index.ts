// ============================================================
// GOBY — Barrel de tipos
// Re-exporta todo para imports limpios: import type { UserRole } from '@/types'
// ============================================================

export type { Database, Json, UserRole, LeanPhase } from './database.types'
export type {
  ToolCode,
  OutputStatus,
  Engagement,
  Organization,
  UserProfile,
  ToolInstance,
  DependencyType,
  ContextRef,
} from './domain.types'
