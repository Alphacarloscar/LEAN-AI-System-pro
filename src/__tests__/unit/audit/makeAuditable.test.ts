import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks declarados antes de cualquier import del módulo bajo prueba.
// fireAuditLog se reemplaza por un spy que no toca Supabase.
// getCorrelationId ya NO existe: correlation_id se pasa vía defaultMetadata.
vi.mock('@/lib/audit/auditClient', () => ({
  fireAuditLog: vi.fn(),
}))
vi.mock('@/lib/audit/context', () => ({
  getAuditUserContext: vi.fn(),
}))

import { makeAuditable }       from '@/lib/audit/makeAuditable'
import { fireAuditLog }        from '@/lib/audit/auditClient'
import { getAuditUserContext } from '@/lib/audit/context'
import type { AuditLogInsert } from '@/lib/audit/types'

// ── Helpers ───────────────────────────────────────────────────

const MOCK_CTX = {
  user_id:    'uid-001',
  user_email: 'qa@goby.com',
  user_role:  'editor',
}

/** String que supera MAX_RESPONSE_CHARS (4 000) para forzar truncación. */
const LARGE_STRING = 'x'.repeat(5_000)

function mockedFireAuditLog() {
  return vi.mocked(fireAuditLog)
}

function lastEntry(): AuditLogInsert {
  const calls = mockedFireAuditLog().mock.calls
  return calls[calls.length - 1][0] as AuditLogInsert
}

const MOCK_CORRELATION_ID = 'corr-0000-aaaa-bbbb-cccccccccccc'

// ── Servicio de prueba ────────────────────────────────────────
//
// Un objeto con métodos async, sync y propiedades planas que permite
// verificar que el Proxy solo instrumenta los métodos asíncronos.

function buildTestService() {
  return {
    asyncSuccess: async (id: string) => ({ id, name: 'Empresa A' }),
    asyncError:   async (_id: string): Promise<never> => { // eslint-disable-line @typescript-eslint/no-unused-vars
      throw new Error('DB unavailable')
    },
    syncDouble:   (n: number): number => n * 2,
    syncGreet:    (): string          => 'hello',
    VERSION:      '1.0.0',
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. Intercepción de métodos asíncronos
// ═══════════════════════════════════════════════════════════════

describe('makeAuditable — intercepción async', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuditUserContext).mockReturnValue(MOCK_CTX)
  })

  it('llama a fireAuditLog exactamente una vez en una llamada exitosa', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')
    await proxy.asyncSuccess('id-001')

    expect(mockedFireAuditLog()).toHaveBeenCalledOnce()
  })

  it('preserva el valor de retorno original tras instrumentar', async () => {
    const proxy  = makeAuditable(buildTestService(), 'test-svc')
    const result = await proxy.asyncSuccess('id-001')

    expect(result).toEqual({ id: 'id-001', name: 'Empresa A' })
  })

  it('registra service_name, method_name y status:success correctamente', async () => {
    const proxy = makeAuditable(buildTestService(), 'companies')
    await proxy.asyncSuccess('id-001')

    const entry = lastEntry()
    expect(entry.service_name).toBe('companies')
    expect(entry.method_name).toBe('asyncSuccess')
    expect(entry.status).toBe('success')
  })

  it('registra duration_ms como número no negativo', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')
    await proxy.asyncSuccess('id-001')

    expect(lastEntry().duration_ms).toBeGreaterThanOrEqual(0)
  })

  it('registra status:error y re-lanza cuando el método async falla', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')

    await expect(proxy.asyncError('id-003')).rejects.toThrow('DB unavailable')
    expect(mockedFireAuditLog()).toHaveBeenCalledOnce()

    const entry = lastEntry()
    expect(entry.status).toBe('error')
    expect(entry.error_message).toBe('DB unavailable')
    expect(entry.response_payload).toBeNull()
  })

  it('incluye defaultMetadata en el campo metadata de cada entrada', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc', { tool_code: 'T1', model: 'haiku' })
    await proxy.asyncSuccess('id-001')

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.tool_code).toBe('T1')
    expect(metadata.model).toBe('haiku')
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. Pass-through de métodos síncronos y propiedades
// ═══════════════════════════════════════════════════════════════

describe('makeAuditable — pass-through síncrono', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuditUserContext).mockReturnValue(MOCK_CTX)
  })

  it('devuelve el valor síncrono directamente (no una Promise)', () => {
    const proxy  = makeAuditable(buildTestService(), 'test-svc')
    const result = proxy.syncDouble(5)

    expect(result).toBe(10)
    expect(result).not.toBeInstanceOf(Promise)
  })

  it('NO llama a fireAuditLog para métodos síncronos', () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')
    proxy.syncDouble(5)
    proxy.syncGreet()

    expect(mockedFireAuditLog()).not.toHaveBeenCalled()
  })

  it('devuelve el valor de retorno correcto para múltiples métodos síncronos distintos', () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')

    expect(proxy.syncDouble(7)).toBe(14)
    expect(proxy.syncGreet()).toBe('hello')
    expect(mockedFireAuditLog()).not.toHaveBeenCalled()
  })

  it('expone propiedades no-función sin modificar', () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')

    expect(proxy.VERSION).toBe('1.0.0')
    expect(mockedFireAuditLog()).not.toHaveBeenCalled()
  })

  it('no llama a fireAuditLog ni a getAuditUserContext para métodos síncronos', () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')
    proxy.syncDouble(3)

    // El contexto de usuario no debe consultarse para operaciones síncronas
    expect(vi.mocked(getAuditUserContext)).not.toHaveBeenCalled()
    expect(mockedFireAuditLog()).not.toHaveBeenCalled()
  })

  it('propaga excepciones síncronas sin llamar a fireAuditLog', () => {
    const svc = {
      throwsSync: (): never => { throw new Error('sync boom') },
    }
    const proxy = makeAuditable(svc, 'test-svc')

    expect(() => proxy.throwsSync()).toThrow('sync boom')
    expect(mockedFireAuditLog()).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. Bandera de truncación en metadata
// ═══════════════════════════════════════════════════════════════

describe('makeAuditable — truncación y bandera response_truncated en metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuditUserContext).mockReturnValue(MOCK_CTX)
  })

  // ── Truncación en response ───────────────────────────────────

  it('inyecta response_truncated:true en metadata cuando la response supera el límite', async () => {
    const svc   = { fetch: async () => ({ data: LARGE_STRING }) }
    const proxy = makeAuditable(svc, 'test-svc')
    await proxy.fetch()

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.response_truncated).toBe(true)
  })

  it('marca _truncated:true dentro de response_payload cuando se trunca', async () => {
    const svc   = { fetch: async () => ({ data: LARGE_STRING }) }
    const proxy = makeAuditable(svc, 'test-svc')
    await proxy.fetch()

    const payload = lastEntry().response_payload as Record<string, unknown>
    expect(payload._truncated).toBe(true)
    expect(typeof payload._preview).toBe('string')
    expect((payload._preview as string).length).toBeLessThanOrEqual(4_000)
  })

  // ── Truncación en args ───────────────────────────────────────

  it('inyecta response_truncated:true en metadata cuando los args superan el límite', async () => {
    const svc   = { save: async (data: string) => ({ ok: true, len: data.length }) }
    const proxy = makeAuditable(svc, 'test-svc')
    await proxy.save(LARGE_STRING)

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.response_truncated).toBe(true)
  })

  it('marca _truncated:true dentro de args_payload cuando se truncan los args', async () => {
    const svc   = { save: async (data: string) => ({ ok: true, len: data.length }) }
    const proxy = makeAuditable(svc, 'test-svc')
    await proxy.save(LARGE_STRING)

    const argsPayload = lastEntry().args_payload as Record<string, unknown>
    expect(argsPayload._truncated).toBe(true)
  })

  // ── Sin truncación ───────────────────────────────────────────

  it('NO incluye response_truncated cuando los payloads están dentro del límite', async () => {
    const svc   = { fetch: async () => ({ data: 'small payload' }) }
    const proxy = makeAuditable(svc, 'test-svc')
    await proxy.fetch()

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.response_truncated).toBeUndefined()
  })

  it('response_payload NO contiene _truncated cuando no se supera el límite', async () => {
    const svc   = { fetch: async () => ({ data: 'small payload' }) }
    const proxy = makeAuditable(svc, 'test-svc')
    await proxy.fetch()

    const payload = lastEntry().response_payload as Record<string, unknown>
    expect(payload._truncated).toBeUndefined()
  })

  // ── Coexistencia con defaultMetadata ────────────────────────

  it('preserva todos los campos de defaultMetadata junto a response_truncated', async () => {
    const svc   = { fetch: async () => ({ data: LARGE_STRING }) }
    const proxy = makeAuditable(svc, 'test-svc', { tool_code: 'T1', model: 'sonnet' })
    await proxy.fetch()

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.tool_code).toBe('T1')
    expect(metadata.model).toBe('sonnet')
    expect(metadata.response_truncated).toBe(true)
  })

  // ── Truncación en path de error ──────────────────────────────

  it('inyecta response_truncated:true en metadata de error cuando los args son grandes', async () => {
    const svc = {
      save: async (_data: string): Promise<never> => { // eslint-disable-line @typescript-eslint/no-unused-vars
        throw new Error('write failed')
      },
    }
    const proxy = makeAuditable(svc, 'test-svc')

    await expect(proxy.save(LARGE_STRING)).rejects.toThrow('write failed')

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.response_truncated).toBe(true)
    expect(lastEntry().status).toBe('error')
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. Correlation ID vía defaultMetadata (race-condition-safe)
// ═══════════════════════════════════════════════════════════════
//
// El correlation_id ya NO se lee de un estado global de módulo.
// Se pasa explícitamente en defaultMetadata al construir el proxy.
// Cada instancia de makeAuditable tiene su propio valor en su closure,
// lo que hace imposible la contaminación entre flujos paralelos.

describe('makeAuditable — correlation_id vía defaultMetadata (race-condition-safe)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuditUserContext).mockReturnValue(MOCK_CTX)
  })

  it('incluye correlation_id en el entry cuando se pasa en defaultMetadata', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc', { correlation_id: MOCK_CORRELATION_ID })
    await proxy.asyncSuccess('id-001')

    expect(lastEntry().correlation_id).toBe(MOCK_CORRELATION_ID)
  })

  it('correlation_id es null cuando no se pasa en defaultMetadata', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')
    await proxy.asyncSuccess('id-001')

    expect(lastEntry().correlation_id).toBeNull()
  })

  it('propaga el mismo correlation_id a múltiples métodos del mismo proxy', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc', { correlation_id: MOCK_CORRELATION_ID })
    await proxy.asyncSuccess('id-001')
    await proxy.asyncSuccess('id-002')

    const entries = vi.mocked(fireAuditLog).mock.calls.map(([e]) => (e as AuditLogInsert).correlation_id)
    expect(entries).toHaveLength(2)
    entries.forEach(id => expect(id).toBe(MOCK_CORRELATION_ID))
  })

  it('propaga correlation_id en el entry de error (ruta de fallo)', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc', { correlation_id: MOCK_CORRELATION_ID })
    await expect(proxy.asyncError('id-003')).rejects.toThrow()

    expect(lastEntry().correlation_id).toBe(MOCK_CORRELATION_ID)
    expect(lastEntry().status).toBe('error')
  })

  it('los métodos síncronos no llaman a fireAuditLog (correlation_id irrelevante)', () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc', { correlation_id: MOCK_CORRELATION_ID })
    proxy.syncDouble(3)

    expect(mockedFireAuditLog()).not.toHaveBeenCalled()
  })

  it('correlation_id NO aparece en el campo metadata JSONB (tiene su propia columna DB)', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc', {
      correlation_id: MOCK_CORRELATION_ID,
      tool_code: 'T1',
    })
    await proxy.asyncSuccess('id-001')

    const entry    = lastEntry()
    const metadata = entry.metadata as Record<string, unknown>
    expect(entry.correlation_id).toBe(MOCK_CORRELATION_ID)  // columna dedicada ✓
    expect(metadata.correlation_id).toBeUndefined()          // ausente del JSONB ✓
    expect(metadata.tool_code).toBe('T1')                    // resto del metadata intacto ✓
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. engagement_id desde localStorage (DEBT-019 fix)
// ═══════════════════════════════════════════════════════════════

describe('makeAuditable — engagement_id desde localStorage', () => {
  const STORAGE_KEY  = 'lean-active-engagement'
  const ENGAGEMENT_ID = 'eng-uuid-from-localStorage'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuditUserContext).mockReturnValue(MOCK_CTX)
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('inyecta engagement_id en metadata cuando está almacenado en localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state:   { activeEngagementId: ENGAGEMENT_ID },
      version: 1,
    }))

    const proxy = makeAuditable(buildTestService(), 'test-svc')
    await proxy.asyncSuccess('id-001')

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.engagement_id).toBe(ENGAGEMENT_ID)
  })

  it('el engagement_id explícito en defaultMetadata tiene prioridad sobre localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state:   { activeEngagementId: 'eng-should-be-ignored' },
      version: 1,
    }))

    const proxy = makeAuditable(buildTestService(), 'test-svc', { engagement_id: 'eng-explicit' })
    await proxy.asyncSuccess('id-001')

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.engagement_id).toBe('eng-explicit')
  })

  it('metadata no contiene engagement_id si localStorage está vacío y no se pasó explícito', async () => {
    const proxy = makeAuditable(buildTestService(), 'test-svc')
    await proxy.asyncSuccess('id-001')

    const metadata = lastEntry().metadata as Record<string, unknown>
    expect(metadata.engagement_id).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 6. Race condition: flujos paralelos con await intercalado
// ═══════════════════════════════════════════════════════════════
//
// Reproduce el bug original:
//   Con estado global (_correlationId en módulo), un Promise.all() con
//   dos flujos que contienen múltiples await provoca que el segundo flujo
//   sobreescriba _correlationId antes de que el primer flujo lo lea en
//   su segundo método, y el finally del primer withCorrelationId() borra
//   el ID del segundo.
//
// Con la nueva implementación (defaultMetadata por instancia), cada proxy
// tiene su propio correlation_id en su closure — sin estado compartido,
// la corrupción es estructuralmente imposible.

describe('makeAuditable — race condition: flujos paralelos aislados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuditUserContext).mockReturnValue(MOCK_CTX)
  })

  it('dos Promise.all paralelas con await intercalados retienen su propio correlation_id', async () => {
    const ID_A = 'corr-aaaa-1111-2222-333333333333'
    const ID_B = 'corr-bbbb-4444-5555-666666666666'

    // Servicio con dos pasos async — cada Promise.resolve() cede la microtarea,
    // garantizando que los dos flujos se interleaven en el event loop.
    const yieldSvc = {
      step: async (label: string): Promise<string> => {
        await Promise.resolve()   // cede microtarea 1
        await Promise.resolve()   // cede microtarea 2 — fuerza intercalado máximo
        return label
      },
    }

    // Dos instancias independientes: cada una lleva su correlation_id en su closure.
    const proxyA = makeAuditable(yieldSvc, 'flow-a', { correlation_id: ID_A })
    const proxyB = makeAuditable(yieldSvc, 'flow-b', { correlation_id: ID_B })

    // Flujo compuesto: dos pasos por flujo. Con estado global, el paso 2 de
    // cada flujo capturaría el ID del otro flujo (o null tras el finally).
    await Promise.all([
      (async () => {
        await proxyA.step('a-1')   // paso 1 — captura ID_A de la closure ✓
        await proxyA.step('a-2')   // paso 2 — captura ID_A de la closure ✓ (bug: capturaría ID_B)
      })(),
      (async () => {
        await proxyB.step('b-1')   // paso 1 — captura ID_B de la closure ✓
        await proxyB.step('b-2')   // paso 2 — captura ID_B de la closure ✓ (bug: capturaría null)
      })(),
    ])

    const allEntries = vi.mocked(fireAuditLog).mock.calls.map(([e]) => e as AuditLogInsert)
    expect(allEntries).toHaveLength(4)   // 2 pasos × 2 flujos

    const aEntries = allEntries.filter(e => e.service_name === 'flow-a')
    const bEntries = allEntries.filter(e => e.service_name === 'flow-b')

    expect(aEntries).toHaveLength(2)
    expect(bEntries).toHaveLength(2)

    // Invariante principal: cada entry retiene ESTRICTAMENTE su propio ID.
    aEntries.forEach(e => expect(e.correlation_id).toBe(ID_A))
    bEntries.forEach(e => expect(e.correlation_id).toBe(ID_B))
  })
})
