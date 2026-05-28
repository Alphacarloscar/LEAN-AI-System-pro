// ============================================================
// resetEngagementStores — Hard Reset + Eager Loading al cambiar de proyecto
//
// resetAllEngagementStores():
//   Limpia sincrónicamente TODOS los stores con datos scoped
//   al engagement activo. Se llama desde selectEngagement en
//   el Engagement store, ANTES de actualizar activeEngagementId.
//   Efecto: cero stale data cuando React re-renderiza con el
//   nuevo engagementId.
//
// loadAllCriticalStores(engagementId):
//   Dispara en paralelo (Promise.allSettled) el load de los
//   stores que actúan como fuente de datos para otros módulos:
//     T1 ← base de diagnóstico (T2, T10)
//     T2 ← stakeholders (T7, T8)
//     T3 ← procesos (T4)
//     T4 ← casos de uso (T9, T7, T8, T6)
//   Fire-and-forget desde selectEngagement: si el usuario vuelve
//   a cambiar de proyecto antes de que terminen, el stale guard
//   de cada store descarta los resultados en vuelo.
//
// Cada store usa el mecanismo de reset más adecuado:
//   reset()              — T1, T2, T3, T4
//   syncEngagement(null) — T5, T6, T7, T8, T9
//   resetAll()           — T12
//
// Sprint 9 — Bloque 2 (estabilización) + Bloque 3 (eager loading)
// ============================================================

import { useT1Store }              from '@/modules/T1_MaturityRadar/store'
import { useT2Store }              from '@/modules/T2_StakeholderMatrix/store'
import { useT3Store }              from '@/modules/T3_ValueStreamMap/store'
import { useT4Store }              from '@/modules/T4_UseCasePriorityBoard/store'
import { useT5Store }              from '@/modules/T5_AITaxonomyCanvas/store'
import { useT6Store }              from '@/modules/T6_RiskGovernance/store'
import { useT7Store }              from '@/modules/T7_AdoptionHeatmap/store'
import { useT8Store }              from '@/modules/T8_CommunicationMap/store'
import { useT9Store }              from '@/modules/T9_AIRoadmap/store'
import { useT12Store }             from '@/modules/T12_ISOAssessment/store'
import { useCompanyProfileStore }  from '@/modules/CompanyProfile/store'

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

  // CompanyProfile: perfil de empresa scoped al engagement
  useCompanyProfileStore.getState().resetProfile()
}

/**
 * Carga en paralelo los stores de datos críticos (T1–T4).
 * Fire-and-forget: se llama desde selectEngagement sin await.
 * Los stale guards de cada store protegen contra cargas en vuelo
 * si el usuario cambia de proyecto antes de que terminen.
 */
export async function loadAllCriticalStores(engagementId: string): Promise<void> {
  await Promise.allSettled([
    useT1Store.getState().load(engagementId),
    useT2Store.getState().load(engagementId),
    useT3Store.getState().load(engagementId),
    useT4Store.getState().loadEngagement(engagementId),
    useCompanyProfileStore.getState().loadProfile(engagementId),
  ])
}
