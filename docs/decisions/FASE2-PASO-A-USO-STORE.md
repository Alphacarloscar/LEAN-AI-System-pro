# PASO A — Diagnóstico de uso real de useT4Store en consumidores

**Fecha:** 2026-08-24  
**Tarea:** Mapear exactamente qué selectores/acciones usan T5, T6, T7 al importar `useT4Store`.  
**Status:** ✅ Completado

---

## Resumen ejecutivo

Los consumidores de T4 usan **dos patrones distintos:**

1. **Desestructuración completa** (`const { useCases } = useT4Store()`)
   - Sin selector explícito
   - Obtienen todas las propiedades del store
   - Usado en **T6View**, **PolicyTab**, **RiskDashboardTab**

2. **Selector explícito** (`useT4Store(s => s.useCases)`)
   - Selector memoizado
   - Más eficiente en reactividad
   - Usado en **T5 (DeptCategoryModal, DomainProjectsModal)**, **T7View**

---

## Análisis por consumidor

### **T5 — DeptCategoryModal.tsx**

**Línea:** 32  
**Patrón:** Selector explícito

```typescript
const useCases = useT4Store(s => s.useCases)
```

**Qué extrae:** Array de `UseCase[]` completo.

**Cómo se usa:**
```typescript
const filteredUCs = useCases.filter(uc => 
  uc.aiCategory === domainCode && uc.department === department
)
// Renderiza lista de casos de uso filtrados en modal
{filteredUCs.map(uc => (...))}
```

**Reactividad necesaria:** SÍ — el filtro debe recomputarse cuando `useCases` cambia.

---

### **T5 — DomainProjectsModal.tsx**

**Línea:** 32  
**Patrón:** Selector explícito

```typescript
const useCases = useT4Store(s => s.useCases)
```

**Qué extrae:** Array de `UseCase[]` completo.

**Cómo se usa:**
```typescript
const domainUCs = useCases.filter(uc => uc.aiCategory === domainCode)
// Renderiza en modal (similar a DeptCategoryModal)
{domainUCs.map(uc => (...))}
```

**Reactividad necesaria:** SÍ — refiltra cuando `useCases` cambia.

---

### **T6 — PolicyTab.tsx**

**Línea:** 33  
**Patrón:** Desestructuración completa

```typescript
const { useCases } = useT4Store()
```

**Qué extrae:** Solo `useCases` (pero sin selector, obtiene todo el store).

**Cómo se usa:**
```typescript
// Múltiples filtrados
const approvedCases = useCases.filter(uc => uc.status === 'go' || uc.status === 'en_piloto')
const highRiskCases = useCases.filter(uc => uc.aiActClassification?.riskLevel === 'alto' || ...)

// Contexto para generación LLM
const policyGenContext = {
  aiActRisk: {
    total: useCases.length,
    prohibido: useCases.filter(uc => uc.aiActClassification?.riskLevel === 'prohibido').length,
    alto: highRiskCases.filter(uc => uc.aiActClassification?.riskLevel === 'alto').length,
    limitado: useCases.filter(uc => ...).length,
    minimo: useCases.filter(uc => ...).length,
    sinClasificar: useCases.filter(uc => !uc.aiActClassification).length,
    highRiskCases: highRiskCases.slice(0, 5).map(uc => ({ ... }))
  },
  useCases: {
    total: useCases.length,
    go: useCases.filter(uc => uc.status === 'go').length,
    piloto: useCases.filter(uc => uc.status === 'en_piloto').length,
  }
}

// Renderiza tablas y documentos PDF
{approvedCases.map(uc => (...))}
{highRiskCases.map(uc => (...))}
```

**Reactividad necesaria:** SÍ — contexto LLM y tablas se recalculan cuando `useCases` cambia.

---

### **T6 — RiskDashboardTab.tsx**

**Línea:** 114  
**Patrón:** Desestructuración completa

```typescript
const { useCases } = useT4Store()
```

**Qué extrae:** Solo `useCases`.

**Cómo se usa:**
```typescript
const summary = useMemo(() => {
  const byLevel = ALL_RISK_LEVELS.reduce((acc, l) => ({ ...acc, [l]: 0 }), {})
  let classified = 0
  useCases.forEach((uc) => {
    const level = uc.aiActClassification?.riskLevel ?? 'sin_clasificar'
    byLevel[level]++
    if (uc.aiActClassification) classified++
  })
  return {
    total: useCases.length,
    byLevel,
    classified,
    unclassified: useCases.length - classified,
    coveragePercent: useCases.length > 0 ? Math.round((classified / useCases.length) * 100) : 0,
  }
}, [useCases])

const filteredCases = selectedLevel
  ? useCases.filter(uc => (uc.aiActClassification?.riskLevel ?? 'sin_clasificar') === selectedLevel)
  : useCases

// Renderiza KPI cards y tabla
```

**Reactividad necesaria:** SÍ — el resumen y filtros dependen de `useCases` (está en dependencias de useMemo).

---

### **T6 — T6View.tsx**

**Línea:** 38-43  
**Patrón:** Desestructuración completa (múltiples selectores implícitos)

```typescript
const {
  useCases,
  isLoading:   t4Loading,
  isLoaded:    t4Loaded,
  ensureLoaded: ensureT4,
} = useT4Store()
```

**Qué extrae:** 4 propiedades del store.

**Cómo se usa:**
```typescript
// Garantiza carga en mount
useEffect(() => {
  if (engagementId && !t4Loaded) {
    void ensureT4(engagementId, { reason: 'T6View-mount' })
  }
}, [engagementId, t4Loaded])

// Bloquea UI mientras carga
const showLoadingShield = t4Loading && !t4Loaded && engagementId !== null

// Pasa useCases a PolicyTab y RiskDashboardTab (hijos)
<PolicyTab companyName={companyName} engagementId={engagementId} />
<RiskDashboardTab />
```

**Reactividad necesaria:** SÍ — estado de carga y acciones son reactivos (renderizado condicional).

---

### **T7 — T7View.tsx**

**Línea:** 70-71  
**Patrón:** Selector explícito (dos selectores separados)

```typescript
const useCases       = useT4Store(s => s.useCases)
const ensureLoadedT4 = useT4Store(s => s.ensureLoaded)
```

**Qué extrae:** 
- `useCases`: array de `UseCase[]`
- `ensureLoadedT4`: función acción de store

**Cómo se usa:**
```typescript
// Carga en mount
useEffect(() => {
  if (!engagementId) return
  if (stakeholders.length === 0) loadT2(engagementId)
  void ensureLoadedT4(engagementId, { reason: 't7-mount' })
  void loadProfile(engagementId)
}, [engagementId])

// T4 use cases para contexto del plan de cambio
// (pasan a t7ContextBuilder para generación LLM)
const t7PlanContext = buildT7PlanContext({
  useCases,
  stakeholders,
  // ...
})
```

**Reactividad necesaria:** SÍ — contexto del plan se recalcula cuando `useCases` cambia.

---

## Consolidado: qué se extrae del store

| Consumidor | Selector | Qué extrae | Tipo | Reactividad |
|---|---|---|---|---|
| **T5 — DeptCategoryModal** | Explícito | `useCases: UseCase[]` | Datos | Sí |
| **T5 — DomainProjectsModal** | Explícito | `useCases: UseCase[]` | Datos | Sí |
| **T6 — PolicyTab** | Implícito (desestr.) | `useCases: UseCase[]` | Datos | Sí |
| **T6 — RiskDashboardTab** | Implícito (desestr.) | `useCases: UseCase[]` | Datos | Sí |
| **T6 — T6View** | Implícito (desestr.) | `useCases`, `isLoading`, `isLoaded`, `ensureLoaded` | Datos + acciones | Sí |
| **T7 — T7View** | Explícito | `useCases: UseCase[]`, `ensureLoaded` | Datos + acción | Sí |

---

## Patrones observados

### **Patrón 1: Solo lectura de `useCases`**
- **Consumidores:** T5 (ambos), T6 (PolicyTab, RiskDashboardTab)
- **Uso:** Filtrado, iteración, cálculo de métricas
- **Reactividad:** Necesaria (hay useMemo con dependencia `useCases`)
- **¿Podría llamar a servicio?** NO — requieren reactividad para re-renderizar cuando datos cambian

### **Patrón 2: Lectura de estado de carga + acción `ensureLoaded`**
- **Consumidores:** T6 (T6View), T7 (T7View)
- **Uso:** Orchestración de carga en mount; mostrar spinners
- **Reactividad:** Necesaria (renderizado condicional en `showLoadingShield`, etc.)
- **¿Podría llamar a servicio?** PARCIALMENTE — la acción `ensureLoaded` sí es necesaria, pero el estado (`isLoading`, `isLoaded`) también

---

## Conclusión de PASO A

**Hallazgo clave:** Todos los consumidores necesitan **reactividad**. No pueden reemplazarse por llamadas directas a `t4.service.ts` porque:

1. Los datos reactivos (`useCases`) se usan en filtrados, cálculos y renders condicionales
2. El estado de carga (`isLoading`, `isLoaded`) es crítico para UX (spinners, bloqueos)
3. La acción `ensureLoaded` es la interfaz de carga programática

**Opción para PASO B:** Crear un hook público `useT4Kernel()` que reexporte selectores específicos sin depender del módulo UI de T4.

---

**Próximo paso:** PASO B — decidir la interfaz pública basada en este análisis.
