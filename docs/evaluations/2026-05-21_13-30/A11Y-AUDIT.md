# Auditoría de Accesibilidad — L.E.A.N. AI System Enterprise
**Estándar:** WCAG 2.1 AA | **Fecha:** 2026-05-21 | **Scope:** Codebase completo (src/)

---

## Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| **Issues encontrados** | **19** |
| 🔴 Críticos | 5 |
| 🟡 Mayores | 9 |
| 🟢 Menores | 5 |
| Pares de color analizados | 14 |
| Pares con fallo AA | 7 |
| Inputs sin label programático | ~26 (0 con id=, 0 con aria-label) |

La aplicación tiene una base semántica correcta (elementos `<main>`, `<header>`, `<nav>`, `lang="es"`, alt texts en logos), pero presenta fallos sistemáticos de contraste en el color de acento principal (gold), cero asociación programática entre labels e inputs, y prácticamente nula gestión de teclado fuera de los botones nativos. Para un producto enterprise B2B, los fallos de contraste y de formularios son los que más probabilidad tienen de aparecer en una revisión de compliance.

---

## 1. Perceivable (Perceptible)

### Contraste de color

| # | Par de colores | Ratio | Requerido | Estado | Criterio WCAG |
|---|----------------|-------|-----------|--------|---------------|
| 1 | Gold `#C8860A` sobre fondo blanco `#FFFFFF` | 3.06:1 | 4.5:1 | 🔴 FALLA | 1.4.3 |
| 2 | Gold `#C8860A` sobre ivory `#F0EDE8` (warm-50) | 2.62:1 | 4.5:1 | 🔴 FALLA | 1.4.3 |
| 3 | Texto sutil `#C4C0B8` (warm-100) sobre blanco | 1.81:1 | 4.5:1 | 🔴 FALLA | 1.4.3 |
| 4 | Placeholder `#9A9790` (warm-200) sobre blanco | 2.92:1 | 3.0:1 | 🔴 FALLA | 1.4.3 |
| 5 | `gray-400` hardcoded `#9CA3AF` sobre blanco (Admin) | 2.54:1 | 4.5:1 | 🟡 FALLA | 1.4.3 |
| 6 | Dark: muted `#6B6864` (warm-300) sobre `#22201C` | 2.93:1 | 4.5:1 | 🟡 FALLA | 1.4.3 |
| 7 | Silver-warm `#9A9790` sobre warm-600 `#3E3B35` | 3.83:1 | 4.5:1 | 🟡 FALLA* | 1.4.3 |

> *Pasa AA para texto grande (≥18pt o ≥14pt bold) pero falla para texto normal. Revisar uso real.

**Pasan correctamente:** lean-black/white (17.37:1 ✅), dark mode principal (13.93:1 ✅), gold/warm-900 en dark mode (5.32:1 ✅), dark: warm-200/warm-800 (5.05:1 ✅), gold/warm-800 en nav activo (4.82:1 ✅).

**Impacto crítico del gold:** El color de acento primario del sistema de diseño (`#C8860A`) falla AA sobre todos los fondos claros. Afecta a botones CTA, badges, texto de énfasis, indicadores de estado activo, y cualquier texto en gold sobre superficie ivory.

### Alternativas a contenido no textual

| # | Hallazgo | Severidad | Criterio |
|---|----------|-----------|---------|
| 8 | **Recharts (radar, bar, area charts) sin descripción accesible.** Los SVG generados por Recharts no tienen `aria-label`, `role="img"` ni `<title>` dentro del SVG. Para un lector de pantalla, los gráficos de T1, T4, T7, T10 son invisibles. | 🟡 Mayor | 1.1.1 |
| 9 | **Spinner de carga sin estado accesible.** El SVG de carga en `ProtectedRoute` (`animate-spin`) no tiene `role="status"`, `aria-label` ni `aria-live`. Un lector de pantalla no anuncia que la aplicación está cargando. | 🟢 Menor | 1.3.1 |

---

## 2. Operable (Operable)

| # | Hallazgo | Severidad | Criterio |
|---|----------|-----------|---------|
| 10 | **Sin skip link "Saltar al contenido principal".** La barra lateral (`<aside>`) con 12+ elementos de navegación se traversa completa con Tab antes de llegar al contenido. Usuarios de teclado deben pulsar Tab 12+ veces en cada cambio de página. | 🔴 Crítico | 2.4.1 |
| 11 | **Modal T1 sin `role="dialog"` ni focus trap.** El modal de "Nueva entrevista" cierra con Escape y hace autofocus correctamente, pero carece de `role="dialog"`, `aria-modal="true"` y `aria-labelledby`. Sin focus trap, Tab puede salir del modal y llegar al contenido de fondo. Lectores de pantalla no anuncian que se ha abierto un diálogo. | 🔴 Crítico | 2.1.2, 4.1.2 |
| 12 | **Sliders T1 sin labels ni valuetext accesibles.** Los `<input type="range">` del módulo T1 (que son el corazón del assessment) no tienen `aria-label`, `aria-valuetext` ni `aria-describedby`. Un lector de pantalla solo anuncia el valor numérico (0-100) sin contexto de qué dimensión se está evaluando ni qué significa ese número. | 🔴 Crítico | 2.1.1, 4.1.2 |
| 13 | **Botones con solo iconos sin aria-label en RecommendationPanel y Admin.** `RecommendationPanel.tsx` líneas 63, 113, 199 y varios botones en `AdminView.tsx` sin texto visible ni `aria-label`. El lector de pantalla anuncia "button" sin nombre. | 🟡 Mayor | 4.1.2 |
| 14 | **Título de página estático.** `<title>` nunca cambia al navegar entre T1-T12. Un lector de pantalla no anuncia el cambio de contexto al navegar entre herramientas. Cada módulo debería actualizar `document.title` (ej: "T1 — AI Readiness · L.E.A.N. AI System"). | 🟢 Menor | 2.4.2 |

---

## 3. Understandable (Comprensible)

| # | Hallazgo | Severidad | Criterio |
|---|----------|-----------|---------|
| 15 | **26 inputs sin asociación programática con su label.** Análisis: 26 inputs de texto/email/password, 0 con atributo `id=`, 0 con `aria-label`, 0 con `aria-labelledby`. Los `<label>` visuales existen en algunos casos pero sin el atributo `for="input-id"` que los conecta. Afecta: todos los formularios de Auth, Admin, CompanyProfile, T1, T4. | 🔴 Crítico | 3.3.2 |
| 16 | **Jerarquía de encabezados invertida en AdminView.** El `<h1>` "Panel de administración" aparece en la línea 521 del DOM, después de varios `<h2>` y `<h3>` (líneas 113, 134, 255, 337, 433, 465). Los lectores de pantalla navegan por encabezados esperando encontrar h1 primero. | 🟡 Mayor | 1.3.1 |
| 17 | **Texto "GOBY" en AlphaLogo.tsx.** El componente `AlphaLogo` en modo `lg` (usado en la pantalla de login) muestra el texto "GOBY" en lugar de "L.E.A.N. AI System". Artefacto del proyecto anterior. Confusión de contexto para todos los usuarios, y especialmente para lectores de pantalla que leerán "GOBY" como nombre del producto. | 🟡 Mayor | 3.2.4 |
| 18 | **Sin mensajes de error accesibles en formularios.** Los campos de formulario no usan `aria-invalid="true"` ni `aria-describedby` apuntando al mensaje de error cuando la validación falla. El error puede ser visible visualmente pero el lector de pantalla no lo asocia al campo que lo causó. | 🟡 Mayor | 3.3.1 |

---

## 4. Robust (Robusto)

| # | Hallazgo | Severidad | Criterio |
|---|----------|-----------|---------|
| 19 | **Sin regiones ARIA live para actualizaciones dinámicas.** Los estados de carga, éxito y error en stores y componentes no usan `aria-live="polite"` ni `role="status"`. Cuando T1 carga datos o cuando un store actualiza su estado de error, los lectores de pantalla no anuncian el cambio. | 🟢 Menor | 4.1.3 |

---

## Tabla de contraste — Resumen de correcciones

Para corregir los fallos de contraste manteniendo el sistema de diseño:

| Token actual | Color hex | Uso | Ratio actual | Corrección sugerida | Ratio objetivo |
|---|---|---|---|---|---|
| `gold` | `#C8860A` | Texto en superficie clara | 3.06:1 | Oscurecer a `#A06A08` | ~4.8:1 |
| `warm-200` | `#9A9790` | Placeholders | 2.92:1 | Usar `warm-300 #6B6864` para placeholders | 5.54:1 |
| `warm-100` | `#C4C0B8` | Texto sutil | 1.81:1 | Reservar para decorativo, no texto | — |
| `warm-300` | `#6B6864` | Texto muted dark mode | 2.93:1 | Usar `warm-200 #9A9790` en dark mode | 5.05:1 |

> **Nota estratégica:** El color gold es el acento central del sistema de diseño. En lugar de cambiar el token globalmente (que afectaría también al dark mode donde sí pasa), la solución menos invasiva es crear un token `gold-text` más oscuro para uso en texto sobre fondos claros, manteniendo `gold` para backgrounds, bordes y elementos decorativos.

---

## Navegación por teclado — Estado actual

| Elemento | Tab accesible | Enter/Space | Escape | Flechas |
|----------|---------------|-------------|--------|---------|
| Botones nativos `<button>` | ✅ Sí | ✅ Sí | — | — |
| Sidebar nav items | ✅ Sí | ✅ Sí | — | — |
| Toggle dark mode | ✅ Sí (aria-label) | ✅ Sí | — | — |
| Modal T1 | ✅ Sí | ✅ Sí | ✅ Escape cierra | ❌ Sin focus trap |
| Sliders T1 (range) | ✅ Sí | — | — | ✅ Nativo pero sin contexto |
| Select elements | ✅ Sí (nativo) | — | — | ✅ Nativo |
| Charts Recharts | ❌ No accesible | ❌ | ❌ | ❌ |
| Skip link | ❌ No existe | — | — | — |

---

## Lector de pantalla — Estado esperado

| Elemento | Lo que anuncia ahora | Lo que debería anunciar |
|----------|---------------------|------------------------|
| Spinner de carga | (silencio) | "Cargando, por favor espera" |
| Modal T1 al abrir | (silencio — no es dialog) | "Nueva entrevista, diálogo" |
| Slider T1 | "0" (número sin contexto) | "Gestión del Cambio, slider, 60 de 100" |
| Gráfico radar T1 | (silencio) | "Radar de madurez: Gobernanza 65, Datos 72…" |
| Logo en login | "Alpha Consulting Solutions" + "GOBY" | "Alpha Consulting Solutions — L.E.A.N. AI System" |
| Input email login | "edit" (sin nombre) | "Correo electrónico, editar texto" |
| Botón "Reintentar" | "button" | "Reintentar, button" (texto ya existe, ok) |

---

## Prioridades de corrección

### Prioridad 1 — Correcciones de impacto máximo (≤2h de trabajo)

**P1.1 — Asociar labels con inputs (3.3.2)**
Añadir `id` a cada `<input>` y `htmlFor` al `<label>` correspondiente. Donde no hay `<label>` visual, añadir `aria-label`. Ejemplo:
```tsx
// Antes
<input type="email" placeholder="Email corporativo" className={inputClass} />

// Después
<label htmlFor="email-input" className="sr-only">Email corporativo</label>
<input id="email-input" type="email" placeholder="Email corporativo" aria-label="Email corporativo" />
```
Afecta a: Auth/LoginView, Auth/ResetPasswordView, Admin/AdminView, T1/T1View, T4/T4View.

**P1.2 — Añadir skip link (2.4.1)**
```tsx
// Justo dentro de <body>, antes del header
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded">
  Saltar al contenido principal
</a>
// En AppLayout, añadir id al main:
<main id="main-content">
```

**P1.3 — Corregir branding "GOBY" en AlphaLogo (3.2.4)**
```tsx
// Antes
<p style={{ fontSize: 20, fontWeight: 600 }}>GOBY</p>

// Después
<p style={{ fontSize: 20, fontWeight: 600 }}>L.E.A.N. AI System</p>
```

**P1.4 — Modal T1 con role="dialog" (4.1.2)**
```tsx
// Añadir al div del card del modal:
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  className="relative w-full max-w-sm bg-white..."
>
  {/* En el h3 del header: */}
  <h3 id="modal-title" className="text-sm font-semibold...">
    Nueva entrevista
  </h3>
```

### Prioridad 2 — Contraste (1.4.3)

**P2.1 — Crear token `gold-accessible` para texto sobre fondo claro**

En `tailwind.config.ts`, añadir:
```ts
'gold-accessible': '#9B6408',  // pasa 4.5:1 sobre blanco: ratio ~5.3:1
```
Usar `gold-accessible` en todos los textos sobre fondos claros (`text-gold-accessible`). Mantener `gold` para backgrounds, bordes, y dark mode donde ya pasa.

**P2.2 — Usar warm-300 en lugar de warm-200 para placeholders**

Cambiar `.placeholder-warm-200` a `.placeholder-warm-300` en todos los inputs. warm-300 (#6B6864) tiene ratio 5.54:1 sobre blanco — pasa AA.

**P2.3 — No usar warm-100 para texto**

`warm-100` (#C4C0B8) tiene ratio 1.81:1 sobre blanco — solo decorativo. Sustituir por `warm-300` en cualquier texto visible.

### Prioridad 3 — Sliders T1 (impacto funcional)

**P3.1 — Añadir aria-label y aria-valuetext a sliders**

```tsx
// En cada input[type=range] de T1View:
<input
  type="range"
  min={0}
  max={100}
  value={score ?? 0}
  aria-label={`${subdimension.name} — ${dimension.name}`}
  aria-valuetext={score !== null ? `${score} de 100 — ${getScoreLabel(score)}` : 'Sin evaluar'}
  onChange={...}
/>
```

### Prioridad 4 — Mejoras progresivas

- Actualizar `document.title` en cada módulo: `useEffect(() => { document.title = "T1 — AI Readiness · L.E.A.N. AI System" }, [])`
- Añadir `role="status"` y `aria-live="polite"` al spinner de carga
- Añadir `role="img"` + `aria-label` descriptivo a los charts de Recharts
- Corregir jerarquía h1→h2→h3 en AdminView (mover el h1 al inicio del componente)
- Añadir `aria-invalid` y `aria-describedby` para errores de validación

---

## Puntuación global de accesibilidad

| Principio WCAG | Puntuación | Estado |
|---|---|---|
| 1. Perceptible | 4/10 | 🔴 Fallos de contraste en acento primario |
| 2. Operable | 5/10 | 🟡 Teclado funcional en botones nativos, sin skip link ni focus trap |
| 3. Comprensible | 4/10 | 🔴 Formularios sin labels programáticos |
| 4. Robusto | 5/10 | 🟡 Semántica básica correcta, sin ARIA live |
| **Global WCAG 2.1 AA** | **4.5/10** | 🟡 |

> Para alcanzar conformidad AA real, las Prioridades 1 y 2 son bloqueantes. Las Prioridades 3 y 4 son mejora progresiva.
