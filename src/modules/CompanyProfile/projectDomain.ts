import type { ProjectRowWithDomain } from '@/types/database.types'

type MaybeDomainProject = Partial<ProjectRowWithDomain> & {
  domain_slug?: string | null
  domain_label?: string | null
}

export function getProjectDomainSlug(project: MaybeDomainProject | null | undefined): string | null {
  return project?.governance_domains?.slug ?? project?.domain_slug ?? null
}

export function getProjectDomainId(project: MaybeDomainProject | null | undefined): string | undefined {
  return project?.domain_id ?? undefined
}
