/**
 * Generate application texts seed data from source code.
 *
 * Extracts hardcoded text strings from React components and other modules
 * to populate the application_texts table with correct semantics:
 * - tool_module: the module/tool where the text lives
 * - text_key: the original text as it appears in source code
 * - filename: the file:line location in source code
 * - text_override: null by default (user can set overrides in admin panel)
 *
 * ADR-029: Multi-Domain Platform
 * BKL-024: Package-based module visibility
 *
 * Allowed modules: t1, t10, t11, t12, admin, admin_auth, company_profile, navegacion
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

interface TextEntry {
  tool_module: string
  text_key: string
  filename: string
  text_override: null
}

// Map source files to modules
const MODULE_MAPPINGS: Record<string, string> = {
  // T1 - Maturity Radar
  'src/modules/T1_MaturityRadar': 't1',

  // T10 - AI Value Dashboard
  'src/modules/T10_AIValueDashboard': 't10',

  // T11 - Operating Rhythm
  'src/modules/T11_OperatingRhythm': 't11',

  // T12 - ISO Assessment
  'src/modules/T12_ISOAssessment': 't12',

  // Admin
  'src/modules/Admin': 'admin',

  // Auth (part of Auth module)
  'src/modules/Auth': 'admin_auth',

  // Company Profile
  'src/modules/CompanyProfile': 'company_profile',

  // Shared navigation
  'src/shared/components/AppSidebar': 'navegacion',
}

// Extract strings from a file (basic implementation)
function extractStringsFromFile(filePath: string, module: string): TextEntry[] {
  const entries: TextEntry[] = []

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    // Regular expressions for different string patterns
    const patterns = [
      // String literals: "...", '...'
      /['""]([^'""\n]{10,150})['""](?=[,\);])/g,
      // Template literals: `...`
      /`([^`\n]{10,150})`(?=[,\);])/g,
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Skip comments, imports, and type definitions
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('import ') ||
        trimmed.startsWith('export ') ||
        trimmed.includes('type ') ||
        trimmed.includes('interface ')
      ) {
        continue
      }

      // Look for string literals in content areas (not type definitions)
      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(line)) !== null) {
          const text = match[1]?.trim()
          if (text && text.length > 5 && !text.includes('${')) {
            // Skip very short strings and template expressions
            const lineNum = i + 1
            entries.push({
              tool_module: module,
              text_key: text,
              filename: `${path.basename(filePath)}:${lineNum}`,
              text_override: null,
            })
          }
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️  Failed to read ${filePath}: ${err instanceof Error ? err.message : String(err)}`)
  }

  return entries
}

// Walk directory tree
function walkDir(dir: string, module: string, extensions = ['.tsx', '.ts']): TextEntry[] {
  const entries: TextEntry[] = []

  try {
    const files = fs.readdirSync(dir, { withFileTypes: true })

    for (const file of files) {
      const fullPath = path.join(dir, file.name)

      if (file.isDirectory()) {
        entries.push(...walkDir(fullPath, module, extensions))
      } else if (extensions.some(ext => file.name.endsWith(ext))) {
        entries.push(...extractStringsFromFile(fullPath, module))
      }
    }
  } catch (err) {
    console.warn(`⚠️  Failed to walk directory ${dir}: ${err instanceof Error ? err.message : String(err)}`)
  }

  return entries
}

function generateSeed(): TextEntry[] {
  const allEntries: TextEntry[] = []
  const seenKeys = new Set<string>()

  for (const [srcPattern, module] of Object.entries(MODULE_MAPPINGS)) {
    const fullPath = path.join(projectRoot, srcPattern)

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Path not found: ${srcPattern}`)
      continue
    }

    console.log(`📖 Scanning ${srcPattern} for module: ${module}`)

    const isFile = fs.statSync(fullPath).isFile()
    const entries = isFile
      ? extractStringsFromFile(fullPath, module)
      : walkDir(fullPath, module)

    // Deduplicate by (module, text_key) pair
    const unique = entries.filter(e => {
      const key = `${e.tool_module}:${e.text_key}`
      if (seenKeys.has(key)) return false
      seenKeys.add(key)
      return true
    })

    console.log(`   → Found ${entries.length} total, ${unique.length} unique strings`)
    allEntries.push(...unique)
  }

  return allEntries
}

async function main() {
  console.log('📋 Generating application_texts seed data...\n')

  const entries = generateSeed()

  console.log(`\n✅ Total entries generated: ${entries.length}`)

  // Write output for review
  const outputPath = path.join(projectRoot, 'seeds/application_texts_generated.json')
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2))
  console.log(`📝 Seed data written to: ${outputPath}`)

  // Summary by module
  console.log('\n📊 Breakdown by module:')
  const byModule = new Map<string, number>()
  for (const entry of entries) {
    byModule.set(entry.tool_module, (byModule.get(entry.tool_module) ?? 0) + 1)
  }

  for (const [module, count] of Array.from(byModule.entries()).sort()) {
    console.log(`   ${module}: ${count}`)
  }

  console.log('\n✨ Next step: Review the seed file and then run:')
  console.log('   npm run seed:texts')
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
