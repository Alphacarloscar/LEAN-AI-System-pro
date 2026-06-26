import { create } from 'zustand'

interface UnsavedState {
  isDirty: boolean
  source:  string | null
  setDirty:   (src: string) => void
  clearDirty: () => void
}

export const useUnsavedChanges = create<UnsavedState>((set) => ({
  isDirty: false,
  source:  null,
  setDirty:   (src) => set({ isDirty: true,  source: src }),
  clearDirty: ()    => set({ isDirty: false, source: null }),
}))
