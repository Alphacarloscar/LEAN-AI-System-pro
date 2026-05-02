// ============================================================
// LEAN AI System — useDarkMode hook
// Persistido en localStorage para sobrevivir recargas.
// Modo por defecto: LIGHT (Sprint 4 Rev2 — paleta Obsidian Amber)
//
// MIGRACIÓN: si el usuario tenía dark=true de la paleta navy anterior,
// se resetea a light en la versión de paleta nueva (PALETTE_VERSION=2).
// ============================================================

import { useState, useEffect } from 'react'

const PALETTE_VERSION = '2'

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      // Reset si es una nueva versión de paleta
      const storedVersion = localStorage.getItem('lean-palette-version')
      if (storedVersion !== PALETTE_VERSION) {
        localStorage.setItem('lean-palette-version', PALETTE_VERSION)
        localStorage.setItem('lean-dark-mode', 'false')
        return false
      }
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
