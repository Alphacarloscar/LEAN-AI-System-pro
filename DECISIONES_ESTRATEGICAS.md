# DECISIONES ESTRATÉGICAS — L.E.A.N. AI System

Documento vivo. Cada decisión fechada. Futuros chats leen de aquí antes de actuar.
Última actualización: 2026-04-18

---

## 1. Tensiones resueltas (sesión 2026-04-18)

### 1.1 Tensión "Modo consultor vs SaaS puro" → RESUELTA
**Decisión:** modelo dual con dos roles de ejecutor:
- Vía A: consultor de Alpha (la principal a corto plazo).
- Vía B: PM / Scrum Master / Technical Leader interno del cliente, formado previamente por Alpha.

**Consecuencia:** el SaaS no es self-service puro. Es **"SaaS asistido por PM interno formado"**.

**Consecuencia adicional:** se abre una **tercera vía de ingresos — formación/certificación** de esos PMs internos.

**Implicación de producto:** la herramienta tiene que incorporar una capa IA de facilitación que sustituya parcialmente al consultor humano en la vía B (entrevistas guiadas, auto-clasificación de arquetipos, scoring automático, recomendaciones dinámicas).

---

### 1.2 Tensión "Ambición cambiar paradigma Jira/Monday/ServiceNow" → PARKEADA
**Decisión:** no es prioridad en los próximos 6-12 meses. Horizonte posterior.

**Lo que sí hacemos ahora:** guardar feedback de mercado en una BBDD estructurada, para alimentar esa decisión cuando llegue el momento.

**Implicación de producto:** la arquitectura inicial no está obligada a ser "plataforma multi-framework", pero debe ser multi-tenant desde el día 1 y no bloquear esa evolución futura (= módulos con contratos claros, no monolito).

---

### 1.3 Tensión "Motor rule-based vs dinámico" → RESUELTA
**Decisión:** el motor IA dinámico es parte del desarrollo desde el día 1, no optimización post-MVP.

**Consecuencia:** cada herramienta debe diseñarse pensando en qué decisiones del motor son reglas fijas y qué decisiones son generadas por capa IA. Esto afecta el modelo de datos y los contratos de output.

---

### 1.4 Tensión "Time-to-first-value de 6 meses" → EN DISEÑO
**Decisión:** implementar quick wins instrumentados por fase (ver Sección 2).
**Pendiente:** validación de los quick wins propuestos en conversaciones con CIOs reales (empezando por la demo Javier+Susana).

---

## 2. Quick wins por fase (propuestos — pendientes de validación en mercado)

Criterios: (1) visibles al CIO en <30 días desde arranque de fase, (2) llevables al Comité de Dirección, (3) autogenerados por la herramienta sin semanas de trabajo manual.

**Fase L (semanas 1-3):**
- QW1 — Executive Briefing Pack: PDF 2 páginas auto-generado 48h tras 3 entrevistas. Foto de madurez preliminar + top-3 riesgos.
- QW2 — Shadow AI Scan: output inmediato de T6 con lista de herramientas IA no aprobadas detectadas en la organización.

**Fase E (semanas 4-8):**
- QW3 — Top 5 casos de uso priorizados con ROI estimado y quick-calc financiero.
- QW4 — **Licence Waste Report** (de T2). Prioridad alta: ataca directamente la fricción "coste > valor" reportada por Javier y Pep. Es el principal candidato a demo con Javier+Susana.

**Fase A (semanas 9-16):**
- QW5 — Piloto simbólico lanzado (ej. Copilot a 20 Exploradores+Operadores con gobierno T6).
- QW6 — Comunicación ejecutiva auto-generada desde T8: kits de Comité + managers.

**Fase N (meses 5-6):**
- QW7 — Dashboard T10 en vivo con 4 KPIs de adopción/valor/gobierno/productividad.
- QW8 — Backlog T12 con 10-15 iniciativas precargadas y priorizadas para asegurar continuidad post-sprint.

---

## 3. Elección de horizonte (sesión 2026-04-18)

**Decisión:** Opción C híbrida con sesgo máximo a velocidad.
- Construir el ecosistema completo (las 13 herramientas).
- Priorizar consultoría Alpha como vía de ingresos activa mientras se construye.
- Ritmo de trabajo Carlos+Claude: sesiones casi diarias.
- Objetivo: tiempo récord sin sacrificar calidad arquitectónica mínima.

**Consecuencia operativa:** disciplina arquitectónica alta desde sprint 0. Cada decisión debe registrarse aquí antes de codificar.

---

## 4. Dos entornos desde el día 1

**Decisión:** producción estable + desarrollo evolutivo separados.

- **Producción (MVP estable):** ven clientes reales y consultores Alpha. Cambios con release controlada, testeados.
- **Desarrollo (evolutivo):** donde se construye el ecosistema completo. Cambios constantes con feedback real.

**Consecuencia técnica:** dos proyectos Supabase (prod / dev) + dos deploys Vercel (prod / preview) + branching GitHub (main / develop). A definir con detalle en sesión de arquitectura.

**Primeros clientes = early adopters aceptados**, pero con la garantía de que el MVP que usan no se rompe con cada iteración de desarrollo.

---

## 5. Entorno de desarrollo primario

**Decisión:** Cowork como entorno principal.
- Acceso a archivos locales → iteración de código directa.
- Acceso a bash → ejecutar, testear, desplegar.
- Carlos no es desarrollador profesional → Claude asiste en cada paso técnico con analogías y explicaciones visuales.

**Claude.ai como entorno secundario** para conversaciones de estrategia/producto sin código.

---

## 6. Limitaciones actuales confirmadas (a resolver)

1. **Motor de recomendaciones rule-based estático.** Vender SaaS con esto = churn inevitable.
2. **Entry point único** del diagnóstico de madurez: redundante para avanzados, abstracto para iniciadores. Necesita segmentación.
3. **Contradicción de stack entre docs:** el .docx menciona React+Tailwind, MEMORIA confirma vainilla HTML/JS. Pendiente decidir en sesión de arquitectura.
4. **T1 asume consultor presente.** Hay que rediseñarla para que funcione sin él (wizard guiado + IA).
5. **Ausencia de pricing definido.** Bloqueante para cerrar ventas. A tratar en chat [ESTRATEGIA-PRODUCTO].

---

## 7. Decisiones de Sprint 0 arquitectura — TODAS CERRADAS (2026-04-19)

Sprint 0 cerrado. Las 9 decisiones técnicas (D1-D9) están documentadas en `ARQUITECTURA.md`. Resumen:

1. **D1 — Stack frontend:** React + Vite + Tailwind + TypeScript + Recharts + SheetJS. CERRADA.
2. **D2 — Modelo de datos:** Híbrido (FKs estructurales + JSONB para payloads). CERRADA.
3. **D3 — Multi-tenancy:** RLS principal + ruta a esquema/instancia bajo demanda. CERRADA.
4. **D4 — Modularización HTML:** Migración incremental por herramienta (no big-bang). CERRADA.
5. **D5 — Workflow sin CLI:** Carlos aprueba PRs en GitHub web; Claude ejecuta código + migraciones SQL manuales. CERRADA.
6. **D6 — Separación prod/dev:** 2 proyectos Supabase + 2 deploys Vercel + branching `main`/`develop`. CERRADA.
7. **D7 — Identidad y roles:** 5 arquetipos (consultor_alpha, pm_cliente, viewer_csuite, admin_alpha, superadmin) + MFA universal. Carlos y Óscar son superadmin. CERRADA.
8. **D8 — Contratos de datos T1-T13:** Grafo de dependencias H/S documentado + snapshot con versionado para datos consumidos. CERRADA.
9. **D9 — Sistema de diseño:** Inter (tipografía) + paleta metálica (blanco/negro/plata/azul marino) + funcionales pastel + light default + 12px radius + 1px líneas grises. Sprint 0.5 dedicado. CERRADA.

---

## 8. Mensajes clave recurrentes (no se cuestionan sin datos nuevos)

- ISO 42001 no es un producto separado: es un resultado natural del sprint.
- Alpha no compite con auditoras de certificación.
- La metodología Voss guía la venta.
- Branding: paleta blanco/negro/plata metálico/azul marino metálico (evolución de "negro/blanco/gris" tras D9 el 2026-04-19). Aplica a herramienta, entregables y materiales comerciales.
- Outputs visualmente estructurados e inmediatamente usables, no drafts.
- Feedback de campo acumula entre sesiones — no reiniciamos de cero.
- Sistema de diseño propio = argumento diferencial de venta vs. consultoría B2B estándar (que entrega en PPT/Excel corporativo).
