import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Test con anon key (simula usuario normal)
const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// Test con service role (admin)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  console.log('Testing RLS on application_texts...\n')

  // Test 1: Service role query
  console.log('📋 Service Role Query:')
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('application_texts')
    .select('*')
    .limit(1)

  if (adminError) {
    console.error('❌ Error:', adminError)
  } else {
    console.log(`✓ Got ${adminData?.length} rows`)
  }

  // Test 2: Anon query (this is what the component uses if not authenticated)
  console.log('\n🔓 Anon Key Query:')
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('application_texts')
    .select('*')
    .limit(1)

  if (anonError) {
    console.error('❌ Error:', anonError.message)
    console.log('Error code:', anonError.code)
  } else {
    console.log(`✓ Got ${anonData?.length} rows`)
  }

  // Test 3: Check table RLS status
  console.log('\n⚙️ Table Info:')
  const { data: tableInfo, error: infoError } = await supabaseAdmin
    .from('application_texts')
    .select('*')
    .limit(0)

  console.log('Table accessible:', !infoError)
}

test().catch(console.error)
