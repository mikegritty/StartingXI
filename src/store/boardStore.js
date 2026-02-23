import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

const DEFAULT_BOARD = {
  id: uuidv4(),
  name: 'New Board',
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
  // New fields:
  //   position       = tactical label string e.g. "CDM", "CB", "ST"
  //   isStarter      = boolean; true = on pitch canvas, false = substitute bench
  players: [],
  drawings: [],
  equipment: [],
  labels: [],
}

export const useBoardStore = create((set, get) => ({
  board: DEFAULT_BOARD,

  setBoardName: (name) =>
    set((s) => ({ board: { ...s.board, name } })),

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
  // Existing substitutes (isStarter === false) for the team are preserved.
  // Existing starters are merged by index so out-of-possession coords are kept.
  applyFormation: (team, players, phase = 'in') =>
    set((s) => {
      const otherTeam    = s.board.players.filter((p) => p.team !== team)
      const teamSubs     = s.board.players.filter((p) => p.team === team && p.isStarter === false)
      const teamStarters = s.board.players.filter((p) => p.team === team && p.isStarter !== false)

      const merged = players.map((newP, i) => {
        const old  = teamStarters[i]
        const base = { ...newP, isStarter: true, position: newP.position ?? newP.role }
        if (!old) return base
        if (phase === 'out') {
          return { ...old, x_out: newP.x, y_out: newP.y, role: newP.role, number: newP.number }
        }
        // Keep out-of-possession coords from existing player if they exist
        return { ...base, x_out: old.x_out ?? old.x, y_out: old.y_out ?? old.y }
      })

      return {
        board: {
          ...s.board,
          players: [...otherTeam, ...merged, ...teamSubs],
        },
      }
    }),

  // Swap a sub onto the pitch in place of a starter.
  // subId becomes a starter (inherits starter's x/y/x_out/y_out).
  // starterId becomes a sub (loses pitch coords).
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

  exportBoard: () => JSON.stringify(get().board, null, 2),
}))
