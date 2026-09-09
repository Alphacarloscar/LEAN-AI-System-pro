// ============================================================
// Admin Audit Tab — Componente reutilizable para visualizar audit logs
//
// Usado en CompanyDetailView y ProjectDetailView.
// Props opcionales: companyId, projectId (para filtrado por entidad).
//
// Requiere: superadmin role (verificado via RLS en BD + gate en componente).
// ============================================================

import { useEffect, useState } from 'react'
import { Button, Spinner, FormField, Select, Table } from '@/shared/design-system/components'
import { Switch } from '@/shared/design-system/components'
import { useAuthStore } from '@/modules/Auth'
import * as auditLogsService from '@/services/auditLogs.service'
import * as schemaMetadataService from '@/services/schemaMetadata.service'
import { fireBusinessAuditEvent } from '@/lib/audit'
import type { AuditLogRow } from '@/lib/audit'
import type { AuditLogQueryFilters } from '@/services/auditLogs.service'

interface AuditTabProps {
  companyId?: string
  projectId?: string
}

export function AuditTab({ companyId, projectId }: AuditTabProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'superadmin'

  // Estado
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [intensiveMode, setIntensiveModeState] = useState(false)
  const [intensiveModeLoading, setIntensiveModeLoading] = useState(true)

  // Filtros
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Paginación
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Gate: solo superadmin
  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-text-muted">
        Solo superadmin puede acceder a la auditoría.
      </div>
    )
  }

  // Cargar modo intensivo al montar
  useEffect(() => {
    const loadIntensiveMode = async () => {
      setIntensiveModeLoading(true)
      try {
        const mode = await schemaMetadataService.getIntensiveMode()
        setIntensiveModeState(mode)
      } catch (err) {
        console.error('[AuditTab] error loading intensive mode:', err)
      } finally {
        setIntensiveModeLoading(false)
      }
    }
    loadIntensiveMode()
  }, [])

  // Cargar logs cuando cambian filtros o página
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const filters: AuditLogQueryFilters = {
          companyId,
          projectId,
          eventType: eventTypeFilter || undefined,
          status: (statusFilter as 'success' | 'error') || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }

        const result = await auditLogsService.queryAuditLogs(filters)
        setLogs(result)
      } catch (err) {
        console.error('[AuditTab] error loading logs:', err)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [companyId, projectId, eventTypeFilter, statusFilter, fromDate, toDate, page])

  // Toggle modo intensivo
  const handleToggleIntensiveMode = async () => {
    try {
      const newMode = !intensiveMode
      await schemaMetadataService.setIntensiveMode(newMode)
      setIntensiveModeState(newMode)

      // Disparar evento de auditoría de negocio
      fireBusinessAuditEvent({
        event_type: 'system.intensive_mode_toggled',
        entity_type: 'system',
        entity_id: 'audit-system',
        company_id: companyId,
        project_id: projectId,
        payload: { intensive_mode_enabled: newMode },
      })
    } catch (err) {
      console.error('[AuditTab] error toggling intensive mode:', err)
    }
  }

  // Definir columnas de la tabla
  const columns = [
    {
      key: 'created_at',
      header: 'Fecha',
      width: '150px',
      render: (row: AuditLogRow) => new Date(row.created_at).toLocaleString(),
    },
    {
      key: 'event_type',
      header: 'Evento',
      width: '150px',
      render: (row: AuditLogRow) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventType = (row as any).event_type
        return eventType || row.method_name || '-'
      },
    },
    {
      key: 'user_email',
      header: 'Actor',
      width: '150px',
      render: (row: AuditLogRow) => {
        // Si el email está en metadata enmascarado, usarlo; si no, mostrar el raw
        const metadata = row.metadata as Record<string, unknown> | null
        const maskedEmail = metadata?.['actor_email_masked'] as string | undefined
        return maskedEmail || row.user_email || '-'
      },
    },
    {
      key: 'entity_type',
      header: 'Entidad',
      width: '120px',
      render: (row: AuditLogRow) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entityType = (row as any).entity_type
        return entityType || row.service_name || '-'
      },
    },
    {
      key: 'status',
      header: 'Estado',
      width: '80px',
      render: (row: AuditLogRow) => (
        <span
          className={
            row.status === 'success'
              ? 'text-green-600 dark:text-green-400 font-medium'
              : 'text-red-600 dark:text-red-400 font-medium'
          }
        >
          {row.status === 'success' ? '✓' : '✗'} {row.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Control de modo intensivo */}
      {intensiveModeLoading ? (
        <Spinner size="sm" />
      ) : (
        <div className="flex items-center gap-4 p-4 bg-warm-50 dark:bg-warm-900 rounded-lg border border-border">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Modo Intensivo</h3>
            <p className="text-xs text-text-muted mt-1">
              {intensiveMode
                ? 'Auditando todas las operaciones (INSERT/UPDATE/DELETE)'
                : 'Solo eventos de negocio y errores'}
            </p>
          </div>
          <Switch
            checked={intensiveMode}
            onChange={handleToggleIntensiveMode}
            label="Activo"
            labelPosition="left"
            size="md"
          />
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Select
          label="Evento"
          value={eventTypeFilter}
          onChange={(e) => {
            setEventTypeFilter(e.target.value)
            setPage(1)
          }}
          options={[
            { value: '', label: 'Todos' },
            { value: 'user.login', label: 'Login' },
            { value: 'user.logout', label: 'Logout' },
            { value: 'project.status_changed', label: 'Cambio de estado' },
            { value: 'access.denied', label: 'Acceso denegado' },
            { value: 'system.intensive_mode_toggled', label: 'Toggle intensivo' },
          ]}
        />

        <Select
          label="Estado"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          options={[
            { value: '', label: 'Todos' },
            { value: 'success', label: 'Éxito' },
            { value: 'error', label: 'Error' },
          ]}
        />

        <FormField
          id="fromDate"
          type="date"
          label="Desde"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value)
            setPage(1)
          }}
        />

        <FormField
          id="toDate"
          type="date"
          label="Hasta"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* Tabla */}
      <div>
        <Table
          columns={columns}
          rows={logs}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No hay eventos de auditoría"
        />
      </div>

      {/* Paginación */}
      {!loading && logs.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">
            Página {page} · {logs.length} eventos
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ← Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={logs.length < pageSize}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
