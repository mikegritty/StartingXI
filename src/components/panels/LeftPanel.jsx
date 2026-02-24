import { useState } from 'react'
import FormationPresets from '../players/FormationPresets'
import SquadEditor from '../squad/SquadEditor'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

function TeamSection({ team, defaultOpen = true, showNamesToggle = false }) {
  const teamData     = useBoardStore((s) => s.board.teams[team])
  const setTeam      = useBoardStore((s) => s.setTeam)
  const showNames    = useSettingsStore((s) => s.showPlayerNames)
  const setShowNames = useSettingsStore((s) => s.setShowPlayerNames)
  const isHome       = team === 'home'
  const label        = isHome ? 'Home' : 'Away'

  const [open, setOpen]           = useState(defaultOpen)
  const [squadOpen, setSquadOpen] = useState(false)

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

export default function LeftPanel() {
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

      </div>
    </aside>
  )
}
