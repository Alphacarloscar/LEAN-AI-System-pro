import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const client = new pg.Client({
  host: 'localhost',
  port: 54321,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
})

async function applyRLS() {
  try {
    await client.connect()
    console.log('✓ Connected to local Supabase database\n')

    const sql = fs.readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20260903_rls_application_texts.sql'),
      'utf-8'
    )

    console.log('Applying RLS policies...\n')
    const result = await client.query(sql)
    console.log('✓ RLS policies applied successfully')
    console.log('Result:', result)
  } catch (err: any) {
    console.error('❌ Error:', err.message)
    if (err.detail) console.error('Detail:', err.detail)
  } finally {
    await client.end()
  }
}

applyRLS()
