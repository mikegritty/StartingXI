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
  // When true, FrameTimeline is in Animate mode (expanded, prominent play button, tools dimmed)
  animateMode: false,

  // Left panel collapsed state (desktop only). Initialised from localStorage.
  leftPanelCollapsed: (() => {
    try { return localStorage.getItem('leftPanelCollapsed') === 'true' } catch { return false }
  })(),

  // Active left-panel navigation section. Persisted to localStorage.
  // 'squad' | 'games' | 'training' | 'schedule'
  activeNavSection: (() => {
    try { return localStorage.getItem('activeNavSection') || 'games' } catch { return 'games' }
  })(),

  // Tactical phase — global annotation, null = none selected
  // 'build' | 'progress' | 'final' | 'defend' | 'transition' | null
  activePhase: null,

  // Active formation key per team. Home formation persisted to localStorage.
  activeFormationKey: (() => {
    try { return { home: localStorage.getItem('activeFormationKey_home') || null, away: null } }
    catch { return { home: null, away: null } }
  })(),

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
  setAnimateMode: (v) => set({ animateMode: v }),

  setLeftPanelCollapsed: (v) => {
    try { localStorage.setItem('leftPanelCollapsed', String(v)) } catch {}
    return set({ leftPanelCollapsed: v })
  },

  setActiveNavSection: (section) => {
    try { localStorage.setItem('activeNavSection', section) } catch {}
    return set({ activeNavSection: section })
  },

  // Toggle phase — clicking the active phase again clears it
  setActivePhase: (phase) =>
    set((s) => ({ activePhase: s.activePhase === phase ? null : phase })),

  setActiveFormationKey: (team, key) => {
    if (team === 'home') {
      try {
        if (key) localStorage.setItem('activeFormationKey_home', key)
        else localStorage.removeItem('activeFormationKey_home')
      } catch { /* ignore */ }
    }
    return set((s) => ({
      activeFormationKey: { ...s.activeFormationKey, [team]: key },
    }))
  },

  openConfirmDialog: (pendingFormationApply) =>
    set({ confirmDialogOpen: true, pendingFormationApply }),

  closeConfirmDialog: () =>
    set({ confirmDialogOpen: false, pendingFormationApply: null }),
}))
