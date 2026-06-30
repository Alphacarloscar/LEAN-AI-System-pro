/**
 * Referencia del mock canónico de Supabase para tests unitarios.
 *
 * NOTA: vi.mock() factories son hoisted antes de los imports de ES modules,
 * por lo que este archivo NO puede importarse directamente dentro de un
 * vi.mock() factory. El patrón de cada test es inline:
 *
 *   vi.mock('@/lib/supabase', () => ({
 *     supabase: {
 *       from:      vi.fn(),
 *       rpc:       vi.fn(),       // solo si el servicio lo usa
 *       functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
 *       auth: {
 *         getSession: vi.fn().mockResolvedValue({
 *           data: { session: { access_token: 'mock-jwt-token' } },
 *           error: null,
 *         }),
 *       },
 *     },
 *   }))
 *
 * Por qué es obligatorio incluir SIEMPRE `functions.invoke` y `auth.getSession`:
 *
 * - `functions.invoke`: auditClient.ts (fire-and-forget IIFE) llama a invoke
 *   vía makeAuditable en todos los servicios. Sin mock → TypeError en stderr.
 *
 * - `auth.getSession`: getAuthHeader() (ADR-026) llama a getSession() antes
 *   de cada functions.invoke para obtener el JWT del usuario. Sin mock →
 *   TypeError: Cannot read properties of undefined (reading 'getSession').
 *   Afecta directamente a inviteUserToCompany y deleteUser (companies + admin
 *   tests) que llaman explícitamente a getAuthHeader(), y a cualquier servicio
 *   que pase por el path makeAuditable → fireAuditLog → getAuthHeader.
 *
 * Ver: docs/architecture/OVERVIEW.md — "Testing — Mocks compartidos"
 */
export {}
