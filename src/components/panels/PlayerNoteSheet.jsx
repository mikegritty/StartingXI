import { useState, useEffect, useRef } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

const MAX_NOTE = 500

/**
 * PlayerNoteSheet — floating panel for editing per-player match instructions.
 *
 * On mobile: slides up from the bottom as a sheet.
 * On desktop: appears as a fixed panel in the bottom-right corner.
 *
 * Opens when `notePlayerId` in settingsStore is non-null.
 * Closes when the user clicks the × button or presses Escape.
 */
export default function PlayerNoteSheet() {
  const notePlayerId   = useSettingsStore((s) => s.notePlayerId)
  const setNotePlayerId = useSettingsStore((s) => s.setNotePlayerId)
  const players        = useBoardStore((s) => s.board.players)
  const updatePlayerNote = useBoardStore((s) => s.updatePlayerNote)

  const player = players.find((p) => p.id === notePlayerId) ?? null

  // Local draft — synced from store when player changes
  const [draft, setDraft] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (player) {
      setDraft(player.note ?? '')
      // Auto-focus after paint
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [player?.id]) // eslint-disable-line

  // Keyboard: Escape closes
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && notePlayerId) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [notePlayerId]) // eslint-disable-line

  const handleClose = () => {
    // Commit draft on close
    if (player) updatePlayerNote(player.id, draft.trim())
    setNotePlayerId(null)
  }

  const handleChange = (e) => {
    if (e.target.value.length <= MAX_NOTE) setDraft(e.target.value)
  }

  if (!player) return null

  const remaining = MAX_NOTE - draft.length

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className="fixed inset-0 z-40 md:hidden bg-black/40"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="
          fixed z-50 bg-panel border border-border shadow-2xl
          /* mobile: bottom sheet */
          bottom-0 left-0 right-0 rounded-t-2xl
          /* desktop: bottom-right corner card */
          md:bottom-6 md:right-4 md:left-auto md:w-72 md:rounded-xl
        "
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          {/* Mobile drag handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border opacity-60 md:hidden" />

          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
              Player Note
            </p>
            <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
              {player.number} · {player.name || 'Player'}
              {player.position ? <span className="ml-1 text-text-muted font-normal text-xs">({player.position})</span> : null}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-md
                       text-text-muted hover:text-text-primary hover:bg-surface transition-colors shrink-0"
            title="Close (Esc)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <div className="px-4 pb-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleChange}
            rows={4}
            placeholder="e.g. Press high, track their #8, stay wide…"
            className="w-full resize-none rounded-md bg-surface border border-border
                       text-sm text-text-primary placeholder:text-text-muted
                       px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent-blue
                       transition-shadow leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-[10px] ${remaining < 50 ? 'text-orange-400' : 'text-text-muted'}`}>
              {remaining} chars left
            </span>
            <button
              onClick={handleClose}
              className="text-[11px] px-3 py-1 rounded-md bg-accent-blue text-white
                         hover:bg-blue-700 transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
