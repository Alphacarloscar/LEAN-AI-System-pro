# ADR-016: Establecer build.target es2022 en Vite para compatibilidad con esbuild >=0.28

**Status:** ACCEPTED
**Date:** 2026-06-13
**Proposed by:** Engineering
**Approved by:** Engineering — 2026-06-13
**Supersedes:** —
**Superseded by:** —

---

## Context

El override `"esbuild": ">=0.28.1"` en `package.json` (introducido para mitigar una vulnerabilidad de seguridad) resuelve a versiones de esbuild ≥0.28 que ya no soportan la transformación de destructuring de ES2015 hacia los targets de browser que Vite usa por defecto (`chrome87`, `edge88`, `es2020`, `firefox78`, `safari14`).

El build de CI fallaba con 22 errores del tipo:
```
Transforming destructuring to the configured target environment
("chrome87", "edge88", "es2020", "firefox78", "safari14" + 2 overrides) is not supported yet
```

Los errores afectaban al chunk `forms` (zod + react-hook-form), que usa destructuring estándar de ES2015. El problema es que esbuild ≥0.28 marcó esta combinación target/sintaxis como no soportada.

## Decision

Añadir `build.target: 'es2022'` explícito en `vite.config.ts`.

Con `es2022` como target, esbuild no necesita transformar destructuring porque todos los browsers objetivo (`chrome87+`, `firefox78+`, `safari14+`, `edge88+`) soportan ES2015 destructuring de forma nativa desde sus primeras versiones. La transformación era innecesaria y el nuevo esbuild se niega a hacerla.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **build.target: 'es2022'** | Fix mínimo, sin cambios de dependencias, compatible con todos los browsers objetivo | Target algo más moderno que el default de Vite | — (elegida) |
| Revertir override de esbuild | Elimina el conflicto | Reactiva la vulnerabilidad de seguridad | Inaceptable |
| Pinear esbuild a versión específica | Control exacto de versión | Frágil; requiere mantenimiento manual al actualizar Vite | No sostenible |
| build.target: 'esnext' | Cero transpilación | Sin garantías de compatibilidad en browsers más antiguos | Demasiado permisivo |

## Consequences

### Positive
- Build de CI pasa sin errores con esbuild >=0.28.x
- No se añaden dependencias ni se cambia la lógica de aplicación
- Compatible con Node >=22 (ya requerido en `engines`)

### Negative / Trade-offs accepted
- El bundle ya no se transpila hacia ES2020 en los chunks de vendor; los browsers objetivo ya lo soportan nativamente, por lo que en la práctica no hay diferencia de compatibilidad

### Constraints introduced
- Si en el futuro se necesita soporte para browsers más antiguos que ES2022 (Safari 13, Firefox 68, etc.), este target deberá revisarse junto con el override de esbuild

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
