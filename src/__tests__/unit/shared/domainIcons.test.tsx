import { describe, it, expect } from 'vitest'
import { isValidElement } from 'react'
import {
  DOMAIN_ICONS,
  DOMAIN_LABELS,
  type DomainIconCode,
} from '@shared/design-system/charts/domainIcons'

const EXPECTED_DOMAINS: DomainIconCode[] = [
  'automatizacion_rpa',
  'automatizacion_inteligente',
  'analitica_predictiva',
  'asistente_ia',
  'optimizacion_proceso',
  'agéntica',
]

describe('DOMAIN_ICONS — mapa canónico Lucide por dominio IA', () => {
  it('tiene exactamente 6 dominios', () => {
    expect(Object.keys(DOMAIN_ICONS)).toHaveLength(6)
  })

  it('contiene todos los dominios esperados', () => {
    for (const domain of EXPECTED_DOMAINS) {
      expect(DOMAIN_ICONS, `dominio "${domain}" faltante`).toHaveProperty(domain)
    }
  })

  it('cada entrada es un ReactElement válido', () => {
    for (const [key, icon] of Object.entries(DOMAIN_ICONS)) {
      expect(isValidElement(icon), `${key} no es ReactElement`).toBe(true)
    }
  })

  it('ningún valor es null o undefined', () => {
    for (const [key, icon] of Object.entries(DOMAIN_ICONS)) {
      expect(icon, `${key} es null o undefined`).not.toBeNull()
      expect(icon).toBeDefined()
    }
  })
})

describe('DOMAIN_LABELS — etiquetas legibles por dominio IA', () => {
  it('tiene exactamente 6 dominios', () => {
    expect(Object.keys(DOMAIN_LABELS)).toHaveLength(6)
  })

  it('DOMAIN_LABELS y DOMAIN_ICONS tienen las mismas keys', () => {
    const iconKeys = Object.keys(DOMAIN_ICONS).sort()
    const labelKeys = Object.keys(DOMAIN_LABELS).sort()
    expect(iconKeys).toEqual(labelKeys)
  })

  it('cada label es un string no vacío', () => {
    for (const [key, label] of Object.entries(DOMAIN_LABELS)) {
      expect(typeof label, `${key} no es string`).toBe('string')
      expect(label.length, `${key} label vacío`).toBeGreaterThan(0)
    }
  })

  it('contiene todas las etiquetas esperadas', () => {
    expect(DOMAIN_LABELS.automatizacion_rpa).toBe('Automatización RPA')
    expect(DOMAIN_LABELS.automatizacion_inteligente).toBe('Automatización Inteligente')
    expect(DOMAIN_LABELS.analitica_predictiva).toBe('Analítica Predictiva')
    expect(DOMAIN_LABELS.asistente_ia).toBe('Asistente IA')
    expect(DOMAIN_LABELS.optimizacion_proceso).toBe('Optimización de Proceso')
    expect(DOMAIN_LABELS['agéntica']).toBe('Agéntica IA')
  })
})
