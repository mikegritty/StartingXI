import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useShallow } from 'zustand/react/shallow'
import FormationPresets from '../players/FormationPresets'
import { PHASES } from '../../data/phases'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'
import GameDayModal from '../ui/GameDayModal'
import SquadEditor from '../squad/SquadEditor'

const PLAYS_KEY = 'startingxi_plays'
const MAX_PLAYS = 20

// ── NAV_ITEMS ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: 'squad',
    label: 'Squad',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="5" r="2.5"/>
        <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
        <circle cx="12" cy="5.5" r="1.8"/>
        <path d="M12 9c1.93 0 3.5 1.57 3.5 3.5"/>
      </svg>
    ),
  },
  {
    id: 'games',
    label: 'Games',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="2.5" width="14" height="11" rx="1.5"/>
        <path d="M1 7h14"/>
        <path d="M6 2.5v11"/>
      </svg>
    ),
  },
  {
    id: 'training',
    label: 'Train',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="3.5" r="2"/>
        <path d="M8 6v5M5 8.5l3-2.5 3 2.5"/>
        <path d="M6.5 11l-2 4M9.5 11l2 4"/>
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Sched',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1.5" y="3" width="13" height="11.5" rx="1.5"/>
        <path d="M1.5 7h13"/>
        <path d="M5 1.5v3M11 1.5v3"/>
        <rect x="4" y="9" width="2.5" height="2.5" rx="0.5"/>
      </svg>
    ),
  },
]

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadPlays() {
  try { return JSON.parse(localStorage.getItem(PLAYS_KEY) ?? '[]') }
  catch { return [] }
}

function savePlaysToStorage(plays) {
  localStorage.setItem(PLAYS_KEY, JSON.stringify(plays))
}

// ── PhasePills ────────────────────────────────────────────────────────────────

function PhasePills() {
  const activePhase    = useSettingsStore((s) => s.activePhase)
  const setActivePhase = useSettingsStore((s) => s.setActivePhase)

  const handlePhaseClick = (id) => {
    const prev = activePhase
    const next = activePhase === id ? null : id
    useBoardStore.getState().applyPhasePositions(next, prev)
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
  const teamData            = useBoardStore((s) => s.board.teams[team])
  const setTeam             = useBoardStore((s) => s.setTeam)
  const teamInstructions    = useBoardStore((s) => s.board.teamInstructions)
  const setTeamInstructions = useBoardStore((s) => s.setTeamInstructions)
  const showNames           = useSettingsStore((s) => s.showPlayerNames)
  const setShowNames        = useSettingsStore((s) => s.setShowPlayerNames)
  const isHome              = team === 'home'
  const label               = isHome ? 'Home' : 'Away'

  const [open, setOpen]             = useState(defaultOpen)
  const [instrOpen, setInstrOpen]   = useState(false)
  const [instrDraft, setInstrDraft] = useState('')

  useEffect(() => {
    setInstrDraft(teamInstructions?.[team] ?? '')
  }, [teamInstructions, team])

  const handleInstrBlur = useCallback(() => {
    setTeamInstructions(team, instrDraft.trim())
  }, [team, instrDraft, setTeamInstructions])

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2.5 group">
        <div className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10"
             style={{ backgroundColor: teamData.primaryColor }} />
        <span className={`text-xs font-semibold uppercase tracking-wider transition-colors
          ${open ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'}`}>
          {label}
        </span>
        {!open && (
          <span className="text-[11px] text-text-muted ml-0.5 font-normal normal-case tracking-normal truncate">
            {teamData.name || 'unnamed'}
          </span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`ml-auto shrink-0 text-text-muted transition-transform group-hover:text-text-primary
            ${open ? '' : '-rotate-90'}`}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
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

          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Kit colours
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input type="color" value={teamData.primaryColor}
                  onChange={(e) => setTeam(team, { primaryColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer" title="Kit colour" />
                <span className="text-[11px] text-text-muted">Kit</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={teamData.secondaryColor}
                  onChange={(e) => setTeam(team, { secondaryColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer" title="Number colour" />
                <span className="text-[11px] text-text-muted">Text</span>
              </div>
            </div>
          </div>

          <FormationPresets team={team} />

          <div>
            <button onClick={() => setInstrOpen((o) => !o)} className="w-full flex items-center gap-1.5 group">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider
                               group-hover:text-text-primary transition-colors">
                Instructions
              </span>
              {!instrOpen && teamInstructions?.[team] && (
                <span className="text-[9px] text-text-muted/60 font-normal normal-case tracking-normal truncate flex-1 text-left">
                  {teamInstructions[team].slice(0, 30)}…
                </span>
              )}
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none"
                className={`ml-auto shrink-0 text-text-muted transition-transform group-hover:text-text-primary
                  ${instrOpen ? '' : '-rotate-90'}`}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
            {instrOpen && (
              <div className="mt-1.5">
                <textarea
                  value={instrDraft}
                  onChange={(e) => { if (e.target.value.length <= MAX_INSTRUCTIONS) setInstrDraft(e.target.value) }}
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
                  <button onClick={handleInstrBlur}
                    className="text-[9px] px-2 py-0.5 rounded bg-accent-blue text-white hover:bg-blue-700 transition-colors font-medium">
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {isHome && (
            <div className="pt-3 border-t border-border">
              <PhasePills />
            </div>
          )}

          {showNamesToggle && (
            <div className="pt-3 border-t border-border">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Display
              </label>
              <button onClick={() => setShowNames(!showNames)} className="flex items-center gap-3 group w-full">
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
    </div>
  )
}

// ── GameDaySection ────────────────────────────────────────────────────────────

function GameDaySection() {
  const boardType   = useBoardStore((s) => s.board.type)
  const gameDayMeta = useBoardStore((s) => s.board.gameDayMeta)
  const [modalOpen, setModalOpen] = useState(false)
  const isGameDay = boardType === 'gameday'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Game Day</span>
        <button
          onClick={() => setModalOpen(true)}
          className={`text-[10px] px-2 py-1 rounded border transition-colors
            ${isGameDay
              ? 'border-accent-blue/50 bg-accent-blue/10 text-accent-blue'
              : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'}`}
        >
          {isGameDay ? 'Edit' : 'Set up'}
        </button>
      </div>
      {isGameDay && gameDayMeta ? (
        <div className="text-[11px] text-text-muted space-y-0.5">
          <div className="text-text-primary font-medium">
            {gameDayMeta.teamName} vs {gameDayMeta.opponentName}
          </div>
          {gameDayMeta.matchDate && (
            <div>{new Date(gameDayMeta.matchDate + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-text-muted/60 leading-snug">
          Set match details to enable sharing a live game day view.
        </p>
      )}
      {modalOpen && <GameDayModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

// ── MyPlays / Saved Games ─────────────────────────────────────────────────────

function MyPlays() {
  const board     = useBoardStore((s) => s.board)
  const loadBoard = useBoardStore((s) => s.loadBoard)

  const [plays, setPlays]               = useState(() => loadPlays())
  const [saving, setSaving]             = useState(false)
  const [saveName, setSaveName]         = useState('')
  const [previewEntry, setPreviewEntry] = useState(null)
  const saveInputRef                    = useRef(null)

  useEffect(() => {
    if (saving && saveInputRef.current) saveInputRef.current.focus()
  }, [saving])

  const handleSave = () => {
    const name  = saveName.trim() || board.name || 'Untitled'
    const entry = { id: uuidv4(), name, savedAt: Date.now(), board: JSON.parse(JSON.stringify(board)) }
    const updated = [entry, ...plays].slice(0, MAX_PLAYS)
    savePlaysToStorage(updated)
    setPlays(updated)
    setSaving(false)
    setSaveName('')
  }

  const handleLoad = (entry) => {
    loadBoard(entry.board)
    setPreviewEntry(null)
  }

  const handleDelete = (id) => {
    if (previewEntry?.id === id) setPreviewEntry(null)
    const updated = plays.filter((p) => p.id !== id)
    savePlaysToStorage(updated)
    setPlays(updated)
  }

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Saved Games</p>
        {!saving && (
          <button
            onClick={() => { setSaving(true); setSaveName(board.name || '') }}
            className="text-[10px] px-2 py-0.5 rounded border border-border
                       text-text-muted hover:text-text-primary hover:border-accent-blue transition-colors"
          >
            + Save
          </button>
        )}
      </div>

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
            placeholder="Game name..."
            className="flex-1 min-w-0 text-xs bg-surface border border-accent-blue rounded px-2 py-1
                       text-text-primary outline-none placeholder:text-text-muted"
          />
          <button onClick={handleSave}
            className="text-[10px] px-2 py-1 rounded bg-accent-blue text-white hover:bg-blue-700 transition-colors font-medium shrink-0">
            Save
          </button>
          <button onClick={() => { setSaving(false); setSaveName('') }}
            className="text-[10px] text-text-muted hover:text-text-primary transition-colors shrink-0">
            ✕
          </button>
        </div>
      )}

      {plays.length === 0 ? (
        <p className="text-[11px] text-text-muted italic">No saved games yet.</p>
      ) : (
        <div className="space-y-0.5">
          {plays.map((entry) => (
            <div key={entry.id}>
              <div
                onClick={() => setPreviewEntry(previewEntry?.id === entry.id ? null : entry)}
                className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-md group cursor-pointer transition-colors
                  ${previewEntry?.id === entry.id ? 'bg-accent-blue/10' : 'hover:bg-white/[0.04]'}`}
              >
                <span className="flex-1 min-w-0 text-[11px] text-text-primary truncate">{entry.name}</span>
                <span className="text-[9px] text-text-muted shrink-0 tabular-nums">{formatDate(entry.savedAt)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                  className="text-[9px] text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Delete"
                >✕</button>
              </div>

              {previewEntry?.id === entry.id && (
                <div className="mx-1.5 mb-1.5 p-2.5 rounded-md bg-surface border border-border text-[11px]">
                  <div className="font-semibold text-text-primary mb-1 truncate">{entry.name}</div>
                  <div className="text-text-muted space-y-0.5 mb-2.5">
                    <div>Saved {formatDate(entry.savedAt)}</div>
                    {entry.board?.teams && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: entry.board.teams.home?.primaryColor ?? '#1a56db' }} />
                        <span className="truncate">{entry.board.teams.home?.name || 'Home'}</span>
                        <span className="text-text-muted/50 mx-0.5">vs</span>
                        <span className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: entry.board.teams.away?.primaryColor ?? '#dc2626' }} />
                        <span className="truncate">{entry.board.teams.away?.name || 'Away'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleLoad(entry)}
                      className="flex-1 text-[10px] py-1 rounded bg-accent-blue text-white hover:bg-blue-700 transition-colors font-medium">
                      Load game
                    </button>
                    <button onClick={() => setPreviewEntry(null)}
                      className="text-[10px] px-2 py-1 rounded border border-border text-text-muted hover:text-text-primary transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section components ────────────────────────────────────────────────────────

function GamesSection() {
  return (
    <div className="flex flex-col gap-0">
      <TeamSection team="home" defaultOpen={true} showNamesToggle={true} />
      <div className="flex items-center gap-2 my-8">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted/40 px-2">vs</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <TeamSection team="away" defaultOpen={false} />
      <div className="mt-8 pt-4 border-t border-border">
        <MyPlays />
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <GameDaySection />
      </div>
    </div>
  )
}

function SquadSection({ onOpenEditor }) {
  const allPlayers = useBoardStore(useShallow((s) => s.board.players))
  const teamData   = useBoardStore(useShallow((s) => s.board.teams.home))
  const players    = allPlayers.filter((p) => p.team === 'home')

  const starters = players.filter((p) => p.isStarter !== false)
  const subs     = players.filter((p) => p.isStarter === false)

  const ROLE_COLORS = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#10b981', FWD: '#ef4444' }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10"
               style={{ backgroundColor: teamData.primaryColor }} />
          <span className="text-xs font-semibold text-text-primary">{teamData.name || 'Home Team'}</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted mb-3">
        {starters.length} starter{starters.length !== 1 ? 's' : ''}
        {subs.length > 0 && ` · ${subs.length} sub${subs.length !== 1 ? 's' : ''}`}
      </p>
      <div className="space-y-0.5 mb-4">
        {[...starters, ...subs].map((p) => {
          const roleColor = ROLE_COLORS[p.role] ?? '#10b981'
          return (
            <div key={p.id}
              className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-white/[0.04] transition-colors">
              <span className="text-[10px] text-text-muted tabular-nums w-5 text-right shrink-0">
                {p.number ?? '—'}
              </span>
              <span className="text-[9px] font-semibold px-1 py-0.5 rounded shrink-0"
                style={{ color: roleColor, backgroundColor: roleColor + '20' }}>
                {p.position || p.role || '—'}
              </span>
              <span className="flex-1 min-w-0 text-[11px] text-text-primary truncate">
                {p.name || <span className="text-text-muted italic">Unnamed</span>}
              </span>
              {p.isStarter === false && (
                <span className="text-[8px] text-text-muted/60 shrink-0 border border-border rounded px-1">sub</span>
              )}
            </div>
          )
        })}
        {players.length === 0 && (
          <p className="text-[11px] text-text-muted italic px-1.5">No players yet.</p>
        )}
      </div>
      <button onClick={onOpenEditor}
        className="w-full text-[11px] py-1.5 rounded-md border border-border
                   text-text-muted hover:text-text-primary hover:border-text-muted transition-colors font-medium">
        Edit squad →
      </button>
    </div>
  )
}

function TrainingSection() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-4">My Drills</p>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor"
             strokeWidth="1.5" className="text-text-muted/30">
          <circle cx="16" cy="8" r="3.5"/>
          <path d="M16 13v9M11 17l5-4 5 4"/>
          <path d="M13 22l-3 7M19 22l3 7"/>
        </svg>
        <p className="text-[11px] text-text-muted/60 leading-relaxed max-w-[160px]">
          Drill builder coming soon. Design and save your training sessions here.
        </p>
      </div>
    </div>
  )
}

function ScheduleSection() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-4">Schedule</p>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor"
             strokeWidth="1.5" className="text-text-muted/30">
          <rect x="4" y="6" width="24" height="22" rx="3"/>
          <path d="M4 13h24"/>
          <path d="M10 3v6M22 3v6"/>
          <rect x="8" y="17" width="4" height="4" rx="1"/>
          <rect x="14" y="17" width="4" height="4" rx="1"/>
        </svg>
        <p className="text-[11px] text-text-muted/60 leading-relaxed max-w-[160px]">
          Calendar view coming soon. See all your games and training sessions in one place.
        </p>
      </div>
    </div>
  )
}

// ── Main LeftPanel ────────────────────────────────────────────────────────────
//
// Layout (desktop):
//   [icon rail 40px] [content panel 224px, collapsible]
//
// The icon rail is ALWAYS visible. The content panel collapses via the hamburger in TopBar.
// collapsed=true → only icon rail shown
// collapsed=false → icon rail + content panel

export default function LeftPanel({ collapsed = false, onExpand }) {
  // All hooks at top — before any conditional returns
  const activeNavSection    = useSettingsStore((s) => s.activeNavSection)
  const setActiveNavSection = useSettingsStore((s) => s.setActiveNavSection)
  const homeColor           = useBoardStore((s) => s.board.teams.home.primaryColor)

  const [squadEditorOpen, setSquadEditorOpen] = useState(false)

  const navBtnCls = (id) =>
    `w-full flex flex-col items-center justify-center gap-0.5 py-2 rounded-md transition-colors
     ${activeNavSection === id
       ? 'text-accent-blue bg-accent-blue/10'
       : 'text-text-muted hover:text-text-primary hover:bg-surface'}`

  return (
    <aside className="flex shrink-0 md:border-r border-border bg-panel overflow-hidden">

      {/* ── Always-visible icon rail ── */}
      <div className="w-10 shrink-0 flex flex-col items-center py-3 gap-0.5 border-r border-border/50">

        {/* Hamburger — toggles content panel */}
        <button
          onClick={onExpand}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
          className="w-8 h-8 flex items-center justify-center rounded-md mb-1
                     text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3h10M2 7h10M2 11h10"/>
          </svg>
        </button>

        <div className="w-5 h-px bg-border mb-1" />

        {/* Squad — with home color dot */}
        <button
          onClick={() => { setActiveNavSection('squad'); if (collapsed) onExpand() }}
          title="Squad"
          className={navBtnCls('squad')}
        >
          <div className="relative">
            {NAV_ITEMS[0].icon}
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-panel"
                 style={{ backgroundColor: homeColor }} />
          </div>
          <span className="text-[6px] leading-none mt-0.5">Squad</span>
        </button>

        {/* Games */}
        <button
          onClick={() => { setActiveNavSection('games'); if (collapsed) onExpand() }}
          title="Games"
          className={navBtnCls('games')}
        >
          {NAV_ITEMS[1].icon}
          <span className="text-[6px] leading-none mt-0.5">Games</span>
        </button>

        {/* Training */}
        <button
          onClick={() => { setActiveNavSection('training'); if (collapsed) onExpand() }}
          title="Training"
          className={navBtnCls('training')}
        >
          {NAV_ITEMS[2].icon}
          <span className="text-[6px] leading-none mt-0.5">Train</span>
        </button>

        {/* Schedule */}
        <button
          onClick={() => { setActiveNavSection('schedule'); if (collapsed) onExpand() }}
          title="Schedule"
          className={navBtnCls('schedule')}
        >
          {NAV_ITEMS[3].icon}
          <span className="text-[6px] leading-none mt-0.5">Sched</span>
        </button>
      </div>

      {/* ── Collapsible content panel ── */}
      {!collapsed && (
        <div className="w-52 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {activeNavSection === 'games'    && <GamesSection />}
            {activeNavSection === 'squad'    && <SquadSection onOpenEditor={() => setSquadEditorOpen(true)} />}
            {activeNavSection === 'training' && <TrainingSection />}
            {activeNavSection === 'schedule' && <ScheduleSection />}
          </div>
        </div>
      )}

      {/* Squad editor modal */}
      {squadEditorOpen && (
        <SquadEditor team="home" onClose={() => setSquadEditorOpen(false)} />
      )}
    </aside>
  )
}
