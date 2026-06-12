import type { RadarDimension } from './LeanRadarChart'

// ── Datos por defecto para demo / Storybook ────────────────────

export const DEMO_RADAR_DATA: RadarDimension[] = [
  { dimension: 'Datos',       current: 3, target: 5 },
  { dimension: 'Procesos',    current: 2, target: 4 },
  { dimension: 'Talento',     current: 2, target: 4 },
  { dimension: 'Tecnología',  current: 4, target: 5 },
  { dimension: 'Cultura',     current: 1, target: 3 },
  { dimension: 'Gobernanza',  current: 2, target: 4 },
]
