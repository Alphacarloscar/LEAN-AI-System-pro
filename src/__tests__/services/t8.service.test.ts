import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/audit/auditClient', () => ({ fireAuditLog: vi.fn() }))
vi.mock('@/lib/audit', () => ({ makeAuditable: <T>(s: T) => s }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc:       vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}))

import { supabase }                  from '@/lib/supabase'
import { saveCommunicationOutput }   from '@/services/t8.service'
import type { GeneratedT8Content }   from '@/modules/T8_CommunicationMap/types'

const PROJECT_ID = 'proj-t8-test'

function makeContent(overrides = {}): GeneratedT8Content {
  return {
    archetypeMessages: [{ archetype: 'sponsor', message: 'Mensaje' }],
    summary:     'Plan de comunicación',
    generatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as unknown as GeneratedT8Content
}

// ── saveCommunicationOutput — Happy Path ──────────────────────

describe('saveCommunicationOutput', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a rpc save_tool_output con tool_code t8_comms', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveCommunicationOutput(PROJECT_ID, makeContent())

    expect(supabase.rpc).toHaveBeenCalledWith(
      'save_tool_output',
      expect.objectContaining({
        p_project_id: PROJECT_ID,
        p_tool_code:  't8_comms',
        p_payload_version: 1,
      }),
    )
  })

  it('incluye p_stale_after como fecha ISO futura (~90 días)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveCommunicationOutput(PROJECT_ID, makeContent())

    const args     = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    const diffDays = (new Date(args.p_stale_after as string).getTime() - Date.now()) / 86_400_000

    expect(diffDays).toBeGreaterThan(85)
    expect(diffDays).toBeLessThan(95)
  })

  it('lanza error con prefijo [T8] si rpc falla', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'connection lost' } } as never)

    await expect(saveCommunicationOutput(PROJECT_ID, makeContent())).rejects.toThrow('[T8] saveCommunicationOutput:')
  })

  it('no lanza si rpc tiene error null', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    await expect(saveCommunicationOutput(PROJECT_ID, makeContent())).resolves.toBeUndefined()
  })
})

// ── Aislamiento de localStorage ───────────────────────────────

describe('saveCommunicationOutput — aislamiento localStorage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('no lee ni escribe en localStorage directamente (aislamiento total)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const getSpy = vi.spyOn(Storage.prototype, 'getItem')
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')

    await saveCommunicationOutput(PROJECT_ID, makeContent())

    expect(getSpy).not.toHaveBeenCalled()
    expect(setSpy).not.toHaveBeenCalled()

    getSpy.mockRestore()
    setSpy.mockRestore()
  })

  it('distintos projectId generan llamadas rpc independientes sin estado compartido', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveCommunicationOutput('proj-a', makeContent())
    await saveCommunicationOutput('proj-b', makeContent())

    expect(supabase.rpc).toHaveBeenCalledTimes(2)
    const firstCall  = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    const secondCall = vi.mocked(supabase.rpc).mock.calls[1][1] as Record<string, unknown>
    expect(firstCall.p_project_id).toBe('proj-a')
    expect(secondCall.p_project_id).toBe('proj-b')
  })
})

// ── Cobertura del payload ─────────────────────────────────────

describe('saveCommunicationOutput — contenido del payload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('serializa el contenido completo en p_payload', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const content = makeContent({ summary: 'Campaña multicapa de adopción' })
    await saveCommunicationOutput(PROJECT_ID, content)

    const args = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    expect(args.p_payload).toEqual(content)
  })

  it('p_payload_version es siempre 1', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveCommunicationOutput(PROJECT_ID, makeContent())

    const args = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    expect(args.p_payload_version).toBe(1)
  })
})
