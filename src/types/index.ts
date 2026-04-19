// ============================================================
// LEAN AI System — Barrel de tipos
// Re-exporta todo para imports limpios: import type { UserRole } from '@/types'
// ============================================================

export type { Database, Json } from './database.types'
export type {
  UserRole,
  LeanPhase,
  ToolCode,
  OutputStatus,
  Engagement,
  Organization,
  UserProfile,
  ToolInstance,
  DependencyType,
  ContextRef,
} from './domain.types'
