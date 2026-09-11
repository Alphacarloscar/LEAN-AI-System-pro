import { supabase } from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'
import type { PackageId } from '@/types/packages'

const _impl = {
  async getCompanyContractedPackages(companyId: string): Promise<PackageId[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('contracted_packages')
      .eq('id', companyId)
      .single()

    if (error) {
      throw new Error(`[CompanyPlans] getCompanyContractedPackages: ${error.message}`)
    }

    return ((data?.contracted_packages as PackageId[] | null) ?? [])
  },

  async updateCompanyContractedPackages(
    companyId: string,
    contractedPackages: PackageId[],
  ): Promise<void> {
    const { error } = await (supabase.rpc as any)('update_company_contracted_packages', {
      p_company_id: companyId,
      p_contracted_packages: contractedPackages,
    })

    if (error) {
      throw new Error(`[CompanyPlans] updateCompanyContractedPackages: ${error.message}`)
    }
  },
}

const _service = makeAuditable(_impl, 'services.company-plans')

export const {
  getCompanyContractedPackages,
  updateCompanyContractedPackages,
} = _service
