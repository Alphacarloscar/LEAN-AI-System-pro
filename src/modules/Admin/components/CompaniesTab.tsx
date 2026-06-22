// ============================================================
// Admin — Tab Empresas
// ============================================================

import { useState }       from 'react'
import { Spinner }        from '@shared/design-system/components'
import { createCompany }  from '@/services/companies.service'
import { CheckIcon }      from './AdminHelpers'
import type { SharedProps } from './AdminHelpers'

export function CompaniesTab({ companies, onCompanyAdd }: SharedProps) {
  const [name,     setName]     = useState('')
  const [creating, setCreating] = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true); setError(null)
    try {
      const company = await createCompany({ name: name.trim() })
      onCompanyAdd(company)
      setName('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear empresa')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-4">Crear empresa cliente</h2>
        <form onSubmit={handleCreate} className="flex gap-3 max-w-md">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la empresa (ej: Nexus Industrial S.A.)"
            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-[#C8860A]/60 focus:bg-white placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="h-9 px-4 rounded-lg bg-[#C8860A] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#B57609] transition-colors flex items-center gap-2"
          >
            {creating ? <Spinner /> : success ? <CheckIcon /> : null}
            Crear
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div>
        <h4 className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-3">
          Empresas registradas ({companies.length})
        </h4>
        {companies.length === 0 ? (
          <p className="text-sm text-gray-400">Sin empresas todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-[#2A2822]">{c.name}</p>
                  <p className="text-xs font-mono text-gray-400">{c.slug ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
