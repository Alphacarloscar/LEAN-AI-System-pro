// Mapa canónico de iconos Lucide por dominio IA — fuente única para T3, T4, T5
import { Settings, Cpu, TrendingUp, MessageSquare, RefreshCw, Network } from 'lucide-react'
import type { ReactElement } from 'react'

export type DomainIconCode =
  | 'automatizacion_rpa'
  | 'automatizacion_inteligente'
  | 'analitica_predictiva'
  | 'asistente_ia'
  | 'optimizacion_proceso'
  | 'agéntica'

export const DOMAIN_ICONS: Record<DomainIconCode, ReactElement> = {
  automatizacion_rpa:         <Settings      size={12} strokeWidth={1.5} />,
  automatizacion_inteligente: <Cpu           size={12} strokeWidth={1.5} />,
  analitica_predictiva:       <TrendingUp    size={12} strokeWidth={1.5} />,
  asistente_ia:               <MessageSquare size={12} strokeWidth={1.5} />,
  optimizacion_proceso:       <RefreshCw     size={12} strokeWidth={1.5} />,
  'agéntica':                 <Network       size={12} strokeWidth={1.5} />,
}

export const DOMAIN_LABELS: Record<DomainIconCode, string> = {
  automatizacion_rpa:         'Automatización RPA',
  automatizacion_inteligente: 'Automatización Inteligente',
  analitica_predictiva:       'Analítica Predictiva',
  asistente_ia:               'Asistente IA',
  optimizacion_proceso:       'Optimización de Proceso',
  'agéntica':                 'Agéntica IA',
}
