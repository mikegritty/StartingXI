import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

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
  // players have x/y for both phases:
  //   x, y           = in-possession position
  //   x_out, y_out   = out-of-possession position
  //   position       = tactical label string e.g. "CDM", "CB", "ST"
  //   isStarter      = boolean; true = on pitch canvas, false = substitute bench
  //   note           = coach instructions for this player (plain text, max 500 chars)
  players: [],
  // drawings: array of drawing objects (pass, run, dribble, zone, highlight, text)
  // All positional values normalized 0–1 relative to pitchRect width/height
  drawings: [],
  // frames: array of animation frame snapshots
  frames: [],
  equipment: [],
  labels: [],
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

  // movePlayer stores position into the correct phase fields
  movePlayer: (id, x, y, phase = 'in') =>
    set((s) => ({
      board: {
        ...s.board,
        players: s.board.players.map((p) => {
          if (p.id !== id) return p
          if (phase === 'out') return { ...p, x_out: x, y_out: y }
          return { ...p, x, y }
        }),
      },
    })),

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

  // applyFormation sets positions for one phase ('in' or 'out').
  applyFormation: (team, players, phase = 'in') =>
    set((s) => {
      const otherTeam    = s.board.players.filter((p) => p.team !== team)
      const teamSubs     = s.board.players.filter((p) => p.team === team && p.isStarter === false)
      const teamStarters = s.board.players.filter((p) => p.team === team && p.isStarter !== false)

      const merged = players.map((newP, i) => {
        const old  = teamStarters[i]
        const base = { ...newP, isStarter: true, position: newP.position ?? newP.role, note: '' }
        if (!old) return base
        if (phase === 'out') {
          return { ...old, x_out: newP.x, y_out: newP.y, role: newP.role, number: newP.number }
        }
        return { ...base, x_out: old.x_out ?? old.x, y_out: old.y_out ?? old.y, note: old.note ?? '' }
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
              x:     starter.x,
              y:     starter.y,
              x_out: starter.x_out ?? starter.x,
              y_out: starter.y_out ?? starter.y,
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

  // ── Animation frame actions ──────────────────────────────────────────────

  // Add current board state as a new animation frame
  addFrame: (label) =>
    set((s) => {
      if (s.board.frames.length >= 8) return s // max 8 frames
      const frame = {
        id: uuidv4(),
        label: label || `Frame ${s.board.frames.length + 1}`,
        players:  s.board.players.map((p) => ({ ...p })),
        drawings: s.board.drawings.map((d) => ({ ...d })),
      }
      return { board: { ...s.board, frames: [...s.board.frames, frame] } }
    }),

  removeFrame: (id) =>
    set((s) => ({
      board: { ...s.board, frames: s.board.frames.filter((f) => f.id !== id) },
    })),

  updateFrame: (id, patch) =>
    set((s) => ({
      board: {
        ...s.board,
        frames: s.board.frames.map((f) => f.id === id ? { ...f, ...patch } : f),
      },
    })),

  // Restore board state from a saved frame snapshot
  restoreFrame: (id) =>
    set((s) => {
      const frame = s.board.frames.find((f) => f.id === id)
      if (!frame) return s
      return {
        board: {
          ...s.board,
          players:  frame.players.map((p) => ({ ...p })),
          drawings: frame.drawings.map((d) => ({ ...d })),
        },
      }
    }),

  exportBoard: () => JSON.stringify(get().board, null, 2),
}))
