import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  activeTool: 'select',
  showPlayerNames: true,
  selectedPlayerId: null,
  confirmDialogOpen: false,
  pendingFormationApply: null, // { team, players, formationKey, phase }
  pendingSubId: null,          // id of sub selected for touch substitution

  // Drawing color — used by all drawing tools
  drawColor: '#ffffff',
  // Note panel — which player's note is open
  notePlayerId: null,
  // Team notes panel open
  teamNotesPanelOpen: false,

  // Animation
  activeFrameId: null,   // null = live board, string = frame id being previewed
  isPlaying: false,

  // Which phase is being viewed/edited per team: 'in' | 'out'
  activePhase: { home: 'in', away: 'in' },

  // Which formation is active per team per phase
  activeFormations: {
    home: { in: null, out: null },
    away: { in: null, out: null },
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setShowPlayerNames: (v) => set({ showPlayerNames: v }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),
  setPendingSubId: (id) => set({ pendingSubId: id }),
  setDrawColor: (color) => set({ drawColor: color }),
  setNotePlayerId: (id) => set({ notePlayerId: id }),
  setTeamNotesPanelOpen: (v) => set({ teamNotesPanelOpen: v }),
  setActiveFrameId: (id) => set({ activeFrameId: id }),
  setIsPlaying: (v) => set({ isPlaying: v }),

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
