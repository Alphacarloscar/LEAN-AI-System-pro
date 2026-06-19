// ============================================================
// E2E Global Teardown — GOBY_TEST_ project cleanup
//
// Runs ONCE after the entire Playwright suite completes.
// Deletes every project whose name starts with "GOBY_TEST_"
// using a direct Supabase admin client (service_role key),
// bypassing RLS so it works regardless of who created them.
//
// Safety rule: the WHERE clause is `name ILIKE 'GOBY_TEST_%'`
// — this guard is the ONLY deletion criterion; no wildcard,
// no "all active" sweeps. Real projects are never touched.
//
// Requires env vars (already defined in .env.local / CI secrets):
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  (server-side only, never VITE_)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const TEST_PREFIX = 'GOBY_TEST_'

export default async function globalTeardown(): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.warn(
      '[teardown] Skipping GOBY_TEST_ cleanup: ' +
      'VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.',
    )
    return
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── 1. Find all test projects ────────────────────────────────
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

  // ── 2. Delete in dependency order ───────────────────────────
  // Child rows are protected by ON DELETE CASCADE in the schema,
  // but we log cascade targets explicitly for auditability.
  const ids = testProjects.map((p) => p.id as string)

  // Guard: never delete if a project id appears to be a production UUID
  // that slipped through (belt-and-suspenders check on names again).
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
    .ilike('name', `${TEST_PREFIX}%`) // double-bind: both id AND name must match

  if (deleteErr) {
    console.error('[teardown] Failed to delete GOBY_TEST_ projects:', deleteErr.message)
    return
  }

  console.log(`[teardown] ✓ Deleted ${ids.length} GOBY_TEST_ project(s) successfully.`)
}
