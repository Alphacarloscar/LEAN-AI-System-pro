# gobytech_pro — Infrastructure Checklist

**Proyecto:** GOBY (gobytech.com)
**Entorno:** Producción
**Completar ANTES del primer login de cliente real**

Cada ítem tiene un estado: `[ ]` pendiente / `[x]` completado.

---

## 1. Supabase — gobytech_pro

### 1.1 Auth Settings
- [ ] **Site URL** apunta a `https://gobytech.com` (o el dominio de producción definitivo).
  Ruta: Authentication → URL Configuration → Site URL
- [ ] **Redirect URLs** incluye `https://gobytech.com/**` y `https://gobytech.com/auth/callback`.
  Evita que los magic links o password reset redirijan a staging.
- [ ] **Email templates** configurados con branding GOBY (remitente, logo, textos).
  Ruta: Authentication → Email Templates

### 1.2 Supabase Secrets (Edge Functions)
Los secrets se configuran en: Settings → Edge Functions → Secrets

- [ ] `ANTHROPIC_API_KEY` — clave de Claude API para las Edge Functions de recomendaciones LLM.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — service role key de **gobytech_pro** (no de lean_ai_pro).
  ⚠️ Verificar que es la key de gobytech_pro: Settings → API → service_role.
- [ ] `SUPABASE_URL` — URL de **gobytech_pro**: `https://[REF_ID].supabase.co`.
  ⚠️ No copiar la URL de lean_ai_pro.

**Cómo verificar que los secrets están bien:**
Tras configurar, ejecutar una Edge Function desde el Dashboard y verificar en los logs que no hay errores de autenticación.

### 1.3 Storage Buckets
Si la app usa Storage (imágenes de empresa, exports PDF, etc.):
- [ ] Crear bucket `company-assets` (o el nombre que use el codebase) en gobytech_pro.
  Ruta: Storage → New bucket
- [ ] Configurar políticas de acceso del bucket (RLS equivalente para Storage).
- [ ] Si lean_ai_pro tiene archivos de referencia/demo, migrar manualmente si son necesarios.

### 1.4 Database
- [ ] Bloques 00–06 ejecutados con todos los checks en [OK].
- [ ] Backup post-migración descargado y guardado.

---

## 2. Vercel — Proyecto gobytech

### 2.1 Environment Variables
Ruta: Vercel Dashboard → gobytech project → Settings → Environment Variables

Las siguientes variables deben apuntar a **gobytech_pro**, no a lean_ai_pro:

- [ ] `VITE_SUPABASE_URL` = `https://[GOBYTECH_PRO_REF_ID].supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = anon key de gobytech_pro
  Ruta para obtenerla: gobytech_pro → Settings → API → anon / public

**Cómo verificar:**
```
# Desde Vercel Logs o en la app abierta, el cliente Supabase usará esta URL.
# En dev local no aplica — el .env.local apunta a lean_ai_pro (staging).
```

⚠️ **El archivo `.env.local` en el repo apunta a lean_ai_pro (staging). NO lo cambies.**
Las variables de Vercel para el proyecto de producción son independientes.

### 2.2 Dominio
- [ ] Dominio `gobytech.com` (o subdominio) apuntando al proyecto Vercel correcto.
- [ ] SSL activo (Vercel lo gestiona automáticamente).
- [ ] Redirección `www.gobytech.com` → `gobytech.com` (o viceversa, según decisión).

### 2.3 Build Settings
- [ ] Verificar que el build command es `npm run build` (o `vite build`).
- [ ] Verificar que el output directory es `dist`.
- [ ] Verificar que el proyecto Vercel de producción NO está usando el mismo repo branch que staging, o que las env vars están separadas por environment (Production vs Preview).

---

## 3. Edge Functions

Si hay Edge Functions deployadas en lean_ai_pro que también deben estar en gobytech_pro:

- [ ] Listar Edge Functions activas en lean_ai_pro: Supabase Dashboard → Edge Functions.
- [ ] Deploy de las mismas funciones en gobytech_pro (via Supabase CLI):
  ```bash
  supabase functions deploy [function-name] --project-ref [GOBYTECH_PRO_REF_ID]
  ```
- [ ] Verificar que los secrets configurados en el paso 1.2 son accesibles desde las funciones.
- [ ] Test de cada Edge Function con una llamada de prueba desde el Dashboard.

**Edge Functions conocidas en el codebase (verificar cuáles están activas):**
- `check-and-log-ai-call` (si existe como Edge Function además de la función SQL)
- Cualquier función de integración con Anthropic Claude API

---

## 4. Protocolo de Promoción

Secuencia recomendada para el lanzamiento:

### Paso 1 — Ventana de mantenimiento
- Ejecutar bloques SQL 00–06 en gobytech_pro.
- Verificar todos los checks en [OK].

### Paso 2 — Configuración de infraestructura
- Completar todos los ítems de esta checklist.

### Paso 3 — Smoke test interno
- [ ] Login con `carlos.sanchez@consultoriaalpha.com` en `gobytech.com`.
- [ ] Verificar que el perfil muestra `role: superadmin` (visible en Admin o en la UI).
- [ ] Crear una empresa de prueba desde la UI.
- [ ] Crear un proyecto de prueba.
- [ ] Abrir T1 y guardar un dato — verificar que persiste tras recarga.
- [ ] Abrir T9 — verificar que el Gantt carga sin errores.
- [ ] Verificar en Supabase Dashboard que las filas aparecen en las tablas correctas.

### Paso 4 — Alta del primer cliente
- [ ] Crear usuario cliente desde Supabase Auth Dashboard (gobytech_pro).
- [ ] Asignar empresa y rol desde la UI de Admin o directamente en SQL.
- [ ] Verificar que el cliente puede hacer login y ver solo sus datos (RLS funciona).

### Paso 5 — Monitorización post-lanzamiento (primera semana)
- [ ] Revisar Supabase Logs → API logs a diario.
- [ ] Revisar `ai_rate_limit_log` para detectar uso anómalo de la API de IA.
- [ ] Confirmar que los backups automáticos de Supabase están activos.

---

## 5. Separación staging / producción

Recordatorio de las dos configuraciones en paralelo:

| | Staging | Producción |
|---|---|---|
| Supabase | lean_ai_pro | gobytech_pro |
| Vercel | lean_ai_system_pro | gobytech (dominio final) |
| `.env.local` | Apunta a lean_ai_pro | No aplica (solo Vercel env) |
| Datos | Datos de prueba | Solo datos reales |
| Backup | No crítico | **Obligatorio** |

**Regla de oro:** nunca apuntes el proyecto Vercel de producción a lean_ai_pro, ni el `.env.local` de desarrollo a gobytech_pro.

---

*Documento generado: 2026-06-01. Actualizar cuando cambien las Edge Functions, dominios, o configuración de Vercel.*
