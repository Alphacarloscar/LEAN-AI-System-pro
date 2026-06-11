# ADR-D11: Biblioteca de componentes atómicos compartidos

**Estado:** Propuesto  
**Fecha:** 2026-05-21  
**Decididores:** Carlos Sánchez (COO)  
**Implementa:** ARQUITECTURA.md §7 — "Construidos en `src/shared/design-system/components/`" (deuda de Sprint 0.5)  
**Criticidad:** 🟡 No bloqueante hoy, bloqueante para consistencia enterprise en 3-6 meses

---

## Contexto

ARQUITECTURA.md §7 planificó explícitamente una biblioteca de componentes atómicos en `src/shared/design-system/components/` con Button, Input, Card, Badge y Alert como mínimo, con validación en Storybook antes de Sprint 1.

**Estado actual:** La carpeta `src/shared/design-system/` existe pero está vacía. Los 12 módulos implementados (T1-T12) construyeron sus propios botones, cards, formularios, badges y estados de carga de forma independiente, generando 134 hardcodes y estilos ad-hoc en 23 de los 113 ficheros.

### Evidencia del problema

```
src/
├── components/RecommendationPanel.tsx      ← componente huérfano
├── shared/
│   ├── components/ (7 componentes, ninguno atómico)
│   └── design-system/ (VACÍO)
└── modules/
    └── T4_UseCasePriorityBoard/T4View.tsx  ← 2.329 líneas con 7 sub-componentes inline
```

La consecuencia directa: dos módulos contiguos (ej. T3 y T4) tienen botones visualmente distintos, cards con padding diferente, y estados de carga incompatibles. Un CIO que hace una demo navegando entre herramientas lo percibe como falta de madurez del producto — no sabría articularlo, pero lo siente.

---

## Opciones consideradas

### Opción A — Construir la biblioteca en un sprint dedicado (recomendada)

Sprint de 2-3 semanas centrado exclusivamente en construir los componentes planificados en ARQUITECTURA.md.

**Scope del sprint:**

| Fase | Componentes | Esfuerzo estimado |
|------|-------------|------------------|
| 1 — Atómicos críticos | Button, FormField, Card, Badge | 12-16h |
| 2 — Patrones de módulo | Modal, PageHeader, EmptyState, Spinner | 8-12h |
| 3 — Extracción de T4View | StatusBadge, CategoryBadge, ExecDashboard | 6-8h |
| 4 — Sustitución en módulos | Reemplazar ad-hoc con componentes nuevos T1-T12 | 16-24h |
| **Total** | | **42-60h** |

**Pros:**
- Resuelve consistencia visual de una vez
- Los 4 componentes de Fase 1 también resuelven A11Y issues #11, #13, #15 simultáneamente
- `T4View.tsx` de 2.329 líneas → ~400 líneas tras extracción
- Activa el Storybook ya instalado (ROI de 6 paquetes devDependencies inutilizados)

**Contras:**
- 42-60h no es trivial. No hay features nuevas durante ese sprint
- Riesgo de regresiones visuales al reemplazar inline styles en 23 ficheros

---

### Opción B — Construir componentes de forma incremental, módulo por módulo

Cada vez que se trabaje en un módulo, extraer sus componentes inline antes de añadir features.

| Dimensión | Evaluación |
|-----------|-----------|
| Esfuerzo por sprint | Bajo (2-3h por módulo) |
| Tiempo hasta consistencia total | 8-12 sprints (6-9 meses) |
| Riesgo de regresión | Bajo (scope pequeño) |

**Pros:** Sin interrupción de features, riesgo mínimo  
**Contras:** El producto funcionará con inconsistencia visual durante 6-9 meses, el período en que más probable es que entre el primer cliente enterprise pagando

---

### Opción C — No construir la biblioteca; aceptar la deuda

Mantener el estado actual e invertir tiempo en features.

**Pros:** Velocidad de features a corto plazo  
**Contras:** La deuda crece con cada módulo nuevo. Con T13, serán 14 implementaciones independientes del mismo botón. Inviable para el posicionamiento enterprise.

---

## Decisión recomendada

**Opción A con scope reducido**: Construir solo Fase 1 (Button, FormField, Card, Badge) en el siguiente sprint, y Fase 2 en el siguiente.

**Razonamiento**: Fase 1 resuelve el 80% del impacto visual con el 40% del esfuerzo total. Los 4 componentes son los que más variaciones ad-hoc tienen y los que más visibles son al cliente. La sustitución masiva (Fase 4) puede hacerse de forma incremental módulo por módulo.

---

## Diseño propuesto — Componentes de Fase 1

### `<Button>`

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode          // icono izquierda
  iconRight?: ReactNode     // icono derecha
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string     // obligatorio si solo icono
  children?: ReactNode
}
```

| Variante | Tokens usados | Uso |
|----------|--------------|-----|
| `primary` | bg-gold, text-warm-950, hover:bg-gold-hover | CTA principal, acciones de guardado |
| `secondary` | bg-transparent, border-border, text-warm-800 | Acciones secundarias |
| `ghost` | bg-transparent, text-warm-600, hover:bg-warm-100/20 | Acciones terciarias, inline |
| `danger` | bg-danger-soft, text-warm-950 | Acciones destructivas |

**Estados obligatorios**: default, hover, active, disabled, loading (con spinner)  
**A11Y**: `role="button"` implícito, keyboard: Enter/Space, focus-visible ring con gold, `aria-busy` en loading

---

### `<FormField>`

```tsx
interface FormFieldProps {
  id: string                // obligatorio — conecta label con input
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'search'
  placeholder?: string
  hint?: string             // texto de ayuda bajo el campo
  error?: string            // mensaje de error (activa aria-invalid)
  required?: boolean
  disabled?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}
```

**Genera automáticamente:**
- `<label htmlFor={id}>` conectado con `for=`
- `aria-describedby` apuntando al mensaje de error cuando `error` existe
- `aria-invalid="true"` cuando `error` existe
- `aria-required="true"` cuando `required` es true

**Impacto:** Resuelve A11Y issue #15 (26 inputs sin label programática) de forma estructural — es imposible usar `<FormField>` sin que el input quede correctamente accesible.

---

### `<Card>`

```tsx
interface CardProps {
  variant?: 'elevated' | 'flat' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}
```

| Variante | Tokens | Uso |
|----------|--------|-----|
| `elevated` | bg-white, shadow-card, rounded-lg | Cards de contenido principal |
| `flat` | bg-surface, border-border, rounded-lg | Cards de contexto o secundarias |
| `outlined` | bg-transparent, border-2 border-border | Cards de selección/highlight |

---

### `<Badge>`

```tsx
interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
  size?: 'sm' | 'md'
  dot?: boolean             // muestra solo punto de color sin texto
  children: ReactNode
}
```

Extrae y estandariza `StatusBadge` de T4View.tsx como componente compartido.

---

## Estructura de archivos propuesta

```
src/shared/design-system/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx   ← Storybook story
│   │   └── index.ts
│   ├── FormField/
│   │   ├── FormField.tsx
│   │   ├── FormField.stories.tsx
│   │   └── index.ts
│   ├── Card/
│   │   └── ...
│   └── Badge/
│       └── ...
└── index.ts                     ← export barrel
```

**Barrel export:**
```ts
// src/shared/design-system/index.ts
export { Button } from './components/Button'
export { FormField } from './components/FormField'
export { Card } from './components/Card'
export { Badge } from './components/Badge'
```

**Import en módulos:**
```ts
import { Button, FormField, Card, Badge } from '@/shared/design-system'
```

---

## Criterios de aceptación

Cada componente se considera completo cuando:

- [ ] Props tipadas con TypeScript
- [ ] Todas las variantes implementadas con tokens (0 hardcodes)
- [ ] Estados default, hover, focus, disabled, loading implementados
- [ ] `focus-visible` ring visible con gold (#C8860A o gold-text)
- [ ] Storybook story con todas las variantes
- [ ] Test unitario básico (render sin crash, props correctas)
- [ ] Sustituido en al menos un módulo como validación

---

## Consecuencias si se acepta

**Lo que se vuelve más fácil:**
- Un nuevo módulo T13 se construye con componentes del DS, no ad-hoc
- Los cambios visuales del DS (ej. cambiar padding de Card) se propagan a todos los módulos
- Las correcciones de accesibilidad se heredan automáticamente
- Storybook tiene contenido — 6 paquetes devDependencies tienen ROI

**Lo que se vuelve más difícil:**
- La sustitución de componentes ad-hoc en 12 módulos existentes requiere PR grande y revisión cuidadosa
- Hay riesgo de regresión visual en módulos que usaban estilos no estándar

**Lo que habrá que revisar tras la implementación:**
- `A11Y-AUDIT.md` issues #11, #12, #13, #15 — pueden cerrarse
- `DS-AUDIT.md` score de component completeness — de 2/10 a 7/10
- `T4View.tsx` — reducir de 2.329 líneas a ~400 tras extracción de sub-componentes
