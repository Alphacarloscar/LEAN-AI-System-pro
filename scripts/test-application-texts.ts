import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  console.log('Testing application_texts table...\n')

  // Test 1: Count rows
  const { count, error: countError } = await supabase
    .from('application_texts')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Count error:', countError)
    return
  }
  console.log(`✓ Total rows: ${count}`)

  // Test 2: Fetch all
  const { data, error: fetchError } = await supabase
    .from('application_texts')
    .select('*')
    .limit(5)

  if (fetchError) {
    console.error('❌ Fetch error:', fetchError)
    return
  }
  console.log(`✓ Sample rows: ${data?.length}`)
  console.log('\nFirst row:', JSON.stringify(data?.[0], null, 2))

  // Test 3: Count by module
  const { data: modules, error: modulesError } = await (supabase
    .from('application_texts')
    .select('tool_module', { count: 'exact' })
    .then((r) => {
      const uniqueModules = [...new Set(r.data?.map((d: any) => d.tool_module) || [])]
      return { data: uniqueModules, error: r.error }
    }) as any)

  if (modulesError) {
    console.error('❌ Modules error:', modulesError)
    return
  }
  console.log(`\n✓ Unique modules: ${modules?.length}`)
  console.log('Modules:', modules?.slice(0, 10).join(', '))
}

test().catch(console.error)
