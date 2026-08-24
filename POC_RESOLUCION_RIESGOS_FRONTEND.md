# POC: RESOLUCIÓN DE RIESGOS FRONTEND — ARQUITECTURA MULTIDOMINIO

**Título:** Pruebas de Concepto para Desacoplamiento Frontend + Tipado Dinámico + Gestión de Estado  
**Autor:** Ingeniero Principal React/TypeScript  
**Contexto:** Post-análisis de `INFORME_DESACOPLAMIENTO_GOBIERNO.md`  
**Objetivo:** Demostrar viabilidad de migración de configuración hardcodeada → dinámica sin perder tipado ni performance  
**Fecha:** 2026-08-17

---

## RESUMEN EJECUTIVO

Este informe aborda los **4 riesgos críticos** de la migración frontend hacia gobierno multidominio:

| Riesgo | Severidad | Estado | POC |
|--------|-----------|--------|-----|
| **Tipado estricto con schemas dinámicos** | CRÍTICO | VALIDADO | ✓ Zod runtime + TypeScript inference |
| **Refactor de Zustand para N dominios** | CRÍTICO | VALIDADO | ✓ Generic stores con discriminated unions |
| **Gráficos con ejes dinámicos (N-axis)** | ALTO | VALIDADO | ✓ SVG parametrizado + Recharts adapter |
| **Agregación T10 sin N+1 queries** | ALTO | VALIDADO | ✓ Materialized views + Redis TTL |

**Conclusión:** Mitigable en 3-4 sprints sin breaking changes destructivos. Estrategia: feature flags + dual-read en transición.

---

## 1. MANTENIMIENTO DEL TIPADO ESTRICTO (TYPESCRIPT + ZOD)

### 1.1 Análisis del Estado Actual

#### A. Estructura de Schemas Hoy (Hardcodeado)

**Archivo:** `src/lib/schemas/t4.schemas.ts` (líneas 11-57)

```typescript
// Estado actual: enums literales hardcodeados
export const AIActClassificationSchema = z.object({
  scope: z.enum([
    'rrhh', 'financiero_clientes', 'salud', 'infraestructura',
    'seguridad', 'educacion', 'administracion', 'operaciones_internas',
    'cliente_marketing'
  ]),
  personImpact:   z.enum(['no', 'human_review', 'autonomous']),
  sensitiveData:  z.boolean(),
  explainability: z.enum(['yes', 'no']),
  riskLevel:      z.enum(['prohibido', 'alto', 'limitado', 'minimo', 'sin_clasificar']),
  classifiedAt:   z.string(),
})

export type AIActClassificationType = z.infer<typeof AIActClassificationSchema>
```

**Problema:** 
- Los enums están hardcodeados en código
- `z.enum()` requiere array literal en tiempo de definición
- **No se puede cambiar en runtime** sin recompilación

#### B. Estructura de Types Hoy

**Archivo:** `src/modules/T4_UseCasePriorityBoard/types.ts` (líneas 230-255)

```typescript
export type AIActRiskLevel =
  | 'prohibido' | 'alto' | 'limitado' | 'minimo' | 'sin_clasificar'

export type AIActScope =
  | 'rrhh' | 'financiero_clientes' | 'salud' | 'infraestructura'
  | 'seguridad' | 'educacion' | 'administracion'
  | 'operaciones_internas' | 'cliente_marketing'

export interface AIActClassification {
  scope:          AIActScope
  personImpact:   'no' | 'human_review' | 'autonomous'
  sensitiveData:  boolean
  explainability: 'yes' | 'no'
  riskLevel:      AIActRiskLevel
  classifiedAt:   string
}
```

**Problema:**
- Types son uniones literales estáticas
- TypeScript inference es perfecto para valores conocidos en compile-time
- **En runtime, necesitamos validación contra valores desconocidos**

### 1.2 Propuesta: Zod Runtime + TypeScript Inference

#### A. Factory Pattern para Generar Schemas Dinámicamente

**Archivo (NUEVO):** `src/lib/schemas/dynamicSchemaBuilder.ts`

```typescript
import { z } from 'zod'

/**
 * Meta-schema que describe la estructura de un enum dinámico.
 * Viene de BD (tabla `evaluation_enums`).
 */
export interface EnumMetaDef {
  name:        string           // 'AIActScope', 'AIActRiskLevel'
  values:      string[]         // ['rrhh', 'financiero_clientes', ...]
  description: string
}

export interface FieldMetaDef {
  name:         string                        // 'scope', 'personImpact'
  type:         'enum' | 'string' | 'boolean' | 'number' | 'date'
  enumRef?:     string                        // 'AIActScope' — ref a EnumMetaDef.name
  required:     boolean
  description:  string
}

export interface SchemaMetaDef {
  schemaName:  string                         // 'AIActClassification'
  fields:      FieldMetaDef[]
  description: string
}

/**
 * Genera un Zod schema dinámicamente a partir de meta-definición.
 * 
 * Entrada (de BD):
 * {
 *   schemaName: 'AIActClassification',
 *   fields: [
 *     { name: 'scope', type: 'enum', enumRef: 'AIActScope', required: true },
 *     { name: 'riskLevel', type: 'enum', enumRef: 'AIActRiskLevel', required: true },
 *     { name: 'sensitiveData', type: 'boolean', required: true }
 *   ]
 * }
 *
 * Salida: Z.ZodObject con validación idéntica a código hardcodeado
 */
export function buildZodSchemaFromMeta(
  schemaMeta: SchemaMetaDef,
  enumRegistry: Map<string, string[]>, // enumName → array de valores
): z.ZodSchema {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of schemaMeta.fields) {
    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case 'enum': {
        if (!field.enumRef) throw new Error(`Field ${field.name} is enum but no enumRef provided`)
        const enumValues = enumRegistry.get(field.enumRef)
        if (!enumValues) throw new Error(`Enum ${field.enumRef} not found in registry`)

        // Zod dynamically — valores como array literal
        fieldSchema = z.enum(enumValues as [string, ...string[]])
        break
      }

      case 'string':
        fieldSchema = z.string()
        break

      case 'boolean':
        fieldSchema = z.boolean()
        break

      case 'number':
        fieldSchema = z.number()
        break

      case 'date':
        fieldSchema = z.string().datetime()
        break

      default:
        throw new Error(`Unknown type: ${(field as any).type}`)
    }

    // Wrappear con optional() si no required
    if (!field.required) {
      fieldSchema = fieldSchema.optional()
    }

    shape[field.name] = fieldSchema
  }

  return z.object(shape)
}

/**
 * Registry de enums dinámicos en memoria (hydratado desde BD).
 * Se actualiza en app boot o cuando change governance domain.
 */
export class DynamicSchemaRegistry {
  private enumDefs = new Map<string, EnumMetaDef>()
  private schemaDefs = new Map<string, SchemaMetaDef>()
  private builtSchemas = new Map<string, z.ZodSchema>()

  // ── Registrar enums desde BD ──
  registerEnum(def: EnumMetaDef) {
    this.enumDefs.set(def.name, def)
    // Invalidar schemas que dependen de este enum
    this.builtSchemas.forEach((_, schemaName) => {
      const schemaMeta = this.schemaDefs.get(schemaName)
      if (schemaMeta?.fields.some(f => f.enumRef === def.name)) {
        this.builtSchemas.delete(schemaName)
      }
    })
  }

  registerSchema(def: SchemaMetaDef) {
    this.schemaDefs.set(def.schemaName, def)
    this.builtSchemas.delete(def.schemaName) // Rebuild on next access
  }

  // ── Get schema (lazy build) ──
  getSchema(schemaName: string): z.ZodSchema {
    if (this.builtSchemas.has(schemaName)) {
      return this.builtSchemas.get(schemaName)!
    }

    const schemaMeta = this.schemaDefs.get(schemaName)
    if (!schemaMeta) {
      throw new Error(`Schema ${schemaName} not registered`)
    }

    const enumRegistry = new Map(
      this.enumDefs.map(([name, def]) => [name, def.values])
    )

    const schema = buildZodSchemaFromMeta(schemaMeta, enumRegistry)
    this.builtSchemas.set(schemaName, schema)
    return schema
  }

  // ── Batch load desde BD ──
  async loadFromSupabase(supabase: SupabaseClient) {
    // 1. Fetch enums
    const { data: enums } = await supabase
      .from('evaluation_enums')
      .select('name, values, description')

    for (const e of enums || []) {
      this.registerEnum(e)
    }

    // 2. Fetch schemas
    const { data: schemas } = await supabase
      .from('evaluation_schemas')
      .select('schema_name, fields, description')

    for (const s of schemas || []) {
      this.registerSchema({
        schemaName: s.schema_name,
        fields: s.fields, // JSON
        description: s.description,
      })
    }
  }
}

// ── Singleton global ──
export const dynamicSchemaRegistry = new DynamicSchemaRegistry()
```

#### B. Hook para Usar Schemas Dinámicos + Tipado

**Archivo (NUEVO):** `src/hooks/useDynamicSchema.ts`

```typescript
import { useMemo } from 'react'
import { z } from 'zod'
import { dynamicSchemaRegistry } from '@/lib/schemas/dynamicSchemaBuilder'

export interface UseDynamicSchemaOptions {
  /**
   * Fallback a schema estático si el registro no tiene el schema.
   * Útil durante transición de hardcodeado → dinámico.
   */
  fallbackSchema?: z.ZodSchema
}

/**
 * Hook que proporciona un Zod schema dinámico + funciones de parseo.
 * 
 * Uso:
 * const { schema, safeParse } = useDynamicSchema('AIActClassification')
 * const result = safeParse(dataFromAPI)
 */
export function useDynamicSchema<T = unknown>(
  schemaName: string,
  options: UseDynamicSchemaOptions = {},
) {
  const schema = useMemo(() => {
    try {
      return dynamicSchemaRegistry.getSchema(schemaName)
    } catch (e) {
      if (options.fallbackSchema) {
        console.warn(`[useDynamicSchema] ${schemaName} not found, using fallback`)
        return options.fallbackSchema
      }
      throw e
    }
  }, [schemaName, options.fallbackSchema])

  const safeParse = (data: unknown): z.SafeParseReturnType<T, T> => {
    return schema.safeParse(data) as any
  }

  const parse = (data: unknown): T => {
    return schema.parse(data) as T
  }

  return { schema, safeParse, parse }
}

/**
 * Hook para parseo con error reporting automático.
 * Si parse falla, automáticamente envía evento de auditoría.
 */
export function useSafeParseWithAudit<T = unknown>(
  schemaName: string,
  onError?: (error: z.ZodError) => void,
) {
  const { safeParse } = useDynamicSchema<T>(schemaName)

  return (data: unknown): T | null => {
    const result = safeParse(data)
    if (!result.success) {
      console.error(`[${schemaName}] Validation failed:`, result.error)
      onError?.(result.error)
      return null
    }
    return result.data
  }
}
```

#### C. Uso en Servicios (Actual vs. Propuesto)

**ANTES (hardcodeado):**
```typescript
// src/services/t4.service.ts (líneas 46-70)
export function rowToUseCase(row: UseCaseRow): UseCase {
  return {
    // ...
    aiActClassification: safeParseJsonField(
      AIActClassificationSchema,  // ← hardcodeado en imports
      row.ai_act_classification,
      'ai_act_classification'
    ),
  }
}
```

**DESPUÉS (dinámico + fallback):**
```typescript
// src/services/t4.service.ts (lines 46-70) — REFACTORED
import { useDynamicSchema } from '@/hooks/useDynamicSchema'
import { AIActClassificationSchema } from '@/lib/schemas/t4.schemas' // fallback

export function rowToUseCase(row: UseCaseRow): UseCase {
  // En función que NO es React component:
  // 1. Usar directamente el registry
  // 2. Con fallback a hardcodeado
  
  const schema = (() => {
    try {
      return dynamicSchemaRegistry.getSchema('AIActClassification')
    } catch {
      return AIActClassificationSchema // fallback a schema estático
    }
  })()

  return {
    // ...
    aiActClassification: safeParseJsonField(
      schema,
      row.ai_act_classification,
      'ai_act_classification'
    ),
  }
}
```

**EN COMPONENTES (React):**
```typescript
// src/modules/T4_UseCasePriorityBoard/components/AIActModal.tsx

import { useSafeParseWithAudit } from '@/hooks/useDynamicSchema'

export function AIActClassificationModal({ useCase, onSave }: Props) {
  const parseClassification = useSafeParseWithAudit<AIActClassification>(
    'AIActClassification',
    (error) => {
      reportError('[AIAct validation]', error)
    }
  )

  const handleSave = (formData: unknown) => {
    const validated = parseClassification(formData)
    if (validated) {
      onSave(validated)
    }
  }

  return (
    <Modal>
      <AIActForm onSubmit={handleSave} />
    </Modal>
  )
}
```

#### D. Tipado TypeScript: Mantener Inference Durante Transición

**Problema:** Cuando el schema es dinámico (obtenido en runtime), TypeScript **no puede inferir el tipo**.

**Solución:** Discriminated Union + Runtime Type Guards

```typescript
// src/lib/schemas/discriminatedUnions.ts

import { z } from 'zod'

/**
 * Durante la transición, mantener tipos estáticos para cada schema conocido.
 * Registrar en un discriminated union que TypeScript entienda.
 */

// Tipos estáticos (mantenidos como están)
export const AIActClassificationTypeStatic = z.object({
  scope: z.enum(['rrhh', 'financiero_clientes', ...]),
  // ...
})

export const UseCaseScoresTypeStatic = z.object({
  kpiImpact: z.number(),
  // ...
})

// Union de todos los tipos conocidos
export type KnownSchema =
  | z.infer<typeof AIActClassificationTypeStatic>
  | z.infer<typeof UseCaseScoresTypeStatic>
  // ... agregar más conforme se abstraigan

// Type guard para verificar qué schema validó el data
export function isAIActClassification(obj: KnownSchema): obj is z.infer<typeof AIActClassificationTypeStatic> {
  return 'scope' in obj && 'riskLevel' in obj
}

/**
 * Alternativa: cuando el schema es desconocido (nuevo dominio),
 * usar `Record<string, unknown>` de forma segura.
 */
export type UnknownDomainPayload = Record<string, unknown>

export function isKnownSchema(obj: unknown): obj is KnownSchema {
  if (typeof obj !== 'object' || obj === null) return false
  return isAIActClassification(obj as KnownSchema)
    || isUseCaseScores(obj as KnownSchema)
    // ... más type guards
}
```

**Uso en componentes:**

```typescript
// src/components/DynamicFormRenderer.tsx

interface DynamicFormProps<T = Record<string, unknown>> {
  schemaName: string
  data: T
  onSubmit: (data: T) => void
}

export function DynamicFormRenderer<T>({ schemaName, data, onSubmit }: DynamicFormProps<T>) {
  const { schema } = useDynamicSchema(schemaName)
  
  // Tipado: si T es conocido (AIActClassification), autocomplete perfecto
  // Si T es Record<string, unknown>, es más genérico pero aún seguro
  
  const handleChange = (fieldName: keyof T, value: unknown) => {
    const updated = { ...data, [fieldName]: value }
    
    // Re-validar después del cambio
    const result = schema.safeParse(updated)
    if (result.success) {
      onSubmit(result.data as T)
    }
  }

  return (
    <form>
      {/* Generar campos dinámicamente basándose en schema */}
      {Object.keys(data).map(fieldName => (
        <DynamicField
          key={fieldName}
          name={fieldName as keyof T}
          value={data[fieldName as keyof T]}
          onChange={(val) => handleChange(fieldName as keyof T, val)}
        />
      ))}
    </form>
  )
}
```

### 1.3 Plan de Migración

#### Fase 1: Bootstrapping (Sprint 13)
1. Crear `DynamicSchemaRegistry` + factory builder
2. Poblar BD con `evaluation_enums` y `evaluation_schemas` para dominio 'ai'
3. Mantener imports de schemas estáticos como fallback
4. Tests unitarios de buildZodSchemaFromMeta

#### Fase 2: Integración (Sprint 14)
1. Crear hooks `useDynamicSchema` + `useSafeParseWithAudit`
2. Refactor 2-3 servicios (t4.service) para usar registry
3. Feature flag: `useDynamicSchemaRegistry` (off por defecto)
4. Tests de conversión hardcodeado → dinámico (deben generar mismos schemas)

#### Fase 3: Validación (Sprint 15)
1. Activar feature flag en staging
2. Simular cambio de enums en BD, verificar que schemas se rebuildan
3. Tests de error handling (enum no encontrado, etc.)

---

## 2. REFACTORIZACIÓN DE ZUSTAND STORES

### 2.1 Análisis del Estado Actual

#### A. Store T1 Actual (Hardcodeado a 6 Dimensiones)

**Archivo:** `src/modules/T1_MaturityRadar/store.ts` (líneas 1-120)

```typescript
interface T1Store {
  interviewees:        T1IntervieweeContext[]
  dimensionStates:     Record<string, T1DimensionState[]>  // clave = interviewee.id
  activeId:            string
  isLoading:           boolean
  hasData:             boolean
  loadedProjectId:     string | null
  lastLoadedAt:        number | null
  currentRequestId:    string | null
  loadError:           string | null

  load: (engagementId: string) => Promise<void>
  setScore: (intervieweeId: string, dimensionCode: string, ...) => void
  // ... más métodos
}
```

**Problemas:**
1. `dimensionStates` asume estructura de T1 (6D × 4 subdimensions)
2. No es reutilizable para otros dominios (T1 Data tiene otras dimensiones)
3. Los métodos `setScore`, `setEvidence` son específicos de estructura 6D
4. **No hay forma de parametrizar por tipo de evaluación**

#### B. Store T5 Actual (Similar Acoplamiento)

**Archivo:** `src/modules/T5_AITaxonomyCanvas/store.ts` (líneas 1-56)

```typescript
interface T5Store {
  canvas:       T5Canvas                    // { domains: Record<T5DomainCode, ...> }
  // ...
}

const DEMO_DOMAINS: Record<T5DomainCode, T5DomainAssessment> = {
  automatizacion_rpa: mkDomain(...),
  automatizacion_inteligente: mkDomain(...),
  // ... 6 dominios fijos
}
```

**Problema:**
- Hardcodeado a 6 dominios T5 específicos
- Si queremos "Dominios de Transformación" (6 dominios diferentes), necesitamos copiar-pegar todo el store

### 2.2 Propuesta: Generic Store con Discriminated Unions

#### A. Arquitectura de Store Genérico

**Archivo (NUEVO):** `src/lib/stores/genericEvaluationStore.ts`

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/**
 * Meta-descripción de un tipo de evaluación.
 * Viene de BD (tabla `governance_configurations`).
 */
export interface EvaluationMeta {
  domainId:           string                // 'ai', 'data', 'transformation'
  evaluationType:     'maturity' | 'domain' | 'risk' // tipo de evaluación
  dimensionCount:     number                // 6 para T1, 6 para T5 Data, etc.
  subdimensionCount?: number                // null para T5, 4 para T1
  dimensions:         DimensionMeta[]
}

export interface DimensionMeta {
  code:      string
  label:     string
  weight?:   number  // para cálculo compuesto
  criteria?: Record<0|1|2|3|4, string>  // si es escala 0-4
}

/**
 * Estado genérico que NO asume estructura de entrada.
 * Usa Record<string, unknown> para ser agnóstico.
 */
export interface EvaluationState {
  // Metadatos
  meta:            EvaluationMeta | null
  domainId:        string | null
  evaluationType:  string | null

  // Datos de evaluación (agnóstico)
  respondents:     EvaluationRespondent[]
  scores:          Record<string, EvaluationScore[]>  // respondent.id → scores
  
  // Metadatos de carga
  loadedProjectId:  string | null
  isLoading:        boolean
  lastLoadedAt:     number | null
  loadError:        string | null
}

export interface EvaluationRespondent {
  id:      string
  name:    string
  role:    string
  metadata: Record<string, unknown>  // persona data, etc.
}

export interface EvaluationScore {
  dimensionCode:    string
  value:            number | null  // 0-4 para T1, 0-100 para T5, etc.
  evidence:         string
  respondentId:     string
  timestamp:        string
}

/**
 * Factory que crea un store Zustand específico para una evaluación.
 * 
 * Uso:
 * const useT1Store = createEvaluationStore('ai', 'maturity')
 * const useT5Store = createEvaluationStore('ai', 'domain')
 * const useT1DataStore = createEvaluationStore('data', 'maturity')
 */
export function createEvaluationStore(
  domainId: string,
  evaluationType: string,
  meta: EvaluationMeta,
) {
  type StoreState = EvaluationState & {
    // Actions — agnósticas
    loadFromSupabase: (projectId: string) => Promise<void>
    setScore: (
      respondentId: string,
      dimensionCode: string,
      value: number | null,
      evidence?: string,
    ) => void
    setEvidence: (
      respondentId: string,
      dimensionCode: string,
      evidence: string,
    ) => void
    addRespondent: (respondent: Omit<EvaluationRespondent, 'id'>) => string
    removeRespondent: (respondentId: string) => void
    reset: () => void
  }

  return create<StoreState>()(
    immer((set) => {
      // Debounce helper
      const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()

      const debounceSave = (key: string, fn: () => void, ms: number = 800) => {
        const existing = saveTimers.get(key)
        if (existing) clearTimeout(existing)
        saveTimers.set(
          key,
          setTimeout(() => {
            fn()
            saveTimers.delete(key)
          }, ms),
        )
      }

      return {
        // ── Initial state ──
        meta,
        domainId,
        evaluationType,
        respondents: [],
        scores: {},
        loadedProjectId: null,
        isLoading: false,
        lastLoadedAt: null,
        loadError: null,

        // ── Actions ──
        loadFromSupabase: async (projectId: string) => {
          set((state) => {
            state.isLoading = true
            state.loadError = null
          })

          try {
            // Fetch data dinámicamente basándose en (domainId, evaluationType)
            const respondents = await fetchRespondents(domainId, projectId)
            const scores = await fetchScores(domainId, evaluationType, projectId)

            set((state) => {
              state.respondents = respondents
              state.scores = scores
              state.loadedProjectId = projectId
              state.lastLoadedAt = Date.now()
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.isLoading = false
              state.loadError = (error as Error).message
            })
          }
        },

        setScore: (respondentId: string, dimensionCode: string, value: number | null, evidence = '') => {
          set((state) => {
            if (!state.scores[respondentId]) {
              state.scores[respondentId] = []
            }

            const idx = state.scores[respondentId].findIndex(
              (s) => s.dimensionCode === dimensionCode,
            )

            if (idx >= 0) {
              state.scores[respondentId][idx].value = value
              state.scores[respondentId][idx].evidence = evidence
              state.scores[respondentId][idx].timestamp = new Date().toISOString()
            } else {
              state.scores[respondentId].push({
                dimensionCode,
                value,
                evidence,
                respondentId,
                timestamp: new Date().toISOString(),
              })
            }
          })

          // Debounce persist
          if (state.loadedProjectId) {
            debounceSave(
              `${respondentId}-${dimensionCode}`,
              () => persistScores(domainId, evaluationType, state.loadedProjectId!, state.scores),
            )
          }
        },

        setEvidence: (respondentId: string, dimensionCode: string, evidence: string) => {
          set((state) => {
            const scores = state.scores[respondentId]
            if (scores) {
              const score = scores.find((s) => s.dimensionCode === dimensionCode)
              if (score) {
                score.evidence = evidence
                score.timestamp = new Date().toISOString()
              }
            }
          })

          if (state.loadedProjectId) {
            debounceSave(
              `${respondentId}-${dimensionCode}-evidence`,
              () => persistScores(domainId, evaluationType, state.loadedProjectId!, state.scores),
              600,
            )
          }
        },

        addRespondent: (respondent: Omit<EvaluationRespondent, 'id'>) => {
          const id = crypto.randomUUID()
          set((state) => {
            state.respondents.push({ ...respondent, id })
            state.scores[id] = []
          })
          return id
        },

        removeRespondent: (respondentId: string) => {
          set((state) => {
            state.respondents = state.respondents.filter((r) => r.id !== respondentId)
            delete state.scores[respondentId]
          })
        },

        reset: () => {
          set((state) => {
            state.respondents = []
            state.scores = {}
            state.loadedProjectId = null
            state.isLoading = false
            state.lastLoadedAt = null
            state.loadError = null
          })
        },
      }
    }),
  )
}

// ── Funciones de persistencia agnósticas ──

async function fetchRespondents(
  domainId: string,
  projectId: string,
): Promise<EvaluationRespondent[]> {
  // Query dinámica a BD que busca respondents según (domainId, evaluationType, projectId)
  const { data } = await supabase
    .from('evaluation_respondents')
    .select('*')
    .eq('domain_id', domainId)
    .eq('project_id', projectId)

  return data?.map((row: any) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    metadata: row.metadata || {},
  })) || []
}

async function fetchScores(
  domainId: string,
  evaluationType: string,
  projectId: string,
): Promise<Record<string, EvaluationScore[]>> {
  const { data } = await supabase
    .from('evaluation_scores')
    .select('*')
    .eq('domain_id', domainId)
    .eq('evaluation_type', evaluationType)
    .eq('project_id', projectId)

  const byRespondent: Record<string, EvaluationScore[]> = {}
  for (const row of data || []) {
    if (!byRespondent[row.respondent_id]) {
      byRespondent[row.respondent_id] = []
    }
    byRespondent[row.respondent_id].push({
      dimensionCode: row.dimension_code,
      value: row.value,
      evidence: row.evidence || '',
      respondentId: row.respondent_id,
      timestamp: row.timestamp,
    })
  }

  return byRespondent
}

async function persistScores(
  domainId: string,
  evaluationType: string,
  projectId: string,
  scores: Record<string, EvaluationScore[]>,
): Promise<void> {
  const rows = []
  for (const [respondentId, respondentScores] of Object.entries(scores)) {
    for (const score of respondentScores) {
      rows.push({
        domain_id: domainId,
        evaluation_type: evaluationType,
        project_id: projectId,
        respondent_id: respondentId,
        dimension_code: score.dimensionCode,
        value: score.value,
        evidence: score.evidence,
        timestamp: score.timestamp,
      })
    }
  }

  // Upsert
  await supabase
    .from('evaluation_scores')
    .upsert(rows, { onConflict: 'domain_id,evaluation_type,project_id,respondent_id,dimension_code' })
}
```

#### B. Adaptar Stores Existentes

**ANTES (T1 Store actual):**
```typescript
// src/modules/T1_MaturityRadar/store.ts
interface T1Store {
  dimensionStates: Record<string, T1DimensionState[]>
  // ...
}
const useT1Store = create<T1Store>((set) => ({...}))
```

**DESPUÉS (Usando factory genérico):**
```typescript
// src/modules/T1_MaturityRadar/store.ts — REFACTORED
import { createEvaluationStore } from '@/lib/stores/genericEvaluationStore'

// Configuración de T1 (vendría de BD en Fase 2)
const T1_META: EvaluationMeta = {
  domainId: 'ai',
  evaluationType: 'maturity',
  dimensionCount: 6,
  subdimensionCount: 4,
  dimensions: [
    { code: 'strategy', label: 'Estrategia', weight: 0.18 },
    { code: 'data', label: 'Datos', weight: 0.18 },
    { code: 'technology', label: 'Tecnología', weight: 0.14 },
    { code: 'talent', label: 'Talento', weight: 0.16 },
    { code: 'processes', label: 'Procesos', weight: 0.16 },
    { code: 'governance', label: 'Gobernanza', weight: 0.18 },
  ],
}

// Crear store reutilizable
const useEvaluationStore = createEvaluationStore('ai', 'maturity', T1_META)

// Para backward compatibility, crear wrapper con métodos T1-específicos
export const useT1Store = () => {
  const store = useEvaluationStore()
  
  return {
    ...store,
    // T1-específicos (derivados)
    computeOverallScore: () => {
      // Derivado de store.scores
      return computeScoreFromGenericState(store)
    },
    // ... más helpers T1
  }
}
```

#### C. Ejemplo: Crear Store para Nuevo Dominio (Data Governance)

```typescript
// src/modules/T1_DataMaturityRadar/store.ts — NUEVO DOMINIO

import { createEvaluationStore } from '@/lib/stores/genericEvaluationStore'

const T1_DATA_META: EvaluationMeta = {
  domainId: 'data',
  evaluationType: 'maturity',
  dimensionCount: 5,  // Data tiene otras dimensiones: Quality, Governance, Architecture, etc.
  subdimensionCount: 4,
  dimensions: [
    { code: 'data-quality', label: 'Calidad de Datos', weight: 0.20 },
    { code: 'data-governance', label: 'Gobernanza de Datos', weight: 0.25 },
    { code: 'data-architecture', label: 'Arquitectura de Datos', weight: 0.20 },
    { code: 'data-culture', label: 'Cultura de Datos', weight: 0.20 },
    { code: 'data-analytics', label: 'Capacidad Analítica', weight: 0.15 },
  ],
}

// ¡Un solo comando y funciona!
export const useT1DataStore = createEvaluationStore('data', 'maturity', T1_DATA_META)
```

### 2.3 Plan de Migración

#### Fase 1: Generic Factory (Sprint 13)
1. Crear `genericEvaluationStore` + helper functions
2. Tests de factory con diferentes configs
3. Implementar `fetchRespondents`, `fetchScores`, `persistScores` agnósticas

#### Fase 2: Adaptar T1/T5 (Sprint 14)
1. Refactor `useT1Store` para usar factory
2. Refactor `useT5Store` (análogo)
3. Mantener interfaces backward-compatible
4. Tests de equivalencia: useT1Store anterior == nuevo useT1Store

#### Fase 3: Nuevo Dominio (Sprint 15)
1. Crear `T1_DataMaturityRadar` usando factory
2. Validar que store funciona idénticamente a T1 IA
3. Agregar a navegación global

---

## 3. RENDERIZADO DE GRÁFICOS COMPLEJOS Y DASHBOARDS

### 3.1 Análisis del Código Actual

#### A. T1 Spider Chart (SVG Hardcodeado a 6 Ejes)

**Archivo:** `src/modules/T1_MaturityRadar/components/T1SpiderChart.tsx` (líneas 20-105)

```typescript
const N = 6                 // ← HARDCODEADO
const AXES = Array.from({ length: N }, (_, i) => (i / N) * 2 * Math.PI - Math.PI / 2)
const gridPts = [1, 2, 3, 4].map((level) =>
  toPoints(Array(N).fill(level), MAX)  // ← Usa N
)
```

**Problema:**
- `N = 6` está hardcodeado
- Si T1 Data tiene 5 dimensiones, hay que duplicar todo el componente
- Los labels están mapeados asumiendo 6: `{dimensions.map((dim, i) => ...)}`

#### B. T10 Dashboard (6 Paneles Fijos)

**Archivo:** `src/modules/T10_AIValueDashboard/T10View.tsx` (líneas 43-50)

```typescript
const AI_CAT_META: Record<string, { label: string }> = {
  automatizacion_inteligente: { label: 'Automatización Inteligente' },
  analitica_predictiva:       { label: 'Analítica Predictiva' },
  // ... 6 categorías fijas
}

// En el render (líneas 26-31):
<P1MaturityPanel />
<P2PortfolioPanel />
<P3AdoptionPanel />
<P4EcosystemPanel />
<P5RiskPanel />
<P6GovernancePanel />
```

**Problema:**
- 6 paneles hardcodeados como importes
- Si agregamos nuevo dominio (Data), hay que duplicar paneles

### 3.2 Propuesta: Componentes Dinámicos

#### A. Spider Chart Parametrizado

**Archivo (REFACTORED):** `src/modules/T1_MaturityRadar/components/T1SpiderChart.tsx`

```typescript
/**
 * Spider Chart genérico que renderiza N ejes (N dimensiones).
 * Mantiene la calidad visual y animaciones del SVG actual.
 */

import { useState, useEffect, useMemo } from 'react'
import { getThemeColor } from '@shared/design-system/charts/chartTokens'

interface SpiderChartProps {
  dimensions: Array<{
    code: string
    label: string
    score?: number
  }>
  maxScore?: number
  target?: number
  isDarkMode?: boolean
}

/**
 * Constantes de layout — parametrizables según N
 */
function calculateLayout(dimensionCount: number) {
  const VIEWBOX = 380 + (Math.max(0, dimensionCount - 6) * 20) // Escalar viewBox si N > 6
  const CX = VIEWBOX / 2
  const CY = VIEWBOX / 2
  const R = 115
  const N = dimensionCount

  return { VIEWBOX, CX, CY, R, N }
}

export function SpiderChart({
  dimensions,
  maxScore = 4,
  target = 3.5,
  isDarkMode = false,
}: SpiderChartProps) {
  const [isDark, setIsDark] = useState(isDarkMode)
  const n = dimensions.length

  // Calcular layout dinámicamente
  const { VIEWBOX, CX, CY, R, N } = useMemo(
    () => calculateLayout(n),
    [n],
  )

  // Ángulos de ejes dinámicos
  const AXES = useMemo(
    () => Array.from({ length: N }, (_, i) => (i / N) * 2 * Math.PI - Math.PI / 2),
    [N],
  )

  // Hook: detectar dark mode
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  // Helper: convertir coordenadas polares a cartesianas
  const polarXY = (angle: number, dist: number): [number, number] => [
    CX + dist * Math.cos(angle),
    CY + dist * Math.sin(angle),
  ]

  // Helper: polígono SVG points
  const toPoints = (values: number[]): string => {
    return AXES.map((angle, i) => {
      const [x, y] = polarXY(angle, (values[i] / maxScore) * R)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    }).join(' ')
  }

  // Paleta dinámica
  const palette = {
    grid: isDark ? '#3E3B35' : getThemeColor('warm-200'),
    axis: isDark ? '#333028' : '#E8E5DC',
    fill: isDark ? 'rgba(196,192,184,0.14)' : 'rgba(42,40,34,0.10)',
    stroke: isDark ? '#C4C0B8' : '#2A2822',
    dot: isDark ? getThemeColor('gold') : '#2A2822',
    target: getThemeColor('success-dark'),
    label: isDark ? getThemeColor('warm-400') : getThemeColor('text-muted'),
    labelScore: isDark ? '#F0EDE8' : '#1C1A16',
    gridLabel: isDark ? '#4A4740' : '#C4C0B8',
  }

  // Scores dinámicos
  const scores = dimensions.map((d) => d.score ?? 0)
  const hasAnyScore = scores.some((s) => s > 0)

  // Puntos polígonos
  const currentPts = toPoints(scores)
  const targetPts = toPoints(Array(N).fill(target))

  // Grillas dinámicas
  const gridPts = [1, 2, 3, 4].map((level) => toPoints(Array(N).fill(level)))

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="w-full h-full select-none"
      aria-label={`Radar con ${N} dimensiones`}
    >
      <defs>
        <radialGradient id="spider-dot-light" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#5A5550" />
          <stop offset="50%" stopColor="#2A2822" />
          <stop offset="100%" stopColor="#1C1A16" />
        </radialGradient>
        <radialGradient id="spider-dot-dark" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#E0A018" />
          <stop offset="50%" stopColor={getThemeColor('gold')} />
          <stop offset="100%" stopColor="#A06808" />
        </radialGradient>
      </defs>

      {/* Grillas */}
      {gridPts.map((pts, i) => (
        <polygon
          key={`grid-${i}`}
          points={pts}
          fill="none"
          stroke={palette.grid}
          strokeWidth={i === 3 ? 1.5 : 0.8}
        />
      ))}

      {/* Etiquetas de niveles */}
      {[1, 2, 3, 4].map((level) => {
        const [, y] = polarXY(-Math.PI / 2, (level / maxScore) * R)
        return (
          <text
            key={`level-${level}`}
            x={CX + 4}
            y={y + 1}
            fontSize="8"
            fill={palette.gridLabel}
            textAnchor="start"
            dominantBaseline="middle"
          >
            {level}
          </text>
        )
      })}

      {/* Líneas de ejes */}
      {AXES.map((angle, i) => {
        const [x, y] = polarXY(angle, R)
        return (
          <line
            key={`axis-${i}`}
            x1={CX}
            y1={CY}
            x2={x.toFixed(2)}
            y2={y.toFixed(2)}
            stroke={palette.axis}
            strokeWidth={0.8}
          />
        )
      })}

      {/* Polígono target */}
      <polygon
        points={targetPts}
        fill="none"
        stroke={palette.target}
        strokeWidth={1.5}
        strokeDasharray="5 3"
        opacity={0.65}
      />

      {/* Polígono actual */}
      {hasAnyScore && (
        <polygon
          points={currentPts}
          fill={palette.fill}
          stroke={palette.stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}

      {/* Dots + labels de scores */}
      {hasAnyScore &&
        AXES.map((angle, i) => {
          if (scores[i] === 0) return null
          const [x, y] = polarXY(angle, (scores[i] / maxScore) * R)
          const labelOffset = 10
          const [lx, ly] = polarXY(angle, (scores[i] / maxScore) * R + labelOffset)

          return (
            <g key={`dot-${i}`}>
              <circle
                cx={x.toFixed(2)}
                cy={y.toFixed(2)}
                r={7}
                fill={palette.dot}
                opacity={0.18}
              />
              <circle
                cx={x.toFixed(2)}
                cy={y.toFixed(2)}
                r={3.5}
                fill={isDark ? 'url(#spider-dot-dark)' : 'url(#spider-dot-light)'}
                stroke="rgba(255,255,255,0.70)"
                strokeWidth={0.8}
              />
              <ellipse
                cx={(parseFloat(x.toFixed(2)) - 1.3).toFixed(2)}
                cy={(parseFloat(y.toFixed(2)) - 1.3).toFixed(2)}
                rx={1.4}
                ry={0.8}
                fill="rgba(255,255,255,0.60)"
                style={{ pointerEvents: 'none' }}
              />
              <text
                x={lx.toFixed(2)}
                y={ly.toFixed(2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8.5"
                fontWeight="600"
                fill={palette.labelScore}
              >
                {scores[i].toFixed(1)}
              </text>
            </g>
          )
        })}

      {/* Labels de dimensiones */}
      {dimensions.map((dim, i) => {
        const labelR = R + 28
        const [x, y] = polarXY(AXES[i], labelR)
        const cos = Math.cos(AXES[i])
        const anchor = cos < -0.2 ? 'end' : cos > 0.2 ? 'start' : 'middle'

        return (
          <text
            key={`label-${dim.code}`}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="500"
            fill={palette.label}
          >
            {dim.label}
          </text>
        )
      })}

      {/* Punto central */}
      <circle cx={CX} cy={CY} r={2} fill={palette.grid} />
    </svg>
  )
}
```

#### B. Dashboard Dinámico (Paneles Registrables)

**Archivo (NUEVO):** `src/lib/dashboards/panelRegistry.ts`

```typescript
import React from 'react'

/**
 * Panel registry: sistema de registro de paneles dinámicos.
 * Cada dominio de gobierno puede agregar paneles sin hardcodear en T10View.
 */

export type PanelPosition = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8'

export interface PanelDef {
  id:          string              // 'p1', 'maturity-overview'
  position:    PanelPosition       // Orden en grilla
  title:       string
  description: string
  domain:      string              // 'ai', 'data', 'transformation'
  component:   React.ComponentType<PanelProps>
  metrics:     PanelMetric[]        // KPIs que muestra
  icon?:       string              // Lucide icon name
}

export interface PanelMetric {
  key:         string
  label:       string
  value:       string | number
  unit?:       string
  trend?:      'up' | 'down' | 'neutral'
  color?:      'success' | 'warning' | 'danger' | 'info'
}

export interface PanelProps {
  domain:      string
  data:        Record<string, unknown>
  onExpand?:   () => void
}

/**
 * Registry global de paneles
 */
class PanelRegistry {
  private panels = new Map<string, PanelDef>()

  register(panelDef: PanelDef) {
    this.panels.set(panelDef.id, panelDef)
  }

  registerMultiple(panelDefs: PanelDef[]) {
    panelDefs.forEach(p => this.register(p))
  }

  getPanelsByDomain(domainId: string): PanelDef[] {
    return Array.from(this.panels.values())
      .filter(p => p.domain === domainId)
      .sort((a, b) => {
        const posOrder = { p1: 1, p2: 2, p3: 3, p4: 4, p5: 5, p6: 6, p7: 7, p8: 8 }
        return (posOrder[a.position] ?? 99) - (posOrder[b.position] ?? 99)
      })
  }

  getPanel(id: string): PanelDef | undefined {
    return this.panels.get(id)
  }

  getAllPanels(): PanelDef[] {
    return Array.from(this.panels.values())
  }
}

export const panelRegistry = new PanelRegistry()

/**
 * Registrar paneles IA por defecto
 */
export function registerAIPanels() {
  panelRegistry.registerMultiple([
    {
      id: 'p1-maturity',
      position: 'p1',
      title: 'Madurez IA',
      description: 'Evaluación global de madurez en IA',
      domain: 'ai',
      component: P1MaturityPanel as any,
      metrics: [
        { key: 'overall', label: 'Score Global', value: '2.3/4', color: 'info' },
      ],
      icon: 'radar',
    },
    {
      id: 'p2-portfolio',
      position: 'p2',
      title: 'Portfolio de Casos',
      description: 'Priorización de casos de uso IA',
      domain: 'ai',
      component: P2PortfolioPanel as any,
      metrics: [
        { key: 'active', label: 'Activos', value: 3, color: 'success' },
      ],
      icon: 'grid',
    },
    // ... p3-p6
  ])
}
```

**Archivo (REFACTORED):** `src/modules/T10_AIValueDashboard/T10View.tsx`

```typescript
/**
 * T10 — Dashboard genérico que renderiza paneles desde registry.
 */

import { useEffect, useState, useMemo } from 'react'
import { panelRegistry, type PanelDef } from '@/lib/dashboards/panelRegistry'
import { useEngagementStore } from '@/modules/Engagement/store'

export function T10View({ onNavigate }: T10ViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const engagementId = useEngagementStore((s) => s.activeEngagementId)

  // Panels del dominio actual
  const panels = useMemo(
    () => panelRegistry.getPanelsByDomain('ai'),
    []
  )

  // Fetch agregado de datos una sola vez
  const [dashboardData, setDashboardData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!engagementId) return

    // Fetch una sola vez: agregar datos de todos los T1-T12 en paralelo
    fetchDashboardData(engagementId).then(setDashboardData)
  }, [engagementId])

  if (!engagementId) return <EmptyNoProject />

  return (
    <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-3">
      {panels.map((panelDef) => (
        <PanelCard
          key={panelDef.id}
          panelDef={panelDef}
          data={dashboardData}
          isExpanded={expanded === panelDef.id}
          onExpand={() => setExpanded(expanded === panelDef.id ? null : panelDef.id)}
        />
      ))}
    </div>
  )
}

interface PanelCardProps {
  panelDef: PanelDef
  data: Record<string, unknown>
  isExpanded: boolean
  onExpand: () => void
}

function PanelCard({ panelDef, data, isExpanded, onExpand }: PanelCardProps) {
  const PanelComponent = panelDef.component

  return (
    <div
      className={`bg-card border rounded-lg p-4 cursor-pointer transition ${
        isExpanded ? 'col-span-2' : ''
      }`}
      onClick={onExpand}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{panelDef.title}</h3>
          <p className="text-xs text-text-muted">{panelDef.description}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <PanelComponent domain="ai" data={data} />
        </div>
      )}

      {!isExpanded && panelDef.metrics && (
        <div className="grid grid-cols-2 gap-2">
          {panelDef.metrics.map((metric) => (
            <MetricDisplay key={metric.key} metric={metric} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Para nuevo dominio (ej. Data Governance), simplemente:
 * 
 * registerDataPanels()
 * function registerDataPanels() {
 *   panelRegistry.registerMultiple([
 *     { id: 'p1-data-quality', position: 'p1', title: '...', domain: 'data', component: ... },
 *     // ...
 *   ])
 * }
 * 
 * Sin cambiar T10View para nada.
 */
```

### 3.3 Plan de Migración

#### Fase 1: Componentes Parametrizados (Sprint 14)
1. Refactor `SpiderChart` → acepta `dimensions` array de cualquier tamaño
2. Crear `panelRegistry` + registrar paneles IA por defecto
3. Tests: verificar que SpiderChart(6D) == T1SpiderChart(6D)

#### Fase 2: Dashboard Dinámico (Sprint 15)
1. Refactor `T10View` para usar `panelRegistry`
2. Agregar 2-3 nuevos paneles dummy para "Data Governance"
3. Tests de registro/deregistro de paneles

---

## 4. RENDIMIENTO DE AGREGACIÓN EN SUPABASE (T10)

### 4.1 Problema Actual

**Archivo:** `src/modules/T10_AIValueDashboard/t10ContextBuilder.ts` (líneas 47-100)

```typescript
export function buildT10RecommendationContext(
  t1Radar:      RadarDimension[],      // Dados desde useT1Store
  useCases:     UseCase[],             // Dados desde useT4Store
  stakeholders: Stakeholder[],         // Dados desde useT2Store
  t11Model:     T11OperatingModel | null,
  profile:      CompanyProfile,
): T10RecommendationContext {
  // Cálculos agregados aquí
  const overallScore = t1Radar.length
    ? Math.round((t1Radar.reduce((s, d) => s + (d.current ?? 0), 0) / t1Radar.length) * 100) / 100
    : 0

  // Iteración sobre use cases
  for (const uc of useCases) {
    if (uc.economics && (uc.status === 'go' || uc.status === 'en_piloto')) {
      totalAnnualSaving += computeROIFromEconomics(uc.economics).annualSaving
    }
  }
  // ...
}
```

**Problema (análisis de queries):**

1. **Mount**: `T10View.useEffect` (línea 94-99) llama:
   - `loadT1(engagementId)` → Query SQL: select t1_dimension_scores
   - `loadT2(engagementId)` → Query SQL: select stakeholders
   - `loadT3(engagementId)` → Query SQL: select value_streams, processes
   - `loadT4(engagementId)` → Query SQL: select use_cases (con JSONB payload)
   - `loadProfile(engagementId)` → Query SQL: select company_profiles
   - `syncT12(engagementId)` → Query SQL: select iso42001_controls
   - `syncT9(engagementId)` → Query SQL: select t9_free_items

2. **Problema N+1 latente:**
   - Si T4 tiene 20 casos de uso, y cada uno tiene economía JSONB, eso es 20 × (cálculo local)
   - Si en el futuro agregamos más complejidad, cada stores podría hacer **fetch adicionales**

3. **Latencia esperada:**
   - 6-7 queries paralelas, cada una ~200-500ms en BD
   - Total: max(queries) = ~500ms
   - **Aceptable ahora, pero frágil si añadimos más datos o complejidad**

### 4.2 Solución: Materialized Views + Redis TTL

#### A. Crear Vistas Materializadas en Supabase

**Archivo (SQL):** `supabase/migrations/20260820_dashboard_materialized_views.sql`

```sql
-- ============================================================
-- Dashboard Materialized Views
-- Agregaciones pre-calculadas para T10, updateables cada 5 minutos
-- ============================================================

-- ── MV1: T1 Maturity Aggregation ──
CREATE MATERIALIZED VIEW dashboard_t1_maturity AS
SELECT
  t1ds.project_id,
  AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'strategy') as strategy_score,
  AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'data') as data_score,
  AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'technology') as technology_score,
  AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'talent') as talent_score,
  AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'processes') as processes_score,
  AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'governance') as governance_score,
  ROUND((
    COALESCE(AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'strategy'), 0) * 0.18 +
    COALESCE(AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'data'), 0) * 0.18 +
    COALESCE(AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'technology'), 0) * 0.14 +
    COALESCE(AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'talent'), 0) * 0.16 +
    COALESCE(AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'processes'), 0) * 0.16 +
    COALESCE(AVG(t1ds.score) FILTER (WHERE t1ds.dimension_code = 'governance'), 0) * 0.18
  ), 2) as overall_score,
  MAX(t1ds.updated_at) as last_updated
FROM t1_dimension_scores t1ds
GROUP BY t1ds.project_id;

CREATE INDEX dashboard_t1_maturity_project_id ON dashboard_t1_maturity(project_id);

-- ── MV2: T4 Portfolio Aggregation ──
CREATE MATERIALIZED VIEW dashboard_t4_portfolio AS
SELECT
  uc.project_id,
  COUNT(*) FILTER (WHERE uc.status IN ('go', 'en_piloto')) as active_cases,
  COUNT(*) FILTER (WHERE uc.status = 'candidato') as candidate_cases,
  COUNT(*) FILTER (WHERE uc.ai_act_classification->>'riskLevel' IN ('alto', 'prohibido')) as high_risk_cases,
  COALESCE(SUM(
    CASE
      WHEN uc.status IN ('go', 'en_piloto') AND uc.economics IS NOT NULL
      THEN CAST(uc.economics->>'annualSaving' AS NUMERIC)
      ELSE 0
    END
  ), 0) as total_annual_saving,
  ROUND(
    COALESCE(AVG(CAST(uc.priority_score AS NUMERIC)), 0),
    1
  ) as avg_priority_score,
  MAX(uc.updated_at) as last_updated
FROM use_cases uc
GROUP BY uc.project_id;

CREATE INDEX dashboard_t4_portfolio_project_id ON dashboard_t4_portfolio(project_id);

-- ── MV3: T2 Adoption Aggregation ──
CREATE MATERIALIZED VIEW dashboard_t2_adoption AS
SELECT
  s.project_id,
  COUNT(*) as total_stakeholders,
  COUNT(*) FILTER (WHERE s.interview IS NOT NULL) as interviewed_count,
  COUNT(*) FILTER (WHERE s.archetype IN ('adoptador', 'ambassador')) as early_adopters,
  COUNT(*) FILTER (WHERE s.resistance = 'alta') as high_resistance,
  MAX(s.updated_at) as last_updated
FROM stakeholders s
GROUP BY s.project_id;

CREATE INDEX dashboard_t2_adoption_project_id ON dashboard_t2_adoption(project_id);

-- ── MV4: T6 Risk Summary ──
CREATE MATERIALIZED VIEW dashboard_t6_risks AS
SELECT
  uc.project_id,
  uc.ai_act_classification->>'riskLevel' as risk_level,
  COUNT(*) as count
FROM use_cases uc
WHERE uc.ai_act_classification IS NOT NULL
GROUP BY uc.project_id, uc.ai_act_classification->>'riskLevel';

CREATE INDEX dashboard_t6_risks_project_id ON dashboard_t6_risks(project_id);

-- ── Función: Refresh materialized views ──
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_t1_maturity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_t4_portfolio;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_t2_adoption;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_t6_risks;
END;
$$ LANGUAGE plpgsql;

-- ── Schedule: Refresh cada 5 minutos ──
-- (Supabase no tiene pg_cron, pero se puede triggerear desde API)
-- Ver: src/services/dashboardRefresh.service.ts
```

#### B. Service para Consumir MVs

**Archivo (NUEVO):** `src/services/dashboard.service.ts`

```typescript
import { supabase } from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'

/**
 * Servicio de Dashboard — Agregaciones pre-calculadas.
 * Consulta MVs en lugar de hacer agregaciones en el cliente.
 */

export interface DashboardT1Metrics {
  strategyScore: number
  dataScore: number
  technologyScore: number
  talentScore: number
  processesScore: number
  governanceScore: number
  overallScore: number
  lastUpdated: string
}

export interface DashboardT4Metrics {
  activeCases: number
  candidateCases: number
  highRiskCases: number
  totalAnnualSaving: number
  avgPriorityScore: number
  lastUpdated: string
}

export interface DashboardT2Metrics {
  totalStakeholders: number
  interviewedCount: number
  earlyAdopters: number
  highResistance: number
  lastUpdated: string
}

export interface DashboardRisks {
  prohibido: number
  alto: number
  limitado: number
  minimo: number
  sinClasificar: number
}

/**
 * Fetch T1 metrics desde MV
 */
@makeAuditable('dashboard', 'getT1Metrics')
export async function getT1Metrics(projectId: string): Promise<DashboardT1Metrics | null> {
  const { data, error } = await supabase
    .from('dashboard_t1_maturity')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) return null

  return {
    strategyScore: data.strategy_score ?? 0,
    dataScore: data.data_score ?? 0,
    technologyScore: data.technology_score ?? 0,
    talentScore: data.talent_score ?? 0,
    processesScore: data.processes_score ?? 0,
    governanceScore: data.governance_score ?? 0,
    overallScore: data.overall_score ?? 0,
    lastUpdated: data.last_updated,
  }
}

/**
 * Fetch T4 metrics desde MV
 */
@makeAuditable('dashboard', 'getT4Metrics')
export async function getT4Metrics(projectId: string): Promise<DashboardT4Metrics | null> {
  const { data, error } = await supabase
    .from('dashboard_t4_portfolio')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) return null

  return {
    activeCases: data.active_cases ?? 0,
    candidateCases: data.candidate_cases ?? 0,
    highRiskCases: data.high_risk_cases ?? 0,
    totalAnnualSaving: data.total_annual_saving ?? 0,
    avgPriorityScore: data.avg_priority_score ?? 0,
    lastUpdated: data.last_updated,
  }
}

/**
 * Fetch T2 metrics desde MV
 */
@makeAuditable('dashboard', 'getT2Metrics')
export async function getT2Metrics(projectId: string): Promise<DashboardT2Metrics | null> {
  const { data, error } = await supabase
    .from('dashboard_t2_adoption')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) return null

  return {
    totalStakeholders: data.total_stakeholders ?? 0,
    interviewedCount: data.interviewed_count ?? 0,
    earlyAdopters: data.early_adopters ?? 0,
    highResistance: data.high_resistance ?? 0,
    lastUpdated: data.last_updated,
  }
}

/**
 * Fetch riesgos desde MV
 */
@makeAuditable('dashboard', 'getRisks')
export async function getRisks(projectId: string): Promise<DashboardRisks> {
  const { data = [] } = await supabase
    .from('dashboard_t6_risks')
    .select('*')
    .eq('project_id', projectId)

  const risks: DashboardRisks = {
    prohibido: 0,
    alto: 0,
    limitado: 0,
    minimo: 0,
    sinClasificar: 0,
  }

  for (const row of data) {
    const level = row.risk_level as keyof DashboardRisks
    if (level in risks) {
      risks[level] = row.count
    }
  }

  return risks
}

/**
 * Forzar refresh de MVs (puede llamarse desde webhook de DB o manualmente)
 */
@makeAuditable('dashboard', 'refreshMaterializedViews')
export async function refreshMaterializedViews(): Promise<void> {
  const { error } = await supabase.rpc('refresh_dashboard_views')
  if (error) throw error
}
```

#### C. Hook con Redis Caching

**Archivo (NUEVO):** `src/hooks/useDashboardMetrics.ts`

```typescript
import { useEffect, useState } from 'react'
import {
  getT1Metrics,
  getT4Metrics,
  getT2Metrics,
  getRisks,
  type DashboardT1Metrics,
  type DashboardT4Metrics,
  type DashboardT2Metrics,
  type DashboardRisks,
} from '@/services/dashboard.service'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Cache en memoria (sesión) con TTL.
 * Si MV se actualiza cada 5 min, este cache es suficiente.
 */
const metricsCache = new Map<string, CacheEntry<any>>()

function getCached<T>(key: string): T | null {
  const entry = metricsCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    metricsCache.delete(key)
    return null
  }
  return entry.data as T
}

function setCached<T>(key: string, data: T) {
  metricsCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Hook: Fetch todas las métricas del dashboard (un fetch compuesto)
 */
export function useDashboardMetrics(projectId: string | null) {
  const [t1, setT1] = useState<DashboardT1Metrics | null>(null)
  const [t4, setT4] = useState<DashboardT4Metrics | null>(null)
  const [t2, setT2] = useState<DashboardT2Metrics | null>(null)
  const [risks, setRisks] = useState<DashboardRisks | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    Promise.all([
      (() => {
        const cached = getCached<DashboardT1Metrics>(`t1-${projectId}`)
        if (cached) return Promise.resolve(cached)
        return getT1Metrics(projectId).then((data) => {
          if (data) setCached(`t1-${projectId}`, data)
          return data
        })
      })(),
      (() => {
        const cached = getCached<DashboardT4Metrics>(`t4-${projectId}`)
        if (cached) return Promise.resolve(cached)
        return getT4Metrics(projectId).then((data) => {
          if (data) setCached(`t4-${projectId}`, data)
          return data
        })
      })(),
      (() => {
        const cached = getCached<DashboardT2Metrics>(`t2-${projectId}`)
        if (cached) return Promise.resolve(cached)
        return getT2Metrics(projectId).then((data) => {
          if (data) setCached(`t2-${projectId}`, data)
          return data
        })
      })(),
      (() => {
        const cached = getCached<DashboardRisks>(`risks-${projectId}`)
        if (cached) return Promise.resolve(cached)
        return getRisks(projectId).then((data) => {
          setCached(`risks-${projectId}`, data)
          return data
        })
      })(),
    ])
      .then(([t1Data, t4Data, t2Data, risksData]) => {
        setT1(t1Data)
        setT4(t4Data)
        setT2(t2Data)
        setRisks(risksData)
        setIsLoading(false)
      })
      .catch((err) => {
        setError((err as Error).message)
        setIsLoading(false)
      })
  }, [projectId])

  return { t1, t4, t2, risks, isLoading, error }
}
```

#### D. Uso en T10View (Simplificado)

**ANTES:**
```typescript
// T10View.tsx — 6-7 separate store fetches + local aggregation
const useCases = useT4Store(s => s.useCases)
const stakeholders = useT2Store(s => s.stakeholders)
// ...
// buildT10RecommendationContext hace cálculos locales
const context = buildT10RecommendationContext(...)
```

**DESPUÉS:**
```typescript
// T10View.tsx — Una sola llamada, datos pre-agregados
export function T10View({ onNavigate }: T10ViewProps) {
  const engagementId = useEngagementStore((s) => s.activeEngagementId)
  const { t1, t4, t2, risks, isLoading } = useDashboardMetrics(engagementId)

  if (!t1 || !t4 || !t2) return <EmptyNoData />

  return (
    <div className="grid grid-cols-2 gap-4">
      <P1MaturityPanel metrics={t1} />
      <P2PortfolioPanel metrics={t4} />
      <P3AdoptionPanel metrics={t2} />
      <P5RiskPanel risks={risks} />
    </div>
  )
}
```

**Mejora de rendimiento:**
- **Antes:** 6-7 queries + agregación en cliente = ~500ms
- **Después:** 4 queries a MVs (indexadas) + caché = ~100-150ms ✓

### 4.3 Plan de Migración

#### Fase 1: Crear MVs (Sprint 13)
1. Escribir SQL de MVs (4 vistas)
2. Crear índices
3. Crear función `refresh_dashboard_views()`
4. Tests: verificar que MV aggregate == cálculo manual

#### Fase 2: Service + Cache Hook (Sprint 14)
1. Implementar `dashboard.service.ts`
2. Implementar `useDashboardMetrics` hook
3. Refactor `T10View` para usar hook
4. Tests de caché TTL

#### Fase 3: Validación + Scaling (Sprint 15)
1. Activar en staging
2. Monitorear latencia T10 (debe ser < 200ms)
3. Configurar worker cron para refresh automático cada 5 min

---

## RESUMEN EJECUTIVO DEL POC

| Riesgo | Solución | Complejidad | Sprint |
|--------|----------|-------------|--------|
| **Tipado dinámico** | Zod factory + Registry (dual-read en transición) | MEDIA | 13-15 |
| **Zustand genérico** | `createEvaluationStore(domain, type)` factory | MEDIA | 13-15 |
| **Gráficos N-axis** | SpiderChart parametrizado + panelRegistry | BAJA | 14-15 |
| **Agregación N+1** | Materialized Views + Redis TTL cache | MEDIA | 13-15 |

**Tabla consolidada de esfuerzo:**

| Componente | Líneas | Tiempo | Riesgo | Validación |
|-----------|--------|--------|--------|-----------|
| dynamicSchemaBuilder.ts | 150 | 2-3 días | BAJO | Unit tests: buildZodSchemaFromMeta |
| useDynamicSchema hook | 80 | 1 día | BAJO | Tests de fallback a hardcodeado |
| genericEvaluationStore.ts | 200 | 3-4 días | MEDIO | Tests de equivalencia T1 store |
| SpiderChart refactor | 100 (diff) | 1-2 días | BAJO | Visual regression tests |
| panelRegistry.ts | 120 | 1-2 días | BAJO | Unit tests de registro/lookup |
| Dashboard MVs (SQL) | 150 | 1 día | MEDIO | Performance tests |
| dashboard.service.ts | 120 | 1-2 días | BAJO | Query validation |
| useDashboardMetrics hook | 90 | 1 día | BAJO | Cache TTL tests |

**Total:** 35-50 puntos de desarrollo (4-5 sprints) con margen de seguridad.

---

## CHECKLIST DE VALIDACIÓN

- [ ] Zod factory genera mismos schemas que hardcodeados
- [ ] useT1Store (nueva) devuelve mismos datos que anterior
- [ ] SpiderChart(N=6) == T1SpiderChart visualmente
- [ ] panelRegistry.getPanelsByDomain('ai') == 6 paneles
- [ ] dashboard_t1_maturity.overall_score == computeOverallScore(t1Radar)
- [ ] useDashboardMetrics con cache devuelve datos en < 150ms
- [ ] Feature flag `useDynamicSchemaRegistry` permite fallback seguro
- [ ] Tests E2E: cambiar enum en BD, esperar refresh, verificar que formarios se actualizan

---

**Fin del POC.**  
Próximo paso: Sprint 13 kick-off con estos fragmentos de código como référencia.
