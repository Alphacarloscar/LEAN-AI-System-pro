# ADR-017: Sistema de Audit Logging transversal mediante patrón Proxy

**Status:** ACCEPTED
**Date:** 2026-06-15
**Proposed by:** Carlos Sánchez - Alpha Consulting
**Approved by:** Carlos Sánchez - Alpha Consulting — 2026-06-15
**Supersedes:** —
**Superseded by:** —

---

## Context

GOBY gestiona datos sensibles de clientes (evaluaciones de madurez IA, gobernanza, roadmaps) en
un entorno multi-tenant. No existe trazabilidad de las acciones de usuario a nivel de servicio:
si un dato cambia o desaparece, no hay forma de saber quién lo modificó, cuándo ni con qué
parámetros. Esta ausencia bloquea dos requisitos emergentes:

1. **Auditoría de cumplimiento** — clientes enterprise exigen evidencia de quién accedió a qué.
2. **Calidad de datos de IA** — el roadmap de IA generativa requiere contexto de uso real
   (qué herramientas se invocan, con qué datos, con qué latencias) para mejorar los modelos.

Añadir logging manual en cada servicio (`t1.service.ts`, `companies.service.ts`, etc.) sería
invasivo, propenso a omisiones y costoso de mantener. Se necesita una solución transversal.

## Decision

Implementar un interceptor de auditoría no intrusivo basado en el **patrón Proxy de JavaScript**
con tipado estricto TypeScript, estructurado en cuatro módulos bajo `src/lib/audit/`:

| Módulo | Responsabilidad |
|--------|----------------|
| `types.ts` | Contratos TypeScript: `AuditLogInsert`, `AuditLogRow`, `AuditAIMetadata` |
| `context.ts` | Singleton de contexto de usuario — desacoplado de React y del Auth store |
| `auditClient.ts` | Escritor fire-and-forget hacia la tabla `audit_logs` de Supabase |
| `makeAuditable.ts` | Proxy factory genérico `makeAuditable<T>(service, name) → T` |

**Principios de diseño:**

- **Tipo preservado:** `makeAuditable` recibe `T` y devuelve `T`. El autocompletado del servicio
  original permanece 100% intacto. No hay casting en el punto de uso.
- **Fire-and-forget:** `fireAuditLog` usa `void promise.then().catch()`. Un fallo en la inserción
  de logs nunca propaga una excepción al caller.
- **Re-throw garantizado:** en el bloque `catch` del Proxy, el error original siempre se
  re-lanza (`throw error`) para no alterar el comportamiento de la UI ni de los stores.
- **PII mínimo:** los argumentos se pasan por `maskSensitive()` antes de serializar.
  Las claves `password`, `token`, `secret` y derivadas se redactan como `[REDACTED]`.
- **Respuesta truncada:** `response_payload` se limita a 4.000 caracteres para evitar filas
  masivas en operaciones de lista (`fetchT1Data`, `listCompanies`, etc.).
- **Sin dependencias cruzadas:** `lib/audit/` no importa nada de `modules/`. El contexto
  de usuario se extrae server-side en la Edge Function `log-audit-event` a partir del JWT.

**Schema de la tabla `audit_logs` (implementado en `supabase/migrations/20260615_003_audit_system.sql`):**

```
audit_logs
  id               uuid        PK default gen_random_uuid()
  created_at       timestamptz default now()
  user_id          uuid        FK → auth.users(id)  nullable
  user_email       text        nullable
  user_role        text        nullable
  service_name     text        NOT NULL
  method_name      text        NOT NULL
  args_payload     jsonb       NOT NULL
  status           text        CHECK (status IN ('success','error'))
  response_payload jsonb       nullable
  error_message    text        nullable
  error_stack      text        nullable
  duration_ms      integer     NOT NULL
  resource_id      text        nullable
  metadata         jsonb       NOT NULL default '{}'
```

**RLS:** cada usuario ve solo sus propias filas (`user_id = auth.uid()`). El superadmin
accede exclusivamente vía `get_audit_logs()` SECURITY DEFINER (ADR-019). Las inserciones
se realizan desde la Edge Function `log-audit-event` con `service_role` (bypass RLS) —
el contexto de usuario se extrae server-side del JWT, no desde el cliente.

**Flujo de escritura:**
`makeAuditable` → `fireAuditLog` → `supabase.functions.invoke('log-audit-event')` →
Edge Function verifica JWT → INSERT con service_role.

**Punto de uso en servicios (ejemplo):**

```typescript
import * as companiesService from '@/services/companies.service'
import { makeAuditable }     from '@/lib/audit'

export const auditableCompanies = makeAuditable(companiesService, 'companies')
// Tipo inferido: typeof companiesService — autocompletado intacto.
```

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **Proxy en makeAuditable** | Type-safe, no intrusivo, un solo punto de cambio | Cast `as T` necesario (limitación conocida de TS con Proxy) | — (elegida) |
| Logging manual en cada servicio | Explícito, fácil de entender | Invasivo, propenso a omisiones, ~14 archivos a modificar | Coste de mantenimiento inaceptable |
| Middleware de Supabase (fetch interceptor) | Captura absolutamente todo | Acceso a objetos internos de Supabase, frágil ante upgrades | Acoplamiento al cliente, sin acceso a nombres de método |
| Decoradores TypeScript | Sintaxis idiomática | Requieren `experimentalDecorators`, inestables en TS 5.x | Complejidad de tooling, sin soporte nativo en Vite |

## Consequences

### Positive
- Trazabilidad completa de todos los servicios sin modificar ningún servicio existente.
- El campo `metadata` + `AuditAIMetadata` prepara el sistema para correlacionar logs
  con generaciones de IA (`tool_code`, `engagement_id`, `prompt_tokens`).
- `duration_ms` expone latencias reales por método, útil para detectar regresiones de rendimiento.
- Los logs sobreviven a errores de la aplicación: se registran incluso antes de re-lanzar.

### Negative / Trade-offs accepted
- El cast `as T` en el retorno del Proxy es una concesión a una limitación de TypeScript.
  El runtime es correcto; solo TypeScript no puede verificar el Proxy estructuralmente.
- La serialización con `JSON.stringify` descarta funciones y Symbols en los argumentos.
  Esto es aceptable: los servicios no reciben funciones como parámetros.
- `fireAuditLog` no tiene garantía de entrega: si Supabase está caído, el log se pierde
  silenciosamente. Aceptado: la disponibilidad de la app tiene prioridad sobre los logs.

### Constraints introduced
- Todos los servicios instrumentados deben exportarse como objetos o namespace imports
  (`import * as svc from '...'`), no como destructuring plano en el punto de uso auditable.
- La Edge Function `log-audit-event` debe estar desplegada y la tabla `audit_logs` debe
  existir antes de activar `makeAuditable` en producción; de lo contrario, los invokes
  fallan silenciosamente (fire-and-forget garantiza que esto no afecte a la app).
- El schema de la Edge Function y el de `audit_logs` deben mantenerse sincronizados —
  un cambio de columna en la tabla requiere actualizar el handler de la función.

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
