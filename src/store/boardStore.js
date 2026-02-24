import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { useSettingsStore } from './settingsStore'

// Default home team in 4-2-3-1 — always shown on a fresh board so the pitch is never empty.
const DEFAULT_4231 = [
  { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
  { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.75 },
  { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
  { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
  { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.75 },
  { role: 'MID', position: 'CDM', number: 4,  x: 0.35, y: 0.60 },
  { role: 'MID', position: 'CDM', number: 8,  x: 0.65, y: 0.60 },
  { role: 'MID', position: 'RW',  number: 7,  x: 0.18, y: 0.42 },
  { role: 'MID', position: 'CAM', number: 10, x: 0.50, y: 0.40 },
  { role: 'MID', position: 'LW',  number: 11, x: 0.82, y: 0.42 },
  { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.20 },
].map((p) => ({
  id: uuidv4(),
  team: 'home',
  name: '',
  isStarter: true,
  selected: false,
  note: '',
  phasePositions: {},
  ...p,
}))

const DEFAULT_BOARD = {
  id: uuidv4(),
  name: 'New Board',
  type: 'tactic',        // 'tactic' | 'gameday'
  gameDayMeta: null,     // { teamName, opponentName, matchDate } or null
  pitch: {
    variant: 'full',
    orientation: 'vertical',
    theme: 'green',
    zoneOverlay: 'none', // 'none' | 'classic' | 'thirds' | 'zones5' | 'zones18'
  },
  teams: {
    home: { name: 'Home Team', primaryColor: '#1a56db', secondaryColor: '#ffffff' },
    away: { name: 'Away Team', primaryColor: '#dc2626', secondaryColor: '#ffffff' },
  },
  // players: tactical label string e.g. "CDM", "CB", "ST"
  //   isStarter = boolean; true = on pitch canvas, false = substitute bench
  //   note      = coach instructions for this player (plain text, max 500 chars)
  players: DEFAULT_4231,
  // drawings: array of drawing objects (pass, run, dribble, zone, highlight, text)
  // All positional values normalized 0–1 relative to pitchRect width/height
  drawings: [],
  // play: animation play model — sequence of frames with phase per frame
  play: {
    name: '',
    frames: [
      {
        id: uuidv4(),
        index: 0,
        label: 'Frame 1',
        phase: null,
        players: DEFAULT_4231.map((p) => ({ ...p })),
        drawings: [],
        duration: 1.5,
      },
    ],
    currentFrameIndex: 0,
    isPlaying: false,
    animateBetweenFrames: false,
  },
  equipment: [],
  labels: [],
  // teamInstructions: tactical guidance text per team (auto-filled from formation, editable)
  teamInstructions: { home: '', away: '' },
}

export const useBoardStore = create((set, get) => ({
  board: DEFAULT_BOARD,

  setBoardName: (name) =>
    set((s) => ({ board: { ...s.board, name } })),

  setType: (type) =>
    set((s) => ({ board: { ...s.board, type } })),

  setGameDayMeta: (meta) =>
    set((s) => ({ board: { ...s.board, gameDayMeta: meta } })),

  resetBoard: () =>
    set({ board: { ...DEFAULT_BOARD, id: uuidv4() } }),

  setZoneOverlay: (zoneOverlay) =>
    set((s) => ({ board: { ...s.board, pitch: { ...s.board.pitch, zoneOverlay } } })),

  setTeam: (side, teamData) =>
    set((s) => ({
      board: {
        ...s.board,
        teams: { ...s.board.teams, [side]: { ...s.board.teams[side], ...teamData } },
      },
    })),

  addPlayer: (player) =>
    set((s) => ({
      board: {
        ...s.board,
        players: [
          ...s.board.players,
          {
            id: uuidv4(),
            selected: false,
            isStarter: true,
            position: player.role ?? 'MID',
            note: '',
            ...player,
          },
        ],
      },
    })),

  removePlayer: (id) =>
    set((s) => ({
      board: { ...s.board, players: s.board.players.filter((p) => p.id !== id) },
    })),

  // movePlayer writes x,y. When a phase is active it also persists to phasePositions.
  movePlayer: (id, x, y) =>
    set((s) => {
      const activePhase = useSettingsStore.getState().activePhase
      return {
        board: {
          ...s.board,
          players: s.board.players.map((p) =>
            p.id !== id ? p : {
              ...p,
              x,
              y,
              phasePositions: activePhase
                ? { ...p.phasePositions, [activePhase]: { x, y } }
                : p.phasePositions,
            }
          ),
        },
      }
    }),

  // Switch between tactical phases, saving current positions into prevPhase and
  // restoring any saved positions for nextPhase. Called from PhasePills in LeftPanel.
  // nextPhase = null means toggling the active phase off (no restore, just save).
  applyPhasePositions: (nextPhase, prevPhase) =>
    set((s) => {
      const players = s.board.players.map((p) => {
        // Always save the current live position into the previous phase slot.
        const phasePositions = prevPhase
          ? { ...(p.phasePositions ?? {}), [prevPhase]: { x: p.x, y: p.y } }
          : (p.phasePositions ?? {})
        // Restore nextPhase saved position if it exists; otherwise keep current x,y.
        const saved = nextPhase ? phasePositions[nextPhase] : null
        return {
          ...p,
          x: saved != null ? saved.x : p.x,
          y: saved != null ? saved.y : p.y,
          phasePositions,
        }
      })
      return { board: { ...s.board, players } }
    }),

  updatePlayer: (id, patch) =>
    set((s) => ({
      board: {
        ...s.board,
        players: s.board.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      },
    })),

  // Update a player's match note
  updatePlayerNote: (id, note) =>
    set((s) => ({
      board: {
        ...s.board,
        players: s.board.players.map((p) => (p.id === id ? { ...p, note } : p)),
      },
    })),

  setTeamInstructions: (team, text) =>
    set((s) => ({
      board: {
        ...s.board,
        teamInstructions: { ...s.board.teamInstructions, [team]: text },
      },
    })),

  selectPlayer: (id) =>
    set((s) => ({
      board: {
        ...s.board,
        players: s.board.players.map((p) => ({ ...p, selected: p.id === id })),
      },
    })),

  deselectAll: () =>
    set((s) => ({
      board: {
        ...s.board,
        players: s.board.players.map((p) => ({ ...p, selected: false })),
      },
    })),

  // applyFormation sets positions for all team starters. No phase concept.
  applyFormation: (team, players) =>
    set((s) => {
      const otherTeam    = s.board.players.filter((p) => p.team !== team)
      const teamSubs     = s.board.players.filter((p) => p.team === team && p.isStarter === false)
      const teamStarters = s.board.players.filter((p) => p.team === team && p.isStarter !== false)

      const merged = players.map((newP, i) => {
        const old  = teamStarters[i]
        // Clear phasePositions so stale phase snapshots don't carry over to the new shape.
        const base = { ...newP, isStarter: true, position: newP.position ?? newP.role, note: '', phasePositions: {} }
        if (!old) return base
        return { ...base, note: old.note ?? '' }
      })

      return {
        board: {
          ...s.board,
          players: [...otherTeam, ...merged, ...teamSubs],
        },
      }
    }),

  // Swap a sub onto the pitch in place of a starter.
  substitutePlayer: (subId, starterId) =>
    set((s) => ({
      board: {
        ...s.board,
        players: s.board.players.map((p) => {
          const starter = s.board.players.find((q) => q.id === starterId)
          if (p.id === subId) {
            return {
              ...p,
              isStarter: true,
              x: starter.x,
              y: starter.y,
            }
          }
          if (p.id === starterId) {
            return { ...p, isStarter: false, selected: false }
          }
          return p
        }),
      },
    })),

  // Bulk-replace the entire squad for a team (used by SquadEditor on Save)
  setSquad: (team, players) =>
    set((s) => ({
      board: {
        ...s.board,
        players: [
          ...s.board.players.filter((p) => p.team !== team),
          ...players,
        ],
      },
    })),

  // ── Drawing actions ──────────────────────────────────────────────────────

  addDrawing: (drawing) =>
    set((s) => ({
      board: { ...s.board, drawings: [...s.board.drawings, drawing] },
    })),

  removeDrawing: (id) =>
    set((s) => ({
      board: { ...s.board, drawings: s.board.drawings.filter((d) => d.id !== id) },
    })),

  clearDrawings: () =>
    set((s) => ({ board: { ...s.board, drawings: [] } })),

  updateDrawing: (id, patch) =>
    set((s) => ({
      board: {
        ...s.board,
        drawings: s.board.drawings.map((d) => d.id === id ? { ...d, ...patch } : d),
      },
    })),

  // ── Play / Animation frame actions ───────────────────────────────────────

  setPlayName: (name) =>
    set((s) => ({
      board: { ...s.board, play: { ...s.board.play, name } },
    })),

  setAnimateBetweenFrames: (v) =>
    set((s) => ({
      board: { ...s.board, play: { ...s.board.play, animateBetweenFrames: v } },
    })),

  // Replace the entire board (used by My Plays load).
  // Merges with DEFAULT_BOARD so old saves missing new fields still work correctly.
  loadBoard: (board) => set({
    board: {
      ...DEFAULT_BOARD,
      ...board,
      pitch: { ...DEFAULT_BOARD.pitch, ...(board.pitch ?? {}) },
      teams: {
        home: { ...DEFAULT_BOARD.teams.home, ...(board.teams?.home ?? {}) },
        away: { ...DEFAULT_BOARD.teams.away, ...(board.teams?.away ?? {}) },
      },
      play: {
        ...DEFAULT_BOARD.play,
        ...(board.play ?? {}),
      },
      teamInstructions: {
        home: board.teamInstructions?.home ?? '',
        away: board.teamInstructions?.away ?? '',
      },
    },
  }),

  // Snapshot the live canvas into a new frame and jump to it.
  // Frame 0 always exists as base — additional frames are added here.
  // IMPORTANT: Before adding a second frame, we sync the live canvas into frame 0
  // so that switching back to frame 0 never wipes the user's setup.
  addFrame: () =>
    set((s) => {
      const { frames, currentFrameIndex } = s.board.play
      if (frames.length >= 8) return s

      // Sync live canvas into the current frame before creating a new one.
      // This ensures frame 0 (and any current frame) always holds the latest positions.
      const syncedFrames = frames.map((f, i) =>
        i === currentFrameIndex
          ? { ...f, players: structuredClone(s.board.players), drawings: structuredClone(s.board.drawings) }
          : f
      )

      const currentFrame = syncedFrames[currentFrameIndex]
      const newFrame = {
        id: uuidv4(),
        index: syncedFrames.length,
        label: `Frame ${syncedFrames.length + 1}`,
        phase: currentFrame?.phase ?? null,
        players:  structuredClone(s.board.players),
        drawings: structuredClone(s.board.drawings),
        duration: 1.5,
      }
      return {
        board: {
          ...s.board,
          play: {
            ...s.board.play,
            frames: [...syncedFrames, newFrame],
            currentFrameIndex: syncedFrames.length,
          },
        },
      }
    }),

  // Remove a frame by id. Frame at index 0 cannot be removed.
  removeFrame: (id) =>
    set((s) => {
      const frames = s.board.play.frames
      if (frames.length <= 1) return s
      const idx = frames.findIndex((f) => f.id === id)
      if (idx === 0) return s  // cannot remove frame 0
      const newFrames = frames.filter((f) => f.id !== id).map((f, i) => ({ ...f, index: i }))
      const newIdx    = Math.min(s.board.play.currentFrameIndex, newFrames.length - 1)
      const target    = newFrames[newIdx]
      return {
        board: {
          ...s.board,
          players:  structuredClone(target.players),
          drawings: structuredClone(target.drawings),
          play: { ...s.board.play, frames: newFrames, currentFrameIndex: newIdx },
        },
      }
    }),

  updateFrame: (id, patch) =>
    set((s) => ({
      board: {
        ...s.board,
        play: {
          ...s.board.play,
          frames: s.board.play.frames.map((f) => f.id === id ? { ...f, ...patch } : f),
        },
      },
    })),

  // Switch to a frame by index — saves live canvas into the current frame first,
  // then loads the target frame's players + drawings into the live canvas.
  // This ensures manual edits are never lost when switching frames.
  setCurrentFrameIndex: (index) =>
    set((s) => {
      const { frames, currentFrameIndex } = s.board.play
      const targetFrame = frames[index]
      if (!targetFrame) return s
      // Sync live canvas into whichever frame is currently active
      const syncedFrames = frames.map((f, i) =>
        i === currentFrameIndex
          ? { ...f, players: structuredClone(s.board.players), drawings: structuredClone(s.board.drawings) }
          : f
      )
      return {
        board: {
          ...s.board,
          players:  structuredClone(syncedFrames[index].players),
          drawings: structuredClone(syncedFrames[index].drawings),
          play: { ...s.board.play, frames: syncedFrames, currentFrameIndex: index },
        },
      }
    }),

  exportBoard: () => JSON.stringify(get().board, null, 2),
}))
