// ============================================================
// useProjectMembersStore — Zustand store for project members
//
// Holds members list + UI state; delegates mutations to the service
// (ADR-011: stores call services, never access supabase directly).
// ============================================================

import { create } from 'zustand'
import * as projectMembersService from '@/services/project-members.service'
import type { ProjectMember } from '@/services/project-members.service'

interface ProjectMembersStore {
  members: ProjectMember[]
  loading: boolean
  error: string | null

  // Actions
  fetchMembers: (projectId: string) => Promise<void>
  addMember: (projectId: string, userId: string, role: 'consultant' | 'client_editor' | 'client_viewer') => Promise<void>
  updateMemberRole: (projectId: string, userId: string, role: 'consultant' | 'client_editor' | 'client_viewer') => Promise<void>
  removeMember: (projectId: string, userId: string) => Promise<void>
  inviteAndAddMember: (params: {
    projectId: string
    companyId: string
    email: string
    name: string
    role: 'consultant' | 'client_editor' | 'client_viewer'
    personId?: string | null
  }) => Promise<void>

  clearError: () => void
}

export const useProjectMembersStore = create<ProjectMembersStore>((set) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async (projectId: string) => {
    try {
      set({ loading: true, error: null })
      const members = await projectMembersService.listProjectMembers(projectId)
      set({ members })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching members'
      set({ error: message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  addMember: async (projectId: string, userId: string, role) => {
    try {
      set({ error: null })
      await projectMembersService.addProjectMember(projectId, userId, role)
      // Refresh the list
      const members = await projectMembersService.listProjectMembers(projectId)
      set({ members })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error adding member'
      set({ error: message })
      throw err
    }
  },

  updateMemberRole: async (projectId: string, userId: string, role) => {
    try {
      set({ error: null })
      await projectMembersService.updateProjectMemberRole(projectId, userId, role)
      // Refresh the list
      const members = await projectMembersService.listProjectMembers(projectId)
      set({ members })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating member role'
      set({ error: message })
      throw err
    }
  },

  removeMember: async (projectId: string, userId: string) => {
    try {
      set({ error: null })
      await projectMembersService.removeProjectMember(projectId, userId)
      // Refresh the list
      const members = await projectMembersService.listProjectMembers(projectId)
      set({ members })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error removing member'
      set({ error: message })
      throw err
    }
  },

  inviteAndAddMember: async (params) => {
    try {
      set({ error: null })
      await projectMembersService.inviteAndAddMember(params)
      // Refresh the list
      const members = await projectMembersService.listProjectMembers(params.projectId)
      set({ members })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inviting member'
      set({ error: message })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
