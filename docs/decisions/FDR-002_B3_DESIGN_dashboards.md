# FDR-002 · Bloque 3 — Design Spec de dashboards derivados (read-only)

> Estado: **BORRADOR para revisión (Carlos + auditor GPT)**. No es código.
> Decisiones de gating (Carlos, 2026-06-26): dashboards **solo reflejan** (read-only,
> sin fórmulas nuevas) · datos parciales = **resumen global con aviso "parcial"** +
> estado por tool debajo.

## 0. Principios de diseño (no negociables en B3)

1. **Read-only.** El dashboard NO calcula nada nuevo. Reusa los campos/scores que cada
   tool YA computa y persiste. Si un número no existe ya en un store/servicio, NO se
   muestra (se marca "sin dato"), no se inventa.
2. **ADR-011.** Sin imports directos de Supabase en la vista. Lectura de stores Zustand
   ya hidratados (vía `ensureLoaded` del propio dashboard) y/o `src/services/*` existentes.
3. **ADR-013.** `PackageDashboardView` ≤ 400 líneas. Si crece, extraer una tarjeta por tool
   a `modules/Packages/cards/`.
4. **Cero acoplamiento nuevo entre tools.** El dashboard lee, no orquesta lógica de negocio.

## 1. Modelo de estado por tool (común a los 3 dashboards)

Cada tool del paquete se pinta como una **tarjeta** con uno de 4 estados, derivados de
señales que YA existen en su store:

| Estado     | Señal de origen (ejemplos reales)                          | Render |
|------------|------------------------------------------------------------|--------|
| `error`    | `loadError` / `persistenceError` ≠ null                    | aviso rojo, sin métrica |
| `loading`  | `isLoading === true` y aún sin datos                       | spinner pequeño |
| `empty`    | `hasData === false` / array vacío / `isLoaded === false`   | "Sin datos — abrir tool" |
| `loaded`   | hay datos                                                  | métrica read-only + enlace |

El **resumen global** del paquete = agregación de cuántas tarjetas están en cada estado
(ej. "3 de 4 con datos · 1 pendiente"). Si alguna tool no está `loaded`, el header muestra
el **badge "Parcial"**. Mitiga el riesgo #4 de GPT (resumen leído como completo): el aviso
"parcial" es explícito y el detalle por tool está siempre debajo.

---

## 2. Dashboard `ai-maturity` (T1, T2, T7, T8)

**Dolor:** "No sé dónde estamos ni por dónde empezar sin abrumar a la organización."

| Tool | Fuente lectura | Métrica read-only (campo existente) | Estado vacío |
|------|----------------|-------------------------------------|--------------|
| T1   | `useT1Store` (`hasData`, `interviewees`, `dimensionStates`) · `t1.service.ts` | nº entrevistas + nº dimensiones evaluadas | `hasData=false` → "Sin diagnóstico" |
| T2   | `useT2Store` (`stakeholders[]`) · `t2.service.ts` | nº stakeholders mapeados | array vacío |
| T7   | `useT7Store` (`generatedPlan`, `persistenceStatus`) · `t7.service.ts` | "Plan de adopción generado / no generado" | `generatedPlan=null` |
| T8   | `useT8Store` (`generatedContent`) · `t8.service.ts` | "Plan de comunicación generado / no generado" | `generatedContent=null` |

Resumen global: "Madurez evaluada en N dimensiones · M stakeholders · planes adopción/comms [estado]".
**Sin score nuevo de madurez agregada** — T1 ya tiene su radar; el dashboard solo dice si existe y enlaza.

---

## 3. Dashboard `ai-compliance` (T6)  — CORREGIDO tras evidencia de código

**Dolor:** "No sé si nuestro uso de IA cumple ni qué riesgos de gobierno tengo abiertos."

> **Hallazgos de auditoría (GPT BLOQUEÓ; verificado en código por Claude):**
> 1. `AIActRiskSummary` **NO está en `useT6Store`**. Se calcula en un `useMemo` dentro de
>    `RiskDashboardTab.tsx:98-113`, y **deriva de T4** (`useT4Store().useCases`), no de los
>    `controls` de T6. → No reutilizable sin extraer; replicarlo = fórmula nueva.
> 2. La métrica "X controles implementados / Y en progreso" **no existe hoy** (grep de
>    recuento por status = vacío). Proponerla era un supuesto inventado de Claude → retirado.
> 3. `useT6Store.controls[]` **sí** está persistido → contarlo por `status` es agregación
>    read-only aceptable (avalado por GPT), additivo, sin tocar T6.

**Decisión Carlos (2026-06-26): EXTRAER el selector AI Act ahora** (incluir el resumen
en v1, aun rompiendo la pureza additiva de FDR-002).

| Bloque | Fuente | Coste | Métrica read-only |
|--------|--------|-------|-------------------|
| Cumplimiento ISO 42001 | `useT6Store.controls[]` (`status ∈ {no_iniciado, en_progreso, implementado}`) | additivo | recuento por estado sobre total de controles |
| Riesgo AI Act | selector extraído `selectAIActRiskSummary(useCases)` (ver §4bis) | **refactor T6** | `byLevel`, `classified`, `coveragePercent` |
| Política IA | `useT6Store.generatedPolicy` | additivo | "Política generada / pendiente" |

> Nota arquitectónica: el "riesgo de compliance" es en realidad una vista **derivada de T4**
> surfaced dentro de T6. El selector vivirá donde GPT determine su home canónico (módulo T6
> o T4); el dashboard de paquete solo lo consume.

---

## 4. Dashboard `ai-portfolio` (T3, T4, T5 + derivadas T9, T11)

**Dolor:** "Tengo muchas ideas de IA pero no sé cuáles priorizar, qué valor dan ni cómo
mantener el ritmo."

**Hallazgo clave:** 3 fuentes independientes (T3, T4, T5) + 2 derivadas (T9←T4, T11←T1).

| Tool | Fuente | Métrica read-only | Nota |
|------|--------|-------------------|------|
| T3 | `useT3Store` (`processes[]`, `hasData`) · `t3.service.ts` | nº procesos mapeados | independiente |
| T4 | `useT4Store` (`useCases[]`, `isLoaded`) · `t4.service.ts` | nº casos de uso + nº priorizados ("go") | independiente; corazón del paquete |
| T5 | `useT5Store` (`canvas`) · `t5.service.ts` | nº dominios/casos en taxonomía | independiente |
| T9 | `useT9Store` (`overrides`, `freeItems`) + deriva de T4 | "Roadmap construido / no" = ¿hay items "go" en T4 **o** freeItems? | **derivada — sin service** |
| T11 | computado en `engine.ts` desde T1 + CompanyProfile | "Modelo operativo disponible" = ¿`hasT1Data` + perfil? | **derivada — sin service ni store de datos** |

Resumen global: "N procesos · M casos de uso (K priorizados) · roadmap [estado] · ritmo [estado]".

> **Decisión a confirmar con GPT (técnica, su lane):** T9/T11 no tienen `service` ni dataset
> propio. Dos opciones para la tarjeta:
> - **(A)** Tratar su estado como *derivado* ("Roadmap disponible si T4 tiene casos go") — refleja
>   la arquitectura real, no inventa un dato de completitud que no existe.
> - **(B)** Omitir T9/T11 del resumen numérico y mostrarlos solo como enlaces de navegación.
>
> Mi recomendación (orquestador): **(A)**, porque el comprador en demo entiende mejor "tu
> roadmap ya sale de tus casos priorizados" que un hueco. Pero **es competencia de GPT validar**
> que leer `useT4Store` desde la tarjeta de T9 no crea un acoplamiento que él rechace.

---

## 4bis. Patrón de selectores (convergencia con GPT — obligatorio en B3)

Los componentes de dashboard **solo renderizan**. Toda lectura de stores ajenos y toda
agregación vive en selectores puros. Cero `useT4Store(...)` en el JSX de un dashboard.

- `src/modules/Packages/selectors/aiPortfolioDashboard.selectors.ts` — estado de tarjeta
  T3/T4/T5 (independientes) + T9/T11 (derivadas) + estado global parcial/completo/vacío/error.
- `selectAIActRiskSummary(useCases)` — **extraído** del `useMemo` de `RiskDashboardTab.tsx`
  a fuente compartida pura, consumido por T6View **y** por el dashboard `ai-compliance`.
  Refactor: `RiskDashboardTab` pasa a llamar al selector en vez de calcular inline.
- `selectControlStatusCounts(controls)` — recuento ISO por status (additivo, lee store T6).

Estados cualitativos para derivadas (sin inventar %): `available | partial | empty | loading | error`.
Regla de estado global: si una o más tools están vacías/pendientes → badge **"Parcial"**,
aunque otra esté `loaded`. Nunca "completo" si solo T4 deriva T9 pero T11 no tiene base.

### 4ter. Estado de implementación ai-portfolio (corrección sobre el borrador)

Implementado: `Packages/selectors/aiPortfolioDashboard.selectors.ts` (puro) +
`Packages/hooks/useAiPortfolioDashboard.ts` (adaptador). Typecheck limpio.

Corrección al borrador: T5 y T11 **sí tienen señal fiable** — no hizo falta heurística
inventada. Se usa el marker de persistencia que los propios stores ya usan:
`T5.canvas.id !== ''` (idéntico al check de `loadCanvas`) y `CompanyProfile.savedAt !== null`.
`isDemoEnabled=false` → sin falsos positivos de demo. T9 sigue derivada (casos GO de T4 +
freeItems), pero recibe `t4GoCount` ya calculado por el adaptador (no lee `useT4Store`).

### 4quater. Estrategia de carga — RESUELTA (GPT APROBADO CON CAMBIOS + síntesis Claude)

**Decisión: B híbrida** — cache-first + `ensureLoaded` secuencial + render progresivo.
No A (entry point frío mostraría "sin datos" falso), no C (burst de 5 fetch que
`ProjectRuntimeProvider` desactivó). Sin botón manual en Fase 1.

**Regla de oro (no negociable):** un store frío antes de que su carga termine es
`loading`, **nunca `empty`**. `empty` solo tras `settled` + sin datos + sin error.

**Divergencia que Claude verificó en código (GPT asumió mal):** GPT dio por hecho
`ensureLoaded(pid,{reason})` uniforme en las 5 fuentes. Era falso: T5 solo tenía `load`
crudo, CompanyProfile solo `loadProfile`, y T4 no exponía `loadError`. Decisión de Carlos
(2026-06-27): **máxima robustez** → se añadió `ensureLoaded` (dedup + stale-guard, patrón
de T1/T3) a T5 y CompanyProfile, y `loadError` a T4. 3 stores tocados, espejando patrón ya
validado. Typecheck limpio (solo 3 errores ambientales @sentry, ajenos).

**Contrato de carga implementado:**
- Loader separado del adaptador (lane GPT): `Packages/hooks/useAiPortfolioDashboardLoader.ts`
  orquesta `ensureLoaded` SECUENCIAL en orden **CompanyProfile → T4 → T3 → T5 → T1**
  (hero con fuentes tempranas; T1 último porque solo alimenta la derivada T11).
- Expone `loadPhase: Record<fuente,'pending'|'loading'|'settled'>`.
- Fallo de una fuente NO aborta la cadena (try/catch + reportError, se marca settled igual).
  La card refleja error vía `loadError` de su store.
- Respeta stale-guard, sin force, `reason:'package_dashboard_mount'`.
- Adaptador `useAiPortfolioDashboard(phases)` deriva `settled` por card (T9←T4;
  T11←T1∧CompanyProfile) y lo pasa a los selectores puros (input `settled` nuevo, aditivo).
- Estado global: Cargando / Parcial / Completo / Sin datos / Error parcial (selectPortfolioGlobal).

**Límite conocido (autocrítica):** CompanyProfile no expone canal de error de carga
(`loadProfile` traga el error, solo tiene `saveError`). Un fallo de carga de perfil degrada
a "Falta perfil" (empty), no a error. No se fabricó señal inventada. T11 solo hereda error
de T1. Si se quiere distinguir, sería un `loadError` en CompanyProfile (fuera de scope B3).

**Pendiente:** render `PackageDashboardView` (cards + badge Parcial + skeletons + hero) —
lane UX/Gemini, requiere validación de Carlos en mockup antes de cablear el JSX.

## 5. Qué NO entra en B3 (límites explícitos)

- Ninguna métrica que requiera cruzar tools (ej. "riesgo ponderado por valor de caso"). Eso
  sería fórmula nueva → fuera.
- T12 (standalone) no tiene dashboard de paquete. T10 ES el dashboard global, no se toca.
- Persistencia: los dashboards no escriben nada. Solo `ensureLoaded` (lectura).

## 6. Autocrítica

- **Supuesto sin validar:** que `coveragePercent` y `AIActRiskSummary` se exponen ya listos
  desde el store de T6 y no se recalculan en su View. Vi el `interface` en `types.ts`; **no
  confirmé** que el store los *persista* vs. los derive en render. Si los deriva en la View de
  T6, el dashboard tendría que replicar ese cálculo → rozaría "fórmula nueva". **A verificar
  antes de codificar.**
- **Riesgo de UX:** 4-5 tarjetas + resumen puede reintroducir sensación "Ferrari" que el pivote
  quiere matar. Mitigación: resumen en 1 frase arriba, tarjetas compactas (1 número + 1 enlace),
  no tablas. Pero esto es **lane de Gemini** (¿reduce o aumenta el abrumo en demo?) y debe
  validarlo Carlos en mockup, no yo.
- **n bajo:** sigo sin evidencia de que un dashboard agregado mueva la conversión de demo; es
  hipótesis derivada del feedback "Ferrari", no dato medido.
- **Qué haría un escéptico:** "estáis añadiendo una capa más para tapar que las tools individuales
  abruman; el dashboard es otra pantalla que rellenar". Contraargumento solo válido si el dashboard
  es 100% read-only (no pide input) — por eso el principio #1 es no negociable.

---

## 7. Render — decisión y construcción (2026-06-27)

**Convergencia a tres bandas** (sin divergencia a escalar):
- **GPT** (técnico): hero, mismo look&feel que T10, loader/adapter separados.
- **Gemini** (mercado/UX): "no aprobaría 5 tarjetas al mismo nivel". Hero ejecutivo +
  2-3 señales tempranas + bloque secundario subordinado. Hero de fuentes tempranas
  (CompanyProfile, T4, T3 — NO T1/T11). T11 abajo como "Cadencia recomendada de seguimiento".
  Estados honestos, nunca ceros falsos. Copy neutral CompanyProfile.
- **Claude** (ventas/gobierno): hero ataca P4 (abrumo) directamente — lo primero que ve
  el comprador es síntesis, no 12 tools.

**Decisión de Carlos (vía AskUserQuestion):** "Mockup en la propia app" — se cabla el JSX real
sobre el loader/selectors/adapter ya construidos, bajo `VITE_PACKAGE_NAV_ENABLED` (off por
defecto), tratado como mockup interno editable hasta validación.

**Construido:**
- `src/modules/Packages/AiPortfolioDashboard.tsx` — render: (1) hero ejecutivo [contexto empresa
  + resumen global 1 línea + badge estado], (2) señales tempranas T4/T3, (3) evidencia
  metodológica subordinada [T3,T4,T5,T9], (4) cadencia T11 inferior. Skeletons en 'loading';
  copy CompanyProfile neutral ("Contexto de empresa pendiente").
- `PackageDashboardView.tsx` — delega en `AiPortfolioDashboard` solo para `ai-portfolio`;
  resto de paquetes mantiene la ficha de Bloque 2.

**Tests:** `src/__tests__/unit/Packages/aiPortfolioDashboard.selectors.test.ts` — 26 casos,
26 verde. Prioridad Gemini cubierta: regla de oro (settled vs empty), error real, derivadas
T9←T4 y T11←T1+perfil, agregador global.

**Bug capturado por test (corregido):** `selectPortfolioGlobal` devolvía `partial` para el caso
"todo vacío" — la rama `partial` (`loading>0 || empty>0`) interceptaba el all-empty, dejando el
estado `empty` **inalcanzable**. Contrato documentado: `empty = todas resueltas, ninguna con
datos`. Corregido con rama explícita `loaded===0 && loading===0 → empty` antes de `partial`.
Lección: el test de agregación pagó su coste de inmediato.

**Deuda registrada:** DEBT-022 (CompanyProfile sin `loadError` → fallo de carga indistinguible
de perfil vacío; T11 hereda la ceguera). Mitigado con copy neutral; fix pendiente en PR separado.

**Pendiente antes de cerrar B3 como estable:**
- QA en navegador (checklist Gemini, 10 pasos) con flag on/off — lo valida Carlos.
- Verificar que ninguna View que use `load`/`loadProfile` se rompe (typecheck a 0 errores ya da
  garantía de tipos; falta la verificación de comportamiento en navegador).

---

## §8 — Regla de ownership de métricas (Veredicto A, cerrado con GPT + Gemini)

**Decisión firme (Carlos, "frontera dura A"):** la capa `Packages` **no crea métricas de
negocio**. Solo orquesta y presenta. Toda métrica de negocio vive como **selector puro en el
módulo dueño del dato fuente**, y `Packages` la consume.

- Dato vive en T4 → selector vive en T4. Dato combina T1+CompanyProfile → engine/selector
  compartido fuera de `Packages`, con ownership explícito. `Packages` solo consume.
- `Packages` **sí** puede: ordenar tarjetas; estado UI (loading/empty/error/loaded/parcial);
  jerarquía visual (hero/señal/detalle); agrupar resultados ya calculados. Eso es orquestación
  de presentación, no fórmula.
- `Packages` **no** puede inventar: Portfolio Score, % completitud, índice de madurez, ROI
  agregado, riesgo agregado, ranking — salvo que exista en la tool fuente o se extraiga antes a
  un selector propietario.
- **Motivo comercial (innegociable):** vendemos gobierno y claridad a CIO/COO. Ante "¿de dónde
  sale este número?" → "de esta tool fuente y este cálculo compartido", nunca "lo calcula el
  dashboard para la demo".

**Aplicado en este PR (convergencia Claude+GPT+Gemini):**
- Nuevo `src/modules/T4_UseCasePriorityBoard/selectors/portfolio.selectors.ts`:
  `selectT4PortfolioMetrics` (métricas de portfolio, copia byte-a-byte de la lógica que
  `T10View.liveT4` tenía inline → invariancia de render), `selectGoUseCases` / `selectGoUseCaseCount`
  (señal GO atómica, separada para que T9 la consuma sin arrastrar ROI).
- Type `T4PortfolioMetrics` movido a `T4/types.ts` (propiedad de T4).
- `T10View` refactorizado para **consumir** el selector (elimina la doble fuente inline; mismo PR,
  por recomendación de GPT: no dejar la copia viva).
- `Packages/aiPortfolioDashboard.selectors.ts` (`selectT4Card`) ahora consume
  `selectGoUseCaseCount` en lugar del `filter(status==='go')` inline que **violaba A**.
- Tests: `src/__tests__/unit/T4/portfolio.selectors.test.ts` (8 casos, verde). Suite completa
  567/567 verde. Typecheck 0 errores.

**Hallazgo colateral → DEBT-023:** la lógica extraída nunca usó el canónico
`computeROIFromEconomics`; hay dos fórmulas ROI paralelas (agregada vs. per-caso). Unificar
cambia números que T10 enseña hoy → decisión de producto aparte, no resuelta en este PR.

**Norma para futuros dashboards de paquete (ai-maturity, ai-compliance):** antes de pintar una
métrica, localizar/crear su selector en la tool dueña. Si el patrón se repite en ≥2 dashboards
más, promover esta regla a ADR (candidato: ADR-015 "Ownership de métricas y selectores derivados").
