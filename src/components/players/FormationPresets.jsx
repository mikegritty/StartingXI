import { useState } from 'react'
import FORMATIONS, { QUICK_FORMATIONS, buildFormationPlayers } from '../../data/formations'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

const ALL_FORMATION_KEYS = Object.keys(FORMATIONS)
// Formations that appear in the "More…" dropdown (everything not in quick-pick)
const MORE_FORMATIONS = ALL_FORMATION_KEYS.filter((k) => !QUICK_FORMATIONS.includes(k))

export default function FormationPresets({ team }) {
  const players            = useBoardStore((s) => s.board.players)
  const applyFormation     = useBoardStore((s) => s.applyFormation)
  const openConfirmDialog  = useSettingsStore((s) => s.openConfirmDialog)
  const setActiveFormation = useSettingsStore((s) => s.setActiveFormation)
  const activeFormations   = useSettingsStore((s) => s.activeFormations)
  const activePhase        = useSettingsStore((s) => s.activePhase[team])
  const setActivePhase     = useSettingsStore((s) => s.setActivePhase)

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const currentFormation = activeFormations[team][activePhase]
  const teamHasPlayers   = players.some((p) => p.team === team)

  const handleSelect = (formationKey) => {
    setDropdownOpen(false)
    if (formationKey === currentFormation) return
    const newPlayers = buildFormationPlayers(formationKey, team)
    if (teamHasPlayers) {
      openConfirmDialog({ team, players: newPlayers, formationKey, phase: activePhase })
    } else {
      applyFormation(team, newPlayers, activePhase)
      setActiveFormation(team, activePhase, formationKey)
    }
  }

  // Is the active formation one of the "more" ones? If so show it selected in the dropdown button
  const moreIsActive = currentFormation && MORE_FORMATIONS.includes(currentFormation)

  return (
    <div className="mt-2">
      {/* In / Out possession phase tabs */}
      <div className="flex rounded-md overflow-hidden border border-border mb-2.5">
        {[
          { key: 'in',  label: 'In Poss.' },
          { key: 'out', label: 'Out of Poss.' },
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

      {/* Quick-pick row — 5 most common formations */}
      <div className="grid grid-cols-3 gap-1 mb-1">
        {QUICK_FORMATIONS.map((key) => {
          const isActive = key === currentFormation
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`text-[10px] py-1.5 px-1 rounded-md border font-medium tracking-tight
                          transition-all duration-150 text-center
                          ${isActive
                            ? 'bg-accent-blue border-accent-blue text-white shadow-sm'
                            : 'bg-surface border-border text-text-muted hover:border-accent-blue hover:text-text-primary'
                          }`}
            >
              {FORMATIONS[key].label}
            </button>
          )
        })}

        {/* More… dropdown trigger — spans remaining space */}
        <div className="relative col-span-3">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`w-full text-[10px] py-1.5 px-2 rounded-md border font-medium
                        transition-all duration-150 flex items-center justify-between
                        ${moreIsActive
                          ? 'bg-accent-blue border-accent-blue text-white shadow-sm'
                          : 'bg-surface border-border text-text-muted hover:border-accent-blue hover:text-text-primary'
                        }`}
          >
            <span>{moreIsActive ? FORMATIONS[currentFormation].label : 'More formations…'}</span>
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1 z-20
                              bg-panel border border-border rounded-md shadow-lg overflow-hidden">
                {MORE_FORMATIONS.map((key) => {
                  const isActive = key === currentFormation
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelect(key)}
                      className={`w-full text-left text-[11px] px-3 py-2 transition-colors
                                  ${isActive
                                    ? 'bg-accent-blue text-white'
                                    : 'text-text-primary hover:bg-surface'
                                  }`}
                    >
                      {FORMATIONS[key].label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
