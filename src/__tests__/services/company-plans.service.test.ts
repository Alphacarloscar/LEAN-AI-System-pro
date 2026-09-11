import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token' } },
        error: null,
      }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { getCompanyContractedPackages, updateCompanyContractedPackages } from '@/services/company-plans.service'

describe('company-plans.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads contracted packages from the company row', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { contracted_packages: ['boost_assessment'] },
        error: null,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await expect(getCompanyContractedPackages('company-1')).resolves.toEqual(['boost_assessment'])
    expect(supabase.from).toHaveBeenCalledWith('companies')
    expect(chain.select).toHaveBeenCalledWith('contracted_packages')
    expect(chain.eq).toHaveBeenCalledWith('id', 'company-1')
  })

  it('updates company and projects through a single atomic RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await updateCompanyContractedPackages('company-1', ['boost_assessment', 'legal_compliance'])

    expect(supabase.rpc).toHaveBeenCalledTimes(1)
    expect(supabase.rpc).toHaveBeenCalledWith('update_company_contracted_packages', {
      p_company_id: 'company-1',
      p_contracted_packages: ['boost_assessment', 'legal_compliance'],
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('fails the whole save when the RPC rejects the package update', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'transaction failed' },
    } as never)

    await expect(
      updateCompanyContractedPackages('company-1', ['portfolio_management']),
    ).rejects.toThrow('[CompanyPlans] updateCompanyContractedPackages: transaction failed')
  })
})
