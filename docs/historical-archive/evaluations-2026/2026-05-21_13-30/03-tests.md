# Área 03 — Tests   🔴

**Puntuación:** 1/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

Cero tests. Las carpetas `tests/unit/`, `tests/integration/` y `tests/e2e/` existen pero solo contienen `.gitkeep`. No hay Vitest, Jest, Playwright ni Cypress instalados. Storybook está configurado como devDependency pero sin ninguna story implementada. Es el gap técnico más crítico para un producto que aspira a escalar a múltiples consultores y clientes.

## Hallazgos

### 🔴 Críticos

- **0 tests en todo el proyecto**: Ni unitarios, ni de integración, ni e2e. La infraestructura (carpetas) existe pero está vacía.

- **No hay test runner instalado**: `vitest`, `jest`, `@testing-library/react`, `playwright` y `cypress` están ausentes de `package.json`. No hay script de test ni en `scripts`.

- **Storybook configurado pero sin stories**: `@storybook/react` y todos sus addons están en devDependencies, el comando `npm run storybook` existe, pero `find src -name "*.stories.*"` devuelve 0 resultados. Inversión sin retorno actual.

### 🟡 Mejorables

- **Lógica de negocio crítica sin cobertura**: Las funciones de cálculo de `t1ContextBuilder.ts`, los motores de scoring de T4, la lógica de UPSERT con debounce en stores — todo funciona por observación manual, no por contrato verificable.

- **Sin snapshot tests para componentes críticos**: T1View, T2View, T4View renderan visualizaciones complejas (radar charts, matrices, roadmaps) que pueden romperse silenciosamente con cambios de dependencias.

### 🟢 Correctos

- La estructura de carpetas de tests existe y refleja el modelo correcto (unit / integration / e2e).
- TypeScript strict mode activo reduce la superficie de errores de tipo que tests descubrirían.

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Archivos de test | 0 | Objetivo >50 |
| Cobertura de código | 0% | Objetivo >60% |
| Test runner instalado | ❌ No | Requerido |
| Stories de Storybook | 0 | Objetivo >12 |
| Scripts de test en package.json | ❌ No | Requerido |

## Recomendaciones priorizadas

### Prioridad 1 — Instalar Vitest + Testing Library y escribir los primeros tests

**Qué:** Añadir Vitest como test runner (compatible con Vite sin config extra), @testing-library/react para componentes, y empezar por los builders de contexto y la lógica de stores.

**Por qué:** Sin tests, cada sprint introduce riesgo acumulativo. Los módulos T1-T4 ya tienen capa de service — son los candidatos perfectos para el primer ciclo de tests.

**Cómo:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/coverage-v8 jsdom
```

Añadir a `vite.config.ts`:
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
  coverage: { provider: 'v8', reporter: ['text', 'html'] },
}
```

Primeros tests objetivo:
1. `tests/unit/t1ContextBuilder.test.ts` — lógica de cálculo de madurez
2. `tests/unit/stores/t1Store.test.ts` — setScore + debounce
3. `tests/unit/stores/authStore.test.ts` — initialize + login flow

**Plan Maestro:** Sin PR asignado — Sprint de Testing (nuevo).

### Prioridad 2 — Añadir script de test a package.json

**Qué:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Plan Maestro:** Incluido en Prioridad 1.

### Prioridad 3 — Crear al menos 1 story por componente shared

**Qué:** Crear `src/shared/components/ErrorBoundary.stories.tsx`, `MetricHero.stories.tsx`, `AppSidebar.stories.tsx`.

**Por qué:** Storybook está instalado y tiene coste de mantenimiento. O se usa o se elimina para aligerar las devDependencies.

**Plan Maestro:** Sin PR asignado.
