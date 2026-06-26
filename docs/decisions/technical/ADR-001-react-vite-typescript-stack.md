# ADR-001: React 18 + Vite + TypeScript como stack frontend

**Status:** ACCEPTED
**Date:** 2026-04-19
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-04-19
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01 desde análisis del repositorio. Documenta la decisión tomada en Sprint 0 (ARQUITECTURA.md D1).

---

## Context

En Sprint 0 fue necesario elegir el stack frontend para un sistema de 13 herramientas (T1-T13) con visualizaciones complejas (gráficos de araña, heatmaps, Gantt, dashboards), generación de PDFs ejecutivos, y un contexto de desarrollo donde Claude escribe ≥98% del código y Carlos revisa sin usar terminal.

Requisitos clave:
- Ecosistema rico en documentación para asistencia de IA efectiva
- TypeScript obligatorio por la complejidad del dominio (13 herramientas, grafo de dependencias)
- Build tool moderno que no requiera configuración compleja
- Compatible con Supabase, Recharts, react-router-dom y @react-pdf/renderer
- Storybook disponible para sistema de diseño (Sprint 0.5)

## Decision

**React 18 + Vite 6 + TypeScript 5.7 (strict mode desde el día 1)** como stack frontend, con Tailwind CSS para estilos, Recharts para visualizaciones, y @react-pdf/renderer para PDFs.

Elegimos React porque es el ecosistema dominante en AI-assisted coding: más training data disponible para Claude, mayor cobertura de documentación nativa por parte de las librerías del stack (Supabase, Recharts, Lucide). Vite porque su HMR es prácticamente instantáneo y su configuración es mínima. TypeScript strict porque para un proyecto donde la IA escribe el código, el tipado estático detecta errores en tiempo de desarrollo y documenta el código como efecto colateral — coste bajo, beneficio alto.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **React 18 + Vite + TypeScript** | Ecosistema dominante en AI coding, docs ricas, compatible con todo el stack | Bundle size mayor que alternativas más ligeras | — (elegida) |
| Next.js + TypeScript | SSR nativo, mejor SEO, app router moderno | Complejidad extra innecesaria para SPA de aplicación interna; deploy en Vercel más complejo de controlar sin CLI | No necesitamos SSR para una app B2B SaaS |
| Vue 3 + Vite + TypeScript | Menor curva de aprendizaje, excelente docs | Menor training data para Claude, menor ecosistema de librerías enterprise | Peor experiencia de AI-assisted coding |
| SvelteKit | Bundle más pequeño, rendimiento excelente | Ecosistema reducido, menor compatibilidad con las librerías elegidas | Riesgo en disponibilidad de librerías |

## Consequences

### Positive
- TypeScript strict captura bugs antes de llegar a producción
- Claude puede asistir con mayor precisión al tener más contexto de entrenamiento sobre este stack
- Recharts, Supabase, react-hook-form y todas las dependencias tienen tipos de TypeScript de primera calidad
- Storybook funciona nativamente con React + Vite
- Vite chunks manuales (configurados en vite.config.ts) optimizan el caching por módulo

### Negative / Trade-offs accepted
- React tiene un bundle base mayor que Svelte/Solid
- Recharts es ~540KB minificado (aceptado: configurado `chunkSizeWarningLimit: 600` en Vite)
- No hay SSR — SEO es irrelevante para una app B2B de acceso autenticado

### Constraints introduced
- Nuevas dependencias de UI deben ser React-compatible (no vanilla JS puro sin wrapper)
- No se puede migrar a Vue/Svelte sin reescritura completa — esta decisión es permanente para el MVP
- Todos los componentes deben tiparse explícitamente — `any` en interfaces de datos está prohibido (red flag en CLAUDE.md)

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
