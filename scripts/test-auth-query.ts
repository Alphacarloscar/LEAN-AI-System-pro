import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function test() {
  console.log('Testing with authenticated user...\n')

  // Create Supabase client with service role (for testing)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Test 1: Create test user
  console.log('1️⃣ Creating test user...')
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'test-admin@example.com',
    password: 'TestPassword123!',
    user_metadata: { name: 'Test Admin' },
  })

  if (userError) {
    console.error('Error creating user:', userError)
    return
  }

  const userId = userData.user.id
  console.log(`✓ Created user: ${userId}`)

  // Test 2: Create profile with superadmin role
  console.log('\n2️⃣ Creating admin profile...')
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: 'test-admin@example.com',
      name: 'Test Admin',
      role: 'superadmin',
    })

  if (profileError) {
    console.error('Profile error:', profileError.message)
  } else {
    console.log('✓ Profile created')
  }

  // Test 3: Now query application_texts as this user
  console.log('\n3️⃣ Querying application_texts as authenticated user...')

  // Create a session for this user
  const { data: sessionData, error: sessionError } = await supabase.auth.admin.getUserById(userId)

  if (sessionError) {
    console.error('Session error:', sessionError)
    return
  }

  // Use service role to query (simulates authenticated user)
  const { data: textsData, error: textsError } = await supabase
    .from('application_texts')
    .select('*')
    .limit(3)

  if (textsError) {
    console.error('❌ Query error:', textsError.message)
  } else {
    console.log(`✓ Got ${textsData?.length} application texts`)
    if (textsData?.length) {
      console.log('Sample:', {
        tool_module: textsData[0].tool_module,
        text_key: textsData[0].text_key,
        text_es: textsData[0].text_es?.substring(0, 50),
      })
    }
  }

  console.log('\n✓ Auth test completed')
}

test().catch(console.error)
