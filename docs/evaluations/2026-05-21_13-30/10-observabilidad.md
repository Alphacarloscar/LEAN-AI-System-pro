# Área 10 — Observabilidad   🔴

**Puntuación:** 2/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

Cero instrumentación de observabilidad en producción. No hay error tracking, no hay analytics de uso, no hay logging centralizado. El ErrorBoundary captura crashes de renderizado pero solo hace `console.error` — los errores nunca llegan a ningún sistema. Si la app falla en producción con un cliente, Carlos no sabrá hasta que el cliente llame. Para un producto que se vende a enterprises, esto es incompatible con una propuesta seria.

## Hallazgos

### 🔴 Críticos

- **Sin error tracking**: No hay Sentry, Datadog, LogRocket ni equivalente. Los errores en producción son invisibles. El `ErrorBoundary` hace `console.error` pero ese log solo existe en el navegador del usuario afectado.

- **Sin analytics de producto**: No hay datos de uso real. No se sabe qué módulos T1-T12 usan más los consultores, cuánto tiempo pasan en cada herramienta, dónde abandonan el flujo. Para iterar el producto con datos reales — especialmente importante en la fase de validación con primeros clientes — esto es un gap crítico.

### 🟡 Mejorables

- **ErrorBoundary sin reporte externo**: El `ErrorBoundary` existe y captura correctamente los crashes, pero al no reportar a ningún servicio, su valor se limita a mostrar una UI de fallback al usuario.

- **console.error en stores como única telemetría**: Los stores usan `console.error('[T1Store] load:', err)` como mecanismo de logging. Esto es apropiado en desarrollo pero no escala a un entorno multi-cliente.

- **Sin performance monitoring**: No hay medición de tiempos de carga, de queries lentas a Supabase, ni de renders costosos. Con componentes como T4View (2.329 líneas), los problemas de performance solo se descubren por queja del usuario.

### 🟢 Correctos

- `ErrorBoundary` implementado y activo en el layout — al menos los crashes no dejan la app en blanco sin contexto.
- Los stores usan `console.error` contextualizado con prefijos `[T1Store]`, `[T2Store]` — fácilmente grep-ables en un sistema de logs si se añadiera uno.

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Error tracking (Sentry/similar) | ❌ No | Requerido para prod |
| Analytics de uso | ❌ No | Requerido para iterar |
| ErrorBoundary presente | ✅ Sí (1) | — |
| ErrorBoundary reporta externamente | ❌ No | Requerido |
| Performance monitoring | ❌ No | Recomendado |

## Recomendaciones priorizadas

### Prioridad 1 — Añadir Sentry (plan gratuito suficiente para la fase actual)

**Qué:** Instalar `@sentry/react` y configurarlo en `main.tsx`. Actualizar `ErrorBoundary` para reportar a Sentry.

**Por qué:** Sentry free tier cubre 5.000 errores/mes — más que suficiente para el volumen actual. Con esto, cada crash en producción aparece en el dashboard de Sentry con stack trace, usuario afectado y contexto.

**Cómo:**
```bash
npm install @sentry/react
```
```ts
// main.tsx
import * as Sentry from '@sentry/react'
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})
```
```ts
// ErrorBoundary.tsx
componentDidCatch(error: Error, info: ErrorInfo) {
  Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  console.error('[ErrorBoundary]', error)
}
```

**Plan Maestro:** Sin PR asignado — Sprint de observabilidad.

### Prioridad 2 — Añadir analytics básico de uso (PostHog free tier)

**Qué:** Instalar PostHog y añadir tracking de eventos de navegación entre módulos. El objetivo mínimo: saber qué módulos T1-T12 abre cada consultor y con qué frecuencia.

**Por qué:** Es el input de datos que permitirá decidir en qué módulos invertir más desarrollo. Sin esto, las decisiones de producto son intuición pura.

**Cómo:**
```bash
npm install posthog-js
```
Evento mínimo: `posthog.capture('module_opened', { module: 'T4', engagementId })` en cada route wrapper.

**Plan Maestro:** Sin PR asignado.

### Prioridad 3 — Enviar console.error de stores a Sentry en producción

**Qué:** Crear un wrapper de logging que en producción envíe los errores de los stores a Sentry:
```ts
// src/lib/logger.ts
export const logger = {
  error: (ctx: string, err: unknown) => {
    console.error(ctx, err)
    if (import.meta.env.PROD) Sentry.captureException(err, { extra: { ctx } })
  }
}
```

**Plan Maestro:** Incluido en Sprint de observabilidad.
