// ============================================================
// auditReport — Generates HTML audit report for ISO 42001
// ============================================================

import { T12_CLAUSE_ORDER } from '../constants'
import type { T12Clause, T12Control, T12Status } from '../types'

const STATUS_LABEL: Record<T12Status, string> = {
  no_iniciado:        'No iniciado',
  en_progreso:        'En progreso',
  pendiente_revision: 'Pendiente revisión',
  aprobado:           'Aprobado',
}

const CLAUSE_LABEL: Record<T12Clause, string> = {
  context:     'Cláusula 4 — Contexto',
  leadership:  'Cláusula 5 — Liderazgo',
  planning:    'Cláusula 6 — Planificación',
  support:     'Cláusula 7 — Apoyo',
  operation:   'Cláusula 8 — Operación',
  evaluation:  'Cláusula 9 — Evaluación del desempeño',
  improvement: 'Cláusula 10 — Mejora',
}

export function generateAuditReport(controls: T12Control[], companyName: string): string {
  const now        = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const total      = controls.length
  const approved   = controls.filter((c) => c.status === 'aprobado').length
  const pending    = controls.filter((c) => c.status === 'pendiente_revision').length
  const progress   = controls.filter((c) => c.status === 'en_progreso').length
  const notStarted = controls.filter((c) => c.status === 'no_iniciado').length
  const globalPct  = Math.round((approved / total) * 100)

  const clauseSections = T12_CLAUSE_ORDER.map((clause) => {
    const subset = controls.filter((c) => c.clause === clause)
    const rows = subset.map((c) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:11px;color:#475569;">${c.code}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#2A2822;">${c.title}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b;">${STATUS_LABEL[c.status]}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;">${c.evidence || '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;">${c.reviewNote || '—'}</td>
      </tr>
    `).join('')

    return `
      <h3 style="margin:28px 0 10px;font-size:14px;font-weight:700;color:#2A2822;border-bottom:2px solid #C8860A;padding-bottom:6px;">
        ${CLAUSE_LABEL[clause]}
      </h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr style="background:#f8f5ef;">
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Código</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Control</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Estado</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Evidencia</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Notas revisión</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe ISO 42001 — ${companyName}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color: #2A2822; background: #fff; max-width: 960px; margin: 0 auto; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div style="border-bottom:3px solid #2A2822;padding-bottom:20px;margin-bottom:24px;">
    <p style="font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin:0 0 6px;">
      GOBY — AI System Impact Assessment
    </p>
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#2A2822;">Informe ISO 42001</h1>
    <p style="margin:0;font-size:14px;color:#64748b;">${companyName} · Generado el ${now}</p>
  </div>

  <!-- Resumen ejecutivo -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
    <div style="background:#f8f5ef;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#2A2822;">${globalPct}%</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">Completado</p>
    </div>
    <div style="background:#f0fdf4;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#16a34a;">${approved}</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">Aprobados</p>
    </div>
    <div style="background:#eff6ff;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#2563eb;">${pending}</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">En revisión</p>
    </div>
    <div style="background:#fefce8;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#d97706;">${progress}</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">En progreso</p>
    </div>
  </div>

  ${clauseSections}

  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;font-family:monospace;">
    Generado por GOBY — powered by Alpha Consulting · Alpha Consulting Solutions S.L. · ${now}
    · ${total - notStarted}/${total} controles iniciados · Referencia normativa: ISO/IEC 42001:2023
  </div>
</body>
</html>`
}
