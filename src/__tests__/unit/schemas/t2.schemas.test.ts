import { describe, it, expect } from 'vitest'
import { stakeholderFormSchema } from '@/lib/schemas/t2.schemas'

describe('stakeholderFormSchema', () => {
  it('acepta un payload válido completo', () => {
    const result = stakeholderFormSchema.safeParse({
      name:            'Javier Morales',
      role:            'CIO',
      department:      'Tecnología',
      unofficialTools: 'ChatGPT',
    })
    expect(result.success).toBe(true)
  })

  it('acepta un payload válido sin unofficialTools (campo opcional)', () => {
    const result = stakeholderFormSchema.safeParse({
      name:       'Ana López',
      role:       'CFO',
      department: 'Finanzas',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza name con menos de 2 caracteres', () => {
    const result = stakeholderFormSchema.safeParse({
      name:       'A',
      role:       'CIO',
      department: 'Tecnología',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('rechaza role vacío', () => {
    const result = stakeholderFormSchema.safeParse({
      name:       'Javier Morales',
      role:       '',
      department: 'Tecnología',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza department vacío', () => {
    const result = stakeholderFormSchema.safeParse({
      name:       'Javier Morales',
      role:       'CIO',
      department: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('department')
    }
  })
})
