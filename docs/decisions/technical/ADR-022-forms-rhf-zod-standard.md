# ADR-022: Estándar de formularios — react-hook-form + Zod

**Status:** ACCEPTED
**Date:** 2026-06-16
**Proposed by:** Carlos Sánchez - Alpha Consulting
**Approved by:** Carlos Sánchez - Alpha Consulting — 2026-06-16
**Supersedes:** —
**Superseded by:** —

---

## Context

GOBY acumula 12+ formularios distribuidos entre T1–T12 y las vistas de autenticación.
Hasta la PR que implementa este ADR, todos usan el patrón manual `useState` + `React.FormEvent`:

```tsx
// Patrón antiguo — NO USAR
const [form, setForm] = useState({ name: '', role: '' })
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!form.name.trim()) return   // validación ad-hoc, sin mensajes de error
  onSubmit(form)
}
```

Problemas identificados:
1. **Sin mensajes de error accesibles** — los formularios solo bloquean el botón; el usuario no sabe qué campo falló ni por qué.
2. **Validación duplicada** — reglas escritas dos veces (en el `canContinue` derivado + en el submit handler).
3. **Sin estado de envío** — el botón no refleja `isSubmitting`, posibilitando dobles-envíos.
4. **Deriva de tipado** — `NewStakeholderForm`, `NewValueStreamForm`, etc. son interfaces sueltas sin schema en runtime.
5. **Sin soporte `isDirty`** — el hook `useUnsavedChanges` (ADR-020 Fase 3) no puede detectar cambios sin esta propiedad.

ADR-020 Fase 3 reservó ADR-022 para establecer este estándar.

## Decision

Todo formulario **nuevo o tocado en una PR** debe usar `react-hook-form` con `zodResolver`,
siguiendo este patrón canónico:

```tsx
// ── Schema — src/lib/schemas/t{N}.schemas.ts ─────────────────
export const stakeholderFormSchema = z.object({
  name:           z.string().min(2, 'Mínimo 2 caracteres'),
  role:           z.string().min(2, 'Mínimo 2 caracteres'),
  department:     z.enum([...DEPT_VALUES] as [string, ...string[]]),
  unofficialTools: z.string().optional(),
})
export type StakeholderFormValues = z.infer<typeof stakeholderFormSchema>

// ── Componente ────────────────────────────────────────────────
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } =
  useForm<StakeholderFormValues>({ resolver: zodResolver(stakeholderFormSchema) })

// ── Render ────────────────────────────────────────────────────
<FormField
  id="name"
  label="Nombre"
  {...register('name')}
  errorText={errors.name?.message}
/>

<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
  Guardar
</Button>
```

### Reglas obligatorias

| Regla | Detalle |
|-------|---------|
| **Schema en `src/lib/schemas/t{N}.schemas.ts`** | Nunca inline en el componente. |
| **`zodResolver`** | Único resolver permitido. No usar `yupResolver` ni validación manual. |
| **Errores vía `errorText`** | Pasar `errors.<campo>?.message` a la prop `errorText` del `FormField` del DS. |
| **`isSubmitting`** | Botón submit `disabled={isSubmitting}` y `loading={isSubmitting}`. |
| **`isDirty`** | Exponer `formState.isDirty` al hook `useUnsavedChanges` cuando aplique. |
| **`mode` de validación** | Por defecto (`onSubmit`). No añadir `mode:'all'` ni `mode:'onChange'` salvo requerimiento UX explícito aprobado. |
| **Formularios multi-fase** | Cada fase del wizard que tenga campos propios tiene su propio `useForm` y schema parcial. |

### Scope de aplicación

- ✅ Aplica a: cualquier `<form>` con campos que el usuario edita y envía.
- ❌ Excluye: controles de filtro inline (sin `<form>` semántico), pickers de un solo campo sin validación.
- ⚠️ Formularios existentes NO tocados en una PR no requieren migración en esa PR (no se aplica retroactivamente salvo que la PR los modifique).

### Formularios migrados en la PR de activación de este ADR

| Vista | Componente refactorizado | Schema |
|-------|--------------------------|--------|
| T2 StakeholderMatrix | `StakeholderFormPhase` en `InterviewModal.tsx` | `t2.schemas.ts` → `stakeholderFormSchema` |
| T3 ValueStreamMap | `ProcessFormPhase.tsx` | `t3.schemas.ts` → `processFormSchema` |
| T4 UseCasePriorityBoard | Sin formularios de creación directa — solo formularios de puntuación vía stores | `t4.schemas.ts` (ya existente, JSONB parsing) |

### Formularios pendientes de migración

Ver **DEBT-024** y **DEBT-024-bis** en `docs/architecture/TECH-DEBT.md`.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **react-hook-form + zodResolver** | Integración nativa con Zod (ya en el proyecto), 0 re-renders, `formState` rico, `isDirty` gratis | — (elegida) | — |
| Formik + Yup | Maduro, ampliamente conocido | Re-renders excesivos, Yup duplica validación ya definida en Zod | Zod ya es dependencia; mantener dos librerías de schema es deuda |
| `useState` + validación manual | Sin dependencia extra | Sin mensajes de error accesibles, sin `isSubmitting`, sin `isDirty`, sin tipado en runtime | Patrón actual que motiva este ADR |
| React 19 `useActionState` | Nativo, sin dependencia | No disponible en React 18 (stack actual ADR-001), `formState` más limitado | Stack actual es React 18 |

## Consequences

### Positive
- Mensajes de error accesibles en todos los campos validados.
- `isSubmitting` previene dobles-envíos sin lógica extra.
- `isDirty` disponible para `useUnsavedChanges` (ADR-020 Fase 3).
- Schema Zod es la fuente única de verdad para tipado + validación runtime de formularios.
- Consistencia en 12+ formularios a medida que se migran.

### Negative / Trade-offs accepted
- `@hookform/resolvers` añadida como dependencia (≈3 kB gzipped).
- Los formularios multi-fase (wizard) necesitan un `useForm` por fase o uso de `trigger()` para validación parcial — mayor complejidad en wizards.
- Migración incremental: los formularios no tocados en una PR pueden quedar sin migrar temporalmente (ver DEBT-024-bis).

### Constraints introduced
- Un formulario nuevo sin `zodResolver` en una PR es un bloqueo de code review.
- El schema de cada formulario debe vivir en `src/lib/schemas/t{N}.schemas.ts`, no inline en el componente ni en `types.ts`.
- `errorText` es la única prop del DS para mostrar errores de campo — no usar tooltips ni texto ad-hoc.

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
