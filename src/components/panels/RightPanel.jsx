import { useState, useRef, useEffect } from 'react'
import { useBoardStore } from '../../store/boardStore'

const ROLE_LABELS = {
  GK:  { label: 'Goalkeeper', short: 'GK',  color: '#f59e0b' },
  DEF: { label: 'Defender',   short: 'DEF', color: '#3b82f6' },
  MID: { label: 'Midfielder', short: 'MID', color: '#10b981' },
  FWD: { label: 'Forward',    short: 'FWD', color: '#ef4444' },
}

const ZONE_OVERLAYS = [
  { key: 'none',    label: 'None' },
  { key: 'classic', label: 'Classic Stripes' },
  { key: 'thirds',  label: 'Thirds' },
  { key: 'zones5',  label: '5 Lanes' },
  { key: 'zones18', label: '18 Zones' },
]

function contrastColor(hex) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#111111' : '#ffffff'
  } catch { return '#ffffff' }
}

// ── Inline-editable squad row ─────────────────────────────────────────────────
function SquadRow({ player, homeColor, numColor, draggable, updatePlayer }) {
  const [editingField, setEditingField] = useState(null) // 'number' | 'name' | 'position'
  const inputRef = useRef(null)

  useEffect(() => {
    if (editingField && inputRef.current) inputRef.current.focus()
  }, [editingField])

  const commit = (field, value) => {
    if (field === 'number') {
      const n = Math.max(1, Math.min(99, Number(value)))
      if (!isNaN(n)) updatePlayer(player.id, { number: n })
    } else {
      updatePlayer(player.id, { [field]: value })
    }
    setEditingField(null)
  }

  const handleDragStart = (e) => {
    e.dataTransfer.setData('subId', player.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const stopPropagation = (e) => e.stopPropagation()

  const roleInfo = ROLE_LABELS[player.role] || ROLE_LABELS.MID

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      className={`flex items-center gap-1.5 py-1 px-1 rounded-md group transition-colors
        ${draggable ? 'hover:bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
    >
      {/* Number circle — click to edit */}
      {editingField === 'number' ? (
        <input
          ref={inputRef}
          type="number"
          defaultValue={player.number}
          min={1} max={99}
          onClick={stopPropagation}
          onBlur={(e) => commit('number', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit('number', e.target.value)
            if (e.key === 'Escape') setEditingField(null)
          }}
          className="w-7 h-7 rounded-full text-center text-[9px] font-bold bg-surface
                     border border-accent-blue outline-none text-text-primary
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none shrink-0"
        />
      ) : (
        <div
          onClick={(e) => { e.stopPropagation(); setEditingField('number') }}
          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center
                     text-[9px] font-bold leading-none cursor-text
                     hover:ring-2 hover:ring-white/30 transition-all"
          style={{ backgroundColor: homeColor, color: numColor }}
          title="Click to edit number"
        >
          {player.number || '?'}
        </div>
      )}

      {/* Position label — click to edit */}
      {editingField === 'position' ? (
        <input
          ref={inputRef}
          type="text"
          defaultValue={player.position || player.role}
          maxLength={5}
          onClick={stopPropagation}
          onBlur={(e) => commit('position', e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit('position', e.target.value.toUpperCase())
            if (e.key === 'Escape') setEditingField(null)
          }}
          className="w-10 text-[9px] font-semibold uppercase bg-surface border border-accent-blue
                     rounded px-1 py-0.5 outline-none shrink-0"
          style={{ color: roleInfo.color }}
          list="position-options"
        />
      ) : (
        <span
          onClick={(e) => { e.stopPropagation(); setEditingField('position') }}
          className="text-[9px] font-semibold uppercase shrink-0 cursor-text
                     hover:underline underline-offset-2 transition-all w-9 truncate"
          style={{ color: roleInfo.color }}
          title="Click to edit position"
        >
          {player.position || player.role}
        </span>
      )}

      {/* Name — click to edit */}
      {editingField === 'name' ? (
        <input
          ref={inputRef}
          type="text"
          defaultValue={player.name}
          onClick={stopPropagation}
          onBlur={(e) => commit('name', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit('name', e.target.value)
            if (e.key === 'Escape') setEditingField(null)
          }}
          className="flex-1 min-w-0 text-[10px] bg-surface border border-accent-blue
                     rounded px-1.5 py-0.5 outline-none text-text-primary"
          placeholder="Name..."
        />
      ) : (
        <span
          onClick={(e) => { e.stopPropagation(); setEditingField('name') }}
          className="flex-1 min-w-0 text-[10px] text-text-primary truncate cursor-text
                     hover:underline underline-offset-2 transition-all"
          title="Click to edit name"
        >
          {player.name || <span className="text-text-muted italic">—</span>}
        </span>
      )}

      {/* Drag handle for subs */}
      {draggable && (
        <span className="text-text-muted text-[10px] shrink-0 opacity-40 cursor-grab
                         group-hover:opacity-70 transition-opacity">⠿</span>
      )}
    </div>
  )
}

// ── Squad list section ────────────────────────────────────────────────────────
function SquadList({ players, homeColor }) {
  const starters     = players.filter((p) => p.isStarter !== false)
  const subs         = players.filter((p) => p.isStarter === false)
  const numColor     = contrastColor(homeColor)
  const updatePlayer = useBoardStore((s) => s.updatePlayer)

  return (
    <div className="space-y-3">
      {/* datalist for position autocomplete */}
      <datalist id="position-options">
        {['GK','RB','CB','LB','RWB','LWB','CDM','CM','CAM','RM','LM','RW','LW','ST','CF'].map(
          (p) => <option key={p} value={p} />
        )}
      </datalist>

      {/* Starting XI */}
      <div>
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
          Starting XI <span className="font-normal normal-case opacity-70">({starters.length})</span>
        </p>
        <div className="space-y-0.5">
          {starters.map((p) => (
            <SquadRow key={p.id} player={p} homeColor={homeColor} numColor={numColor}
              draggable={false} updatePlayer={updatePlayer} />
          ))}
          {starters.length === 0 && (
            <p className="text-[11px] text-text-muted italic px-1.5">
              Apply a formation to add starters.
            </p>
          )}
        </div>
      </div>

      {/* Substitutes */}
      {subs.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Substitutes <span className="font-normal normal-case opacity-70">({subs.length})</span>
          </p>
          <p className="text-[9px] text-text-muted italic px-1.5 mb-1">
            Drag onto a pitch player to substitute
          </p>
          <div className="space-y-0.5">
            {subs.map((p) => (
              <SquadRow key={p.id} player={p} homeColor={homeColor} numColor={numColor}
                draggable={true} updatePlayer={updatePlayer} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function RightPanel() {
  const players        = useBoardStore((s) => s.board.players)
  const homeColor      = useBoardStore((s) => s.board.teams.home.primaryColor)
  const zoneOverlay    = useBoardStore((s) => s.board.pitch.zoneOverlay)
  const setZoneOverlay = useBoardStore((s) => s.setZoneOverlay)

  const homePlayers = players.filter((p) => p.team === 'home')

  return (
    <aside className="w-52 shrink-0 border-l border-border bg-panel flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* ── Home squad list ───────────────────────────────────────────── */}
        {homePlayers.length > 0 && (
          <div>
            <h2 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Squad
            </h2>
            <SquadList players={homePlayers} homeColor={homeColor} />
          </div>
        )}

        {/* ── Zone overlay ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Zone Overlay
          </h2>
          <div className="space-y-1">
            {ZONE_OVERLAYS.map(({ key, label }) => (
              <button key={key}
                onClick={() => setZoneOverlay(key)}
                className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-md border transition-colors
                  ${zoneOverlay === key
                    ? 'border-accent-blue bg-accent-blue/10 text-text-primary font-medium'
                    : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {homePlayers.length === 0 && (
          <p className="text-[11px] text-text-muted leading-relaxed">
            Apply a formation to get started.
          </p>
        )}
      </div>
    </aside>
  )
}
