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
 *       auth:      { ... },        // solo si el servicio lo usa
 *       functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
 *     },
 *   }))
 *
 * La clave es incluir SIEMPRE `functions.invoke` para silenciar el stderr
 * "audit.write TypeError" que produce auditClient.ts cuando supabase.functions
 * no está definido en el mock (fire-and-forget IIFE en auditClient.ts:37).
 *
 * Ver: docs/architecture/OVERVIEW.md — "Testing — Mocks compartidos"
 */
export {}
