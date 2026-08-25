// generateOperatingModelHTML — exportación del modelo operativo a HTML

import { T11_LEVEL_CONFIG, T11_FREQUENCY_LABEL, T11_MATURITY_CONFIG } from '../constants'
import type { buildOperatingModel } from '../engine'

export function generateOperatingModelHTML(
  companyName: string,
  model: ReturnType<typeof buildOperatingModel>,
): string {
  const now    = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const matCfg = T11_MATURITY_CONFIG[model.maturityTier]

  const eventsHTML = model.recommendedEvents.map((e) => {
    const lcfg = T11_LEVEL_CONFIG[e.level]
    return `<tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1a1a1a;">${e.title}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${lcfg.label}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${T11_FREQUENCY_LABEL[e.frequency]}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${e.duration}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${e.owner}</td>
    </tr>`
  }).join('')

  const decisionsHTML = model.decisions.map((d) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 12px;font-size:11px;color:#374151;">${d.trigger}</td>
      <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#1a1a1a;">${d.owner}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${d.escalateTo}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${d.timeline}</td>
    </tr>`).join('')

  const kpiHTML = model.kpiGroups.map((g) => `
    <h3 style="font-size:13px;font-weight:600;color:#374151;margin:24px 0 12px;">${g.label}</h3>
    ${g.kpis.map((k) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <div>
        <p style="font-size:12px;font-weight:600;color:#1a1a1a;margin:0 0 2px;">${k.name}</p>
        <p style="font-size:10px;color:#9ca3af;font-family:monospace;margin:0;">${k.formula}</p>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:16px;">
        <span style="font-size:10px;background:#f3f4f6;padding:2px 6px;border-radius:4px;color:#374151;">${k.source}</span>
        <p style="font-size:10px;color:#9ca3af;margin:4px 0 0;">${k.cadence}</p>
      </div>
    </div>`).join('')}`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AI Operating Rhythm — ${companyName}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;margin:0;padding:40px;background:#fff}
    h2{font-size:15px;font-weight:700;color:#374151;margin:32px 0 12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{background:#f9fafb;text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:600}
    @media print{body{padding:20px}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div>
      <p style="font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin:0 0 6px;">GOBY · T11</p>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">AI Operating Rhythm</h1>
      <p style="font-size:13px;color:#6b7280;margin:0;">${companyName}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:10px;color:#9ca3af;margin:0;">Generado el ${now}</p>
      {/* TODO: domain-specific prefix — parametrize when second domain is implemented */}
      <p style="font-size:11px;font-weight:600;margin:4px 0 0;color:${matCfg.hex};">Madurez IA: ${matCfg.label} (${model.maturityAvg.toFixed(1)}/4)</p>
    </div>
  </div>
  <div style="display:flex;gap:16px;margin:24px 0;">
    ${[
      { v: model.maturityAvg.toFixed(1), l: 'Índice de madurez IA', c: matCfg.hex },
      { v: model.recommendedEvents.length, l: 'Eventos de gobierno', c: '#C8860A' },
      { v: model.decisions.length,         l: 'Nodos de decisión', c: '#6A90C0' },
      { v: model.kpiGroups.reduce((a, g) => a + g.kpis.length, 0), l: 'KPIs definidos', c: '#5FAF8A' },
    ].map(k => `<div style="flex:1;background:#f9fafb;border-radius:12px;padding:16px 20px;">
      <div style="font-size:28px;font-weight:700;color:${k.c};">${k.v}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">${k.l}</div>
    </div>`).join('')}
  </div>
  <h2>Cadencia de Gobierno Recomendada</h2>
  <table><thead><tr><th>Evento</th><th>Nivel</th><th>Frecuencia</th><th>Duración</th><th>Responsable</th></tr></thead>
  <tbody>${eventsHTML}</tbody></table>
  <h2>Matriz de Decisiones y Escalada</h2>
  <table><thead><tr><th>Trigger</th><th>Owner</th><th>Escala a</th><th>Plazo</th></tr></thead>
  <tbody>${decisionsHTML}</tbody></table>
  <h2>KPIs por Nivel de Gobierno</h2>${kpiHTML}
  <p style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;">
    Generado por GOBY — powered by Alpha Consulting · Alpha Consulting Solutions S.L. · ${now}
  </p>
</body>
</html>`
}
