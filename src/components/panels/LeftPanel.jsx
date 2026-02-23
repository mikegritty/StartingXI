import { useState } from 'react'
import FormationPresets from '../players/FormationPresets'
import SquadEditor from '../squad/SquadEditor'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

function TeamSection({ team }) {
  const teamData = useBoardStore((s) => s.board.teams[team])
  const setTeam  = useBoardStore((s) => s.setTeam)
  const isHome   = team === 'home'
  const label    = isHome ? 'Home' : 'Away'
  const [squadOpen, setSquadOpen] = useState(false)

  return (
    <div>
      {/* Team header with Squad button */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
          style={{ backgroundColor: teamData.primaryColor }}
        />
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </span>
        <button
          onClick={() => setSquadOpen(true)}
          className="ml-auto text-[10px] px-2 py-0.5 rounded border border-border
                     text-text-muted hover:text-text-primary hover:border-accent-blue
                     transition-colors"
        >
          Squad
        </button>
      </div>

      {/* Team name */}
      <input
        value={teamData.name}
        onChange={(e) => setTeam(team, { name: e.target.value })}
        className="w-full text-xs bg-surface border border-border rounded-md px-2.5 py-1.5
                   text-text-primary focus:border-accent-blue outline-none mb-2
                   placeholder:text-text-muted transition-colors"
        placeholder="Team name..."
      />

      {/* Kit colours */}
      <div className="flex items-center gap-2 mb-0.5">
        <label className="text-[11px] text-text-muted">Kit</label>
        <input type="color" value={teamData.primaryColor}
          onChange={(e) => setTeam(team, { primaryColor: e.target.value })}
          className="w-6 h-6 rounded cursor-pointer" title="Kit colour" />
        <label className="text-[11px] text-text-muted">Text</label>
        <input type="color" value={teamData.secondaryColor}
          onChange={(e) => setTeam(team, { secondaryColor: e.target.value })}
          className="w-6 h-6 rounded cursor-pointer" title="Number colour" />
      </div>

      <FormationPresets team={team} />

      {/* Squad editor modal */}
      {squadOpen && <SquadEditor team={team} onClose={() => setSquadOpen(false)} />}
    </div>
  )
}

export default function LeftPanel() {
  const showNames    = useSettingsStore((s) => s.showPlayerNames)
  const setShowNames = useSettingsStore((s) => s.setShowPlayerNames)

  return (
    <aside className="w-full md:w-56 md:shrink-0 md:border-r border-border bg-panel flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-0">
        <TeamSection team="home" />
        <div className="border-t border-border my-3" />
        <TeamSection team="away" />
        <div className="border-t border-border my-3" />

        {/* Display toggle */}
        <div>
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Display
          </p>
          <button
            onClick={() => setShowNames(!showNames)}
            className="flex items-center gap-2 group w-full"
          >
            <div className={`w-8 h-4 rounded-full relative transition-colors
              ${showNames ? 'bg-accent-blue' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform
                ${showNames ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[11px] text-text-muted group-hover:text-text-primary transition-colors">
              Player names
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}
