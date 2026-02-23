import FORMATIONS, { buildFormationPlayers } from '../../data/formations'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

const FORMATION_KEYS = Object.keys(FORMATIONS)

export default function FormationPresets({ team }) {
  const players            = useBoardStore((s) => s.board.players)
  const applyFormation     = useBoardStore((s) => s.applyFormation)
  const openConfirmDialog  = useSettingsStore((s) => s.openConfirmDialog)
  const setActiveFormation = useSettingsStore((s) => s.setActiveFormation)
  const activeFormations   = useSettingsStore((s) => s.activeFormations)
  const activePhase        = useSettingsStore((s) => s.activePhase[team])
  const setActivePhase     = useSettingsStore((s) => s.setActivePhase)

  const currentFormation = activeFormations[team][activePhase]
  const teamHasPlayers   = players.some((p) => p.team === team)

  const handleSelect = (formationKey) => {
    if (formationKey === currentFormation) return
    const newPlayers = buildFormationPlayers(formationKey, team)
    if (teamHasPlayers) {
      openConfirmDialog({ team, players: newPlayers, formationKey, phase: activePhase })
    } else {
      applyFormation(team, newPlayers, activePhase)
      setActiveFormation(team, activePhase, formationKey)
    }
  }

  return (
    <div className="mt-2">
      {/* In / Out possession phase tabs */}
      <div className="flex rounded-md overflow-hidden border border-border mb-2.5">
        {[
          { key: 'in',  label: 'In Possession' },
          { key: 'out', label: 'Out of Possession' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActivePhase(team, key)}
            className={`flex-1 text-[10px] py-1.5 font-semibold transition-colors
              ${activePhase === key
                ? 'bg-accent-blue text-white'
                : 'bg-surface text-text-muted hover:text-text-primary'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Formation label */}
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
        Formation
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {FORMATION_KEYS.map((key) => {
          const isActive = key === currentFormation
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`text-[11px] py-1.5 px-2 rounded-md border font-medium tracking-tight
                          transition-all duration-150
                          ${isActive
                            ? 'bg-accent-blue border-accent-blue text-white shadow-sm'
                            : 'bg-surface border-border text-text-muted hover:border-accent-blue hover:text-text-primary'
                          }`}
            >
              {FORMATIONS[key].label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
