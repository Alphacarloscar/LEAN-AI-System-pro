# PROMPT DE ARRANQUE — Chat [ARQUITECTURA]

Copia y pega el bloque siguiente como primer mensaje del chat.
Si arrancas el chat en Cowork: con la carpeta `LEAN AI System` ya seleccionada, el chat puede leer todos los archivos directamente.
Si arrancas el chat en Claude.ai: súbele como adjuntos los archivos listados en "Archivos de referencia" al final de este documento.

---

## BLOQUE A COPIAR COMO PRIMER MENSAJE

```
Área activa del chat: [ARQUITECTURA]

Este chat es la sesión de arquitectura técnica del L.E.A.N. AI System.
Objetivo: producir un diseño de arquitectura completo que desbloquee todo
el desarrollo posterior del software. No se toca código todavía en esta sesión.

Lee primero, en este orden y antes de responder nada más, los siguientes archivos:

1. SYSTEM_PROMPT_v2.md — contexto global, reglas del proyecto, rol.
2. DECISIONES_ESTRATEGICAS.md — decisiones ya tomadas que NO se vuelven a debatir
   salvo que aparezcan datos nuevos.
3. BACKLOG_DESARROLLO.md — objetivo y entregables del Sprint 0 (este sprint).
4. LEAN_AI_System_Contexto_Proyecto.docx — estado del proyecto y decisiones
   arquitectónicas previas.
5. MEMORIA.pdf — inteligencia acumulada del proyecto.
6. Descripción Detallada por Herramienta (1).xlsx — framework completo de T1-T12,
   con especial atención a los campos "Input", "Output", "Sinergia con el ecosistema"
   para construir el grafo de dependencias.

Después de leerlos, y ANTES de proponer nada, hazme las preguntas necesarias para
resolver los siguientes puntos. Pregunta una cada vez, no en lista.

Decisiones que debemos cerrar en esta sesión:

1. Stack frontend definitivo: React+Tailwind (como menciona el .docx de transferencia)
   vs. HTML/JS vainilla (confirmado en MEMORIA). Justifica la recomendación con
   criterios de (a) facilidad de modularización, (b) velocidad de desarrollo para
   un no-programador, (c) compatibilidad con Vercel + Supabase, (d) impacto en la
   evolución futura a plataforma multi-framework.

2. Modelo de datos completo Supabase:
   - Tablas para cada entidad principal del ecosistema (project, client, stakeholder,
     tool_instance, use_case, maturity_score, recommendation, etc.).
   - Cómo modelamos el grafo de dependencias T1-T13 (el bloque context_refs que
     aparece en los inputs de T8-T12).
   - Claves foráneas y reglas de integridad.
   - Representación visual del diagrama entidad-relación.

3. Estrategia multi-tenancy:
   - fila-por-cliente (Row Level Security) vs esquema-por-cliente vs instancia-por-cliente.
   - Impacto en coste, complejidad y aislamiento de datos.

4. Separación producción / desarrollo (MVP estable + desarrollo evolutivo):
   - Dos proyectos Supabase separados (prod / dev).
   - Dos deploys Vercel (prod desde main / preview desde develop).
   - Branching GitHub limpio para un no-programador.
   - Procedimiento de release de develop → main sin romper clientes.

5. Plan de modularización del HTML monolítico actual (~2,5 MB):
   - Migración big-bang vs incremental.
   - Cómo se identifican y extraen los 7 módulos MVP existentes.
   - Estructura de carpetas del repo propuesta.

6. Workflow completo GitHub → Vercel → Supabase para Carlos SIN CLI:
   - Cómo se hace un cambio y se despliega usando solo interfaces web y Cowork.
   - Cómo se gestionan migraciones de Supabase sin terminal.

7. Esquema de identidad y roles:
   - Consultor Alpha vs PM cliente vs viewer C-suite.
   - Cómo se autentica cada uno.
   - Qué ve cada uno de cada herramienta.

8. Contratos de datos por herramienta T1-T13:
   - Para cada herramienta, qué campos produce y qué campos consume de otras.
   - Esto debe ser coherente con el Excel, no inventarlo.

Formato esperado de respuesta final del chat al cerrar la sesión:

- Un documento ARQUITECTURA.md guardado en la carpeta del proyecto, con:
  a) Diagrama entidad-relación (en texto estructurado tipo ERD).
  b) Estructura de carpetas del repo GitHub.
  c) Flujo visual GitHub→Vercel→Supabase.
  d) Tabla de decisiones arquitectónicas con justificación.
  e) Lista de riesgos técnicos identificados y mitigaciones.
- Plan de modularización del HTML paso a paso, enumerado.
- Lista de primeros commits sugeridos para Sprint 1 (sin escribir aún el código).

Restricciones:
- Carlos NO es desarrollador profesional. Cada decisión técnica debe explicarse
  con una analogía o visualización.
- Ningún comando en terminal/CLI salvo que sea inevitable; si lo es, justifícalo.
- Formato directo, analítico, sin relleno.
- Si detectas que una decisión de arquitectura puede afectar a otra área del proyecto
  (pricing, posicionamiento, operaciones), señálalo explícitamente con "Impacto en [ÁREA]:".

Empieza haciendo la primera pregunta que necesites responder para avanzar. No propongas
arquitectura aún.
```

---

## Archivos de referencia a adjuntar (si usas Claude.ai)

Si usas Cowork, estos archivos ya están en la carpeta `LEAN AI System` y el chat puede leerlos directamente. Si usas Claude.ai, sube estos adjuntos al chat:

- `SYSTEM_PROMPT_v2.md`
- `DECISIONES_ESTRATEGICAS.md`
- `BACKLOG_DESARROLLO.md`
- `LEAN_AI_System_Contexto_Proyecto.docx`
- `MEMORIA.pdf`
- `Descripción Detallada por Herramienta (1).xlsx`
- `lean-ai-system (V6).html`  *(solo si vas a tocar código en la misma sesión; para diseño puro, no hace falta y consume mucho contexto)*

---

## Nota operativa para Carlos

Este chat es de **diseño, no de código**. Si en algún momento el chat te propone escribir código antes de cerrar las 8 decisiones de arriba, pídele que pare y vuelva a preguntas.

El cierre de este sprint = el documento `ARQUITECTURA.md` generado y guardado en la carpeta. Sin ese documento, no arranca Sprint 1.
