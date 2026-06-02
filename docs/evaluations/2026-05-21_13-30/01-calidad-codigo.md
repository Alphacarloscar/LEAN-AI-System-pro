# Área 01 — Calidad de Código   🟡

**Puntuación:** 5/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

El código tiene buenas bases estructurales (TypeScript strict mode, path aliases, comentarios de intención por archivo) pero presenta un problema grave de god-components: T4View.tsx tiene 2.329 líneas con sub-componentes incrustados. El fichero ESLint está declarado en scripts pero no existe, lo que significa que el comando `npm run lint` falla en frío.

## Hallazgos

### 🔴 Críticos

- **ESLint config ausente**: `package.json` declara `"lint": "eslint . --ext ts,tsx ..."` pero `eslint.config.js` no existe en el repositorio. El lint no se puede ejecutar. Cualquier CI/CD que lo invoque fallará inmediatamente.

- **T4View.tsx: 2.329 líneas (god-component)**: Contiene al menos 8 sub-componentes definidos inline (`StatusBadge`, `CategoryBadge`, `ExecDashboard`, `QuarterlyRoadmap`, `PriorityMatrix`, `T4ScoreBars`...). Imposible de testear en aislamiento, el mantenimiento es de alto riesgo.

### 🟡 Mejorables

- **God-components adicionales**: T3View (1.233 l.), T10View (1.229 l.), T8View (1.228 l.), T7View (1.164 l.). Patrón extendido a todos los módulos complejos. El problema de T4 es el caso extremo, pero la tendencia afecta a 5+ ficheros.

- **`createClient<any>` en supabase.ts**: El cliente Supabase no está tipado con el schema de la base de datos. Las queries no tienen type-safety en respuesta. El fichero mismo lo documenta ("Sprint 5: generar tipos via CLI") pero sigue sin resolverse.

- **console.log en producción** (`companies.service.ts:68`): Un log de MOCK que aparentemente quedó de un paso intermedio. Llegará al navegador del cliente en producción.

- **`noUnusedLocals` / `noUnusedParameters`** activados en tsconfig ✅, pero sin ESLint activo no hay enforcement real en CI.

### 🟢 Correctos

- TypeScript strict mode activado desde el día 1.
- Path aliases (`@/`, `@shared/`, `@modules/`, `@services/`) usados consistentemente (220 imports vs 0 relativos `../`).
- 1 solo `any` explícito con comentario eslint-disable justificado.
- Comentarios de intención en todos los ficheros clave (fecha, sprint, propósito).

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Total líneas de código | 28.453 | — |
| Total archivos TS/TSX | 113 | — |
| Archivos >500 líneas | 14 | Objetivo <5 |
| Archivos >1000 líneas | 8 | Objetivo 0 |
| `any` explícitos | 1 | Objetivo 0 |
| console.log en prod | 1 | Objetivo 0 |
| TODO/FIXME/HACK | 3 (ninguno crítico) | — |
| ESLint config presente | ❌ No | Requerido |

## Recomendaciones priorizadas

### Prioridad 1 — Crear eslint.config.js inmediatamente

**Qué:** Crear `eslint.config.js` en la raíz con la configuración mínima para React + TypeScript + Hooks.

**Por qué:** Sin este fichero, `npm run lint` falla. No hay guardia de calidad ejecutable. Cuando se añada CI/CD (área 07), el step de lint no funcionará.

**Cómo:**
```js
// eslint.config.js
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
)
```
**Plan Maestro:** Sin PR asignado — añadir como tarea de Sprint actual.

### Prioridad 2 — Descomponer T4View.tsx

**Qué:** Extraer cada sub-componente interno a su propio fichero dentro de `T4_UseCasePriorityBoard/components/`.

**Por qué:** Con 2.329 líneas y 8+ componentes incrustados, cualquier cambio en T4 tiene probabilidad alta de introducir regresiones. Es el fichero de mayor riesgo del proyecto.

**Cómo:** Crear carpeta `src/modules/T4_UseCasePriorityBoard/components/` y mover `ExecDashboard`, `QuarterlyRoadmap`, `PriorityMatrix`, `StatusBadge`, `CategoryBadge`, `T4ScoreBars` a ficheros independientes.

**Plan Maestro:** Sin PR asignado — Sprint de refactoring T4.

### Prioridad 3 — Eliminar console.log en producción

**Qué:** Eliminar `console.log('[Companies] inviteUserToCompany (MOCK)')` en `companies.service.ts:68`.

**Por qué:** Log de datos internos visible en DevTools del cliente.

**Plan Maestro:** Fix puntual, 1 línea.
