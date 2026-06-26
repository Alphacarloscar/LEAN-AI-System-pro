# ADR-021: Design System Enforcement
> **Estado:** Propuesto · **Fecha:** 2026-06-22 · **Autor:** Alpha + Claude
> **Depende de:** ADR-011 (Service Layer), ADR-013 (File Size), ADR-020 (UX Consolidation)
> **Impacto:** Todos los módulos T1–T12, shared/design-system, CI pipeline

---

## Contexto

La auditoría de diseño (2026-06-22) reveló que el sistema de tokens y componentes del DS está correctamente definido pero insuficientemente forzado. Los datos:

- **751 HEX hardcodeados** en src/ (vs ~45 tokens canónicos)
- **491 clases gray/slate frías** contradiciendo la paleta warm
- **117 bg-* rainbow saturados** violando §2.3 del DESIGN-SYSTEM.md
- **96 strokeWidth violations** (sw=2 en lugar de 1.5)
- **277 clases m-{50..950} dead** que no producen CSS
- **12/12 módulos** con paleta fría infiltrada

La existencia de reglas advisory (DESIGN-SYSTEM.md) sin enforcement automático permite que cada nueva sesión de IA o desarrollo manual reintroduzca violaciones. ADR-011 resolvió este patrón para el service layer con ESLint bloqueante. Aplicamos el mismo principio al sistema de diseño.

## Decisión

### 1. Extensión de CSS vars (:root)

Añadir los tokens faltantes que causan hardcoding masivo:

```css
:root {
  /* Escala warm completa (faltan warm-200 a warm-800) */
  --color-warm-200: #D4D0C8;
  --color-warm-300: #B8B4AB;
  --color-warm-400: #9A9790;
  --color-warm-500: #8A857C;
  --color-warm-600: #6B6864;
  --color-warm-700: #4A4740;
  --color-warm-800: #2A2822;

  /* Semánticos light/dark (causan >100 HEX hardcodeados) */
  --color-success-light: #E8F5EE;
  --color-success-dark: #5FAF8A;
  --color-warning-light: #FEF6E8;
  --color-warning-dark: #D4A85C;
  --color-danger-light: #FDECEC;
  --color-danger-dark: #C06060;
  --color-info-light: #EBF2FA;
  --color-info-dark: #6A90C0;
}
```

### 2. Reglas ESLint bloqueantes (CI gate)

```js
// eslint.config.js — Design System enforcement rules
{
  rules: {
    // PROHIBIR clases gray/slate frías
    'no-restricted-syntax': ['error', {
      selector: 'JSXAttribute[name.name="className"][value.value=/\\b(bg|text|border)-(gray|slate)-/]',
      message: 'ADR-021: Usar equivalentes warm-* en lugar de gray/slate. Ver DESIGN-SYSTEM.md §2.'
    }],

    // PROHIBIR HEX hardcodeados en className y style
    // (excepto en archivos *Tokens.ts, *constants.ts, *PDF*.tsx)
    'no-restricted-syntax': ['error', {
      selector: 'JSXAttribute[name.name="style"] Property[key.name="color"][value.value=/^#/]',
      message: 'ADR-021: Usar token CSS var o clase Tailwind. HEX hardcodeado prohibido.'
    }],

    // PROHIBIR sombras pesadas
    'no-restricted-syntax': ['error', {
      selector: 'JSXAttribute[name.name="className"][value.value=/shadow-(lg|xl|2xl)/]',
      message: 'ADR-021: Máximo shadow-md. Ver DESIGN-SYSTEM.md §5.'
    }],

    // PROHIBIR rounded-2xl y rounded-3xl
    'no-restricted-syntax': ['error', {
      selector: 'JSXAttribute[name.name="className"][value.value=/rounded-(2xl|3xl)/]',
      message: 'ADR-021: Usar rounded-xl para cards. Ver GOBY-DESIGN-DIRECTION.md §4.3.'
    }],
  }
}
```

**Nota:** Las reglas anteriores son pseudocódigo conceptual. La implementación real usará `eslint-plugin-regexp` o un plugin custom para matchear patrones dentro de strings de className. La implementación exacta se define en el prompt de ejecución de Fase 0.

### 3. Override de gray → warm en light mode

El override actual en `src/index.css` solo cubre dark mode. Extender a light:

```css
/* Light mode: gray → warm equivalents */
.bg-gray-50 { background-color: var(--color-warm-50) !important; }
.bg-gray-100 { background-color: #F0EDE8 !important; }
.bg-gray-200 { background-color: var(--color-warm-200) !important; }
.text-gray-400 { color: var(--color-warm-400) !important; }
.text-gray-500 { color: var(--color-warm-500) !important; }
.text-gray-600 { color: var(--color-warm-600) !important; }
.text-gray-700 { color: var(--color-warm-700) !important; }
.border-gray-200 { border-color: var(--color-warm-200) !important; }
.border-gray-300 { border-color: var(--color-warm-300) !important; }
```

**Objetivo transitorio:** Este override actúa como red de seguridad mientras se ejecuta la migración real (reemplazar clase por clase). Una vez completada la migración, se elimina el override y se activa la regla ESLint bloqueante.

### 4. chartTokens.ts como única fuente para colores de gráfico

Extender `src/shared/design-system/charts/chartTokens.ts` para cubrir:

```ts
// Colores de cuadrante (T3, T4 scatter/matrix)
export const QUADRANT_COLORS = {
  topRight: getThemeColor('--color-success-dark'),
  topLeft: getThemeColor('--color-warning-dark'),
  bottomRight: getThemeColor('--color-info-dark'),
  bottomLeft: getThemeColor('--color-warm-400'),
} as const;

// Segmentos de Rogers (T7 bell curve)
export const ROGERS_SEGMENT_COLORS = {
  innovators: getThemeColor('--color-success-dark'),
  earlyAdopters: getThemeColor('--color-gold'),
  earlyMajority: getThemeColor('--color-info-dark'),
  lateMajority: getThemeColor('--color-warning-dark'),
  laggards: getThemeColor('--color-warm-400'),
} as const;

// Dominios IA (T5 portfolio map)
export const DOMAIN_COLORS = {
  predictive: '#6A90C0',   // azul acero desaturado
  assistant: '#C8860A',    // gold warm
  optimization: '#5FAF8A', // esmeralda apagado
  agentic: '#7BA882',      // verde salvia
  autoAI: '#B08D6A',       // cobre warm
  rpa: '#8A857C',          // gris pizarra warm
} as const;

// Hero color con tokens del DS (reemplaza heroColor() de T10)
export function getHeroColor(score: number): string {
  if (score < 30) return getThemeColor('--color-danger');
  if (score < 60) return getThemeColor('--color-warning');
  return getThemeColor('--color-success');
}
```

### 5. Purga de dead classes

Script de codemod para eliminar las 277 clases `m-{50..950}`:

```bash
# Patrón: clases tipo m-50, m-100, m-200... m-950 que no existen en Tailwind
find src/ -name '*.tsx' -exec sed -i -E 's/\bm-([0-9]{2,3})\b//g' {} +
```

Ejecutar manualmente por Claude Code con verificación post-ejecución (`npm run typecheck`).

## Consecuencias

### Positivas
- El CI bloquea nuevas violaciones del DS, cerrando la puerta a la re-contaminación por agentes IA
- Los tokens CSS vars centralizados eliminan la necesidad de hardcodear HEX
- chartTokens.ts como Single Source of Truth para colores de gráfico reduce la superficie de drift
- La purga de dead classes reduce ruido en el codebase (~277 instancias menos)

### Negativas
- La fase de migración (reemplazar gray → warm) toca 12 módulos — riesgo de regresiones visuales
- Los archivos PDF (PolicyPDF, auditReport, generateOperatingModelHTML) necesitan sus HEX inline — se excluyen de la regla ESLint pero deben mapear a los mismos valores del DS
- El override transitorio de gray en light mode usa `!important` — deuda temporal aceptada si se purga en Fase 2

### Riesgos
- Los custom charts SVG (T1 spider, T2 quadrant, T7 bell curve) usan HEX calculados en JS — la migración a chartTokens requiere refactor individual por componente
- El cambio de strokeWidth 2→1.5 en T8 (43 iconos) puede alterar la densidad visual percibida del timeline — validar manualmente

## Alternativas rechazadas

1. **Stylelint en lugar de ESLint** — descartado porque el 90% de los estilos están en className strings de JSX, no en CSS files
2. **Tailwind prefix para tokens custom** — descartado porque aumenta la curva de aprendizaje sin beneficio; el sistema actual de extend.colors es correcto
3. **CSS Modules o styled-components** — descartado por principio de mínima fricción; Tailwind está bien adoptado

---

*Este ADR se activa al mergearse. Las reglas ESLint se implementan en Fase 0 del Plan de Migración Visual.*
