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

## BLOQUE B — Importantes (pendiente)

- [ ] U-01 — Añadir hilo conductor metodológico (breadcrumb/indicador de fase) en T1–T9
- [ ] U-02 — Reemplazar `window.print()` en T6 por exportación PDF real
- [ ] U-03 — Añadir timeline visual y KPI strip en T8
- [ ] V-02 — Corregir dark mode en T7 (colores hardcoded no adaptativos)
- [ ] V-03 — Mapear hexadecimales hardcoded de T7/T9 a tokens del design system
- [ ] U-10 — Añadir tooltips a scatter charts en T3 (HeroOpportunityMatrix) y T4 (PriorityMatrix)
- [ ] U-08 — Añadir cabeceras de agrupación Q1/Q2 en Gantt de T9
- [ ] U-05 — Expandir primer departamento por defecto en T2
- [ ] U-12 — Pre-seleccionar primer stakeholder en T2 para demo

## BLOQUE C — Cosméticos (pendiente)

- [ ] U-04 — Añadir botón "Nueva entrevista" en header de T1
- [ ] C-01 — Eliminar dead code `filterCat` en T3View
- [ ] C-02 — Reemplazar `←` (texto) por icono svg en botones Back
- [ ] C-03 — Sustituir emoji 🔍 en T5 empty state por icono SVG
- [ ] C-04 — Eliminar `LeanRadarChart`/`LeanBarChart` de shared si siguen sin uso

---

*Última actualización: 2026-05-01 | Compilación base: ✅ 0 errores TypeScript*
