import { useState, useRef } from 'react'
import FORMATIONS, { buildFormationPlayers } from '../../data/formations'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

// How long to show the "Update instructions?" toast (ms)
const INSTRUCTIONS_TOAST_MS = 6000

const ALL_FORMATION_KEYS = Object.keys(FORMATIONS)

// Threshold (normalized) beyond which a player is considered "moved" from canonical position
const MOVED_THRESHOLD = 0.02

/**
 * FormationPresets — wrapped grid of formation chips + +Custom.
 *
 * All formations visible at once (no scrolling, no dropdown).
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

  const chipCls = (isActive) =>
    `text-[10px] py-1 px-2 rounded-md border font-medium tracking-tight
     transition-all duration-150 whitespace-nowrap
     ${isActive
       ? 'bg-accent-blue border-accent-blue text-white shadow-sm'
       : 'bg-surface border-border text-text-muted hover:border-accent-blue hover:text-text-primary'
     }`

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

      {/* Wrapped grid — all formations visible, no scrolling or dropdown */}
      <div className="flex flex-wrap gap-1">
        {ALL_FORMATION_KEYS.map((key) => {
          const isActive = key === activeFormationKey
          const label    = FORMATIONS[key].label + (isActive && isModified ? '*' : '')
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={chipCls(isActive)}
            >
              {label}
            </button>
          )
        })}

        {/* +Custom chip — clears the active formation */}
        <button
          onClick={handleCustom}
          className={chipCls(activeFormationKey === null)}
          title="Custom — drag players freely"
        >
          +Custom
        </button>
      </div>
    </div>
  )
}
