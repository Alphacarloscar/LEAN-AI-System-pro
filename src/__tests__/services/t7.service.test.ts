import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase }               from '@/lib/supabase'
import { saveChangePlanOutput }   from '@/services/t7.service'
import type { GeneratedChangePlan } from '@/modules/T7_AdoptionHeatmap/types'

const PROJECT_ID = 'proj-t7-test'

function makePlan(overrides = {}): GeneratedChangePlan {
  return {
    phases: [{ phase: 'phase1', actions: [], duration: '1 mes' }],
    summary: 'Plan de cambio',
    generatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as unknown as GeneratedChangePlan
}

// ── saveChangePlanOutput — Happy Path ─────────────────────────

describe('saveChangePlanOutput', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a rpc save_tool_output con tool_code t7_plan', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveChangePlanOutput(PROJECT_ID, makePlan())

    expect(supabase.rpc).toHaveBeenCalledWith(
      'save_tool_output',
      expect.objectContaining({
        p_project_id: PROJECT_ID,
        p_tool_code:  't7_plan',
        p_payload_version: 1,
      }),
    )
  })

  it('incluye p_stale_after como fecha ISO futura (~90 días)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveChangePlanOutput(PROJECT_ID, makePlan())

    const args     = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    const diffDays = (new Date(args.p_stale_after as string).getTime() - Date.now()) / 86_400_000

    expect(diffDays).toBeGreaterThan(85)
    expect(diffDays).toBeLessThan(95)
  })

  it('lanza error con prefijo [T7] si rpc falla', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'DB error' } } as never)

    await expect(saveChangePlanOutput(PROJECT_ID, makePlan())).rejects.toThrow('[T7] saveChangePlanOutput:')
  })

  it('no lanza si rpc tiene error null', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    await expect(saveChangePlanOutput(PROJECT_ID, makePlan())).resolves.toBeUndefined()
  })
})

// ── Aislamiento de localStorage ───────────────────────────────

describe('saveChangePlanOutput — aislamiento localStorage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('no lee ni escribe en localStorage directamente (aislamiento total)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const getSpy = vi.spyOn(Storage.prototype, 'getItem')
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')

    await saveChangePlanOutput(PROJECT_ID, makePlan())

    expect(getSpy).not.toHaveBeenCalled()
    expect(setSpy).not.toHaveBeenCalled()

    getSpy.mockRestore()
    setSpy.mockRestore()
  })

  it('distintos projectId generan llamadas rpc independientes sin estado compartido', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveChangePlanOutput('proj-a', makePlan())
    await saveChangePlanOutput('proj-b', makePlan())

    expect(supabase.rpc).toHaveBeenCalledTimes(2)
    const firstCall  = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    const secondCall = vi.mocked(supabase.rpc).mock.calls[1][1] as Record<string, unknown>
    expect(firstCall.p_project_id).toBe('proj-a')
    expect(secondCall.p_project_id).toBe('proj-b')
  })
})

// ── Cobertura del payload ─────────────────────────────────────

describe('saveChangePlanOutput — contenido del payload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('serializa el plan completo en p_payload', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const plan = makePlan({ summary: 'Plan resistencia alta' })
    await saveChangePlanOutput(PROJECT_ID, plan)

    const args = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    expect(args.p_payload).toEqual(plan)
  })

  it('p_payload_version es siempre 1', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await saveChangePlanOutput(PROJECT_ID, makePlan())

    const args = vi.mocked(supabase.rpc).mock.calls[0][1] as Record<string, unknown>
    expect(args.p_payload_version).toBe(1)
  })
})
