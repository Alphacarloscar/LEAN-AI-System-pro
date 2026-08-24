# T4 Shared Kernel — Diagnóstico Pre-Extracción (Fase 2)

**Fecha:** 2026-08-24  
**ADR:** ADR-029 Fase 2 — Shared Kernel T4  
**Objetivo:** Mapear estructura, dependencias y riesgos antes de extraer T4 como módulo compartido por Paquetes 2 y 3.

---

## 1. Estructura de ficheros T4

### Servicio de datos (núcleo)
```
src/services/t4.service.ts (203 líneas)
  └─ Expone 5 funciones públicas de CRUD + mapeo BD↔dominio
```

### Validaciones
```
src/lib/schemas/t4.schemas.ts
  └─ Zod schemas para campos JSONB de use_cases
```

### Módulo UI
```
src/modules/T4_UseCasePriorityBoard/ (18 ficheros)
├─ index.ts (exports principal)
├─ T4View.tsx (raíz componente)
├─ types.ts
├─ constants.ts
├─ store.ts (Zustand)
├─ t4ContextBuilder.ts
└─ components/ (13 componentes)
   ├─ AIActClassificationModal
   ├─ ContextoTabContent
   ├─ EconomicsTab
   ├─ ExecDashboard
   ├─ ImportFromT3Modal
   ├─ LowScoreRecommendations
   ├─ PriorityMatrix
   ├─ QuarterlyRoadmap
   ├─ RoadmapTabContent
   ├─ ScoringTabContent
   ├─ T4Badges
   ├─ T4ScoreEditors
   └─ UseCaseDetailPanel
```

### Tests
```
src/__tests__/services/t4.service.test.ts
src/__tests__/unit/T4/
├─ aiact.test.ts (T4 → computeAIActRisk)
├─ roi.test.ts
└─ scoring.test.ts
```

**Total de ficheros:** 1 servicio + 1 schema + 18 módulo + 3 tests = **23 ficheros**

---

## 2. Interfaz pública de t4.service.ts

Todas las funciones son asincrónicas y pasadas por `makeAuditable(_, 'services.t4')`.

### Funciones de CRUD (5)

```typescript
// Cargar todos los casos de uso de un engagement
export async function fetchUseCases(projectId: string): Promise<UseCase[]>

// Insertar nuevo caso de uso
export async function insertUseCase(uc: UseCase, projectId: string): Promise<void>

// Actualizar campos específicos de un caso de uso
export async function updateUseCaseInDb(
  id: string,
  projectId: string,
  updates: Partial<Omit<UseCase, 'id' | 'createdAt'>>
): Promise<void>

// Eliminar un caso de uso
export async function deleteUseCaseFromDb(id: string, projectId: string): Promise<void>

// Insertar múltiples casos de uso (seed data)
export async function bulkInsertUseCases(useCases: UseCase[], projectId: string): Promise<void>
```

### Funciones de mapeo (2, públicas)

```typescript
// Convierte fila BD (snake_case) → objeto dominio (camelCase)
export function rowToUseCase(row: UseCaseRow): UseCase

// Convierte objeto dominio → fila BD (para INSERT)
export function useCaseToInsert(uc: UseCase, projectId: string): UseCaseInsert
```

### Funciones internas (2)

```typescript
// Normaliza scores con valores por defecto para registros anteriores a migración
function normalizeScores(raw: UseCaseScores | null | undefined): UseCaseScores

// Casteo seguro de tipo para valores opcionales
function castOpt<T>(v: unknown): T | undefined
```

---

## 3. Consumidores de T4 (8 imports)

### Por módulo consumidor

#### T5 — AI Taxonomy Canvas (Paquete 2)
- `DeptCategoryModal.tsx:9` → `useT4Store`
- `DomainProjectsModal.tsx:10` → `useT4Store`

#### T6 — Risk Governance (Paquete 3)
- `PolicyTab.tsx:6` → `useT4Store`
- `RiskDashboardTab.tsx:7` → `useT4Store`
- `RiskDashboardTab.tsx:10` → `type { AIActRiskLevel }`
- `constants.ts:6` → `type { AIActRiskLevel }`
- `PolicyPDF.tsx:20` → `type { UseCase }`
- `t6ContextBuilder.ts:11` → `type { UseCase }`
- `types.ts:13` → `type { AIActRiskLevel }`
- `T6View.tsx:14` → `useT4Store`

#### T7 — Adoption Heatmap (Paquete 1)
- `T7View.tsx:17` → `useT4Store`

#### App root
- `App.tsx:20` → `T4View` (componente)

### Resumen de consumo

| Paquete | Módulo | Tipo de import | Cantidad |
|---------|--------|---|---|
| **Paquete 2** | T5 | `useT4Store` runtime | 2 |
| **Paquete 3** | T6 | `useT4Store` + types | 5 runtime + 4 type |
| **Paquete 1** | T7 | `useT4Store` runtime | 1 |
| **Plataforma** | App | `T4View` runtime | 1 |

**Conclusión:** T5, T6, T7 consumen T4 a través de:
1. **Store Zustand** (`useT4Store`) — acceso a datos
2. **Types** (`UseCase`, `AIActRiskLevel`) — tipado
3. **Componente** (`T4View`) — renderizado (desde App root)

---

## 4. Dependencias de T4 → Otros módulos

### Matriz de imports EN T4

| Desde | A dónde | Línea | Tipo | Severidad |
|-------|---------|-------|------|-----------|
| **T4View.tsx** | T1 store | 8 | `useT1Store` runtime | 🟢 OK |
| **T4View.tsx** | T2 store | 9 | `useT2Store` runtime | 🟢 OK |
| **ContextoTabContent.tsx** | T2 types | 9 | `type { Stakeholder }` | 🟢 OK (type-only) |
| **ImportFromT3Modal.tsx** | T3 store | 19 | `useT3Store` runtime | 🟢 OK |
| **ImportFromT3Modal.tsx** | T3 const | 21 | `AI_CATEGORY_CONFIG` runtime | 🟢 OK |
| **UseCaseDetailPanel.tsx** | T2 types | 14 | `type { Stakeholder }` | 🟢 OK (type-only) |
| **AIActClassificationModal.tsx** | T6 schema | 13 | `@/lib/schemas/t6.schemas` | 🟡 REVISAR |

### Análisis de circularidad

**¿T1 → T4?** No. T1 no menciona T4.  
**¿T2 → T4?** No. T2 no menciona T4.  
**¿T3 → T4?** No. T3 no menciona T4.  
**¿T6 → T4?** SÍ. T6 importa:
  - `useT4Store` (5 ubicaciones)
  - `type { AIActRiskLevel }` (3 ubicaciones)
  - `type { UseCase }` (2 ubicaciones)

**Conclusión:** **SIN CICLOS CIRCULARES.** T4 → T1, T2, T3, T6 son **dependencias unidireccionales**. T4 solo consume estado y tipos; T1, T2, T3 no re-importan T4. T6 importa T4, pero T4 solo usa librería pura de T6 (schemas).

**Riesgo residual:** `AIActClassificationModal.tsx` importa `t6.schemas`. Si T6 contiene lógica de negocio futura que dependa de T4, podría haber acoplamiento tácito. **Mitigación:** documentar claramente que T6 schemas son dominio-agnósticas.

---

## 5. Criterios de aceptación (ADR-029 §4)

Para Fase 2, T4 debe cumplir:

- ✅ **Interfaz pública clara:** 5 funciones CRUD + 2 helpers de mapeo
- ✅ **Sin imports cruzados entre paquetes:** T5, T6, T7 consumen T4; T4 no importa de T5 o T6 (solo de T1, T2, T3, schemas)
- ✅ **Dependencias unidireccionales:** T4 ← Paquetes. Ningún ciclo.
- ✅ **Tests de caracterización:** `aiact.test.ts`, `roi.test.ts`, `scoring.test.ts` cubren fórmulas clave
- ✅ **Servicio sin presentación:** `t4.service.ts` es CRUD puro, sin componentes UI

---

## 6. Riesgos y mitigaciones

| Riesgo | Descripción | Mitigación |
|--------|---|---|
| **Imports de store en UI** | T4View, T5, T6 importan `useT4Store` directamente | ESLint `no-restricted-imports`: solo servicios accesibles desde Shared Kernel |
| **Schema T6 en T4** | AIActClassificationModal.tsx importa schemas de T6 | Documentar que T6 schemas son agnósticas; revisar si hay acoplamiento implícito |
| **Tipado de UseCase en T6** | T6 depende de tipo `UseCase` de T4 | Aceptable: T4 tipos son públicos y estables. Considerar exportar desde Shared Kernel index. |
| **Constants AI_CATEGORY_CONFIG en T3** | ImportFromT3Modal.tsx importa constantes hardcodeadas de T3 | Fase 5 (eliminación de literales AI): reemplazar por lookup a dominio |

---

## 7. Pasos siguientes (Fase 2)

1. **Crear módulo Shared Kernel:**
   - `src/shared/t4-kernel/index.ts` → re-exporta `t4.service.ts`
   - Actualizar `src/modules/T4_UseCasePriorityBoard/index.ts` para consumir desde kernel

2. **Actualizar ESLint:**
   - `no-restricted-imports` regla: solo servicios desde kernel; componentes UI locales a T4

3. **Verificar tests:**
   - `npm test` → asegurar que 3 tests de caracterización pasan

4. **CI verificación:**
   - `tsc --noEmit` → sin errores
   - Imports from T4 resuelven correctamente desde T5, T6, T7

---

**Versión:** 1.0.0  
**Realizado por:** Claude Code (diagnóstico automático)  
**Dependencias:** ADR-029 Fase 1 completada ✅
