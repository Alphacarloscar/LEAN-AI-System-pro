// ============================================================
// T2 — Zustand store con Supabase
//
// Sprint 5: Supabase como fuente de verdad.
// Eliminado: persist middleware (localStorage).
// Añadido: load(engagementId) + mutaciones optimistas con sync.
//
// Modo demo (engagementId = null): estado local sin persistencia.
// Modo real (engagementId presente): Supabase.
// ============================================================

import { create } from 'zustand'
import type { Stakeholder } from './types'
import {
  fetchStakeholders,
  insertStakeholder,
  updateStakeholderInDb,
  deleteStakeholderFromDb,
} from '@/services/t2.service'

// ── Demo data — 8 stakeholders en 4 departamentos ─────────────
// Usada solo cuando no hay engagement activo (demo / presentación).

const DEMO_STAKEHOLDERS: Stakeholder[] = [
  // ── Dirección General ──
  {
    id:            'demo-dg-1',
    name:          'Ana Villanueva',
    role:          'CEO',
    department:    'Dirección General',
    archetype:     'decisor',
    resistance:    'media',
    manualOverride: true,
    notes:         'Interesada en resultados, no en tecnología. Pide ROI medible en <6 meses.',
    createdAt:     new Date('2026-04-10').toISOString(),
    interview: {
      answers:        { 1: 'B', 2: 'A', 3: 'D', 4: 'A', 5: 'B' },
      adoptionScore:  1.14,
      influenceScore: 4.00,
      opennessScore:  2.67,
      archetype:      'decisor',
      resistance:     'media',
      computedAt:     new Date('2026-04-10').toISOString(),
    },
  },
  {
    id:            'demo-dg-2',
    name:          'Pedro Saura',
    role:          'CFO',
    department:    'Dirección General',
    archetype:     'critico',
    resistance:    'alta',
    notes:         'Ve la IA como un gasto, no una inversión. Ha frenado dos proyectos similares anteriores.',
    createdAt:     new Date('2026-04-10').toISOString(),
    interview: {
      answers:        { 1: 'D', 2: 'D', 3: 'D', 4: 'A', 5: 'C' },
      adoptionScore:  0.00,
      influenceScore: 4.00,
      opennessScore:  0.44,
      archetype:      'critico',
      resistance:     'alta',
      computedAt:     new Date('2026-04-10').toISOString(),
    },
  },
  // ── IT / Tecnología ──
  {
    id:            'demo-it-1',
    name:          'Marcos Ibáñez',
    role:          'CIO',
    department:    'IT / Tecnología',
    archetype:     'ambassador',
    resistance:    'baja',
    notes:         'Impulsa la agenda IA internamente. Conoce las herramientas y quiere estructura metodológica.',
    createdAt:     new Date('2026-04-10').toISOString(),
    interview: {
      answers:        { 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A' },
      adoptionScore:  4.00,
      influenceScore: 4.00,
      opennessScore:  3.56,
      archetype:      'ambassador',
      resistance:     'baja',
      computedAt:     new Date('2026-04-10').toISOString(),
    },
  },
  {
    id:            'demo-it-2',
    name:          'Claudia Ros',
    role:          'Head of IT Operations',
    department:    'IT / Tecnología',
    archetype:     'adoptador',
    resistance:    'baja',
    notes:         'Usa IA en su flujo diario. Buena candidata para documentar quick wins.',
    createdAt:     new Date('2026-04-11').toISOString(),
    interview: {
      answers:        { 1: 'A', 2: 'B', 3: 'B', 4: 'B', 5: 'A' },
      adoptionScore:  4.00,
      influenceScore: 2.00,
      opennessScore:  3.56,
      archetype:      'adoptador',
      resistance:     'baja',
      computedAt:     new Date('2026-04-11').toISOString(),
    },
  },
  // ── Operaciones ──
  {
    id:            'demo-ops-1',
    name:          'Javier Morales',
    role:          'COO',
    department:    'Operaciones',
    archetype:     'decisor',
    resistance:    'media',
    manualOverride: true,
    notes:         'Abierto si ve impacto en eficiencia. Tiene autoridad sobre los procesos clave.',
    createdAt:     new Date('2026-04-11').toISOString(),
    interview: {
      answers:        { 1: 'B', 2: 'B', 3: 'D', 4: 'A', 5: 'B' },
      adoptionScore:  1.14,
      influenceScore: 4.00,
      opennessScore:  2.67,
      archetype:      'decisor',
      resistance:     'media',
      computedAt:     new Date('2026-04-11').toISOString(),
    },
  },
  {
    id:            'demo-ops-2',
    name:          'Susana Prats',
    role:          'Head of Digital Ops',
    department:    'Operaciones',
    archetype:     'especialista',
    resistance:    'media',
    manualOverride: true,
    notes:         'Conoce los procesos a fondo. Preocupada por si la IA reemplazará su equipo de analistas.',
    createdAt:     new Date('2026-04-11').toISOString(),
    interview: {
      answers:        { 1: 'C', 2: 'C', 3: 'C', 4: 'B', 5: 'C' },
      adoptionScore:  0.57,
      influenceScore: 1.33,
      opennessScore:  1.78,
      archetype:      'especialista',
      resistance:     'media',
      computedAt:     new Date('2026-04-11').toISOString(),
    },
  },
  // ── Marketing & Comercial ──
  {
    id:            'demo-mkt-1',
    name:          'Rafael Molina',
    role:          'CMO',
    department:    'Marketing & Comercial',
    archetype:     'adoptador',
    resistance:    'baja',
    notes:         'Ya usa IA para generación de contenido y análisis de campañas. Quiere más.',
    createdAt:     new Date('2026-04-12').toISOString(),
    interview: {
      answers:        { 1: 'A', 2: 'A', 3: 'B', 4: 'B', 5: 'A' },
      adoptionScore:  4.00,
      influenceScore: 2.00,
      opennessScore:  3.56,
      archetype:      'adoptador',
      resistance:     'baja',
      computedAt:     new Date('2026-04-12').toISOString(),
    },
  },
  {
    id:            'demo-mkt-2',
    name:          'Laura Giménez',
    role:          'Head of Growth',
    department:    'Marketing & Comercial',
    archetype:     'ambassador',
    resistance:    'baja',
    notes:         'Conecta bien IT y Negocio. Influye en el equipo comercial. Candidata a sponsor del piloto.',
    createdAt:     new Date('2026-04-12').toISOString(),
    interview: {
      answers:        { 1: 'A', 2: 'A', 3: 'A', 4: 'B', 5: 'A' },
      adoptionScore:  4.00,
      influenceScore: 2.67,
      opennessScore:  3.56,
      archetype:      'ambassador',
      resistance:     'baja',
      computedAt:     new Date('2026-04-12').toISOString(),
    },
  },
]

// ── Store ─────────────────────────────────────────────────────

interface T2Store {
  stakeholders: Stakeholder[]
  isLoading:    boolean

  /** Carga stakeholders desde Supabase para el engagement activo */
  load: (engagementId: string) => Promise<void>

  /** Inicializa con datos demo (sin engagement activo) */
  initDemo: () => void

  addStakeholder:    (s: Omit<Stakeholder, 'id' | 'createdAt'>, engagementId: string | null) => Promise<void>
  updateStakeholder: (id: string, updates: Partial<Omit<Stakeholder, 'id'>>, engagementId: string | null) => Promise<void>
  removeStakeholder: (id: string, engagementId: string | null) => Promise<void>

  reset: () => void
}

export const useT2Store = create<T2Store>()((set, get) => ({
  stakeholders: [],
  isLoading:    false,

  // ── load ───────────────────────────────────────────────────
  load: async (engagementId) => {
    set({ isLoading: true })
    try {
      const stakeholders = await fetchStakeholders(engagementId)
      set({ stakeholders, isLoading: false })
    } catch (err) {
      console.error('[T2Store] load:', err)
      set({ isLoading: false })
    }
  },

  // ── initDemo ───────────────────────────────────────────────
  initDemo: () => set({ stakeholders: DEMO_STAKEHOLDERS, isLoading: false }),

  // ── addStakeholder ─────────────────────────────────────────
  addStakeholder: async (s, engagementId) => {
    const newStakeholder: Stakeholder = {
      ...s,
      id:        `sh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    set((state) => ({ stakeholders: [...state.stakeholders, newStakeholder] }))

    if (engagementId) {
      try {
        await insertStakeholder(newStakeholder, engagementId)
      } catch (err) {
        console.error('[T2Store] addStakeholder sync:', err)
        // Rollback optimistic update
        set((state) => ({
          stakeholders: state.stakeholders.filter((sh) => sh.id !== newStakeholder.id),
        }))
      }
    }
  },

  // ── updateStakeholder ──────────────────────────────────────
  updateStakeholder: async (id, updates, engagementId) => {
    const prev = get().stakeholders.find((sh) => sh.id === id)

    // Optimistic update
    set((state) => ({
      stakeholders: state.stakeholders.map((sh) =>
        sh.id === id ? { ...sh, ...updates } : sh
      ),
    }))

    if (engagementId) {
      try {
        await updateStakeholderInDb(id, engagementId, updates)
      } catch (err) {
        console.error('[T2Store] updateStakeholder sync:', err)
        // Rollback
        if (prev) {
          set((state) => ({
            stakeholders: state.stakeholders.map((sh) => sh.id === id ? prev : sh),
          }))
        }
      }
    }
  },

  // ── removeStakeholder ──────────────────────────────────────
  removeStakeholder: async (id, engagementId) => {
    const prev = get().stakeholders

    // Optimistic update
    set((state) => ({
      stakeholders: state.stakeholders.filter((sh) => sh.id !== id),
    }))

    if (engagementId) {
      try {
        await deleteStakeholderFromDb(id, engagementId)
      } catch (err) {
        console.error('[T2Store] removeStakeholder sync:', err)
        // Rollback
        set({ stakeholders: prev })
      }
    }
  },

  // ── reset ──────────────────────────────────────────────────
  reset: () => set({ stakeholders: [], isLoading: false }),
}))
