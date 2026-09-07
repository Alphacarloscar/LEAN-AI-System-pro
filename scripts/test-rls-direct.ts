import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Try using fetch to execute SQL directly via Supabase API
async function executeSQL(sql: string) {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/`
  const headers = {
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: sql }),
    })

    const data = await response.json()
    console.log('Response:', data)
    return data
  } catch (err) {
    console.error('Error:', err)
  }
}

// For local Supabase, we need to directly modify the DB
// This won't work via REST API, only via direct SQL connection

async function tryAlternative() {
  console.log('Note: RLS policies need to be applied directly to the database.')
  console.log('Run this in Supabase SQL editor in the web UI:')
  console.log('')
  console.log(`
-- Enable RLS on application_texts
ALTER TABLE public.application_texts ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read application_texts (global texts)
CREATE POLICY "Authenticated users can read application_texts"
  ON public.application_texts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only superadmin/admin can update application_texts
CREATE POLICY "Admins can update application_texts"
  ON public.application_texts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (public.profiles.role = 'superadmin' OR public.profiles.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (public.profiles.role = 'superadmin' OR public.profiles.role = 'admin')
    )
  );
`)
}

tryAlternative()
