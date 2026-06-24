# ADR-010: Sentry for error monitoring across DEV/PRE/PRO

**Status:** ACCEPTED
**Date:** 2026-06-02
**Proposed by:** Claude (P1-4 refactor session)
**Approved by:** Carlos Sánchez — 2026-06-02
**Supersedes:** —

---

## Context

GOBY had no production error monitoring. Runtime exceptions in the client bundle (React crashes, failed Supabase calls, LLM timeout errors) were invisible unless a user reported them explicitly. With a real client base in PRO, this created a silent-failure risk that could go undetected for days.

Three environments exist (DEV / PRE / PRO), each deployed independently on Vercel. A monitoring solution needed to work across all three without separate setups.

## Decision

We adopt **@sentry/react v10** as the single error monitoring solution. One Sentry project is used for all environments; errors are tagged with the `VITE_APP_ENV` environment variable (`development` | `pre` | `production`) so they can be filtered per environment in the Sentry dashboard.

Key design choices:
- `VITE_SENTRY_ENABLED=false` locally — prevents polluting the Sentry project during development
- `SENTRY_AUTH_TOKEN` is NOT prefixed with `VITE_` — it is a build-time secret used by `sentryVitePlugin` to upload sourcemaps and must never appear in the client bundle
- sourcemap upload only activates in PRO (when `SENTRY_AUTH_TOKEN` is present in Vercel)
- Session Replay enabled on errors only (`replaysOnErrorSampleRate: 1.0`), with `maskAllText: true` and `blockAllMedia: true` to respect RGPD/privacy constraints
- Trace sampling: 100% in DEV/PRE, 10% in PRO (quota control)

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Sentry** | Industry standard, good React integration, session replay, sourcemaps | Paid for volume | Chosen — free tier sufficient for current scale |
| LogRocket | Good session replay | Higher cost, no free tier for SPAs | Cost |
| Datadog | Full observability suite | Very expensive, overkill | Cost + complexity |
| No monitoring | Zero cost | Silent failures in production | Unacceptable risk |

## Consequences

### Positive
- Production errors surface immediately in Sentry dashboard with full stack trace
- Three environments share one Sentry project — no per-env setup
- Session replay on errors gives reproduction context
- `reportError()` utility wraps Sentry + console.error for stores

### Negative / Trade-offs accepted
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` must be configured manually in Vercel PRO
- Sentry DSN must be added to Vercel PRE and PRO environment variables

### Constraints introduced
- `ANTHROPIC_API_KEY` must NEVER be added as `VITE_` variable (already enforced)
- `SENTRY_AUTH_TOKEN` must NEVER be added as `VITE_SENTRY_AUTH_TOKEN`

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
