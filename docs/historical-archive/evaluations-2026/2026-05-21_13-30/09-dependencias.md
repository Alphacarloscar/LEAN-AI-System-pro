# Área 09 — Dependencias   🟡

**Puntuación:** 5/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

El stack de dependencias es moderno y adecuado al proyecto. El problema principal es la presencia de `xlsx` (SheetJS) v0.18.5, que tiene CVEs conocidos de prototype pollution y lleva sin actualizarse desde 2023. Además, `@supabase/auth-helpers-react` está deprecado oficialmente. No hay proceso automatizado de auditoría de dependencias (npm audit en CI).

## Hallazgos

### 🔴 Críticos

- **xlsx v0.18.5 con CVEs conocidos**: SheetJS (xlsx) v0.18.5 tiene vulnerabilidades conocidas de prototype pollution (CVE-2023-30533 y relacionadas). El paquete fue fork-spammed en npm y la versión pública en npm no recibe actualizaciones de seguridad desde 2023. Si el proyecto usa xlsx para importar/exportar datos de clientes, esto es un riesgo real. La alternativa es usar la versión de pago desde el repositorio oficial del autor o migrar a `exceljs`.

### 🟡 Mejorables

- **`@supabase/auth-helpers-react` deprecado** (también en Área 06): Sin updates de seguridad. Migrar a `@supabase/ssr`.

- **41 deps con `^` (caretas)**: Todas las dependencias usan `^` (compatible semver), lo que significa que `npm install` puede traer versiones menores que rompan comportamiento. Considerando que no hay CI ni tests, una actualización accidental de `recharts ^2.13.3 → ^2.14.x` podría cambiar la renderización de los charts sin detección.

- **Sin `npm audit` automatizado**: No hay proceso que detecte nuevas vulnerabilidades en las dependencias existentes. Si aparece un CVE en recharts o zustand, no hay alerta.

- **Storybook v8.4.7 (6 paquetes)**: Storybook ocupa 6 devDependencies y tiene su propio sistema de build pero no hay stories implementadas. Es deuda de configuración activa.

### 🟢 Correctos

- Stack principal (React 18, Vite 6, TypeScript 5.7, Tailwind 3.4) está en versiones actuales.
- Zustand v5, Zod v3, react-hook-form v7, react-router-dom v6 — dependencias sanas.
- No hay dependencias duplicadas visibles ni conflictos de peer deps.
- `package-lock.json` presente (lockfile reproducible).

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Total dependencias | 41 | — |
| Deps con CVEs conocidos | 1 (xlsx) | Objetivo 0 |
| Deps deprecadas oficialmente | 1 (@auth-helpers) | Objetivo 0 |
| Deps con ^ (drift risk) | 41/41 | — |
| npm audit en CI | ❌ No | Recomendado |

## Recomendaciones priorizadas

### Prioridad 1 — Reemplazar o actualizar xlsx

**Qué:** Evaluar migración de `xlsx` a `exceljs` (activamente mantenido) o usar la versión de pago de SheetJS desde su repositorio oficial.

**Por qué:** SheetJS v0.18.5 tiene CVEs activos. Si se usa para procesar ficheros Excel subidos por el cliente, es un vector de ataque.

**Cómo alternativa inmediata:**
```bash
npm install exceljs
npm uninstall xlsx
```

**Plan Maestro:** Sin PR asignado.

### Prioridad 2 — Añadir npm audit al CI (cuando exista)

**Qué:** En el workflow de GitHub Actions (Área 07), añadir el step:
```yaml
- run: npm audit --audit-level=high
```

**Por qué:** Detecta automáticamente nuevas vulnerabilidades en cada push.

**Plan Maestro:** Incluido en el workflow de Área 07.

### Prioridad 3 — Eliminar Storybook o comenzar a usarlo

**Qué:** Decisión binaria: (a) crear 1 story por componente shared en el próximo sprint y mantener Storybook como catálogo vivo, o (b) eliminar los 6 paquetes de Storybook de devDependencies para reducir la superficie y el tiempo de `npm install`.

**Plan Maestro:** Sin PR asignado.
