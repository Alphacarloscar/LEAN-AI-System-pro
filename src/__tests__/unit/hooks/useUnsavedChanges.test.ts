import { describe, it, expect, beforeEach } from 'vitest'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'

beforeEach(() => {
  useUnsavedChanges.getState().clearDirty()
})

describe('useUnsavedChanges', () => {
  it('starts clean', () => {
    const { isDirty, source } = useUnsavedChanges.getState()
    expect(isDirty).toBe(false)
    expect(source).toBeNull()
  })

  it('setDirty marks dirty with source', () => {
    useUnsavedChanges.getState().setDirty('T4')
    const { isDirty, source } = useUnsavedChanges.getState()
    expect(isDirty).toBe(true)
    expect(source).toBe('T4')
  })

  it('clearDirty resets state', () => {
    useUnsavedChanges.getState().setDirty('T2')
    useUnsavedChanges.getState().clearDirty()
    const { isDirty, source } = useUnsavedChanges.getState()
    expect(isDirty).toBe(false)
    expect(source).toBeNull()
  })
})
