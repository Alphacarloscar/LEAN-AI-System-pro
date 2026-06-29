import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/audit/auditClient', () => ({ fireAuditLog: vi.fn() }))
vi.mock('@/lib/audit', () => ({ makeAuditable: <T>(s: T) => s }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc:       vi.fn(),
    from:      vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}))

import { supabase }               from '@/lib/supabase'
import { savePolicyOutput, fetchPolicyFromDb } from '@/services/t6.service'
import type { GeneratedPolicyContent } from '@/modules/T6_RiskGovernance/types'

const PROJECT_ID = 'proj-t6-test'

function makePolicy(overrides = {}): GeneratedPolicyContent {
  return {
    declaracion_opening:  'Texto apertura',
    declaracion_mandate:  'Texto mandate',
    alcance_context:      'Contexto alcance',
    principios: [{ title: 'Transparencia', desc: 'Descripción' }],
    contexto_sectorial:   'Contexto sectorial',
    sector:               'industrial',
    tamano:               'mediana',
    generatedAt:          '2026-01-01T00:00:00Z',
    ...overrides,
  } as unknown as GeneratedPolicyContent
}

// ── savePolicyOutput ──────────────────────────────────────────

describe('savePolicyOutput', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a rpc save_tool_output con tool_code t6_policy', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await savePolicyOutput(PROJECT_ID, makePolicy())

    expect(supabase.rpc).toHaveBeenCalledWith(
      'save_tool_output',
      expect.objectContaining({
        p_project_id:      PROJECT_ID,
        p_tool_code:       't6_policy',
        p_payload_version: 1,
      }),
    )
  })

  it('incluye p_stale_after como fecha ISO futura (>90 días)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await savePolicyOutput(PROJECT_ID, makePolicy())

    const args = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    const staleDate = new Date(args.p_stale_after as string)
    const now       = new Date()
    const diffDays  = (staleDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    expect(diffDays).toBeGreaterThan(85)
    expect(diffDays).toBeLessThan(95)
  })

  it('lanza error con prefijo [T6] si rpc falla', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'RLS denied' } } as never)

    await expect(savePolicyOutput(PROJECT_ID, makePolicy())).rejects.toThrow('[T6] savePolicyOutput:')
  })

  it('no lanza si rpc tiene error null', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    await expect(savePolicyOutput(PROJECT_ID, makePolicy())).resolves.toBeUndefined()
  })
})

// ── fetchPolicyFromDb — Cache-First con Fallback a BD ─────────

describe('fetchPolicyFromDb', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cache vacía (F5) → dispara SELECT limpio a tool_outputs y retorna la política', async () => {
    const storedPayload = makePolicy({ sector: 'manufactura' })
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { payload: storedPayload }, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchPolicyFromDb(PROJECT_ID)

    expect(supabase.from).toHaveBeenCalledWith('tool_outputs')
    expect(mockChain.select).toHaveBeenCalledWith('payload')
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', PROJECT_ID)
    expect(mockChain.eq).toHaveBeenCalledWith('tool_code', 't6_policy')
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'active')
    expect(result).toEqual(storedPayload)
  })

  it('retorna null si el proyecto aún no tiene política generada', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchPolicyFromDb(PROJECT_ID)

    expect(result).toBeNull()
  })

  it('lanza error con prefijo [T6] ante fallo de red o error PGRST de esquema', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data:  null,
        error: { message: 'PGRST204: column "payload" not found' },
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchPolicyFromDb(PROJECT_ID)).rejects.toThrow('[T6] fetchPolicyFromDb:')
  })

  it('ordena por created_at DESC y limita a 1 (última política activa)', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await fetchPolicyFromDb(PROJECT_ID)

    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockChain.limit).toHaveBeenCalledWith(1)
  })

  it('no lee ni escribe en localStorage directamente (aislamiento total)', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const getSpy = vi.spyOn(Storage.prototype, 'getItem')
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')

    await fetchPolicyFromDb(PROJECT_ID)

    expect(getSpy).not.toHaveBeenCalled()
    expect(setSpy).not.toHaveBeenCalled()

    getSpy.mockRestore()
    setSpy.mockRestore()
  })
})
