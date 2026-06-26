import { describe, it, expect } from 'vitest'
import { processFormSchema } from '@/lib/schemas/t3.schemas'

describe('processFormSchema', () => {
  it('acepta un payload válido completo', () => {
    const result = processFormSchema.safeParse({
      name:        'Gestión de incidencias TI',
      department:  'Tecnología',
      owner:       'Ana López',
      ownerRole:   'CTO',
      description: 'Proceso de resolución de tickets de soporte interno.',
      phase:       'piloto',
    })
    expect(result.success).toBe(true)
  })

  it('acepta un payload mínimo (solo name, department y phase)', () => {
    const result = processFormSchema.safeParse({
      name:       'Conciliación financiera',
      department: 'Finanzas',
      phase:      'validacion',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza name vacío', () => {
    const result = processFormSchema.safeParse({
      name:       '',
      department: 'Finanzas',
      phase:      'idea',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('rechaza description con menos de 10 caracteres cuando se proporciona', () => {
    const result = processFormSchema.safeParse({
      name:        'Proceso X',
      department:  'Tecnología',
      phase:       'idea',
      description: 'Corto',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('description')
    }
  })

  it('rechaza una fase fuera del enum', () => {
    const result = processFormSchema.safeParse({
      name:       'Proceso X',
      department: 'Tecnología',
      phase:      'desconocida',
    })
    expect(result.success).toBe(false)
  })

  it('acepta description vacía (string vacío tratado como omitido)', () => {
    const result = processFormSchema.safeParse({
      name:        'Proceso X',
      department:  'Tecnología',
      phase:       'escalado',
      description: '',
    })
    expect(result.success).toBe(true)
  })
})
