# Testing Strategy — L.E.A.N. AI System Enterprise
**Fecha:** 2026-05-21 | **Estado actual:** 0 tests, sin test runner instalado  
**Stack de testing propuesto:** Vitest + Testing Library + Playwright

---

## Punto de partida

El proyecto tiene 0 tests y no tiene test runner instalado. Vitest está ausente de package.json. Storybook está instalado pero sin stories. El contexto es un equipo de 1 developer (Carlos) con 12 módulos en producción.

**El objetivo de testing para este proyecto no es alcanzar 100% de cobertura.** Es llegar al punto donde:
1. Los bugs en lógica crítica se detectan antes de llegar al cliente
2. Los refactors del DS y los módulos no producen regresiones invisibles
3. Carlos puede hacer merges a main con confianza

---

## Pirámide de testing recomendada

```
             /  E2E (Playwright) \
            /    ~10 tests        \     Flujos críticos completos
           /  Integration Tests    \
          /    ~30 tests            \   Supabase + stores + services
         /  Unit Tests (Vitest)      \
        /    ~80 tests                \  Stores, servicios, utils puros
```

**Proporción objetivo:** 70% unit / 20% integration / 10% E2E

---

## Instalación mínima viable

```bash
# Test runner + utilidades
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event

# E2E (instalar después de tener unit tests estables)
npm install -D @playwright/test
npx playwright install chromium
```

**vitest.config.ts:**
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/store.ts', 'src/modules/**/service.ts', 'src/shared/**'],
      thresholds: { lines: 40 },  // Aumentar con el tiempo
    },
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

---

## Plan de tests por área — qué cubrir y cómo

### 1. Stores de Zustand (prioridad máxima)

Los stores son el corazón de la lógica de negocio. Son puros (no dependen del DOM) y fáciles de testear. Son también el área donde un bug silencioso tiene más impacto.

**Qué cubrir:**
- Estado inicial correcto
- Transiciones de estado (loading → success → error)
- Lógica de cálculo (scores, promedios, ROI en T4)
- Debounce de upsert no genera llamadas duplicadas
- El store limpia el error al recargar

**Ejemplo — T1 store:**
```typescript
// src/modules/T1_MaturityRadar/__tests__/store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useT1Store } from '../store'
import * as T1Service from '../service'

vi.mock('../service')

describe('T1Store', () => {
  beforeEach(() => {
    useT1Store.setState({ scores: null, loading: false, error: null })
  })

  it('inicia con estado vacío', () => {
    const { scores, loading, error } = useT1Store.getState()
    expect(scores).toBeNull()
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })

  it('pone loading=true durante la carga', async () => {
    vi.mocked(T1Service.loadScores).mockResolvedValueOnce([])
    const loadPromise = useT1Store.getState().load('eng-123')
    expect(useT1Store.getState().loading).toBe(true)
    await loadPromise
    expect(useT1Store.getState().loading).toBe(false)
  })

  it('captura errores de red correctamente', async () => {
    vi.mocked(T1Service.loadScores).mockRejectedValueOnce(new Error('Network error'))
    await useT1Store.getState().load('eng-123')
    expect(useT1Store.getState().error).toBeTruthy()
    expect(useT1Store.getState().loading).toBe(false)
  })
})
```

**Target:** 1 suite de tests por store (T1-T12), ~5 tests por store → 60 tests unit de store

---

### 2. Servicios (segunda prioridad)

Los servicios son la capa de acceso a datos. Requieren mocking de Supabase.

```typescript
// src/test/setup.ts — mock global de Supabase
import { vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  },
}))
```

**Qué cubrir:**
- La query construida tiene las columnas correctas (no `select('*')`)
- El upsert usa el campo `onConflict` correcto
- Los errores de Supabase se propagan como excepciones (no se silencian)

---

### 3. Componentes compartidos (cuando existan)

Una vez construidos Button, FormField, Card, Badge (ADR D-11):

**Qué cubrir:**
- Renderiza sin crash en cada variante
- FormField asocia label con input (htmlFor = id)
- Button deshabilitado no dispara onClick
- Button con loading muestra spinner y tiene aria-busy
- Badge aplica la clase correcta para cada variant

```typescript
// src/shared/design-system/components/Button/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

it('no llama a onClick cuando está deshabilitado', async () => {
  const onClick = vi.fn()
  render(<Button disabled onClick={onClick}>Guardar</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(onClick).not.toHaveBeenCalled()
})

it('FormField asocia label e input correctamente', () => {
  render(<FormField id="email" label="Email corporativo" />)
  const label = screen.getByText('Email corporativo')
  const input = screen.getByRole('textbox')
  expect(label).toHaveAttribute('for', 'email')
  expect(input).toHaveAttribute('id', 'email')
})
```

---

### 4. Funciones de cálculo y utilidades (fácil, alto valor)

El proyecto tiene funciones de cálculo críticas para el negocio: ROI en T4, scores de madurez en T1, priorización de casos de uso. Son funciones puras → tests triviales.

```typescript
// src/modules/T4_UseCasePriorityBoard/__tests__/calculations.test.ts
import { computePriorityScore, computeROIFromEconomics } from '../constants'

it('computePriorityScore retorna 0 con todos los scores a 0', () => {
  expect(computePriorityScore({ strategic: 0, feasibility: 0, impact: 0 })).toBe(0)
})

it('computeROIFromEconomics calcula el payback correctamente', () => {
  const result = computeROIFromEconomics({ cost: 100000, annualSaving: 50000 })
  expect(result.paybackMonths).toBe(24)
})
```

---

### 5. Tests E2E con Playwright (fase posterior)

Para iniciar, solo los 3 flujos más críticos del negocio:

| Test E2E | Prioridad | Descripción |
|----------|-----------|-------------|
| Login → dashboard | 🔴 Crítico | Usuario se autentica y ve el selector de engagement |
| T1 → guardar score | 🔴 Crítico | Consultor evalúa una dimensión y el score persiste tras recargar |
| Admin → crear usuario | 🟡 Mayor | Superadmin crea un nuevo consultor y puede iniciar sesión |

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('login exitoso redirige al dashboard', async ({ page }) => {
  await page.goto('/')
  await page.fill('[id="email-input"]', process.env.TEST_EMAIL!)
  await page.fill('[id="password-input"]', process.env.TEST_PASSWORD!)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.locator('h1')).toContainText('L.E.A.N.')
})
```

---

## Cobertura objetivo por fase

| Fase | Duración | Tests nuevos | Cobertura target | CI gate |
|------|----------|-------------|-----------------|---------|
| Sprint 1 | 2-3 semanas | ~30 (stores T1-T4) | >20% stores | ✅ vitest en PR |
| Sprint 2 | 2-3 semanas | +50 (stores T5-T12 + utils) | >50% stores | ✅ |
| Sprint 3 | 4-6 semanas | +40 (componentes DS) | >40% global | ✅ con threshold |
| Sprint 4+ | continuo | E2E flujos críticos | — | ✅ E2E en main |

---

## Lo que NO testear

- Componentes de terceros (Recharts, Supabase SDK)
- Código generado automáticamente (database.types.ts)
- Trivial getters/setters sin lógica
- Tests que replican exactamente la implementación (test de "hace lo que hace")

---

## Integración con CI (cuando GitHub Actions exista)

```yaml
# En el workflow de CI:
- name: Run tests
  run: npx vitest run --coverage

- name: Check coverage threshold
  run: npx vitest run --coverage --reporter=json
  # Falla si cobertura < 40% en stores
```
