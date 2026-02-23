import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useBoardStore } from '../../store/boardStore'
import { roleFromNumber } from '../../data/formations'

const POSITION_OPTIONS = [
  'GK',
  'RB', 'CB', 'LB', 'RWB', 'LWB',
  'CDM', 'CM', 'CAM', 'RM', 'LM',
  'RW', 'LW', 'ST', 'CF', 'SS',
]

const ROLE_COLORS = {
  GK:  '#f59e0b',
  DEF: '#3b82f6',
  MID: '#10b981',
  FWD: '#ef4444',
}

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] ?? '#10b981'
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{
        backgroundColor: color + '22',
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {role}
    </span>
  )
}

function PlayerRow({ player, isStarter, onChange, onRemove }) {
  return (
    <tr className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
      {/* Shirt number */}
      <td className="py-1.5 px-2 w-12">
        <input
          type="number"
          min={1}
          max={99}
          value={player.number ?? ''}
          onChange={(e) => {
            const num = Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
            onChange(player.id, 'number', num)
          }}
          className="w-full text-xs bg-surface border border-border rounded px-1.5 py-1
                     text-text-primary focus:border-accent-blue outline-none text-center
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
        />
      </td>

      {/* Position label */}
      <td className="py-1.5 px-2 w-[5.5rem]">
        <input
          list="squad-positions"
          value={player.position ?? ''}
          onChange={(e) => onChange(player.id, 'position', e.target.value)}
          className="w-full text-xs bg-surface border border-border rounded px-1.5 py-1
                     text-text-primary focus:border-accent-blue outline-none"
          placeholder="CB, CDM…"
        />
      </td>

      {/* Name */}
      <td className="py-1.5 px-2">
        <input
          value={player.name ?? ''}
          onChange={(e) => onChange(player.id, 'name', e.target.value)}
          className="w-full text-xs bg-surface border border-border rounded px-1.5 py-1
                     text-text-primary focus:border-accent-blue outline-none"
          placeholder="Name…"
        />
      </td>

      {/* Role badge */}
      <td className="py-1.5 px-2 w-12 text-center">
        <RoleBadge role={player.role} />
      </td>

      {/* Remove (subs only) */}
      <td className="py-1.5 px-1 w-8 text-center">
        {!isStarter && (
          <button
            onClick={() => onRemove(player.id)}
            className="text-[11px] text-text-muted hover:text-red-400 transition-colors leading-none"
            title="Remove"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  )
}

export default function SquadEditor({ team, onClose }) {
  const allPlayers = useBoardStore((s) => s.board.players)
  const setSquad   = useBoardStore((s) => s.setSquad)
  const teamData   = useBoardStore((s) => s.board.teams[team])

  // Local draft — only committed to store on Save
  const [draft, setDraft] = useState(() =>
    allPlayers
      .filter((p) => p.team === team)
      .map((p) => ({ ...p }))
  )

  const starters = draft.filter((p) => p.isStarter !== false)
  const subs     = draft.filter((p) => p.isStarter === false)
  const canAddSub = draft.length < 20 && subs.length < 9

  const handleChange = (id, field, value) => {
    setDraft((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, [field]: value }
        // Auto-derive role when shirt number changes
        if (field === 'number') {
          updated.role = roleFromNumber(Number(value))
        }
        return updated
      })
    )
  }

  const handleRemove = (id) => {
    setDraft((prev) => prev.filter((p) => p.id !== id))
  }

  const handleAddSub = () => {
    if (!canAddSub) return
    setDraft((prev) => [
      ...prev,
      {
        id: uuidv4(),
        team,
        number: '',
        name: '',
        role: 'MID',
        position: '',
        isStarter: false,
        selected: false,
        x: 0.5,
        y: 0.5,
      },
    ])
  }

  const handleSave = () => {
    setSquad(team, draft)
    onClose()
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const tableHeader = (
    <thead>
      <tr className="text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">
        <th className="text-center pb-2 px-2">#</th>
        <th className="text-left pb-2 px-2">Pos</th>
        <th className="text-left pb-2 px-2">Name</th>
        <th className="text-center pb-2 px-2">Role</th>
        <th />
      </tr>
    </thead>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      {/* Position datalist for all inputs */}
      <datalist id="squad-positions">
        {POSITION_OPTIONS.map((p) => <option key={p} value={p} />)}
      </datalist>

      <div className="bg-panel border border-border rounded-xl shadow-2xl w-[540px] max-h-[88vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full ring-1 ring-white/10"
              style={{ backgroundColor: teamData.primaryColor }}
            />
            <h2 className="text-sm font-semibold text-text-primary">
              {teamData.name || (team === 'home' ? 'Home Team' : 'Away Team')}
            </h2>
            <span className="text-[11px] text-text-muted">
              {draft.length} / 20 players
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Starting XI */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Starting XI
              <span className="ml-1.5 font-normal normal-case">({starters.length} / 11)</span>
            </p>
            {starters.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">
                Apply a formation to populate the starting XI.
              </p>
            ) : (
              <table className="w-full">
                {tableHeader}
                <tbody>
                  {starters.map((p) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      isStarter={true}
                      onChange={handleChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Substitutes */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Substitutes
              <span className="ml-1.5 font-normal normal-case">({subs.length} / 9)</span>
            </p>
            {subs.length > 0 && (
              <table className="w-full mb-3">
                {tableHeader}
                <tbody>
                  {subs.map((p) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      isStarter={false}
                      onChange={handleChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </tbody>
              </table>
            )}
            <button
              onClick={handleAddSub}
              disabled={!canAddSub}
              className="text-[11px] px-3 py-1.5 rounded-md border border-dashed border-border
                         text-text-muted hover:text-text-primary hover:border-text-muted
                         transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Add substitute
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-2 justify-end px-5 py-3.5 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="text-[11px] px-3.5 py-1.5 rounded-md border border-border
                       text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-[11px] px-3.5 py-1.5 rounded-md bg-accent-blue text-white
                       hover:bg-blue-700 transition-colors font-medium"
          >
            Save squad
          </button>
        </div>
      </div>
    </div>
  )
}
