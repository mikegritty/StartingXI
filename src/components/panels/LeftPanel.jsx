import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import FormationPresets from '../players/FormationPresets'
import SquadEditor from '../squad/SquadEditor'
import { PHASES } from '../../data/phases'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

const PLAYS_KEY = 'startingxi_plays'
const MAX_PLAYS = 20

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadPlays() {
  try {
    return JSON.parse(localStorage.getItem(PLAYS_KEY) ?? '[]')
  } catch { return [] }
}

function savePlaysToStorage(plays) {
  localStorage.setItem(PLAYS_KEY, JSON.stringify(plays))
}

// ── PhasePills ────────────────────────────────────────────────────────────────

function PhasePills() {
  const activePhase    = useSettingsStore((s) => s.activePhase)
  const setActivePhase = useSettingsStore((s) => s.setActivePhase)

  const handlePhaseClick = (id) => {
    const prev = activePhase                        // phase we're leaving (may be null)
    const next = activePhase === id ? null : id     // null = toggling current phase off

    // 1. Save current player positions into the previous phase slot,
    //    then restore any saved positions for the next phase.
    useBoardStore.getState().applyPhasePositions(next, prev)

    // 2. Update the active phase toggle in settingsStore.
    setActivePhase(id)
  }

  return (
    <div>
      <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
        Phase
      </label>
      <div className="flex flex-wrap gap-1">
        {PHASES.map(({ id, label, color }) => {
          const active = activePhase === id
          return (
            <button
              key={id}
              onClick={() => handlePhaseClick(id)}
              className="text-[10px] px-2 py-1 rounded-full border font-medium transition-all"
              style={{
                backgroundColor: active ? color : 'transparent',
                borderColor: color,
                color: active ? '#fff' : color,
                opacity: active ? 1 : 0.7,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── TeamSection ───────────────────────────────────────────────────────────────

const MAX_INSTRUCTIONS = 500

function TeamSection({ team, defaultOpen = true, showNamesToggle = false }) {
  const teamData              = useBoardStore((s) => s.board.teams[team])
  const setTeam               = useBoardStore((s) => s.setTeam)
  const teamInstructions      = useBoardStore((s) => s.board.teamInstructions)
  const setTeamInstructions   = useBoardStore((s) => s.setTeamInstructions)
  const showNames             = useSettingsStore((s) => s.showPlayerNames)
  const setShowNames          = useSettingsStore((s) => s.setShowPlayerNames)
  const isHome                = team === 'home'
  const label                 = isHome ? 'Home' : 'Away'

  const [open, setOpen]                     = useState(defaultOpen)
  const [squadOpen, setSquadOpen]           = useState(false)
  const [instrOpen, setInstrOpen]           = useState(false)
  const [instrDraft, setInstrDraft]         = useState('')

  // Sync draft when panel opens or instructions change externally
  useEffect(() => {
    setInstrDraft(teamInstructions?.[team] ?? '')
  }, [teamInstructions, team])

  const handleInstrBlur = useCallback(() => {
    setTeamInstructions(team, instrDraft.trim())
  }, [team, instrDraft, setTeamInstructions])

  return (
    <div>
      {/* ── Section header — click to expand/collapse ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 group"
      >
        <div
          className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10"
          style={{ backgroundColor: teamData.primaryColor }}
        />
        <span className={`text-xs font-semibold uppercase tracking-wider transition-colors
          ${open ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'}`}>
          {label}
        </span>
        {!open && (
          <span className="text-[11px] text-text-muted ml-0.5 font-normal normal-case tracking-normal truncate">
            {teamData.name || 'unnamed'}
          </span>
        )}

        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`ml-auto shrink-0 text-text-muted transition-transform group-hover:text-text-primary
            ${open ? '' : '-rotate-90'}`}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>

        {/* Edit Squad button — only when expanded */}
        {open && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setSquadOpen(true) }}
            onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), setSquadOpen(true))}
            className="text-[10px] px-2 py-1 rounded border border-border
                       text-text-muted hover:text-text-primary hover:border-accent-blue
                       transition-colors cursor-pointer"
          >
            Edit Squad
          </span>
        )}
      </button>

      {/* ── Collapsible body ── */}
      {open && (
        <div className="mt-4 space-y-4">

          {/* Team name */}
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Team name
            </label>
            <input
              value={teamData.name}
              onChange={(e) => setTeam(team, { name: e.target.value })}
              className="w-full text-xs bg-surface border border-border rounded-md px-3 py-2
                         text-text-primary focus:border-accent-blue outline-none
                         placeholder:text-text-muted transition-colors"
              placeholder="Team name..."
            />
          </div>

          {/* Kit colours */}
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Kit colours
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={teamData.primaryColor}
                  onChange={(e) => setTeam(team, { primaryColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer"
                  title="Kit colour"
                />
                <span className="text-[11px] text-text-muted">Kit</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={teamData.secondaryColor}
                  onChange={(e) => setTeam(team, { secondaryColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer"
                  title="Number colour"
                />
                <span className="text-[11px] text-text-muted">Text</span>
              </div>
            </div>
          </div>

          {/* Formation picker */}
          <FormationPresets team={team} />

          {/* Instructions section */}
          <div>
            <button
              onClick={() => setInstrOpen((o) => !o)}
              className="w-full flex items-center gap-1.5 group"
            >
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider
                               group-hover:text-text-primary transition-colors">
                Instructions
              </span>
              {!instrOpen && teamInstructions?.[team] && (
                <span className="text-[9px] text-text-muted/60 font-normal normal-case tracking-normal truncate flex-1 text-left">
                  {teamInstructions[team].slice(0, 30)}…
                </span>
              )}
              <svg
                width="8" height="8" viewBox="0 0 10 10" fill="none"
                className={`ml-auto shrink-0 text-text-muted transition-transform group-hover:text-text-primary
                  ${instrOpen ? '' : '-rotate-90'}`}
              >
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>

            {instrOpen && (
              <div className="mt-1.5">
                <textarea
                  value={instrDraft}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_INSTRUCTIONS) setInstrDraft(e.target.value)
                  }}
                  onBlur={handleInstrBlur}
                  rows={4}
                  placeholder="Add tactical instructions for this team…"
                  className="w-full resize-none rounded-md bg-surface border border-border
                             text-[11px] text-text-primary placeholder:text-text-muted
                             px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue
                             transition-shadow leading-relaxed"
                />
                <div className="flex justify-between items-center mt-0.5">
                  <span className={`text-[9px] ${MAX_INSTRUCTIONS - instrDraft.length < 50 ? 'text-orange-400' : 'text-text-muted'}`}>
                    {MAX_INSTRUCTIONS - instrDraft.length} chars left
                  </span>
                  <button
                    onClick={handleInstrBlur}
                    className="text-[9px] px-2 py-0.5 rounded bg-accent-blue text-white
                               hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tactical phase pills — only under Home team */}
          {isHome && (
            <div className="pt-3 border-t border-border">
              <PhasePills />
            </div>
          )}

          {/* Player names toggle — only under Home team */}
          {showNamesToggle && (
            <div className="pt-3 border-t border-border">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Display
              </label>
              <button
                onClick={() => setShowNames(!showNames)}
                className="flex items-center gap-3 group w-full"
              >
                <div className={`w-8 h-4 rounded-full relative transition-colors shrink-0
                  ${showNames ? 'bg-accent-blue' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform
                    ${showNames ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-text-muted group-hover:text-text-primary transition-colors">
                  Player names
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {squadOpen && <SquadEditor team={team} onClose={() => setSquadOpen(false)} />}
    </div>
  )
}

// ── MyPlays ───────────────────────────────────────────────────────────────────

function MyPlays() {
  const board     = useBoardStore((s) => s.board)
  const loadBoard = useBoardStore((s) => s.loadBoard)

  const [plays, setPlays]       = useState(() => loadPlays())
  const [saving, setSaving]     = useState(false)
  const [saveName, setSaveName] = useState('')
  const saveInputRef            = useRef(null)

  useEffect(() => {
    if (saving && saveInputRef.current) saveInputRef.current.focus()
  }, [saving])

  const handleSave = () => {
    const name = saveName.trim() || board.name || 'Untitled'
    const entry = {
      id: uuidv4(),
      name,
      savedAt: Date.now(),
      board: JSON.parse(JSON.stringify(board)),
    }
    const updated = [entry, ...plays].slice(0, MAX_PLAYS)
    savePlaysToStorage(updated)
    setPlays(updated)
    setSaving(false)
    setSaveName('')
  }

  const handleLoad = (entry) => {
    if (!window.confirm(`Load "${entry.name}"? Unsaved changes will be lost.`)) return
    loadBoard(entry.board)
  }

  const handleDelete = (id) => {
    const updated = plays.filter((p) => p.id !== id)
    savePlaysToStorage(updated)
    setPlays(updated)
  }

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          My Plays
        </p>
        {!saving && (
          <button
            onClick={() => { setSaving(true); setSaveName(board.name || '') }}
            className="text-[10px] px-2 py-0.5 rounded border border-border
                       text-text-muted hover:text-text-primary hover:border-accent-blue
                       transition-colors"
            title="Save current board as a play"
          >
            + Save
          </button>
        )}
      </div>

      {/* Inline save input */}
      {saving && (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            ref={saveInputRef}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') { setSaving(false); setSaveName('') }
            }}
            placeholder="Play name..."
            className="flex-1 min-w-0 text-xs bg-surface border border-accent-blue rounded px-2 py-1
                       text-text-primary outline-none placeholder:text-text-muted"
          />
          <button
            onClick={handleSave}
            className="text-[10px] px-2 py-1 rounded bg-accent-blue text-white
                       hover:bg-blue-700 transition-colors font-medium shrink-0"
          >
            Save
          </button>
          <button
            onClick={() => { setSaving(false); setSaveName('') }}
            className="text-[10px] text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Play list */}
      {plays.length === 0 ? (
        <p className="text-[11px] text-text-muted italic">No saved plays yet.</p>
      ) : (
        <div className="space-y-0.5">
          {plays.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-md group
                         hover:bg-white/[0.04] transition-colors"
            >
              <span className="flex-1 min-w-0 text-[11px] text-text-primary truncate">
                {entry.name}
              </span>
              <span className="text-[9px] text-text-muted shrink-0 tabular-nums">
                {formatDate(entry.savedAt)}
              </span>
              <button
                onClick={() => handleLoad(entry)}
                className="text-[9px] text-text-muted hover:text-accent-blue transition-colors
                           opacity-0 group-hover:opacity-100 shrink-0 font-medium"
                title="Load play"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-[9px] text-text-muted hover:text-red-400 transition-colors
                           opacity-0 group-hover:opacity-100 shrink-0"
                title="Delete play"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main LeftPanel ────────────────────────────────────────────────────────────

export default function LeftPanel({ collapsed = false, onExpand }) {
  const homeColor = useBoardStore((s) => s.board.teams.home.primaryColor)
  const awayColor = useBoardStore((s) => s.board.teams.away.primaryColor)

  // Collapsed icon rail (desktop only)
  if (collapsed) {
    const btnCls = `w-8 flex flex-col items-center justify-center gap-0.5 py-1 rounded-md
                    text-text-muted hover:text-text-primary hover:bg-surface transition-colors`
    return (
      <aside className="w-10 shrink-0 border-r border-border bg-panel flex flex-col items-center py-3 gap-1">
        {/* Hamburger — expand */}
        <button
          onClick={onExpand}
          title="Expand panel"
          className="w-8 h-8 flex items-center justify-center rounded-md
                     text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3h10M2 7h10M2 11h10"/>
          </svg>
        </button>

        <div className="w-5 h-px bg-border my-1" />

        {/* Home team icon — person + color dot + label */}
        <button onClick={onExpand} title="Home team" className={btnCls}>
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="5" r="2.5"/>
              <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
            </svg>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-panel"
              style={{ backgroundColor: homeColor }}
            />
          </div>
          <span className="text-[6px] leading-none">Home</span>
        </button>

        {/* Away team icon — person + color dot + label */}
        <button onClick={onExpand} title="Away team" className={btnCls}>
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="5" r="2.5"/>
              <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
            </svg>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-panel"
              style={{ backgroundColor: awayColor }}
            />
          </div>
          <span className="text-[6px] leading-none">Away</span>
        </button>

        <div className="flex-1" />

        {/* My Plays — bookmark icon + label */}
        <button onClick={onExpand} title="My Plays" className={btnCls}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 2h8a1 1 0 011 1v9l-4-2.5L4 12V3a1 1 0 011-1z"/>
          </svg>
          <span className="text-[6px] leading-none">Plays</span>
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-full md:w-56 md:shrink-0 md:border-r border-border bg-panel flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-0">

        {/* Home team — open by default */}
        <TeamSection team="home" defaultOpen={true} showNamesToggle={true} />

        {/* Divider */}
        <div className="flex items-center gap-2 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted/40 px-2">
            vs
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Away team — collapsed by default */}
        <TeamSection team="away" defaultOpen={false} />

        {/* My Plays */}
        <div className="mt-8 pt-4 border-t border-border">
          <MyPlays />
        </div>

      </div>
    </aside>
  )
}
