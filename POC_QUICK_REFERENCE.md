# POC QUICK REFERENCE — 4 Riesgos Frontend

**Fecha:** 2026-08-17  
**Para:** Equipo de desarrollo Sprints 13-15  
**Uso:** Copiar-pegar fragmentos exactos y adaptar a contexto local

---

## 1️⃣ TIPADO DINÁMICO (Zod Runtime)

### Setup
```bash
# No hay nuevas dependencias — Zod ya está instalado
```

### Archivo principal
**`src/lib/schemas/dynamicSchemaBuilder.ts`** (155 líneas — ver POC completo)

### Uso en servicio
```typescript
// src/services/t4.service.ts
const schema = dynamicSchemaRegistry.getSchema('AIActClassification') || AIActClassificationSchema
const validated = safeParseJsonField(schema, row.ai_act_classification, 'ai_act')
```

### Uso en componente React
```typescript
// src/modules/T4_UseCasePriorityBoard/components/AIActModal.tsx
const parseClassification = useSafeParseWithAudit<AIActClassification>(
  'AIActClassification',
  (error) => reportError('[AIAct validation]', error)
)
const validated = parseClassification(formData)
```

### Testing
```typescript
// src/__tests__/schemas/dynamicSchemaBuilder.test.ts
test('buildZodSchemaFromMeta generates equivalent schema', () => {
  const meta: SchemaMetaDef = {
    schemaName: 'AIActClassification',
    fields: [
      { name: 'scope', type: 'enum', enumRef: 'AIActScope', required: true }
    ]
  }
  const registry = new Map([['AIActScope', ['rrhh', 'financiero_clientes', ...]]])
  const schema = buildZodSchemaFromMeta(meta, registry)
  
  expect(schema.safeParse({ scope: 'rrhh' }).success).toBe(true)
  expect(schema.safeParse({ scope: 'invalid' }).success).toBe(false)
})
```

---

## 2️⃣ ZUSTAND GENÉRICO (Generic Store)

### Setup
```bash
# No hay nuevas dependencias
```

### Archivo principal
**`src/lib/stores/genericEvaluationStore.ts`** (260 líneas — ver POC completo)

### Crear store para nueva evaluación
```typescript
// src/modules/T1_DataMaturityRadar/store.ts
import { createEvaluationStore } from '@/lib/stores/genericEvaluationStore'

const T1_DATA_META: EvaluationMeta = {
  domainId: 'data',
  evaluationType: 'maturity',
  dimensionCount: 5,
  subdimensionCount: 4,
  dimensions: [
    { code: 'quality', label: 'Calidad de Datos', weight: 0.20 },
    // ... 4 más
  ],
}

export const useT1DataStore = createEvaluationStore('data', 'maturity', T1_DATA_META)
```

### Usar en componente
```typescript
export function T1DataInterviewForm() {
  const { respondents, scores, setScore } = useT1DataStore()
  
  const handleScoreChange = (respondentId: string, dimension: string, value: number) => {
    setScore(respondentId, dimension, value)
  }
  
  return (
    // Renderizar form de forma dinámica basándose en respondents + scores
  )
}
```

### Testing
```typescript
// src/__tests__/stores/genericEvaluationStore.test.ts
test('createEvaluationStore generates equivalent state to T1Store', () => {
  const store = createEvaluationStore('ai', 'maturity', T1_META)
  const { getState } = store
  
  expect(getState().scores).toEqual({})
  
  getState().addRespondent({ name: 'John', role: 'IT Manager', metadata: {} })
  getState().setScore('john-id', 'strategy', 2, 'Evidence...')
  
  expect(getState().scores['john-id']).toContainEqual({
    dimensionCode: 'strategy',
    value: 2,
    evidence: 'Evidence...'
  })
})
```

---

## 3️⃣ GRÁFICOS DINÁMICOS (N-Axis Spider)

### Setup
```bash
npm install recharts  # Si no está instalado
# Ya está: SVG + React hooks
```

### Archivo principal
**`src/modules/T1_MaturityRadar/components/SpiderChart.tsx`** (320 líneas — ver POC completo)

### Uso
```typescript
// src/modules/T1_MaturityRadar/components/T1RadarPanel.tsx
import { SpiderChart } from './SpiderChart'

export function T1RadarPanel() {
  const dimensions = useT1Store(s => s.dimensionStates[activeId])
  
  return (
    <SpiderChart
      dimensions={dimensions.map(d => ({
        code: d.code,
        label: d.label,
        score: computeDimensionScore(d)
      }))}
      maxScore={4}
      target={3.5}
    />
  )
}
```

### Panel registry
**`src/lib/dashboards/panelRegistry.ts`** (180 líneas)

```typescript
import { panelRegistry } from '@/lib/dashboards/panelRegistry'

// Registrar paneles IA al startup
panelRegistry.registerMultiple([
  {
    id: 'p1-maturity',
    position: 'p1',
    title: 'Madurez IA',
    domain: 'ai',
    component: P1MaturityPanel,
    metrics: [{ key: 'overall', label: 'Score Global', value: '2.3/4' }],
  },
  // ... p2-p6
])

// Para nuevo dominio: un registro más
panelRegistry.register({
  id: 'p1-data-quality',
  position: 'p1',
  title: 'Calidad de Datos',
  domain: 'data',
  component: P1DataQualityPanel,
  metrics: [{ key: 'overall', label: 'Score', value: '3.1/4' }],
})
```

### Testing
```typescript
test('SpiderChart renders N axes dynamically', () => {
  const { container } = render(
    <SpiderChart
      dimensions={[
        { code: 'd1', label: 'D1', score: 2 },
        { code: 'd2', label: 'D2', score: 3 },
        { code: 'd3', label: 'D3', score: 1.5 },
      ]}
    />
  )
  
  const lines = container.querySelectorAll('line[stroke]')
  expect(lines.length).toBe(3) // 3 ejes
})
```

---

## 4️⃣ RENDIMIENTO DASHBOARD (MVs + Cache)

### Setup
```bash
# SQL migrations
supabase migration up  # Ejecutar 20260820_dashboard_materialized_views.sql
```

### Archivo principal: Service
**`src/services/dashboard.service.ts`** (150 líneas)

```typescript
import { supabase } from '@/lib/supabase'

export async function getT1Metrics(projectId: string): Promise<DashboardT1Metrics | null> {
  const { data, error } = await supabase
    .from('dashboard_t1_maturity')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) return null
  return {
    strategyScore: data.strategy_score ?? 0,
    // ...
    overallScore: data.overall_score ?? 0,
  }
}
```

### Archivo principal: Hook
**`src/hooks/useDashboardMetrics.ts`** (110 líneas)

```typescript
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'

export function T10View() {
  const engagementId = useEngagementStore(s => s.activeEngagementId)
  const { t1, t4, t2, risks, isLoading } = useDashboardMetrics(engagementId)
  
  return (
    <div>
      {isLoading ? 'Cargando...' : <Dashboard t1={t1} t4={t4} t2={t2} risks={risks} />}
    </div>
  )
}
```

### Testing
```typescript
test('useDashboardMetrics returns cached data on second call', async () => {
  const { result, rerender } = renderHook(() => useDashboardMetrics('proj-123'))
  
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  const firstCall = result.current.t1
  
  // Segunda llamada — debe venir del cache
  rerender()
  await waitFor(() => expect(result.current.t1).toEqual(firstCall))
})
```

---

## 🔄 MIGRACIÓN PASO A PASO

### Sprint 13: Fase de Setup
1. **Mañana 1-2:** Crear `dynamicSchemaBuilder.ts` + registry
2. **Mañana 3-4:** Poblar BD con enums/schemas de dominio 'ai'
3. **Mañana 5:** Tests + merge a develop
4. **Mañana 6-7:** SQL migrations + MVs + indices
5. **Mañana 8-9:** `dashboard.service.ts` + tests
6. **Mañana 10:** Feature flag `useDynamicSchemaRegistry` (OFF)

### Sprint 14: Fase de Integración
1. **Mañana 1-3:** Refactor `useT1Store` → usar factory genérico
2. **Mañana 4-5:** Tests de equivalencia
3. **Mañana 6-7:** Refactor `T1SpiderChart` → dinámico
4. **Mañana 8-9:** `useDashboardMetrics` hook
5. **Mañana 10:** Refactor `T10View` para usar hook

### Sprint 15: Fase de Validación
1. **Mañana 1-2:** Staging testing con feature flag ON
2. **Mañana 3-4:** Simular cambio de enums en BD → verificar que schemas se rebuildan
3. **Mañana 5-6:** Crear dominio "Data Governance" dummy
4. **Mañana 7-8:** Tests E2E multidominio
5. **Mañana 9-10:** Merge + stabilización

---

## 📊 CHECKLIST DE VALIDACIÓN

- [ ] Zod factory output == hardcoded schemas (unit test)
- [ ] useT1Store nuevo == useT1Store antiguo (test de estado)
- [ ] SpiderChart(6D) visual regression test pasa
- [ ] panelRegistry.getPanelsByDomain() devuelve orden correcto
- [ ] dashboard_t1_maturity overall_score == computeOverallScore local
- [ ] useDashboardMetrics cache TTL funciona (test temporal)
- [ ] Feature flag `useDynamicSchemaRegistry` permite fallback
- [ ] E2E: cambiar enum → refresh MV → verificar formularios actualizados

---

## ⚠️ GOTCHAS & MITIGACIONES

| Gotcha | Mitigación |
|--------|-----------|
| Zod `z.enum()` requiere array literal → usar `as [string, ...string[]]` | ✓ Código POC lo hace |
| TypeScript no infiere tipos de schema dinámico → usar discriminated unions | ✓ Fallback a tipos estáticos |
| Zustand debounce timers no se limpian en unmount → memory leak | ✓ useEffect return cleanup |
| Materialized views recargadas sin índices → query lenta | ✓ Índices en migración |
| SpiderChart SVG viewBox hardcodeado a 380 → problemas con N>6 | ✓ Escalable: `380 + (N-6)*20` |
| panelRegistry no purga paneles viejos → memory leak | ✓ Agregar `unregister(id)` |

---

## 🚀 DEPLOY A PRODUCCIÓN

1. **Feature flag OFF** durante sprints 13-14
2. **Feature flag ON** en staging (Sprint 15)
3. **Monitoreo:** Latencia T10, errores de validación, caché hit rate
4. **Rollback:** Si latencia > 300ms, desactivar `useDashboardMetrics` hook
5. **Go-live:** Feature flag ON en prod + monitor 24h

---

**Contacto:** Revisar `POC_RESOLUCION_RIESGOS_FRONTEND.md` para detalles técnicos completos.
