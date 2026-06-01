# ADR-009: Claude API (Anthropic) vía Supabase Edge Functions para recomendaciones IA

**Status:** ACCEPTED
**Date:** 2026-05-15
**Proposed by:** Claude (co-arquitecto técnico)
**Approved by:** Carlos Sánchez (COO) — 2026-05-15
**Note:** Auto-generado durante AI-Ready Setup 2026-06-01. Evidencia: supabase/functions/ai-recommend/ + VITE_CLAUDE_API_KEY en .env.example.

---

## Context

El L.E.A.N. AI System incluye un motor de recomendaciones IA que genera:
- Política de IA corporativa contextualizada por sector (T6)
- Recomendaciones dinámicas basadas en scores de madurez (T1→T4→T6)
- ISO 42001 guidance contextualizada al perfil de riesgo del cliente

Estas funciones requieren llamar a un LLM con contexto del engagement. La API key de Claude (Anthropic) no puede exponerse al cliente — debe usarse server-side. El frontend es una SPA (no SSR), sin servidor propio.

`VITE_CLAUDE_API_KEY` en `.env.example` actúa como documentación de la variable — la key real solo existe en el entorno del servidor (Edge Function).

## Decision

**Claude API (Anthropic) invocada desde Supabase Edge Functions** (Deno), manteniendo la API key exclusivamente en el servidor. El frontend llama a la Edge Function autenticado vía token JWT de Supabase — la Edge Function verifica el token, extrae el contexto del engagement, llama a Claude API, y devuelve la respuesta.

Arquitectura:
```
Frontend → invoke('ai-recommend', { body: { engagementId } }) → Edge Function (Deno)
                                                                        ↓
                                                              Verifica JWT (RLS)
                                                                        ↓
                                                              Lee contexto de BD
                                                                        ↓
                                                              Claude API (Anthropic)
                                                                        ↓
                                                              Devuelve respuesta al frontend
```

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Supabase Edge Functions + Claude API** | Server-side key; RLS nativo; un solo proveedor de infraestructura (Supabase); Deno compatible con fetch nativo | Edge Functions en Deno (no Node.js) — diferencias de módulos | — (elegida) |
| Vercel API Routes | Node.js familiar; integrado con el frontend | Añade complejidad a vercel.json; otro punto de configuración de env vars; duplica infraestructura | Ya tenemos Edge Functions en Supabase |
| OpenAI GPT-4 | Alternativa conocida | Sin razón técnica para preferirlo; Claude tiene mejor razonamiento en contexto largo; consistencia (Claude es el co-arquitecto) | No hay ventaja sobre Claude API |
| API key en frontend (VITE_) | Implementación trivial | La API key quedaría expuesta en el bundle del cliente — inaceptable en términos de seguridad y coste | Prohibido absolutamente |

## Consequences

### Positive
- La API key de Anthropic nunca aparece en el código cliente ni en el bundle de Vite
- La Edge Function verifica el JWT antes de llamar a Claude — un usuario no autenticado no puede consumir la API
- El contexto del engagement se lee directamente desde la BD en la Edge Function — datos frescos y seguros
- Un solo proveedor de infraestructura para BD + Auth + IA serverless

### Negative / Trade-offs accepted
- Deno en Edge Functions tiene algunas diferencias con Node.js (`npm:` prefix para packages npm)
- Cold starts de Edge Functions pueden añadir latencia en la primera llamada
- `VITE_CLAUDE_API_KEY` en `.env.example` es documentación — el valor real solo existe en Supabase Dashboard → Edge Functions → Secrets

### Constraints introduced
- La Claude API key NUNCA debe ser una variable `VITE_` activa en producción (VITE_ = expuesto al cliente). Solo existe en Supabase Edge Function Secrets
- La Edge Function `ai-recommend` debe verificar el JWT antes de cualquier operación — sin autenticación, sin respuesta
- Los prompts del motor IA se gestionan en `supabase/functions/ai-recommend/prompts/` — cambios a prompts requieren deploy de Edge Function, no solo código frontend
- Cambios al modelo de Claude (ej: claude-3-5-sonnet → claude-opus-4) requieren ADR para documentar el impacto en coste y calidad

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
