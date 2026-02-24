import { useState } from 'react'
import { useBoardStore } from '../../store/boardStore'

export default function GameDayModal({ onClose }) {
  const homeTeamName  = useBoardStore((s) => s.board.teams.home.name)
  const setBoardName  = useBoardStore((s) => s.setBoardName)
  const setType       = useBoardStore((s) => s.setType)
  const setGameDayMeta = useBoardStore((s) => s.setGameDayMeta)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    teamName:     homeTeamName || '',
    opponentName: '',
    matchDate:    today,
  })

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.opponentName.trim()) return

    const name = `${form.teamName.trim() || 'Home'} vs ${form.opponentName.trim()}`
    setBoardName(name)
    setType('gameday')
    setGameDayMeta({
      teamName:     form.teamName.trim(),
      opponentName: form.opponentName.trim(),
      matchDate:    form.matchDate || null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-base">🗓️</span>
            <h2 className="text-sm font-semibold text-text-primary">Game Day Tactic</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] text-text-muted mb-1">Your team name</label>
            <input
              value={form.teamName}
              onChange={(e) => setForm((f) => ({ ...f, teamName: e.target.value }))}
              className="w-full text-xs bg-surface border border-border rounded-md px-2.5 py-1.5
                         text-text-primary focus:border-accent-blue outline-none transition-colors"
              placeholder="e.g. FC Barcelona"
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-muted mb-1">Opponent *</label>
            <input
              value={form.opponentName}
              onChange={(e) => setForm((f) => ({ ...f, opponentName: e.target.value }))}
              className="w-full text-xs bg-surface border border-border rounded-md px-2.5 py-1.5
                         text-text-primary focus:border-accent-blue outline-none transition-colors"
              placeholder="e.g. HJK Helsinki"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-muted mb-1">Match date (optional)</label>
            <input
              type="date"
              value={form.matchDate}
              onChange={(e) => setForm((f) => ({ ...f, matchDate: e.target.value }))}
              className="w-full text-xs bg-surface border border-border rounded-md px-2.5 py-1.5
                         text-text-primary focus:border-accent-blue outline-none transition-colors"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] px-3.5 py-1.5 rounded-md border border-border
                         text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[11px] px-3.5 py-1.5 rounded-md bg-accent-blue text-white
                         hover:bg-blue-700 transition-colors font-medium"
            >
              Set up game day
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
