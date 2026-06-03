import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
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
