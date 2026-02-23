import { useSettingsStore } from '../../store/settingsStore'
import { useBoardStore } from '../../store/boardStore'

export default function ConfirmFormationModal() {
  const { confirmDialogOpen, pendingFormationApply, closeConfirmDialog, setActiveFormation } = useSettingsStore()
  const applyFormation = useBoardStore((s) => s.applyFormation)

  if (!confirmDialogOpen) return null

  const teamLabel  = pendingFormationApply?.team === 'home' ? 'Home' : 'Away'
  const phaseLabel = pendingFormationApply?.phase === 'out' ? 'out-of-possession' : 'in-possession'

  const handleConfirm = () => {
    if (pendingFormationApply) {
      const { team, players, formationKey, phase } = pendingFormationApply
      applyFormation(team, players, phase)
      setActiveFormation(team, phase, formationKey)
    }
    closeConfirmDialog()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeConfirmDialog()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-panel border border-border rounded-xl p-5 w-72 shadow-2xl">
        <h3 className="text-sm font-semibold text-text-primary mb-1.5">Replace formation?</h3>
        <p className="text-[11px] text-text-muted mb-5 leading-relaxed">
          This will replace the <span className="text-text-primary font-medium">{teamLabel}</span> team's{' '}
          <span className="text-text-primary font-medium">{phaseLabel}</span> formation.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={closeConfirmDialog}
            className="text-[11px] px-3.5 py-1.5 rounded-md border border-border text-text-muted
                       hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="text-[11px] px-3.5 py-1.5 rounded-md bg-accent-blue text-white
                       hover:bg-blue-700 transition-colors font-medium"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  )
}
