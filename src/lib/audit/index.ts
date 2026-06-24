// ============================================================
// Audit Module — Barrel file
//
// Re-exporta los componentes principales del sistema de auditoría
// para permitir importaciones limpias desde otros módulos, como:
//   import { makeAuditable, setAuditContextProvider } from '@/lib/audit'
// ============================================================

export * from './types'
export * from './makeAuditable'
export * from './auditClient'