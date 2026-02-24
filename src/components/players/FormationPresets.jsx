import { useState, useRef } from 'react'
import FORMATIONS, { QUICK_FORMATIONS, buildFormationPlayers } from '../../data/formations'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

// How long to show the "Update instructions?" toast (ms)
const INSTRUCTIONS_TOAST_MS = 6000

const ALL_FORMATION_KEYS = Object.keys(FORMATIONS)
// Formations that appear in the "More formations…" dropdown (everything not in quick-pick)
const MORE_FORMATIONS = ALL_FORMATION_KEYS.filter((k) => !QUICK_FORMATIONS.includes(k))

// Threshold (normalized) beyond which a player is considered "moved" from canonical position
const MOVED_THRESHOLD = 0.02

/**
 * FormationPresets — horizontal scrollable chip row.
 *
 * Chips: [4-3-3] [4-4-2] [4-2-3-1] [3-5-2] [3-4-3] [4-5-1] [+Custom] [More ▾]
 *
 * Active chip shows an asterisk (*) if any home starter has been manually moved
 * more than MOVED_THRESHOLD from the canonical position.
 */
export default function FormationPresets({ team }) {
  const players               = useBoardStore((s) => s.board.players)
  const applyFormation        = useBoardStore((s) => s.applyFormation)
  const teamInstructions      = useBoardStore((s) => s.board.teamInstructions)
  const setTeamInstructions   = useBoardStore((s) => s.setTeamInstructions)
  const openConfirmDialog     = useSettingsStore((s) => s.openConfirmDialog)
  const activeFormationKey    = useSettingsStore((s) => s.activeFormationKey[team])
  const setActiveFormationKey = useSettingsStore((s) => s.setActiveFormationKey)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  // "Update instructions?" toast state — holds formationKey to update from, or null
  const [instrToastKey, setInstrToastKey] = useState(null)
  const instrToastTimerRef = useRef(null)

  const teamHasPlayers = players.some((p) => p.team === team)

  // Compute whether the active formation has been modified (any starter moved beyond threshold)
  const isModified = (() => {
    if (!activeFormationKey) return false
    const formation = FORMATIONS[activeFormationKey]
    if (!formation) return false
    const starters = players.filter((p) => p.team === team && p.isStarter !== false)
    return starters.some((player, i) => {
      const canonical = formation.positions[i]
      if (!canonical) return false
      const cx = canonical.x
      const cy = team === 'away' ? 1.0 - canonical.y : canonical.y
      return (
        Math.abs(player.x - cx) > MOVED_THRESHOLD ||
        Math.abs(player.y - cy) > MOVED_THRESHOLD
      )
    })
  })()

  const applyInstructions = (formationKey) => {
    const instrText = FORMATIONS[formationKey]?.instructions
    if (!instrText) return
    const current = teamInstructions?.[team] ?? ''
    if (!current.trim()) {
      // Instructions are empty — auto-fill
      setTeamInstructions(team, instrText)
    } else {
      // Already filled — show "Update?" toast
      clearTimeout(instrToastTimerRef.current)
      setInstrToastKey(formationKey)
      instrToastTimerRef.current = setTimeout(() => setInstrToastKey(null), INSTRUCTIONS_TOAST_MS)
    }
  }

  const handleSelect = (formationKey) => {
    setDropdownOpen(false)
    if (formationKey === activeFormationKey) return
    const newPlayers = buildFormationPlayers(formationKey, team)
    if (teamHasPlayers) {
      openConfirmDialog({ team, players: newPlayers, formationKey })
    } else {
      applyFormation(team, newPlayers)
      setActiveFormationKey(team, formationKey)
    }
    // Always try to fill instructions after applying
    applyInstructions(formationKey)
  }

  const handleCustom = () => {
    // Clear the active formation key — coach is free to drag freely
    setActiveFormationKey(team, null)
  }

  // Is the active formation one of the "more" ones? Show it in the dropdown button.
  const moreIsActive = activeFormationKey && MORE_FORMATIONS.includes(activeFormationKey)

  return (
    <div className="mt-2">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
        Formation
      </p>

      {/* "Update instructions?" toast */}
      {instrToastKey && (
        <div className="flex items-center gap-1.5 mb-1.5 px-2 py-1.5 rounded-md bg-surface border border-border text-[10px]">
          <span className="text-text-muted flex-1 min-w-0 leading-snug">
            Update instructions for {FORMATIONS[instrToastKey]?.label}?
          </span>
          <button
            onClick={() => {
              setTeamInstructions(team, FORMATIONS[instrToastKey]?.instructions ?? '')
              clearTimeout(instrToastTimerRef.current)
              setInstrToastKey(null)
            }}
            className="shrink-0 text-accent-blue hover:text-blue-400 font-semibold transition-colors"
          >
            Yes
          </button>
          <button
            onClick={() => {
              clearTimeout(instrToastTimerRef.current)
              setInstrToastKey(null)
            }}
            className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
          >
            Keep
          </button>
        </div>
      )}

      {/* Horizontal scrollable chip row */}
      <div
        className="flex gap-1 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {QUICK_FORMATIONS.map((key) => {
          const isActive = key === activeFormationKey
          const label    = FORMATIONS[key].label + (isActive && isModified ? '*' : '')
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`text-[10px] py-1 px-2 rounded-md border font-medium tracking-tight
                          transition-all duration-150 whitespace-nowrap shrink-0
                          ${isActive
                            ? 'bg-accent-blue border-accent-blue text-white shadow-sm'
                            : 'bg-surface border-border text-text-muted hover:border-accent-blue hover:text-text-primary'
                          }`}
            >
              {label}
            </button>
          )
        })}

        {/* +Custom chip — clears the active formation */}
        <button
          onClick={handleCustom}
          className={`text-[10px] py-1 px-2 rounded-md border font-medium tracking-tight
                      transition-all duration-150 whitespace-nowrap shrink-0
                      ${activeFormationKey === null
                        ? 'bg-accent-blue border-accent-blue text-white shadow-sm'
                        : 'bg-surface border-border text-text-muted hover:border-accent-blue hover:text-text-primary'
                      }`}
          title="Custom — drag players freely"
        >
          +Custom
        </button>

        {/* More ▾ dropdown trigger */}
        <div className="relative shrink-0">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={`text-[10px] py-1 px-2 rounded-md border font-medium
                        transition-all duration-150 flex items-center gap-1
                        ${moreIsActive
                          ? 'bg-accent-blue border-accent-blue text-white shadow-sm'
                          : 'bg-surface border-border text-text-muted hover:border-accent-blue hover:text-text-primary'
                        }`}
          >
            <span>
              {moreIsActive
                ? (FORMATIONS[activeFormationKey].label + (isModified ? '*' : ''))
                : 'More'}
            </span>
            <svg
              width="8" height="8" viewBox="0 0 10 10" fill="none"
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
              <div className="absolute left-0 top-full mt-1 z-20
                              bg-panel border border-border rounded-md shadow-lg overflow-hidden min-w-[120px]">
                {MORE_FORMATIONS.map((key) => {
                  const isActive = key === activeFormationKey
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
