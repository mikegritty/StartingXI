import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  activeTool: 'select',
  showPlayerNames: true,
  selectedPlayerId: null,
  confirmDialogOpen: false,
  pendingFormationApply: null, // { team, players, formationKey }
  pendingSubId: null,          // id of sub selected for touch substitution

  // Drawing color — used by all drawing tools
  drawColor: '#ffffff',
  // Which drawing is currently selected (in select tool mode)
  selectedDrawingId: null,
  // Note panel — which player's note is open
  notePlayerId: null,
  // Team notes panel open
  teamNotesPanelOpen: false,

  // Animation
  isPlaying: false,
  // When true, FrameTimeline shows the "Animate?" toast.
  // Set by any code path that adds a frame (Toolbar or FrameTimeline).
  frameToastPending: false,

  // Left panel collapsed state (desktop only). Initialised from localStorage.
  leftPanelCollapsed: (() => {
    try { return localStorage.getItem('leftPanelCollapsed') === 'true' } catch { return false }
  })(),

  // Tactical phase — global annotation, null = none selected
  // 'build' | 'progress' | 'final' | 'defend' | 'transition' | null
  activePhase: null,

  // Active formation key per team (replaces old activeFormations[team][phase])
  activeFormationKey: { home: null, away: null },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setShowPlayerNames: (v) => set({ showPlayerNames: v }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),
  setPendingSubId: (id) => set({ pendingSubId: id }),
  setDrawColor: (color) => set({ drawColor: color }),
  setSelectedDrawingId: (id) => set({ selectedDrawingId: id }),
  setNotePlayerId: (id) => set({ notePlayerId: id }),
  setTeamNotesPanelOpen: (v) => set({ teamNotesPanelOpen: v }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setFrameToastPending: (v) => set({ frameToastPending: v }),

  setLeftPanelCollapsed: (v) => {
    try { localStorage.setItem('leftPanelCollapsed', String(v)) } catch {}
    return set({ leftPanelCollapsed: v })
  },

  // Toggle phase — clicking the active phase again clears it
  setActivePhase: (phase) =>
    set((s) => ({ activePhase: s.activePhase === phase ? null : phase })),

  setActiveFormationKey: (team, key) =>
    set((s) => ({
      activeFormationKey: { ...s.activeFormationKey, [team]: key },
    })),

  openConfirmDialog: (pendingFormationApply) =>
    set({ confirmDialogOpen: true, pendingFormationApply }),

  closeConfirmDialog: () =>
    set({ confirmDialogOpen: false, pendingFormationApply: null }),
}))
