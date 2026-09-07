import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function applyRLS() {
  console.log('Applying RLS policies to application_texts...\n')

  const sql = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260903_rls_application_texts.sql'),
    'utf-8'
  )

  try {
    const { error } = await supabase.rpc('exec', { sql })

    if (error) {
      // rpc might not exist, try direct approach
      console.log('Trying direct SQL approach...')

      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('--'))

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 60) + '...')
        const { error: stmtError } = await (supabase as any).rpc('exec', {
          sql: statement,
        })

        if (stmtError) {
          console.error('Error:', stmtError.message)
        } else {
          console.log('✓ Success')
        }
      }
    } else {
      console.log('✓ RLS policies applied successfully')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    console.log('\nTrying alternative: create policy directly...')

    // Try creating policies one by one
    const policies = [
      {
        name: 'Admins can read application_texts',
        sql: `CREATE POLICY "Admins can read application_texts"
          ON application_texts
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
                AND (profiles.role = 'superadmin' OR profiles.role = 'admin')
            )
          );`,
      },
      {
        name: 'Admins can update application_texts',
        sql: `CREATE POLICY "Admins can update application_texts"
          ON application_texts
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
                AND (profiles.role = 'superadmin' OR profiles.role = 'admin')
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
                AND (profiles.role = 'superadmin' OR profiles.role = 'admin')
            )
          );`,
      },
    ]

    for (const policy of policies) {
      console.log(`Creating policy: ${policy.name}...`)
      const { error: policyError } = await (supabase as any).rpc('exec', {
        sql: policy.sql,
      })

      if (policyError) {
        console.error(`✗ Error: ${policyError.message}`)
      } else {
        console.log(`✓ ${policy.name} created`)
      }
    }
  }
}

applyRLS().catch(console.error)
