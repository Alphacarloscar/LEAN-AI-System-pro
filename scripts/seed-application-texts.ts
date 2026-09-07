import dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import { fileURLToPath } from 'node:url'

// Definir __dirname para módulos ES6
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar .env.local específicamente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface TextRow {
  tool_module: string
  text_key: string
  text_es: string
  text_ai_domain: string
  text_data_domain: string
  text_digital_domain: string
}

const FILE_MAPPING: Record<string, string> = {
  'T1_tabla_dominios.md': 'T1',
  'T2_tabla_dominios.md': 'T2',
  'T3_tabla_dominios.md': 'T3',
  'T4_tabla_dominios.md': 'T4',
  'T5_tabla_dominios.md': 'T5',
  'T6_tabla_dominios.md': 'T6',
  'T7_tabla_dominios.md': 'T7',
  'T8_tabla_dominios.md': 'T8',
  'T9_tabla_dominios.md': 'T9',
  'T10_tabla_dominios.md': 'T10',
  'T11_tabla_dominios.md': 'T11',
  'T12_tabla_dominios.md': 'T12',
  'Admin_Auth_tabla_dominios.md': 'Admin_Auth',
  'CompanyProfile_Engagement_tabla_dominios.md': 'CompanyProfile_Engagement',
  'Navegacion_tabla_dominios.md': 'Navegacion',
}

function parseMarkdownTable(content: string): Array<Record<string, string>> {
  const lines = content.split('\n').filter(line => line.trim())
  
  const tableStart = lines.findIndex(line => line.includes('|'))
  if (tableStart === -1) return []
  
  const headerLine = lines[tableStart]
  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0)
  
  const rows: Array<Record<string, string>> = []
  
  for (let i = tableStart + 2; i < lines.length; i++) {
    const line = lines[i]
    if (!line.includes('|')) break
    
    const values = line
      .split('|')
      .map(v => v.trim())
      .filter((_, idx) => idx > 0 && idx < headers.length + 1)
    
    if (values.length === headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '')
        row[key] = values[idx]
      })
      rows.push(row)
    }
  }
  
  return rows
}

async function seedApplicationTexts() {
  console.log('🌱 Iniciando seed de textos de aplicación...')
  
  // Por esta (más robusta):
  const projectRoot = path.resolve(__dirname, '..')
  const projectTextsDir = path.join(projectRoot, 'textos-dominio')
  
  console.log(`📂 Buscando textos en: ${projectTextsDir}`)
  const allTexts: TextRow[] = []
  let successCount = 0
  let skipCount = 0
  
  for (const [filename, moduleName] of Object.entries(FILE_MAPPING)) {
    const filepath = path.join(projectTextsDir, filename)
    
    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️  No encontrado: ${filename}`)
      skipCount++
      continue
    }
    
    console.log(`📖 Leyendo ${filename}...`)
    const content = fs.readFileSync(filepath, 'utf-8')
    const rows = parseMarkdownTable(content)
    
    console.log(`   → ${rows.length} filas parseadas`)
    
    rows.forEach((row, idx) => {
      // Flexibilidad en nombres de columnas
      const textKey = row.clave || row.key || row.id || `${moduleName}_${idx}`
      const textEs = row.texto_original || row.texto || row.es || row.text_es || ''
      const textAi = row.dominio_ia || row.ia || row.ai || ''
      const textData = row.dominio_data || row.data || row.data_domain || ''
      const textDigital = row.dominio_transformacion_digital || 
                          row.transformacion_digital || 
                          row.digital || 
                          row.transformacion || ''
      
      if (textKey && textEs) {
        allTexts.push({
          tool_module: moduleName,
          text_key: String(textKey),
          text_es: String(textEs),
          text_ai_domain: String(textAi),
          text_data_domain: String(textData),
          text_digital_domain: String(textDigital),
        })
        successCount++
      }
    })
  }
  
  console.log(`\n✅ Total de textos a insertar: ${allTexts.length}`)
  console.log(`   Archivos procesados: ${Object.keys(FILE_MAPPING).length - skipCount}`)
  
  if (allTexts.length === 0) {
    console.error('❌ No se encontraron textos para insertar')
    process.exit(1)
  }
  
  // Insertar en batches
  const BATCH_SIZE = 100
  let insertedCount = 0
  
  for (let i = 0; i < allTexts.length; i += BATCH_SIZE) {
    const batch = allTexts.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    console.log(`📤 Insertando batch ${batchNum}/${Math.ceil(allTexts.length / BATCH_SIZE)}...`)
    
    const { data, error } = await supabase
      .from('application_texts')
      .insert(batch)
    
    if (error) {
      console.error(`❌ Error en batch ${batchNum}: ${error.message}`)
      console.error(`   Details: ${error.details}`)
      throw error
    }
    
    insertedCount += batch.length
    console.log(`   ✓ ${batch.length} registros insertados`)
  }
  
  console.log(`\n✨ Seed completado exitosamente`)
  console.log(`   Total insertado: ${insertedCount} textos`)
}

seedApplicationTexts().catch(err => {
  console.error('❌ Error fatal:', err.message)
  process.exit(1)
})