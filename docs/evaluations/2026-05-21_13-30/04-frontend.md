# Área 04 — Componentes Frontend   🟡

**Puntuación:** 6/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

El sistema de diseño está bien fundamentado (Tailwind tokens en tailwind.config.ts, paleta Obsidian Amber documentada, dark mode con clase). El bundle splitting en Vite es correcto. El problema principal es la concentración de lógica en ficheros View monolíticos y la ausencia de componentes compartidos para los patrones repetitivos que aparecen en todos los módulos.

## Hallazgos

### 🔴 Críticos

- **God-components generalizados**: 8 ficheros View superan las 600 líneas. T4View (2.329 l.) contiene lógica de presentación, lógica de estado, 8 sub-componentes y helpers de formateo. Es el caso extremo de un patrón que afecta a casi todos los módulos.

### 🟡 Mejorables

- **Biblioteca de componentes shared muy pequeña**: Solo 7 componentes en `src/shared/components/` para 12 módulos. No hay componentes reutilizables para patrones recurrentes visibles en los módulos: tablas de datos, paneles de score, badges de estado, cards de métricas. Cada módulo reimplementa sus propias variantes.

- **Sin lazy loading de módulos**: `App.tsx` importa todos los 12 TxView de forma estática. En un SPA de esta complejidad, el tiempo de carga inicial podría reducirse significativamente con `React.lazy` + `Suspense` en las rutas.

- **ErrorBoundary solo a nivel de AppLayout**: Un solo `<ErrorBoundary>` envuelve todo el contenido protegido. Si un módulo falla, toda la app se colapsa. El patrón correcto es un ErrorBoundary por módulo o por ruta.

- **`bg-white` hardcodeado detectado en T2**: El comentario en el store menciona `bg-white` explícito en el dropdown de unofficialTools. Viola la regla del design system de no hardcodear colores.

### 🟢 Correctos

- Sistema de tokens en `tailwind.config.ts`: paleta completa (warm-950 → warm-50, gold, silver), tipografía Inter, dark mode configurado.
- Manual chunk splitting en Vite: vendor, supabase, charts, ui, forms, state — correcto para caching por módulo.
- `sourcemap: true` en build de producción — facilita debugging.
- `ErrorBoundary` implementado (aunque con cobertura limitada).
- `chunkSizeWarningLimit: 600` configurado (Recharts es ~540KB — justified).

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Archivos View >600 líneas | 8 | Objetivo 0 |
| Componentes shared | 7 | Objetivo >20 |
| Bundle dist total | 4.5 MB | — |
| Lazy loading de rutas | ❌ No | Recomendado |
| ErrorBoundary por módulo | ❌ Solo 1 global | Recomendado >1 |
| Dark mode configurado | ✅ Sí | — |
| Tokens de diseño en tailwind.config | ✅ Completo | — |

## Recomendaciones priorizadas

### Prioridad 1 — Extraer componentes internos de T4View (y gradualmente del resto)

**Qué:** Crear `src/modules/T4_UseCasePriorityBoard/components/` y mover `ExecDashboard`, `QuarterlyRoadmap`, `PriorityMatrix`, `StatusBadge`, `CategoryBadge`, `T4ScoreBars`.

**Por qué:** T4 es el módulo de mayor riesgo por tamaño. Extraer sus sub-componentes también los hace candidatos a reutilización o testing independiente.

**Plan Maestro:** Sin PR asignado.

### Prioridad 2 — Añadir lazy loading en rutas

**Qué:** Convertir los imports estáticos de TxView a `React.lazy`:
```tsx
const T4View = React.lazy(() => import('@modules/T4_UseCasePriorityBoard'))
// en la ruta:
<Suspense fallback={<LoadingSpinner />}>
  <T4RouteView />
</Suspense>
```

**Por qué:** Reduce el bundle inicial cargado. Los módulos T1-T12 solo se descargan cuando el usuario navega a ellos.

**Plan Maestro:** Sin PR asignado — Sprint de performance.

### Prioridad 3 — ErrorBoundary por módulo/ruta

**Qué:** Envolver cada `<Route element={<TxRouteView />}>` con su propio `<ErrorBoundary>`.

**Por qué:** Un crash en T4 no debería colapsar T1, T2, el sidebar ni el header.

**Plan Maestro:** Sin PR asignado.
