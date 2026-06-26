# Crítica de Diseño — GOBY
**Scope:** Todo el producto | **Etapa:** Refinamiento | **Foco:** Sistema de diseño  
**Fecha:** 2026-05-21 | **Estándar:** Usabilidad, consistencia, accesibilidad, escalabilidad del DS

---

## Puntuación global de diseño

| Dimensión | Puntuación | Estado |
|---|---|---|
| Intención del sistema de diseño | 8/10 | 🟢 Sólido |
| Adherencia al token system | 3/10 | 🔴 Violaciones masivas |
| Biblioteca de componentes | 4/10 | 🟡 Incompleta |
| Consistencia visual | 5/10 | 🟡 Heterogénea |
| Accesibilidad de diseño | 4/10 | 🔴 (ver A11Y-AUDIT.md) |
| Escalabilidad del DS | 5/10 | 🟡 Fundamentos OK, ejecución parcial |
| **Global** | **4.8/10** | **🟡** |

---

## Primera impresión

El sistema de diseño tiene una identidad clara y profesionalmente diferenciada para el mercado B2B español: la paleta Obsidian Amber (escala warm + gold) funciona como acento de lujo-sobriedad que encaja con el posicionamiento enterprise de Alpha Consulting. El dark mode está bien pensado y los tokens semánticos en `tailwind.config.ts` demuestran intención de arquitectura real de diseño.

El problema no está en la visión. Está en la brecha entre lo que el token system promete y lo que el código implementa. Esa brecha, medida en código, es de **134 valores hex hardcodeados** en `/src`. Para una aplicación de 28.453 líneas, eso no es una excepción — es un patrón paralelo no controlado que erosiona el DS desde dentro.

Hay además un bug de branding activo visible en producción que nunca debería haber llegado a main.

---

## 1. El token system: lo que funciona

`tailwind.config.ts` está bien construido. Vale la pena documentar sus aciertos antes de las críticas:

**Escala de grises warm coherente.** `warm-950` (#22201C) hasta `warm-50` (#FAF8F5) forma una rampa perceptualmente consistente. La decisión de usar una escala warm en lugar de neutral gray es correcta para el posicionamiento de la marca — crea temperatura y reduce la frialdad corporativa de los grises estándar.

**Sistema de z-index tokenizado.** Definir `base/raised/dropdown/sticky/overlay/modal/toast` como tokens es una decisión de arquitectura correcta que muchos equipos omiten. Previene los `z-index: 9999` ad-hoc.

**Tokens de sombra contextuales.** `card`, `sidebar`, `modal` — cada sombra tiene un propósito semántico, no solo un tamaño.

**Animaciones tokenizadas.** `shimmer`, `fade-in`, `slide-up` como tokens de `keyframes` + `animation` garantizan consistencia en microinteracciones.

**El componente MetricHero.** Es la mejor implementación del DS en el proyecto: usa tokens de tamaño semánticamente (`sm/md/lg/xl`), maneja estados de carga con skeleton nativo, incluye delta/trend indicators, tiene el `MetricHeroGrid` wrapper para layouts responsivos. Es el modelo a seguir para el resto de componentes.

---

## 2. El token system: lo que no funciona

### 2.1 — El token `navy` es semánticamente incorrecto

```ts
// tailwind.config.ts (estado actual)
navy: '#2A2822',  // ← No es navy. Es charcoal oscuro warm.
```

`navy` es un nombre de color que comunica azul marino. `#2A2822` es un marrón-negro cálido — exactamente la base de la escala `warm-950`. El token existe como alias de `warm-950` con un nombre engañoso heredado de un proyecto anterior.

**Impacto:** Cualquier developer que lea `text-navy` en el código espera azul. Genera confusión de lectura en revisiones de código. Cualquier miembro nuevo del equipo interpretará mal el token.

**Corrección:** Renombrar `navy` a `obsidian` (alineado con el nombre del DS) o a `brand-dark`. No es un cambio de color — es un rename de token. Afecta a todos los usos de `text-navy`, `bg-navy`, `border-navy` en `/src`.

### 2.2 — `warm-100` es una trampa para developers

```ts
warm-100: '#C4C0B8',  // ratio sobre blanco: 1.81:1 — invisible para usuarios con baja visión
```

`warm-100` existe en el token system sin ninguna restricción de uso. Cualquier developer que lo use para texto — lo cual es natural, los números bajos sugieren "claro para fondos oscuros" en el modelo mental de Tailwind — produce texto inaccesible sin saberlo. El audit WCAG encontró uso de este token en texto visible.

**Corrección:** Añadir un comentario en `tailwind.config.ts` marcando `warm-100` como "solo decorativo / no usar en texto". A largo plazo, eliminarlo del sistema visible y reemplazarlo por un token semántico como `decorative-border`.

### 2.3 — `gold` (#C8860A) falla AA en todos los fondos claros

```ts
gold: '#C8860A',  // ratio sobre blanco: 3.06:1 — falla WCAG AA (requiere 4.5:1)
                  // ratio sobre ivory (#F0EDE8): 2.62:1 — falla
                  // ratio sobre warm-950 en dark mode: 5.32:1 — PASA ✅
```

El color de acento central del sistema, el que aparece en CTAs, badges, estados activos, texto de énfasis y nav activo — falla accesibilidad en el contexto más frecuente (modo claro sobre fondo blanco/ivory). El gold *sí funciona* en dark mode porque el contraste contra `warm-950` es suficiente.

La solución no es cambiar el token `gold` (rompería el dark mode). La solución es un token complementario:

```ts
// Propuesta para tailwind.config.ts
'gold-text': '#9B6408',   // ratio sobre blanco: ~5.3:1 ✅ PASA AA
'gold-text-dark': '#C8860A', // mantener gold original para dark mode
```

Esto permite `text-gold-text` en claro y `dark:text-gold` sin cambiar la paleta visual percibida.

---

## 3. La brecha de adherencia: 134 hardcodes

El análisis estático de `/src` encontró **134 valores hex hardcodeados** fuera del token system. Esto no es un problema menor — es evidencia de que el DS no se está aplicando como capa de abstracción, sino como referencia opcional.

### Los patrones más frecuentes

**PHASE_COLORS en AppSidebar:**
```ts
// AppSidebar.tsx — estado actual
const PHASE_COLORS = ['#2A2822', '#2D6A4F', '#E29B3B', '#7B5EA7', '#C0392B', '#888888']
```
Seis colores hardcodeados. `#2A2822` es `warm-950`/`navy` del token system. `#E29B3B` es aproximadamente `gold-hover`. `#2D6A4F` y `#7B5EA7` no existen en el DS — son colores de fase que nunca se tokenizaron.

**Implicación de diseño:** Las fases del proyecto no tienen identidad visual dentro del DS. Si el color de una fase necesita cambiar (rebranding, modo accesible), hay que encontrar y cambiar cada hardcode. Si los colores de fase necesitan funcionar en dark mode, no hay mecanismo.

**Corrección mínima:** Crear tokens de fase:
```ts
// tailwind.config.ts
phase: {
  '1': '#2A2822',  // obsidian — fase inicial
  '2': '#2D6A4F',  // forest
  '3': '#E29B3B',  // amber
  '4': '#7B5EA7',  // violet
  '5': '#C0392B',  // ruby
  '6': '#888888',  // neutral
}
```

**Gradientes con hex internos:**
```ts
// tailwind.config.ts — los gradientes sí están tokenizados, pero:
'navy-metallic': 'linear-gradient(135deg, #2A2822 0%, #3E3B35 50%, #2A2822 100%)'
// ← hex hardcodeados dentro del token — si warm-950 cambia, el gradiente no cambia
```
Los gradientes referencian hex en lugar de referenciar variables CSS. Esto rompe la cadena de abstracción en la propia definición del token.

---

## 4. Biblioteca de componentes: el hueco

El proyecto tiene **7 componentes compartidos** para **12 módulos** con cientos de instancias de UI. Los componentes compartidos son: `AppSidebar`, `AppLayout`, `MetricHero`, `AlphaLogo`, `ProtectedRoute`, `ErrorBoundary`, y un par de wrappers menores.

Lo que **no existe** como componente compartido pero debería:

| Componente ausente | Impacto | Instancias estimadas |
|---|---|---|
| `<Button>` | Estilos de botón replicados inline en cada módulo | ~80+ |
| `<FormField>` | Label + input + error replicados sin asociación programática (ver A11Y-AUDIT issue #15) | ~26+ |
| `<Badge>` / `<StatusBadge>` | `StatusBadge` existe en T4View inline — no compartido | ~40+ |
| `<Modal>` | Modal implementado de forma ad-hoc en T1 | ~5+ |
| `<Card>` | Contenedor de card con bordes y sombras replicado | ~100+ |
| `<PageHeader>` | H1 + subtitle en cada módulo con estilos diferentes | 12 |
| `<EmptyState>` | Estado vacío en cada módulo con ilustración y CTA diferente | ~12 |

La consecuencia directa: cuando un cliente enterprise revisa dos módulos consecutivos (ej. T1 → T4), percibe inconsistencias visuales sutiles en botones, cards y formularios. No sabría articularlo, pero lo siente como "el producto no está pulido".

**T4View.tsx como caso extremo:** 2.329 líneas de un solo fichero que contiene `StatusBadge`, `CategoryBadge`, `ExecDashboard`, `QuarterlyRoadmap`, `PriorityMatrix`, `T4ScoreBars` incrustados inline. Estos componentes, si existieran en `/src/shared/components/`, estarían disponibles para T5-T12, reducirían el fichero a ~400 líneas, y garantizarían consistencia visual automática.

---

## 5. El bug de branding activo

Este hallazgo merece sección propia porque es visible en producción y afecta directamente a la percepción del cliente.

**AlphaLogo.tsx, modo `size="lg"` (pantalla de login):**
```tsx
// Estado actual — lo que el cliente ve al iniciar sesión
<p style={{ fontSize: 20, fontWeight: 600 }}>GOBY</p>
```
El texto "GOBY" aparece en la pantalla de login del producto. "GOBY" es el nombre del proyecto anterior de Alpha Consulting. Un cliente nuevo que vea la pantalla de login ve "Alpha Consulting Solutions" en el logo y "GOBY" como nombre del producto. La confusión es total.

**AppSidebar.tsx, footer:**
```tsx
// Estado actual
<span>GOBY · Alpha Consulting</span>
```
Visible permanentemente en la barra lateral de todos los usuarios autenticados.

**Corrección (5 minutos, dos líneas):**
```tsx
// AlphaLogo.tsx
<p style={{ fontSize: 20, fontWeight: 600 }}>GOBY</p>

// AppSidebar.tsx
<span>GOBY · Alpha Consulting</span>
```

No hay ninguna justificación técnica para que este bug lleve en producción más tiempo.

---

## 6. Jerarquía visual y consistencia cross-módulo

### Títulos de página sin componente unificado

Cada módulo tiene su propio enfoque para el `<h1>` de página. Algunos usan `text-2xl font-bold`, otros `text-xl font-semibold`, otros incluyen un subtítulo descriptivo, otros no. No hay un `<PageHeader>` compartido que garantice que T1 y T12 tengan la misma entrada visual.

### Z-index: tokens definidos, no usados

```ts
// tailwind.config.ts — bien definido
zIndex: { base: '0', raised: '10', dropdown: '20', sticky: '30', overlay: '40', modal: '50', toast: '60' }

// Uso real en componentes
className="z-10"     // ← raw value, no el token
className="z-30"     // ← raw value, no el token
```

Los tokens de z-index existen pero los componentes usan las clases numéricas de Tailwind directamente. Si el sistema de z-index necesita reordenarse (añadir una capa nueva entre dropdown y sticky), los tokens no son suficientes — hay que huntar todos los `z-10` y `z-30` en el código.

### Spacing no tokenizado para layouts de módulo

Los módulos usan clases de spacing de Tailwind directamente (`p-6`, `gap-4`, `mb-8`) sin tokens de spacing semánticos para los contenedores de módulo. Esto significa que el "padding estándar de un módulo T-x" no es una constante del DS — es lo que cada developer puso en su momento.

---

## 7. Lo que genuinamente funciona bien

Para que la crítica sea calibrada, los elementos del DS que están bien ejecutados:

**La paleta warm es correcta para el posicionamiento.** El marrón-negro cálido como base y el gold como acento comunica autoridad sin frialdad corporativa. Es una decisión de marca diferenciadora respecto a los azules/grises de la competencia de consultoría.

**El dark mode está bien pensado.** El sistema de tokens tiene variantes semánticas que funcionan en ambos modos. El dark principal pasa AA (13.93:1). El gold sobre `warm-900` en dark mode pasa AA (5.32:1). No es un dark mode afterthought — está en los cimientos del DS.

**Los tokens de sombra son semánticos.** Tener `shadow-card`, `shadow-sidebar`, `shadow-modal` en lugar de `shadow-sm/md/lg` evita que sombras arbitrarias erosionen la jerarquía visual.

**El sistema de border-radius es limpio.** La escala de `none` (0px) a `full` (9999px) con los valores intermedios bien distribuidos es suficiente para el lenguaje visual del producto. No hay necesidad de más radios.

**MetricHero como blueprint.** Si los próximos 20 componentes compartidos se construyen con la misma disciplina que MetricHero (props semánticas, skeleton states, tamaños tipados, sin hardcodes), el DS tendrá una biblioteca de componentes profesional en 4-6 sprints.

---

## 8. Recomendaciones priorizadas

### P1 — Correcciones inmediatas (bloqueantes para entorno enterprise)

| Fix | Fichero | Esfuerzo |
|---|---|---|
| Corregir "GOBY" en AlphaLogo y AppSidebar | `AlphaLogo.tsx`, `AppSidebar.tsx` | 5 min |
| Añadir token `gold-text: '#9B6408'` y aplicar en texto sobre claro | `tailwind.config.ts` + grep en src/ | 2h |
| Tokenizar `PHASE_COLORS` en `tailwind.config.ts` | `tailwind.config.ts`, `AppSidebar.tsx` | 1h |
| Renombrar token `navy` → `obsidian` o `brand-dark` | `tailwind.config.ts` + grep en src/ | 2h |

### P2 — Componentes compartidos prioritarios (deuda de consistencia)

Orden de extracción recomendado basado en frecuencia de uso:

1. **`<Button>`** — El componente más replicado. Variantes: `primary`, `secondary`, `ghost`, `danger`. Tamaños: `sm`, `md`, `lg`. Estado: `loading`, `disabled`.
2. **`<FormField>`** — Resuelve simultáneamente la deuda de accesibilidad (A11Y issue #15) y la inconsistencia visual. Props: `label`, `id`, `error`, `hint`.
3. **`<Card>`** — Contenedor base con variantes `flat`, `elevated`, `outlined`.
4. **`<Badge>` / `<StatusBadge>`** — Extraer de T4View. Variantes de color por estado.
5. **`<PageHeader>`** — H1 + subtitle opcional + slot para CTA. Garantiza entrada visual consistente en T1-T12.

### P3 — Higiene del token system (deuda técnica)

- Auditar los 134 hardcodes y clasificarlos: los que son tokens mal referenciados (alta prioridad), los que son colores de terceros válidos (documentar como excepciones).
- Marcar `warm-100` como "solo decorativo" en comentario de `tailwind.config.ts`.
- Corregir los gradientes `navy-metallic` y `gold-metallic` para que referencien variables CSS en lugar de hex inline.
- Adoptar tokens de z-index semánticos: sustituir `z-10`, `z-30` por `z-raised`, `z-sticky` en componentes.

### P4 — Refactor estructural (mejora progresiva)

- Extraer los sub-componentes de `T4View.tsx` a `/src/shared/components/`.
- Crear tokens de spacing semánticos para contenedores de módulo: `module-padding`, `module-gap`.
- Actualizar `document.title` en cada módulo (también en A11Y P4).

---

## Relación con la A11Y-AUDIT

Esta crítica y la auditoría de accesibilidad (`A11Y-AUDIT.md`) son complementarias. Los puntos de intersección donde un fix resuelve ambos problemas simultáneamente:

| Fix | Impacto en Design Critique | Impacto en A11Y |
|---|---|---|
| Crear `<FormField>` compartido | Consistencia visual de formularios | Resuelve issue #15 (26 inputs sin label) |
| Token `gold-text` accesible | Coherencia del DS | Resuelve issues #1 y #2 (gold falla AA) |
| Crear `<Modal>` compartido | Consistencia de modales | Resuelve issue #11 (modal sin role="dialog") |
| `<Button>` con aria-label prop | Consistencia de botones | Resuelve issue #13 (botones icono sin aria-label) |

Los fixes de Prioridad 1 de ambos documentos son los mismos fixes visto desde perspectivas distintas. La deuda de diseño y la deuda de accesibilidad comparten la misma causa raíz: ausencia de componentes compartidos que encapsulen tanto las decisiones visuales como los atributos ARIA correctos.

---

## Pregunta de debate

El DS tiene una tensión no resuelta: los tokens están bien definidos en `tailwind.config.ts`, pero el 134 hardcodes sugiere que los developers (actualmente: probablemente solo Carlos) no están usando el DS como primera opción al escribir CSS. 

**La pregunta no es técnica — es de proceso:** ¿Cuándo aparecen los hardcodes? ¿En el momento de prototipado rápido de un módulo nuevo cuando el token correcto no existe? ¿Por desconocimiento del token disponible? ¿Por urgencia de entrega?

La respuesta determina la solución correcta: si es falta de tokens existentes → ampliar el DS primero. Si es falta de visibilidad de los tokens disponibles → crear un catálogo Storybook o similar. Si es urgencia de entrega → definir un proceso de "token debt" que se paga en el sprint siguiente.

Sin saber la causa raíz, cualquier campaña de "eliminar hardcodes" se repetirá cada 3 meses.
