import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  activeTool: 'select',
  showPlayerNames: true,
  selectedPlayerId: null,
  confirmDialogOpen: false,
  pendingFormationApply: null, // { team, players, formationKey, phase }

  // Which phase is being viewed/edited per team: 'in' | 'out'
  activePhase: { home: 'in', away: 'in' },

  // Which formation is active per team per phase: { home: { in: '4-3-3', out: '4-4-2' }, away: {...} }
  activeFormations: {
    home: { in: null, out: null },
    away: { in: null, out: null },
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setShowPlayerNames: (v) => set({ showPlayerNames: v }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),

  setActivePhase: (team, phase) =>
    set((s) => ({
      activePhase: { ...s.activePhase, [team]: phase },
    })),

  setActiveFormation: (team, phase, formationKey) =>
    set((s) => ({
      activeFormations: {
        ...s.activeFormations,
        [team]: { ...s.activeFormations[team], [phase]: formationKey },
      },
    })),

  openConfirmDialog: (pendingFormationApply) =>
    set({ confirmDialogOpen: true, pendingFormationApply }),

  closeConfirmDialog: () =>
    set({ confirmDialogOpen: false, pendingFormationApply: null }),
}))
