import dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const COMPANY_ID = '70941976-1b87-4577-9111-6d521f60a0dc'

// Datos de ejemplo para seed inicial
// Datos de ejemplo para seed inicial
const SEED_DATA = [
  { tool_module: 'T1', text_key: 't1_001', text_es: 'Evaluar madurez actual', text_ai_domain: 'Madurez IA', text_data_domain: 'Madurez datos', text_digital_domain: 'Madurez digital', company_id: COMPANY_ID },
  { tool_module: 'T1', text_key: 't1_002', text_es: 'Definir objetivos', text_ai_domain: 'Objetivos IA', text_data_domain: 'Objetivos datos', text_digital_domain: 'Objetivos digitales', company_id: COMPANY_ID },
  { tool_module: 'T2', text_key: 't2_001', text_es: 'Mapeo de stakeholders', text_ai_domain: 'Stakeholders IA', text_data_domain: 'Stakeholders data', text_digital_domain: 'Stakeholders digital', company_id: COMPANY_ID },
  { tool_module: 'Admin_Auth', text_key: 'admin_001', text_es: 'Gestión de usuarios', text_ai_domain: 'Usuarios IA', text_data_domain: 'Usuarios data', text_digital_domain: 'Usuarios digital', company_id: COMPANY_ID },
]

async function seedDirect() {
  console.log('🌱 Iniciando seed directo...')
  
  const { error, data } = await supabase
    .from('application_texts')
    .insert(SEED_DATA)
  
  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
  
  console.log('✨ Seed completado')
  console.log('Registros insertados:', SEED_DATA.length)
}

seedDirect()
