import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase }          from '@/lib/supabase'
import { savePolicyOutput }  from '@/services/t6.service'
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
