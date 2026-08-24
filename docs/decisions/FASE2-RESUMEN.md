# ADR-029 Fase 2 — Shared Kernel T4 — COMPLETADO ✅

**Fecha:** 2026-08-24  
**Estado:** ✅ Implementado y validado  
**Branch:** `feat/adr029-fase2-shared-kernel`

---

## Objetivo (ADR-029 §4)

Extraer T4 como módulo con interfaz pública explícita, consumible por Paquete 2 (T5) y Paquete 3 (T6) sin acoplamiento directo al store UI.

**Problema pre-Fase 2:** T5, T6, T7 importaban `useT4Store` directamente, violando ADR-011 (separación de capas).

---

## Implementación

### PASO A — Diagnóstico de uso real

Mapeé exactamente qué datos/acciones usan los 6 consumidores:

**Hallazgo clave:** Todos necesitan reactividad (no pueden usar `t4.service.ts` directo).

Consumo consolidado:
- **6 consumidores** usan `useCases: UseCase[]` (datos reactivos)
- **2 consumidores** (T6View, T7View) usan `ensureLoaded` (acción de carga)
- **1 consumidor** (T6View) usa `isLoading`, `isLoaded` (estado UI)

**Documento:** `FASE2-PASO-A-USO-STORE.md` (273 líneas)

---

### PASO B — Decisión de interfaz pública

**Solución:** Opción (a) — crear hook público `useT4Kernel()`.

Razones:
- ✅ Encapsula acceso al store interno
- ✅ Proporciona interfaz tipada y clara
- ✅ Permite prohibir imports de `useT4Store` vía ESLint
- ✅ Cumple ADR-011 (separación de capas)

---

### PASO C — Implementación (5 sub-pasos)

#### C.1 — Crear `index.public.ts`

**Archivo:** `src/modules/T4_UseCasePriorityBoard/index.public.ts` (40 líneas)

```typescript
// Hook público — única interfaz que T5, T6, T7 pueden usar
export function useT4Kernel() {
  const useCases = useT4Store(state => state.useCases)
  const isLoading = useT4Store(state => state.isLoading)
  const isLoaded = useT4Store(state => state.isLoaded)
  const ensureLoaded = useT4Store(state => state.ensureLoaded)
  return { useCases, isLoading, isLoaded, ensureLoaded }
}

// Tipos públicos
export type { AIActRiskLevel }
```

**Restricciones aplicadas:**
- ❌ NO exporta `useT4Store`
- ❌ NO exporta componentes UI
- ✅ Index.ts existente SIN CAMBIOS (uso interno de T4)

#### C.2 — Actualizar 6 consumidores

| Archivo | Cambio | Status |
|---------|--------|--------|
| **T5/DeptCategoryModal.tsx** | `useT4Store()` → `useT4Kernel()` | ✅ |
| **T5/DomainProjectsModal.tsx** | `useT4Store()` → `useT4Kernel()` | ✅ |
| **T6/PolicyTab.tsx** | `useT4Store()` → `useT4Kernel()` | ✅ |
| **T6/RiskDashboardTab.tsx** | `useT4Store()` → `useT4Kernel()` | ✅ |
| **T6/T6View.tsx** | `useT4Store()` → `useT4Kernel()` | ✅ |
| **T7/T7View.tsx** | `useT4Store()` → `useT4Kernel()` | ✅ |

**Patrón de cambio:**
```typescript
// ANTES
const { useCases } = useT4Store()
const useCases = useT4Store(s => s.useCases)

// DESPUÉS
const { useCases } = useT4Kernel()
const { useCases, ensureLoaded: ensureLoadedT4 } = useT4Kernel()
```

#### C.3 — Configurar ESLint

**Archivo:** `eslint.config.js`

Añadí nueva regla `no-restricted-imports`:

```javascript
{
  files: ['src/**/*.{ts,tsx}'],
  ignores: [
    'src/modules/T4_UseCasePriorityBoard/**',
    'src/__tests__/**',
  ],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/modules/T4_UseCasePriorityBoard'],
          importNames: ['useT4Store'],
          message: 'ADR-029: useT4Store es privado a T4. Usar useT4Kernel desde index.public.',
        },
      ],
    }],
  },
}
```

**Efecto:** Cualquier import de `useT4Store` fuera de T4 genera error.

#### C.4 — Verificar typecheck

```bash
npx tsc --noEmit
```

**Resultado:** ✅ Sin errores de tipo.

#### C.5 — Ejecutar tests

```bash
npm run test
```

**Resultado:**
```
Test Files  47 passed (47)
Tests  718 passed | 3 todo (721)
```

✅ CI verde.

---

## Cambios resumidos

| Componente | Cambios | Líneas |
|---|---|---|
| Archivos nuevos | `index.public.ts` | +40 |
| Archivos modificados | 6 consumidores + ESLint config | ~30 lines/file |
| Tests | Sin regresión | 718 passed |
| Typecheck | Sin errores | ✅ |

---

## Verificación de criterios (ADR-029 §4)

| Criterio | Estado | Verificación |
|----------|--------|---|
| T4 importable desde Paquete 2 y 3 | ✅ | T5, T6 usan `useT4Kernel()` sin ciclos |
| Sin imports cruzados entre paquetes | ✅ | T5 ↔ T6 no se importan; ambos usan T4 kernel |
| ESLint `no-restricted-imports` actualizado | ✅ | Rule en eslint.config.js prohibe `useT4Store` fuera de T4 |
| Tests de caracterización de T4 en verde | ✅ | 718 tests passed (incluye T4 aiact, roi, scoring) |
| `tsc --noEmit` en verde | ✅ | Sin errores de tipo |

---

## Impacto en arquitectura

### Antes (violaba ADR-011)
```
T5, T6, T7
    ↓ (import useT4Store)
T4 store (privado)
```

### Después (cumple ADR-011 + ADR-029)
```
T5, T6, T7
    ↓ (import useT4Kernel from index.public)
T4 Shared Kernel Public Interface
    ↓
T4 store (privado)
```

**Resultado:** 
- ✅ Dependencia unidireccional clara
- ✅ Interfaz pública explícita
- ✅ Store privado protegido por ESLint

---

## Documentos generados

1. **FASE2-T4-DIAGNOSTICO.md** (223 líneas)
   - Estructura de T4, interfaz pública, consumidores, circularidad

2. **FASE2-PASO-A-USO-STORE.md** (273 líneas)
   - Diagnóstico de uso real en 6 consumidores
   - Patrones observados, conclusiones

3. **FASE2-RESUMEN.md** (este documento)
   - Implementación completa, verificación

---

## Estado para Fase 3

T4 está listo como Shared Kernel. Próxima Fase 3:

**Fase 3 — Paquetes en navegación y permisos**
- Objetivo: que sidebar y `usePermissions` reflejen `contracted_packages` del proyecto
- Dependencias: Fase 1 ✅, Fase 2 ✅
- Módulos: sidebar, usePermissions hook, Zustand store

---

**Rama:** `feat/adr029-fase2-shared-kernel` (pusheada, lista para PR)  
**Próximo paso:** Fase 3 (navegación y permisos) ← Carlos puede decidir si continuar

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
