// ============================================================
// resetEngagementStores — Hard Reset al cambiar de proyecto
//
// Limpia sincrónicamente TODOS los stores con datos scoped
// al engagement activo. Se llama desde selectEngagement en
// el Engagement store, ANTES de actualizar activeEngagementId.
//
// Efecto: cuando React re-renderiza las vistas con el nuevo
// engagementId, los stores ya están vacíos — cero stale data.
//
// Cada store usa el mecanismo más adecuado:
//   reset()           — T1, T2, T3, T4 (limpia datos + isLoading)
//   syncEngagement(null) — T5, T6, T7, T8, T9 (limpia canvas/plan/policy)
//   resetAll()        — T12 (limpia controles ISO)
//
// Sprint 9 — Bloque 2: Estabilización arquitectónica Zustand
// ============================================================

import { useT1Store }   from '@/modules/T1_MaturityRadar/store'
import { useT2Store }   from '@/modules/T2_StakeholderMatrix/store'
import { useT3Store }   from '@/modules/T3_ValueStreamMap/store'
import { useT4Store }   from '@/modules/T4_UseCasePriorityBoard/store'
import { useT5Store }   from '@/modules/T5_AITaxonomyCanvas/store'
import { useT6Store }   from '@/modules/T6_RiskGovernance/store'
import { useT7Store }   from '@/modules/T7_AdoptionHeatmap/store'
import { useT8Store }   from '@/modules/T8_CommunicationMap/store'
import { useT9Store }   from '@/modules/T9_AIRoadmap/store'
import { useT12Store }  from '@/modules/T12_ISOAssessment/store'

/**
 * Limpia todos los stores con datos scoped al engagement.
 * Debe llamarse síncronamente antes de cambiar activeEngagementId.
 */
export function resetAllEngagementStores(): void {
  // T1–T4: stores con datos cargados desde Supabase
  useT1Store.getState().reset()
  useT2Store.getState().reset()
  useT3Store.getState().reset()
  useT4Store.getState().reset()

  // T5–T6: canvas y controles editados por el usuario, scoped al engagement
  useT5Store.getState().syncEngagement(null)
  useT6Store.getState().syncEngagement(null)

  // T7–T8: contenido generado por LLM, scoped al engagement
  useT7Store.getState().syncEngagement(null)
  useT8Store.getState().syncEngagement(null)

  // T9: overrides del Gantt y freeItems, scoped al engagement
  useT9Store.getState().syncEngagement(null)

  // T12: assessment ISO 42001
  useT12Store.getState().resetAll()
}
