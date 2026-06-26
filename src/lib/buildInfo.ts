// ============================================================
// buildInfo — Metadatos de build inyectados por Vite
//
// Los valores __APP_VERSION__, __GIT_COMMIT__ y __BUILD_TIME__
// son constantes reemplazadas en compile-time por vite.config.ts.
// En runtime NUNCA son "undefined"; son strings literales.
//
// logBuildInfo() debe llamarse UNA sola vez al arrancar la app.
// ============================================================

declare const __APP_VERSION__: string
declare const __GIT_COMMIT__:  string
declare const __BUILD_TIME__:  string

export interface BuildInfo {
  appVersion:  string
  gitCommit:   string
  buildTime:   string
  vercelEnv:   string
  demoEnabled: string
  supabaseUrl: string   // masked: solo host, sin scheme ni path
}

export function getBuildInfo(): BuildInfo {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
  let maskedUrl = '(no configurada)'
  try {
    if (rawUrl) {
      const u = new URL(rawUrl)
      maskedUrl = u.hostname     // ej. "xyzabc.supabase.co"
    }
  } catch {
    maskedUrl = '(URL inválida)'
  }

  return {
    appVersion:  __APP_VERSION__,
    gitCommit:   __GIT_COMMIT__,
    buildTime:   __BUILD_TIME__,
    vercelEnv:   import.meta.env.VERCEL_ENV        ?? import.meta.env.VITE_VERCEL_ENV ?? '(local/unknown)',
    demoEnabled: import.meta.env.VITE_DEMO_ENABLED ?? 'false',
    supabaseUrl: maskedUrl,
  }
}

export function logBuildInfo(): void {
  const info = getBuildInfo()
  console.groupCollapsed(
    `%c[GOBY] v${info.appVersion} — ${info.gitCommit} — ${info.vercelEnv}`,
    'color:#C8860A;font-weight:bold;font-size:11px',
  )
  console.table({
    'App version':    info.appVersion,
    'Git commit':     info.gitCommit,
    'Build time':     info.buildTime,
    'Vercel env':     info.vercelEnv,
    'Demo enabled':   info.demoEnabled,
    'Supabase host':  info.supabaseUrl,
  })
  console.groupEnd()
}
