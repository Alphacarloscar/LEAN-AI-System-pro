# DIAGNÓSTICO: Instabilidad Crónica de Supabase Local

**Fecha:** 2026-08-25  
**Versión CLI:** 2.101.0  
**Docker Desktop:** 4.77.0 (Engine 29.5.3)  
**OS:** Windows 11 Home (WSL2)

---

## 1. SÍNTOMAS OBSERVADOS

### Patrón de fallo identificado:
1. ✅ Supabase inicia correctamente (contenedores levantados, migraciones aplicadas)
2. ✅ BD accesible durante 30-60 segundos iniciales
3. ❌ Falla DURANTE tests o después de ~1-2 minutos de carga
4. ❌ Contenedor `supabase_db_LEAN-AI-System-pro` desaparece sin razón
5. ⚠️ Docker Desktop logs muestran error recurrente: `exit status 0x40010004`

### Evidencia temporal:
- **08:45:54** - `legacy.stop` (parada voluntaria)
- **08:47:55** - `legacy.status` (check)
- **08:48:25-08:48:34** - Múltiples `status` checks (cada 3-5 seg)
- **08:57:56** - `legacy.stop` (5ª parada en 12 min)
- **09:02:58** - Otra parada
- **10:01:11** - Parada (una cada ~1 hora)
- **10:47:51** - Última parada registrada

**Patrón:** Supabase se detiene cada 30-60 minutos de forma espontánea.

---

## 2. LOGS Y ERRORES CLAVE

### Docker Desktop Logs
```
[2026-08-25T07:55:28][Docker Desktop.exe] launching backend.exe
[2026-08-25T07:55:57][Docker Desktop.exe] backend already running
[2026-08-25T07:56:04][Docker Desktop.exe] backend already running, signaling show-dashboard

HISTÓRICO: Error status 0x40010004 reportado desde 2026-05-25 (3 meses)
```

**Significado de `0x40010004`:**
- No es un error de Supabase específico
- Es un código genérico de Docker Desktop backend
- Sugiere: reinicio de daemon, memory leak, o WSL2 kernel panic

### Supabase CLI Traces (NDJSON)
```json
{
  "name": "legacy.stop",
  "duration_ms": 585-829,
  "status": "ok"
}
```
- Todos los `stop` reportan `status: ok` (terminación limpia)
- ⚠️ Pero ¿quién está triggeando esos stops?
- No hay evidence de `legacy.start` fallando

---

## 3. ESTADO ACTUAL DEL SISTEMA

### Docker
- **Containers:** 0 activos (todos stoppados/removidos)
- **Volumes:** 3 anónimos huérfanos
- **Engine:** Windows (WSL2 backend)
- **Versión:** 29.5.3

### Supabase Local
- **Estado:** No running
- **Migraciones:** 28 en disco (limpias, sin duplicados tras reparación)
- **Config:** `supabase/config.toml` + `.supabase/` no existe (limpiado múltiples veces)

### App Vite
- **Puerto:** 5176 (5173-5175 ocupados de sesiones anteriores)
- **Status:** Stoppado (pero levantable)

### E2E Tests
```
Running 155 tests using 1 worker
- Skipped: 1 test (admin login)
- Passed: 2 tests (auth basic: login form, error handling)
- Failed (timeout): 27+ tests (architecture-guard, audit, company-profile)
- Skipped (no auth): 126 tests (require full Supabase)

Pattern: Tests timeout after 13-14 seconds → backend unreachable
```

---

## 4. CAUSA RAÍZ PROBABLE

### Hipótesis 1: Docker Desktop WSL2 Kernel Issue (⚠️ MÁS PROBABLE)
```
Síntomas:
- Docker daemon crashes cada 30-60 min
- Supabase se detiene "limpiamente" (como si CLI recibiera SIGTERM)
- Error code 0x40010004 es genérico de backend
- Ningún log explícito de OOM, disk full, o memory error
- Afecta a múltiples startups en paralelo

Causa: WSL2 kernel peut avoir une fuite mémoire ou problema de synchronization
```

### Hipótesis 2: Supabase Config Incompatible (🔸 POSIBLE)
```
Síntomas:
- pg_cron comentado (extensión no disponible en local)
- Backfill migrations archivadas (faltan datos de seed)
- 28 migraciones es un volumen considerable
- PostgreSQL 17.6.1 puede tener lag inicial

Causa: Migración larga (custom functions, índices, RLS policies)
       → PostgreSQL consume memoria
       → Memory pressure en WSL2
       → Docker daemon garbage-collects container
```

### Hipótesis 3: Resource Limits (🔹 MENOS PROBABLE)
```
Síntomas:
- Vite + Playwright + PostgreSQL compiten por memoria
- 155 tests en paralelo (1 worker, pero Playwright abre Chromium)

Causa: Host no tiene suficientes recursos
       → WSL2 OOM killer mata contenedores
```

---

## 5. CHECKLIST DE DIAGNÓSTICO

```
☐ Memory usage durante Supabase start (ver Event Viewer)
☐ Disk space en C:\Windows\System32\wsl\... (almacenamiento WSL2)
☐ WSL2 kernel logs: wsl --list --verbose
☐ Docker Desktop WSL2 backend status: docker context ls
☐ PostgreSQL log en el volumen (docker volume inspect)
☐ Port 54322 activamente escuchando durante tests
☐ File descriptor limits en WSL2 (ulimit -n)
☐ Docker daemon resource limits (settings.json)
```

---

## 6. EVIDENCE DE FALLOS ESPECÍFICOS EN SESIÓN

### Supabase Restart Cycle
| Intento | Duración BD | Resultado | Error |
|---------|----------|-----------|-------|
| 1 | ~2 min | Crash | Backfill migration (seed missing) |
| 2 | ~3 min | Crash | pg_cron schema not exist |
| 3 | ~4 min | Crash | 20260707 timestamp duplicado |
| 4 | ~5 min | ✅ UP | Limpio, BD accesible |
| 5 | <2 min | ❌ DOWN | Tests iniciaron → crash |

**Correlación:** Tests → I/O intenso → CPU/Memory spike → Docker daemon reset

### Tests Behavior
```
Test run #1: 155 tests, ~3 tests ejecutados, resto skipped
Test run #2: 155 tests, ~2 tests OK, 27+ timeout (14s), crash
Test run #3: 155 tests listed correctly, pero runner never started
```

**Patrón:** Cuando Playwright intenta conectar a backend (login, navigation),
         la carga dispara el crash.

---

## 7. SOLUCIONES SUGERIDAS (Orden de Probabilidad)

### 🔴 CRÍTICO: Resolver Docker WSL2 Stability
1. **Limitar memoria a Supabase:**
   ```bash
   docker-compose.yml: services.db.deploy.resources.limits.memory: 2GB
   ```

2. **Aumentar límites de archivo en WSL2:**
   ```bash
   wsl.conf [interop] 
   appendWindowsPath = true
   # y en PowerShell:
   wsl --list -v
   wsl --set-version <distro> 2
   ```

3. **Forzar rebuild de WSL2 kernel:**
   ```bash
   wsl --shutdown
   wsl --update
   docker context use desktop-linux
   ```

### 🟠 IMPORTANTE: Optimizar Supabase Config
1. **Reducir migraciones paralelas:**
   - Aplicar solo migraciones base + gobernanza (15 en lugar de 28)
   - Mover operacionales a seed manual en PRE

2. **Aumentar timeout de tests:**
   ```ts
   // playwright.config.ts
   timeout: 30000 // 30s en lugar de default 30s
   ```

3. **Monitorear recursos:**
   ```bash
   docker stats --no-stream supabase_db_LEAN-AI-System-pro
   ```

### 🟡 SECUNDARIO: Diagnosticar en Profundidad
1. Ejecutar Supabase sin tests: `supabase start && supabase logs db`
2. Monitorear 10 minutos sin carga
3. Si sigue crasheando → es WSL2
4. Si solo crashea con tests → es load-related

---

## 8. ARCHIVOS DE REFERENCIA

| Archivo | Estado | Notas |
|---------|--------|-------|
| `supabase/migrations/` | ✅ Limpio (28 sin duplicados) | Renombrados timestamps |
| `supabase/config.toml` | ⚠️ pg_cron comentado | Extensión no disponible en local |
| `supabase/migrations/_archive/` | ✅ 2 backfills archivados | Requieren seed específico |
| Docker Engine | ⚠️ 0x40010004 errors | WSL2 backend issue crónico |
| WSL2 Kernel | ❓ Desconocido | Puede estar corrupto |

---

## 9. RECOMENDACIÓN FINAL

**No ejecutes más en local hasta resolver WSL2.**

Opciones:
1. **Si dispones de acceso PRE:** Usa PRE para E2E (recomendado)
2. **Si necesitas local:** Resuelve WSL2 primero:
   - `wsl --shutdown` + `wsl --update`
   - Reinicia Docker Desktop
   - Intenta con solo base migrations (8 + 3 governance)

3. **Alternativa:** Usa Docker socket desde host nativo (no WSL2)

---

**Generado:** 2026-08-25 10:50 UTC  
**Historial:** Fallo #5 en 2 horas de desarrollo
