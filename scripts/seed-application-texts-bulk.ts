import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse markdown table: | text_key | text_es | text_ai_domain | text_data_domain | text_digital_domain |
function parseMarkdownTable(content: string) {
  const lines = content.split('\n')
  const rows: any[] = []

  for (const line of lines) {
    if (!line.includes('|') || line.includes('---')) continue

    const cells = line.split('|').map((c) => c.trim()).filter((c) => c)
    if (cells.length >= 5) {
      rows.push({
        text_key: cells[0],
        text_es: cells[1],
        text_ai_domain: cells[2],
        text_data_domain: cells[3],
        text_digital_domain: cells[4],
      })
    }
  }

  return rows
}

async function seed() {
  const textosDir = path.join(process.cwd(), 'textos-dominio')

  if (!fs.existsSync(textosDir)) {
    console.log(`ℹ No textos-dominio directory found at ${textosDir}`)
    return
  }

  const files = fs.readdirSync(textosDir).filter((f) => f.endsWith('.md'))

  if (files.length === 0) {
    console.log('ℹ No markdown files found in textos-dominio/')
    return
  }

  let inserted = 0
  let skipped = 0

  for (const file of files) {
    // Extract tool_module from filename: T1_tabla_dominios.md → T1
    const toolModule = file.split('_')[0]
    const content = fs.readFileSync(path.join(textosDir, file), 'utf-8')
    const rows = parseMarkdownTable(content)

    console.log(`Processing ${file} (${rows.length} rows)...`)

    for (const row of rows) {
      const { error } = await supabase.from('application_texts').insert({
        tool_module: toolModule,
        text_key: row.text_key,
        text_es: row.text_es,
        text_ai_domain: row.text_ai_domain,
        text_data_domain: row.text_data_domain,
        text_digital_domain: row.text_digital_domain,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        if (error.code === '23505') {
          // unique constraint
          skipped++
        } else {
          console.error(`✗ Error inserting ${toolModule}/${row.text_key}:`, error.message)
        }
      } else {
        inserted++
      }
    }
  }

  console.log(`✓ Inserted: ${inserted}, Skipped (duplicates): ${skipped}`)
}

seed().catch(console.error)
