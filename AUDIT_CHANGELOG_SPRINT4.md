# AUDIT CHANGELOG — Sprint 4
## L.E.A.N. AI System — Alpha Consulting Solutions

> **Protocolo:** Cada entrada registra: ID de ítem del audit, archivo modificado, líneas afectadas, motivo del cambio, resultado de compilación (`tsc --noEmit`), y estado.
> **Referencia de severidad:** 🔴 Bloqueante · 🟠 Importante · 🟡 Cosmético

---

## BLOQUE A — Bloqueantes de demo

---

### ✅ V-01 | Logo placeholder visible en demo
**Fecha:** 2026-05-01
**Severidad:** 🔴 Bloqueante

**Problema:** `LogoSlot` en `AppLayout.tsx` mostraba un placeholder con borde dashed y texto "Logo Alpha" / "Logo Cliente" visible en todas las pantallas autenticadas (T1–T9, Dashboard). Indica producto inacabado al primer vistazo del cliente.

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/shared/layouts/AppLayout.tsx` | Eliminado `LogoSlot` inline. Añadido import de `AlphaLogo` compartido. Reemplazado `<LogoSlot alt="Logo Alpha">` por `<AlphaLogo dark={dark} />`. Reemplazado `<LogoSlot alt="Logo Cliente">` por `<ClientLogoSlot dark={dark} />`. |
| `src/shared/components/AlphaLogo.tsx` | **NUEVO** — Componente compartido con props `size` ('sm'|'lg') y `dark`. Símbolo α SVG en cuadrado navy + wordmark. Instrucción de swap a archivo real documentada en comentario. |

**Resultado compilación:** ✅ 0 errores TypeScript
**Resultado visual:** Header muestra wordmark Alpha (cuadrado navy 26px + "Alpha / CONSULTING"). Slot cliente: área filled sutil sin aspecto de borrador.

---

### ✅ V-01b | Logo Alpha Consulting en pantalla de login + coherencia ecosistema
**Fecha:** 2026-05-01
**Severidad:** 🔴 Bloqueante

**Problema:**
1. `LoginView.tsx` tenía `LeanLogo()` con `α` en texto plano (`<span>`) en cuadrado con `bg-[#0D1B2A]` — color diferente al design system navy `#1B2A4E`. Sin consistencia visual con el resto del producto.
2. `ProtectedRoute` (spinner de carga) en `App.tsx` usaba `text-[#0D1B2A]` hardcodeado.
3. `LeanLogo` era un componente local no compartido — logo duplicado entre login y header, riesgo de divergencia futura.

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/shared/components/AlphaLogo.tsx` | Añadido modo `size="lg"`: cuadrado 48px, SVG α 26px, wordmark centrado con "Alpha Consulting Solutions", "L.E.A.N. AI System", "Enterprise Edition". Single source of truth para todo el ecosistema. |
| `src/modules/Auth/LoginView.tsx` | Eliminado `LeanLogo()` local. Añadido `import { AlphaLogo }`. Reemplazadas 2 instancias de `<LeanLogo />` por `<AlphaLogo size="lg" />` (login normal + recovery flow). |
| `src/App.tsx` | Spinner de `ProtectedRoute`: `text-[#0D1B2A]` → `text-navy` (design system token). |

**Resultado compilación:** ✅ 0 errores TypeScript

**Cobertura de pantallas tras el cambio:**
| Pantalla | Logo presente | Implementación |
|----------|--------------|----------------|
| `/login` | ✅ Centrado, size lg | `AlphaLogo size="lg"` |
| `/` Dashboard | ✅ Top-left header | `AlphaLogo size="sm"` vía AppLayout |
| `/t1` – `/t9` | ✅ Top-left header | `AlphaLogo size="sm"` vía AppLayout |
| `/company-profile` | ✅ Top-left header | `AlphaLogo size="sm"` vía AppLayout |
| Loading state | ✅ Spinner navy coherente | `text-navy` token |

**Nota de mantenimiento:** Cuando se disponga del logo definitivo (SVG/PNG), cambiar únicamente `src/shared/components/AlphaLogo.tsx`. Las 11+ pantallas se actualizan automáticamente.

---

### ✅ V-01c | Logo AC oficial implementado como SVG fiel al original
**Fecha:** 2026-05-01
**Severidad:** 🔴 Bloqueante

**Problema:** Las iteraciones anteriores usaban una "α" artesanal que no correspondía al logo real de Alpha Consulting Solutions. El cliente aportó el logo oficial: monograma "AC" (A en primer plano, C en segundo plano con overlap) + texto "ALPHA CONSULTING" fino centrado. Versión clara (negro) y versión oscura (blanco).

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/shared/components/AlphaLogo.tsx` | Reemplazado completamente. Nuevo componente `ACMark` con SVG `viewBox="0 0 195 138"`. C pintado primero, A encima (overlap correcto). "ALPHA CONSULTING" a font-weight=300, letterSpacing=3.8. Color: `#0D0D0D` en claro, `#ffffff` en oscuro — coherente con las dos versiones del logo oficial. |

**Comportamiento por pantalla:**
| Pantalla | Tamaño | Color | Notas |
|----------|--------|-------|-------|
| Header (AppLayout) | 48×34px | `dark` prop recibida del hook `useDarkMode` | Se adapta automáticamente |
| Login | 176×124px | `dark=false` (pantalla light only) | + "L.E.A.N. AI System / Enterprise Edition" debajo |

**Resultado compilación:** ✅ 0 errores TypeScript

**Nota de swap:** Cuando se disponga del archivo SVG/PNG oficial, cambiar solo `AlphaLogo.tsx` — todas las pantallas se actualizan. Ver comentario al inicio del archivo.

---

### ✅ V-01c (rev2) | Logo AC — overlap corregido, fiel al original
**Fecha:** 2026-05-01
**Severidad:** 🔴 Bloqueante

**Problema:** Primera implementación SVG del logo tenía overlap superficial (C empezaba en x=72, overlap ≈ 17px). El logo oficial muestra la "A" entrando profundamente en la apertura de la "C" (overlap ≈ 50% del ancho de A).

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/shared/components/AlphaLogo.tsx` | viewBox ajustado a `"0 0 185 148"`. C: `x=53` (antes x=72). Overlap: 53px (antes ~17px). "ALPHA CONSULTING": `x=92 y=81 letterSpacing=2.8` (antes 3.8). |

**Resultado compilación:** ✅ 0 errores TypeScript

---

### ✅ U-01 | Hilo conductor metodológico en T1–T9 (PhaseMiniMap)
**Fecha:** 2026-05-01
**Severidad:** 🔴 Bloqueante para demo (sin él, el cliente no sabe en qué fase está)

**Problema:** Los headers de T1–T9 mostraban chips de texto inconsistentes ("Fase Listen · Semanas 1–3", "Fase E · Enable" [incorrecto], "Fase L · Listen" [incorrecto para T3], nada en T7/T8/T9). No había indicador visual de posición en la metodología L.E.A.N. de 6 fases.

**Solución:** Componente `PhaseMiniMap` con 6 nodos L–E–A–N–I–∞ conectados por líneas. Estado visual por posición:
- Activa → navy filled + glow
- Anteriores → navy/10 sutil (progreso completado)
- Siguientes → gris muy sutil

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/shared/components/PhaseMiniMap.tsx` | **NUEVO** — componente compartido. Props: `phaseId`, `toolCode`, `dark`. Estático, sin dependencias de contexto. |
| `src/modules/T1_MaturityRadar/T1View.tsx` | Import + chip "Fase Listen" → `<PhaseMiniMap phaseId="listen" toolCode="T1" />` |
| `src/modules/T2_StakeholderMatrix/T2View.tsx` | Import + chip "Fase Listen" → `<PhaseMiniMap phaseId="listen" toolCode="T2" />` |
| `src/modules/T3_ValueStreamMap/T3View.tsx` | Import + texto "Fase L · Listen" (incorrecto) → header refactorizado + `<PhaseMiniMap phaseId="listen" toolCode="T3" />` |
| `src/modules/T4_UseCasePriorityBoard/T4View.tsx` | Import + texto "Fase E · Enable" (incorrecto) → header refactorizado + `<PhaseMiniMap phaseId="evaluate" toolCode="T4" />` |
| `src/modules/T5_AITaxonomyCanvas/T5View.tsx` | Import + texto "Fase Evaluate" → `<PhaseMiniMap phaseId="evaluate" toolCode="T5" />` |
| `src/modules/T6_RiskGovernance/T6View.tsx` | Import + texto "Fase Evaluate" → `<PhaseMiniMap phaseId="evaluate" toolCode="T6" />` |
| `src/modules/T7_AdoptionHeatmap/T7View.tsx` | Import + fase ausente → `<PhaseMiniMap phaseId="activate" toolCode="T7" />` añadida |
| `src/modules/T8_CommunicationMap/T8View.tsx` | Import + fase ausente → `<PhaseMiniMap phaseId="activate" toolCode="T8" />` añadida |
| `src/modules/T9_AIRoadmap/T9View.tsx` | Import + fase ausente → header refactorizado + `<PhaseMiniMap phaseId="activate" toolCode="T9" />` |

**Bugs corregidos de paso:**
- T3: "Fase L · Listen" → correcto con PhaseMiniMap
- T4: "Fase E · Enable" → corregido a "evaluate"
- T7: "Fase L · Listen" (copiado de T1) → corregido a "activate"
- T8/T9: sin fase → ahora tienen indicador correcto

**Resultado compilación:** ✅ 0 errores TypeScript

---

---

### ✅ V-01c (rev3) | Logo AC incrustado como PNG oficial
**Fecha:** 2026-05-02
**Severidad:** 🔴 Bloqueante (resolución definitiva)

**Problema:** SVG text descartado por inconsistencias de font rendering entre browsers (Inter no garantizado, métricas de C/A variables). El logo oficial AC existe como PNG en dos tonalidades.

**Solución:** Incrustar los PNG originales del cliente directamente mediante `<img>` tag.

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `public/logos/logo-alpha-dark.png` | **NUEVO** — Logo AC blanco sobre negro (para dark mode) |
| `public/logos/logo-alpha-light.png` | **NUEVO** — Logo AC negro sobre blanco (para light mode) |
| `src/shared/components/AlphaLogo.tsx` | Eliminado `ACMark` SVG. Nuevo componente usa `<img src={dark ? '/logos/logo-alpha-dark.png' : '/logos/logo-alpha-light.png'}>`. size sm: 48px width. size lg: 160px width + product name. |

**Resultado compilación:** ✅ 0 errores TypeScript
**Nota de swap:** Para actualizar el logo en el futuro: reemplazar solo los PNG en `public/logos/`. Todas las pantallas se actualizan automáticamente.

---

### ✅ V-02 | Dark mode T7 — colores adaptativos
**Fecha:** 2026-05-02
**Severidad:** 🟠 Importante

**Problema:** T7View.tsx tenía múltiples colores hardcoded light-only:
1. `SEG_LABELS` bg: `#EFF6FF`, `#F0FDF4`, `#FEFCE8`, `#FFF7ED`, `#F9FAFB` — manchas claras en dark mode sobre SVG oscuro
2. Bell curve fill: `rgba(255,255,255,0.5)` — overlay blanco visible en dark
3. Divisores + baseline: `#CBD5E1` — muy claro en dark
4. `Dirección General` fill `#0D1B2A` — invisible sobre fondos oscuros
5. Arrow SVG con `stroke="#0D1B2A"` — hardcoded, sin adaptar

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/modules/T7_AdoptionHeatmap/T7View.tsx` | Import `useDarkMode`. `SEG_LABELS` ampliado con `darkBg`. `DeptCfg` ampliado con `darkFill`. Nueva función `deptFill(dept, dark)`. SVG bell curve: fondos, fill, divisores, baseline y textos ahora usan colores dark-conditional. `CondensedCard`, `BellCurveTab`, `DeptRecommendationsTab` reciben prop `dark`. Arrow icon: `stroke="#0D1B2A"` → `stroke="currentColor"`. |

**Colores dark mode añadidos:**
| Departamento | Light | Dark |
|---|---|---|
| Dirección General | `#0D1B2A` | `#7BA7D4` |
| IT / Tecnología | `#6366F1` | `#818CF8` |
| Operaciones | `#F97316` | `#FB923C` |
| Marketing & Comercial | `#10B981` | `#34D399` |

**Resultado compilación:** ✅ 0 errores TypeScript

---

---

### ✅ U-02 | PDF export real en T6 (reemplazar window.print)
**Fecha:** 2026-05-02
**Severidad:** 🟠 Importante

**Problema:** `PolicyTab` en T6 usaba `window.print()` — abre el diálogo de impresión del OS, aspecto no profesional en demo con cliente.

**Solución:** PDF generado client-side con `@react-pdf/renderer` (ya en dependencias). Componente `PolicyPDFDocument` replica todas las secciones del documento HTML (declaración, alcance, principios, catálogo AI aprobada, controles alto riesgo condicionales, roles, revisión). `BlobProvider` para estado loading → `<a>` programático en onClick para descargar.

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/modules/T6_RiskGovernance/PolicyPDF.tsx` | **NUEVO** — `PolicyPDFDocument` (Document + Page A4 con 7 secciones) + `PolicyDownloadButton` (BlobProvider con estado loading/error). |
| `src/modules/T6_RiskGovernance/T6View.tsx` | Import `PolicyDownloadButton`. `handlePrint` + botón `window.print()` eliminados. `pdfData` construido desde datos de T4/T5. `PolicyDownloadButton data={pdfData}` en action bar. |

**Nota API:** `@react-pdf/renderer` v3 eliminó render prop en `PDFDownloadLink`. Se usa `BlobProvider` (que sí mantiene render prop) + `<a>` programático.

**Resultado compilación:** ✅ 0 errores TypeScript

---

---

### ✅ V-03 | Tokens design system en T7 y T9 (eliminar hex hardcoded)
**Fecha:** 2026-05-02
**Severidad:** 🟠 Importante

**Problema:** T7 y T9 tenían colores hexadecimales hardcoded que no referenciaban el design system: colores semánticos de riesgo/estado en RISK_META, T4_STATUS_META y FREE_STATUS_META, colores de barra Gantt, cabeceras Q1/Q2, hito de entrega, y SVG de iconos en T7 — todos usaban hex propios que divergían (ej. `#A32D2D` vs `danger.dark #C06060`, `#16a34a` vs `success.dark #5FAF8A`).

**Solución:**
- T7: Reemplazados 4 hex hardcoded (barra momentum progress, SVG warning/check icons) por tokens DS directos.
- T9: Añadido objeto `DS` como single source of truth (17 entradas: tokens semánticos + neutrales decorativos para barras free). RISK_META, T4_STATUS_META, FREE_STATUS_META, GanttRowItem bars/source badges, Q1/Q2 headers, milestone dot y leyenda — todos referenciando `DS.xxx`.

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `src/modules/T7_AdoptionHeatmap/T7View.tsx` | momentum bar: `#16a34a/#d97706/#dc2626` → `DS.successDark/warningDark/dangerDark`. SVG warning icon: `#dc2626` → `#C06060`. SVG check icon: `#16a34a` → `#5FAF8A`. |
| `src/modules/T9_AIRoadmap/T9View.tsx` | Añadido objeto `const DS` (17 tokens). RISK_META, T4_STATUS_META, FREE_STATUS_META mapeados a DS. GanttRowItem: barBg navy, sourceBg/sourceColor info tokens, free bars a DS.freeBar*. Milestone: `#E24B4A` → `DS.dangerDark`. Q1/Q2: info/success tokens. Leyenda: navy, freeBar, dangerDark. |

**Resultado compilación:** ✅ 0 errores TypeScript

---

## BLOQUE B — Importantes (pendiente)
- [x] ✅ U-10 — Tooltips en scatter charts T3 y T4 (2026-05-02) — hover state + div absoluto, flip automático si dot > 65% del eje X, muestra nombre/categoría/scores. 0 errores TypeScript.
- [x] ✅ U-08 — Cabeceras Q1/Q2 en Gantt de T9 — ya implementadas en T9View original (líneas 618–649). Tokenizadas en V-03.
- [x] ✅ U-05 — Primer departamento expandido por defecto en T2 (2026-05-02) — `useState` lazy initializer con `stakeholders[0].department`. 0 errores TypeScript.
- [x] ✅ U-12 — Primer stakeholder pre-seleccionado en T2 para demo (2026-05-02) — `useState` lazy initializer con `stakeholders[0] ?? null`. 0 errores TypeScript.

## BLOQUE C — Cosméticos

- [x] ✅ U-04 — Botón "Nueva entrevista" en header sticky de T1 (2026-05-02) — botón navy con icono + en sticky header; el colapsible mantiene el botón "Nueva" compacto interno.
- [x] ✅ C-01 — Dead code `filterCat` eliminado de T3View (2026-05-02) — estado, filter y dependencia del useMemo eliminados. setFilterCat(null) en "Limpiar filtros" simplificado a setFilterPhase(null).
- [x] ✅ C-02 — `←` texto → SVG chevron-left en botones Back (2026-05-02) — T3, T4 (circular icon button), T5, T6 (text links). Mismo viewBox `0 0 14 14` consistente.
- [x] ✅ C-03 — Emoji 🔍 → icono SVG search en T5 empty states (2026-05-02) — 2 instancias. Contenedor `w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800`, icono `text-text-subtle`.
- [x] N/A C-04 — `LeanRadarChart`/`LeanBarChart` siguen en uso en App.tsx (líneas 246, 249). No eliminar.

---

*Última actualización: 2026-05-02 | Compilación final Sprint 4: ✅ 0 errores TypeScript | Todos los ítems de Bloque A, B y C cerrados.*
