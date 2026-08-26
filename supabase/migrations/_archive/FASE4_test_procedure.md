# FASE 4 — Procedimiento de test controlado post-deploy

**Objetivo:** Determinar si el problema es (A) deploy antiguo, (B) índices faltantes, o (C) bug frontend.

---

## Prerequisitos

- [ ] FASE 1 desplegada en Vercel (commit con buildInfo + logBuildInfo)
- [ ] FASE 2 ejecutada en Supabase → resultado compartido con Claude
- [ ] FASE 3 ejecutada si faltan índices

---

## Paso 1 — Verificar versión desplegada

1. Abrir staging en Chrome → F12 → Console
2. Buscar la línea amarilla `[GOBY] v...`
3. Expandir el grupo → verificar:
   - `Git commit` coincide con el último commit en `main` (debe ser `7dd3129` o posterior)
   - `Build time` es reciente (hoy)
   - `Vercel env` es `preview` o `production`, no `(local/unknown)`
   - `Supabase host` muestra el hostname correcto (no vacío)

**Si el git commit NO coincide:** el deploy no está actualizado → esperar a que Vercel termine el build o forzar redeploy.

---

## Paso 2 — Capturar logs de carga de T3

1. Abrir DevTools → Console → activar filtro `[T3]` o `[LEAN]`
2. Navegar a T3 (Value Stream Map)
3. Verificar que aparece: `→ [T3] load started` seguido de `✓ [T3] load completed`
4. Anotar `durationMs` — debe ser < 2000ms si los índices están creados

**Si durationMs > 5000ms o aparece `✗ [T3] load error`:** el problema es de infraestructura DB, no frontend.

---

## Paso 3 — Test de tab-switch (el escenario que falla)

1. Navegar a T3 → esperar que cargue (estado: datos visibles)
2. Cambiar a otra pestaña del navegador → esperar **30 segundos**
3. Volver a la pestaña de GOBY
4. En Console, buscar: `[ProjectRuntimeProvider] visibility_change`
5. Verificar que T3 NO queda en blanco:
   - Si `durationMs` < STALE_MS (5min): debe mostrar datos cached, sin re-fetch → **correcto**
   - Si data es > 5min: re-fetcha en background, UI muestra datos previos mientras carga → **correcto**
   - Si pantalla queda en blanco: `loadError` no se está capturando → bug pendiente

---

## Paso 4 — Test de cambio de proyecto

1. Seleccionar "Proyecto Demo Carlos" → navegar a T3 → esperar carga
2. Cambiar a "Testing Oscar 2.0" → navegar a T3
3. Verificar en Console:
   - Aparece `[GOBY] activeProjectId →` con el nuevo ID
   - T3 limpia sus datos y re-fetcha del proyecto nuevo
   - KPIs muestran `—` durante la carga (no `0`)
4. Si los datos del proyecto anterior persisten → bug en `resetAllEngagementStores`

---

## Paso 5 — Verificar estado de error visible

1. Desconectar internet (Network tab → Offline) o esperar que un fetch falle
2. Navegar a T3
3. Verificar que aparece el banner de error con botón "Reintentar"
4. Reconectar → pulsar "Reintentar" → verificar que carga correctamente

---

## Clasificación de resultados

| Síntoma observado | Diagnóstico | Acción |
|---|---|---|
| Git commit incorrecto en console | Deploy desactualizado | Forzar redeploy en Vercel |
| durationMs > 8000ms en T3 | Índices faltantes | Ejecutar FASE 3 |
| Pantalla en blanco tras tab-switch | Bug en error state | Reportar a Claude con screenshot + console |
| KPIs muestran `0` durante carga | `hasData` flag incorrecto | Reportar a Claude |
| Datos de proyecto anterior visibles | reset no ejecutado | Reportar a Claude |
| Todo correcto en staging, falla en prod | Variables de entorno distintas | Verificar VITE_SUPABASE_URL en prod |
