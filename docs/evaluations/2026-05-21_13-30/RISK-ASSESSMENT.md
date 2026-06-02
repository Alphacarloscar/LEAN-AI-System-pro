# Evaluación de Riesgos — L.E.A.N. AI System Enterprise
**Fecha:** 2026-05-21 | **Alcance:** Producto + operación + mercado  
**Propietario:** Carlos Sánchez (COO)

---

## Registro de riesgos — ordenado por nivel

### 🔴 Riesgos críticos

| # | Riesgo | Categoría | Probabilidad | Impacto | Nivel | Mitigación | Estado |
|---|--------|-----------|-------------|---------|-------|-----------|--------|
| R1 | **VITE_CLAUDE_API_KEY expuesta en bundle cliente.** Un usuario del producto que abra DevTools → Sources puede extraer la key y hacer requests a la API de Anthropic con el crédito de Alpha. | Seguridad | Alta | Alto | 🔴 Crítico | Eliminar de .env.example; redirigir todas las llamadas LLM a la Edge Function de Supabase donde la key es una variable de servidor. | Abierto |
| R2 | **0 tests en producción.** Cualquier sprint puede introducir una regresión en los cálculos de T1 (madurez), T4 (ROI), T2 (stakeholders) que llegue al cliente sin detección. Para un producto de consultoría enterprise donde los números importan, un cálculo incorrecto daña la credibilidad de Alpha. | Técnico | Alta | Alto | 🔴 Crítico | Instalar Vitest y comenzar con tests de stores T1-T4 que cubran la lógica de cálculo. CI gate que bloquee el merge sin tests verdes. | Abierto |
| R3 | **Sin error tracking.** Si la app falla en producción con un cliente, Carlos no lo sabe hasta que el cliente llama. El tiempo de detección de incidentes es indefinido. | Operacional | Alta | Alto | 🔴 Crítico | Instalar Sentry (plan gratuito). Actualizar ErrorBoundary para reportar. | Abierto |
| R4 | **Divergencia UserRole (5 roles en código vs 4 en BD).** El control de acceso de la interfaz (botones, secciones visibles) se basa en comparaciones de rol que son siempre `false` para los roles correctos de la BD. | Técnico | Alta | Alto | 🔴 Crítico | ADR D-10: actualizar domain.types.ts y hacer grep exhaustivo de comparaciones de rol. | Abierto |

---

### 🟡 Riesgos altos

| # | Riesgo | Categoría | Probabilidad | Impacto | Nivel | Mitigación | Estado |
|---|--------|-----------|-------------|---------|-------|-----------|--------|
| R5 | **Sin CI/CD.** Código con errores TypeScript puede llegar a main y desplegarse a Vercel. Un build roto en producción durante una demo con cliente es impacto reputacional directo. | Técnico | Media | Alto | 🟡 Alto | GitHub Actions con typecheck + lint + build. Branch protection en main. | Abierto |
| R6 | **Migraciones SQL manuales.** Cada migración se aplica a mano en Supabase Dashboard. Una migración aplicada en el orden equivocado o con un typo puede corromper datos de producción sin posibilidad de rollback automatizado. | Operacional | Media | Alto | 🟡 Alto | Documentar cada SQL antes de ejecutar. Backup pg_dump antes de cada migración. Aplicar primero en dev. Nunca aplicar viernes. | Parcial |
| R7 | **CVE en xlsx v0.18.5.** Si el producto procesa ficheros Excel subidos por el cliente (probable en flujos de onboarding), la vulnerabilidad de prototype pollution es un vector de ataque real. | Seguridad | Media | Alto | 🟡 Alto | Migrar a exceljs. Estimado 3h. | Abierto |
| R8 | **Un único developer.** Carlos es el único developer del proyecto. Si no puede trabajar por enfermedad, viaje o sobrecarga, el desarrollo se para completamente. | Operacional | Media | Alto | 🟡 Alto | Documentación técnica actualizada (ARQUITECTURA.md existe — bien). Evaluar incorporar un segundo developer cuando el primer cliente SaaS entre. | Parcial |
| R9 | **Sin analytics de producto.** Alpha no sabe qué módulos usan sus consultores, cuánto tiempo pasan, ni dónde abandonan. En la fase de validación con primeros clientes, esto impide tomar decisiones de producto basadas en datos reales. | Estratégico | Alta | Medio | 🟡 Alto | Instalar PostHog (free tier). Tracking mínimo: navegación entre módulos T1-T12. | Abierto |
| R10 | **Branding "GOBY" activo en producción.** La pantalla de login y el footer de la sidebar muestran "GOBY" (nombre del proyecto anterior). Un nuevo cliente que hace su primera sesión ve el nombre incorrecto del producto. | Reputacional | Alta | Medio | 🟡 Alto | 2 líneas de código. 5 minutos. Sin justificación para no hacerlo hoy. | Abierto |

---

### 🟢 Riesgos medios y bajos

| # | Riesgo | Categoría | Probabilidad | Impacto | Nivel | Mitigación |
|---|--------|-----------|-------------|---------|-------|-----------|
| R11 | `@supabase/auth-helpers-react` deprecado — sin actualizaciones de seguridad. | Seguridad | Baja | Medio | 🟢 Medio | Migrar a `@supabase/ssr` en Sprint 3. |
| R12 | `database.types.ts` manual — puede divergir del esquema real de BD en migraciones futuras. | Técnico | Media | Medio | 🟢 Medio | Activar Supabase CLI codegen en CI. |
| R13 | Issues WCAG 2.1 AA — 5 críticos. Si un cliente enterprise audita accesibilidad del producto, Alpha puede no pasar. | Compliance | Baja | Medio | 🟢 Medio | Resolver P1 de A11Y-AUDIT.md en Sprint 1 (2-3h). |
| R14 | Solo rama `main` — un merge accidental de código inestable rompe producción directamente. | Proceso | Media | Bajo | 🟢 Bajo | Crear rama `develop`. Branch protection en main exigiendo PR + CI. |
| R15 | Competencia de big4 con capacidades IA propias. McKinsey, BCG y Accenture están invirtiendo fuertemente en plataformas internas de AI adoption. | Estratégico | Alta | Medio | 🟢 Medio | Diferenciación por metodología propietaria, precio, agilidad y proximidad al cliente español. |

---

## Matriz de riesgos

```
         IMPACTO
         Bajo │ Medio │ Alto
    ─────────┼───────┼──────
Alta │  R14  │R9,R10 │R1,R2,R3,R4
PROB─────────┼───────┼──────
Media│       │R11,R12│R5,R6,R7,R8
    ─────────┼───────┼──────
Baja │       │R13,R15│
```

---

## Decisiones de aceptación de riesgo

Los siguientes riesgos se aceptan explícitamente por decisión de negocio en la fase actual del producto:

| Riesgo | Decisión de aceptación | Trigger para revisar |
|--------|----------------------|---------------------|
| Sin MFA obligatorio aún | Producto en MVP, base de usuarios controlada | Primer cliente enterprise que lo exija en contrato |
| Sin WAF ni DDoS protection | Tráfico bajo, Vercel tiene protección básica | >1000 usuarios activos o cliente que exija compliance específico |
| Sin backup automatizado de Supabase | Supabase hace backups diarios en plan Pro | Migrar a plan Pro cuando el primer cliente esté en producción real |

---

## Plan de mitigación prioritario — próximas 4 semanas

| Semana | Acciones | Riesgos que cierra |
|--------|---------|-------------------|
| Esta semana | Eliminar VITE_CLAUDE_API_KEY · Corregir GOBY | R1, R10 |
| Sprint 1 (semana 2-3) | Instalar Vitest + primeros tests · GitHub Actions · Sentry · Migrar xlsx · Unificar UserRole | R2, R3, R4, R5, R7 |
| Sprint 2 (semana 4-6) | PostHog analytics · service.ts T5-T12 · Activar CLI codegen | R9, R12 |
