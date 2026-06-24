Decision Log — GOBY
AI-Ready Repository System v2.1.0 | Última actualización: 2026-06-24

Este directorio contiene el registro completo de decisiones técnicas (ADR) y funcionales (FDR)
del proyecto. Toda decisión arquitectónica o de producto con impacto duradero debe tener un
documento aquí antes de ejecutarse.


Cómo usar este registro
Leer antes de empezar a trabajar: revisa las últimas entradas para conocer el contexto reciente.
Crear un ADR cuando el cambio afecte a: stack, esquema de BD, seguridad, arquitectura de módulos, infraestructura, dependencias principales.
Crear un FDR cuando el cambio afecte a: comportamiento visible para el usuario, roles y permisos, lógica de negocio, definición de herramientas T1-T13, arquetipos de stakeholder.
Templates:

ADR: technical/ADR-000-template.md
FDR: functional/FDR-000-template.md


Decisiones Técnicas (ADR)
IDTítuloEstadoFechaÁreaADR-001React 18 + Vite + TypeScript como stack frontendACCEPTED2026-04-19StackADR-002Supabase como backend únicoACCEPTED2026-04-19InfraestructuraADR-003Modelo de datos híbrido FKs + JSONBACCEPTED2026-04-19EsquemaADR-004Row Level Security para multi-tenancyACCEPTED2026-04-19SeguridadADR-005Workflow sin CLI — solo GitHub/Vercel/Supabase webACCEPTED2026-04-19WorkflowADR-0062 entornos Supabase separados (PRO/DEV)ACCEPTED2026-04-19InfraestructuraADR-007Zustand para estado globalACCEPTED2026-04-19ArquitecturaADR-008Sistema de 4 roles de usuarioACCEPTED2026-05-01SeguridadADR-009Claude API vía Supabase Edge FunctionsACCEPTED2026-05-15IA/InfraestructuraADR-016Establecer build.target es2022 para compatibilidad esbuild >=0.28ACCEPTED2026-06-13StackADR-017Sistema de Audit Logging transversal mediante patrón ProxyACCEPTED2026-06-15InfraestructuraADR-018Política de retención de audit_logs: 90 días activos + 5 años archivo via pg_cronACCEPTED2026-06-15InfraestructuraADR-019Acceso a audit_logs exclusivamente vía función SECURITY DEFINERACCEPTED2026-06-15Seguridad

Decisiones Funcionales (FDR)
IDTítuloEstadoFechaÁreaFDR-001BackToDashboard como control canónicoACCEPTED2026-06-05UX/NavegaciónFDR-002Navegación por paquetes de venta (Fase 1)ACCEPTED2026-06-24Producto/Navegación

Decisiones Estratégicas de Producto
Las decisiones estratégicas de producto/mercado se documentan en:
→ DECISIONES_ESTRATEGICAS.md (formato propio, complementario a este registro)

Próximo número disponible

ADR: ADR-020
FDR: FDR-003