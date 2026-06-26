// ============================================================
// E2E Global Teardown — test data cleanup
//
// Runs ONCE after the entire Playwright suite completes.
// Uses a direct Supabase admin client (service_role key),
// bypassing RLS so it works regardless of who created them.
//
// Cleans up two kinds of test data:
//   1. Projects whose name starts with "GOBY_TEST_"
//   2. t1_dimension_scores rows for interviewee "E2E-AuditBot"
//      in the LAB seed project (Toy Story) created by audit.spec.ts
//
// Safety rules:
//   — Projects: WHERE name ILIKE 'GOBY_TEST_%' (never touches real projects)
//   — Interviewees: WHERE interviewee_name = 'E2E-AuditBot'
//                   AND project_id = LAB_PROJECT_ID (scoped to seed project)
//
// Requires env vars (already defined in .env.local / CI secrets):
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  (server-side only, never VITE_)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const TEST_PREFIX      = 'GOBY_TEST_'
const LAB_PROJECT_ID   = 'e2058bff-9759-465d-ae4d-df79fdf23815'
// IMPORTANTE: debe coincidir exactamente con TEST_INTERVIEWEE.name en audit.spec.ts
const TEST_INTERVIEWEE = 'E2E-AuditBot'

export default async function globalTeardown(): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.warn(
      '[teardown] Skipping cleanup: ' +
      'VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.',
    )
    return
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  await cleanupTestProjects(admin)
  await cleanupAuditBotInterviewee(admin)
}

// ── 1. Delete GOBY_TEST_ projects ───────────────────────────────────────────

async function cleanupTestProjects(admin: ReturnType<typeof createClient>): Promise<void> {
  const { data: testProjects, error: listErr } = await admin
    .from('projects')
    .select('id, name')
    .ilike('name', `${TEST_PREFIX}%`)

  if (listErr) {
    console.error('[teardown] Failed to query GOBY_TEST_ projects:', listErr.message)
    return
  }

  if (!testProjects || testProjects.length === 0) {
    console.log('[teardown] No GOBY_TEST_ projects found — nothing to clean up.')
    return
  }

  console.log(
    `[teardown] Deleting ${testProjects.length} GOBY_TEST_ project(s):`,
    testProjects.map((p) => `${p.name} (${p.id})`).join(', '),
  )

  const ids = testProjects.map((p) => p.id as string)

  // Seguridad conservadora: si cualquier proyecto no tiene el prefijo esperado,
  // aborta TODAS las eliminaciones para proteger datos de producción.
  // Comportamiento intencional: fallo ruidoso > eliminación parcial silenciosa.
  for (const project of testProjects) {
    if (!(project.name as string).startsWith(TEST_PREFIX)) {
      console.error(
        `[teardown] SAFETY ABORT — project "${project.name}" does not start with ` +
        `"${TEST_PREFIX}". Skipping all deletions to protect production data.`,
      )
      return
    }
  }

  const { error: deleteErr } = await admin
    .from('projects')
    .delete()
    .in('id', ids)
    .ilike('name', `${TEST_PREFIX}%`)

  if (deleteErr) {
    console.error('[teardown] Failed to delete GOBY_TEST_ projects:', deleteErr.message)
    return
  }

  console.log(`[teardown] ✓ Deleted ${ids.length} GOBY_TEST_ project(s) successfully.`)
}

// ── 2. Delete E2E-AuditBot interviewee scores from seed project ─────────────

async function cleanupAuditBotInterviewee(admin: ReturnType<typeof createClient>): Promise<void> {
  const { error, count } = await admin
    .from('t1_dimension_scores')
    .delete({ count: 'exact' })
    .eq('project_id', LAB_PROJECT_ID)
    .eq('interviewee_name', TEST_INTERVIEWEE)

  if (error) {
    console.error('[teardown] Failed to delete E2E-AuditBot scores:', error.message)
    return
  }

  if ((count ?? 0) === 0) {
    console.log('[teardown] No E2E-AuditBot scores found — nothing to clean up.')
  } else {
    console.log(`[teardown] ✓ Deleted ${count} E2E-AuditBot score row(s) from seed project.`)
  }
}
