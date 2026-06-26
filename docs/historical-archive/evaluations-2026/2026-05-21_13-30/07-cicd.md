# Área 07 — CI/CD y Entornos   🔴

**Puntuación:** 2/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

No hay pipeline de CI/CD. No existe carpeta `.github/` ni ningún workflow de GitHub Actions. El deploy a Vercel se asume que ocurre desde Vercel's GitHub integration (auto-deploy en push a main), pero sin ningún gate de calidad previo: typecheck, lint, test o build. Solo existe una rama (main). La arquitectura documenta la existencia de entornos prod/staging separados pero no hay evidencia en el repositorio de que estén activos.

## Hallazgos

### 🔴 Críticos

- **Sin GitHub Actions**: No hay carpeta `.github/`, no hay ningún workflow. Cada push a `main` puede llegar a producción sin typecheck, sin lint, sin test.

- **Deploy sin gate de calidad**: El script `build` es `tsc --noEmit && vite build`, que ejecuta typecheck. Pero solo se ejecuta si alguien lanza `npm run build` manualmente. Si Vercel tiene auto-deploy desde GitHub, puede deployar código con errores de TypeScript porque no tiene configurada la fase de build con los checks adicionales.

- **Solo una rama (main)**: La ARQUITECTURA.md documenta una separación `main` (prod) / `develop` (dev) y dos proyectos Supabase separados. En el repositorio solo existe la rama `main`. No hay `develop`.

### 🟡 Mejorables

- **vercel.json mínimo**: Solo contiene el rewrite SPA. No hay configuración de `env`, `buildCommand`, `outputDirectory`, ni `headers` de seguridad (HSTS, CSP, X-Frame-Options).

- **Sin environment variables documentadas en Vercel**: No hay referencia a qué variables deben estar configuradas en el proyecto de Vercel de producción vs. staging.

- **Sin rama develop activa**: Aunque el flujo está documentado, no está implementado. Todo el desarrollo ocurre directamente en main.

### 🟢 Correctos

- Script `build` incluye `tsc --noEmit` antes de `vite build` — el typecheck bloquea el build localmente.
- `vercel.json` tiene el rewrite correcto para SPA (todas las rutas → index.html).
- Los commits tienen mensajes descriptivos con convención `feat/fix/docs(scope): descripción`.

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| GitHub Actions workflows | 0 | Objetivo ≥1 |
| Gate de typecheck en CI | ❌ No | Requerido |
| Gate de lint en CI | ❌ No | Requerido |
| Gate de test en CI | ❌ No | Requerido |
| Ramas activas | 1 (main) | Objetivo ≥2 |
| Headers de seguridad en vercel.json | ❌ No | Recomendado |
| Convención de commits | ✅ Sí | — |

## Recomendaciones priorizadas

### Prioridad 1 — Crear GitHub Actions workflow básico

**Qué:** Crear `.github/workflows/ci.yml` con los pasos: checkout → setup node → npm ci → typecheck → lint → build.

**Por qué:** Sin CI, la primera vez que un error de TypeScript llegue a producción no habrá nada que lo hubiera impedido. Es la red de seguridad más básica.

**Cómo:**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint        # requiere eslint.config.js (Área 01)
      - run: npm run build
```

**Plan Maestro:** Sin PR asignado — depende de eslint.config.js (Área 01, Prioridad 1).

### Prioridad 2 — Crear rama develop y activar el flujo documentado

**Qué:** `git checkout -b develop && git push origin develop`. Configurar en Vercel: rama `develop` → proyecto staging, rama `main` → proyecto producción.

**Por qué:** Actualmente todo el trabajo ocurre en main y va directamente a producción. Un error de merge no tiene buffer.

**Plan Maestro:** Sin PR asignado.

### Prioridad 3 — Añadir headers de seguridad en vercel.json

**Qué:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Plan Maestro:** Sin PR asignado.
