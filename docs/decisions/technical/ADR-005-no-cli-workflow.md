# ADR-005: Workflow sin CLI — Carlos opera exclusivamente vía web (GitHub / Vercel / Supabase Dashboard)

**Status:** ACCEPTED
**Date:** 2026-04-19
**Proposed by:** Carlos Sánchez (COO)
**Approved by:** Carlos Sánchez (COO) — 2026-04-19
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Documenta la decisión D5 de ARQUITECTURA.md. Esta decisión es operativa y afecta a cómo Claude entrega trabajo.

---

## Context

Carlos Sánchez (COO, co-fundador) es el único revisor y aprobador humano del sistema. Su perfil es técnico-metodológico pero no quiere (ni necesita) usar terminal para el flujo de trabajo diario. El objetivo es que Carlos pueda aprobar código, revisar PRs, y validar deploys desde interfaces web, sin dependencia de un entorno de desarrollo local configurado.

Claude asume toda la ejecución técnica: escribe código, crea migraciones SQL, prepara scripts y configura workflows — Carlos solo revisa, aprueba y ejecuta desde dashboards web.

## Decision

**Workflow completamente web para Carlos**:
- **Código y PRs**: GitHub web UI (crear ramas, revisar diffs, aprobar PRs, hacer merge)
- **Deploys**: Vercel Dashboard (ver estado de deploys, activar/pausar, gestionar env vars)
- **Migraciones de BD**: Supabase Dashboard → SQL Editor (pegar SQL preparado por Claude, ejecutar, verificar)
- **Variables de entorno**: Vercel Dashboard → Project Settings → Environment Variables

Claude entrega cada cambio de base de datos como un SQL script completo con instrucciones paso a paso para Supabase SQL Editor. Nunca como un comando `supabase migration run` o similar.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Web-only para Carlos** | Sin dependencias de entorno local; Carlos puede trabajar desde cualquier dispositivo; reduce fricción en el flujo de revisión | Carlos no puede hacer hotfixes directos en terminal; depende de Claude para ejecución técnica | — (elegida) |
| CLI completa para Carlos | Máxima flexibilidad; Carlos podría ejecutar por su cuenta | Curva de aprendizaje; errores de entorno; dependencia de máquina específica | Carlos prefiere enfocarse en producto y revisión, no en operaciones técnicas |
| Automatización total via CI/CD | Carlos no toca nada | Requiere configuración de CI robusta desde el principio | Se implementa gradualmente con GitHub Actions (ADR pendiente para CI completo) |

## Consequences

### Positive
- Carlos puede revisar y aprobar desde cualquier navegador/dispositivo
- Cero errores de "funciona en mi máquina" — el entorno local de Carlos no existe como variable
- Flujo claro: Claude propone → Carlos revisa en GitHub → Carlos ejecuta SQL en Supabase Dashboard → Carlos aprueba deploy en Vercel
- Las instrucciones de Carlos siempre están en lenguaje natural, nunca en comandos de terminal

### Negative / Trade-offs accepted
- Carlos depende de Claude para cualquier operación técnica de ejecución
- Si Claude comete un error en un SQL script, Carlos lo ejecuta sin poder validarlo localmente antes
- Las migraciones requieren que Carlos copie/pegue SQL manualmente → riesgo de error humano mitigado con scripts pequeños y verificables

### Constraints introduced
- **Claude NUNCA dará instrucciones CLI a Carlos**. Si una tarea requiere terminal, Claude la ejecuta o la automatiza vía GitHub Actions
- Toda migración SQL se entrega como script completo con: (1) script SQL, (2) instrucciones "abre Supabase Dashboard → SQL Editor → pega → ejecuta", (3) query de verificación
- Las variables de entorno de producción las gestiona Carlos directamente en Vercel Dashboard — Claude nunca las ve ni manipula
- Ninguna instrucción de onboarding puede incluir `npm install -g`, `brew install`, o comandos de sistema

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
