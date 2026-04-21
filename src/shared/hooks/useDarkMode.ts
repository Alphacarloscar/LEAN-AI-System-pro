// ============================================================
// LEAN AI System — useDarkMode hook
// Persistido en localStorage para sobrevivir recargas.
// ============================================================

import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('lean-dark-mode')
      return stored === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('lean-dark-mode', String(dark))
    } catch {
      // ignore
    }
  }, [dark])

  return { dark, toggle: () => setDark((v) => !v) }
}
