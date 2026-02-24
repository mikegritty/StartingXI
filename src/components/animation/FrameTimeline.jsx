import { useEffect, useRef, useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'
import { PHASES } from '../../data/phases'

const PLAY_INTERVAL_MS  = 1500  // ms between frames during playback (spec: 1.5s)
const TOAST_DISMISS_MS  = 5000  // animate toast auto-dismiss

/**
 * FrameTimeline — horizontal strip of animation frame chips.
 *
 * Sits between PitchCanvas and Toolbar.
 * Always shows Frame 1 (index 0) as the base — it cannot be deleted.
 * Frames beyond index 0 can be removed.
 *
 * Features:
 *  - Add frame (snapshot current board state into new frame, max 8)
 *  - Remove frame (frame 0 protected — no ✕ shown)
 *  - Rename frame (double-click label to edit)
 *  - Switch frame (click chip → copies that frame's players+drawings to live canvas)
 *  - Play / Stop — cycles through all frames at 1.5 s interval
 *  - Phase dot on chips when frame.phase !== null
 *  - Animate toast: after adding a frame, offer to tween positions on playback
 */
export default function FrameTimeline() {
  const frames                  = useBoardStore((s) => s.board.play.frames)
  const currentFrameIndex       = useBoardStore((s) => s.board.play.currentFrameIndex)
  const animateBetweenFrames    = useBoardStore((s) => s.board.play.animateBetweenFrames)
  const addFrame                = useBoardStore((s) => s.addFrame)
  const removeFrame             = useBoardStore((s) => s.removeFrame)
  const updateFrame             = useBoardStore((s) => s.updateFrame)
  const setCurrentFrameIndex    = useBoardStore((s) => s.setCurrentFrameIndex)  // used for manual frame selection & playback
  const setAnimateBetweenFrames = useBoardStore((s) => s.setAnimateBetweenFrames)

  const isPlaying           = useSettingsStore((s) => s.isPlaying)
  const setIsPlaying        = useSettingsStore((s) => s.setIsPlaying)
  const frameToastPending   = useSettingsStore((s) => s.frameToastPending)
  const setFrameToastPending = useSettingsStore((s) => s.setFrameToastPending)

  const [editingId, setEditingId] = useState(null) // frame id being renamed
  const inputRef      = useRef(null)
  const playTimerRef  = useRef(null)
  const playIndexRef  = useRef(0)
  const toastTimerRef = useRef(null)

  // Auto-focus rename input
  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.select()
  }, [editingId])

  // Playback ticker
  useEffect(() => {
    if (!isPlaying || frames.length < 2) {
      clearInterval(playTimerRef.current)
      return
    }

    // Start from the current frame
    playIndexRef.current = currentFrameIndex

    const advance = () => {
      playIndexRef.current = (playIndexRef.current + 1) % frames.length
      setCurrentFrameIndex(playIndexRef.current)
    }

    playTimerRef.current = setInterval(advance, PLAY_INTERVAL_MS)
    return () => clearInterval(playTimerRef.current)
  }, [isPlaying, frames.length]) // eslint-disable-line

  // Stop playback when there's only one frame
  useEffect(() => {
    if (frames.length < 2) setIsPlaying(false)
  }, [frames.length]) // eslint-disable-line

  // Clean up toast timer on unmount
  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  const handleSelectFrame = (index) => {
    setIsPlaying(false)
    setCurrentFrameIndex(index)
  }

  const handleRemove = (e, id) => {
    e.stopPropagation()
    removeFrame(id)
  }

  const handleRenameCommit = (id, value) => {
    const label = value.trim()
    if (label) updateFrame(id, { label })
    setEditingId(null)
  }

  const togglePlay = () => {
    if (frames.length < 2) return
    setIsPlaying(!isPlaying)
  }

  // Show the animate toast — called after any addFrame (from here or Toolbar).
  const triggerToast = () => {
    clearTimeout(toastTimerRef.current)
    setFrameToastPending(true)
    toastTimerRef.current = setTimeout(() => setFrameToastPending(false), TOAST_DISMISS_MS)
  }

  const handleAddFrame = () => {
    // addFrame() atomically snapshots the canvas, appends the frame, and
    // sets currentFrameIndex to the new frame — no setTimeout needed.
    addFrame()
    triggerToast()
  }

  const handleToastYes = () => {
    setAnimateBetweenFrames(true)
    setFrameToastPending(false)
    clearTimeout(toastTimerRef.current)
  }

  const handleToastSkip = () => {
    setAnimateBetweenFrames(false)
    setFrameToastPending(false)
    clearTimeout(toastTimerRef.current)
  }

  // Only render when there are multiple frames
  if (frames.length < 2) return null

  return (
    <div className="shrink-0 bg-panel border-t border-border relative">
      {/* ── Animate toast ── */}
      {frameToastPending && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                     flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
                     bg-[#1e2330] border border-border text-[11px] text-text-primary
                     pointer-events-auto whitespace-nowrap"
        >
          <span>💡 Move players to show what happens next. Animate?</span>
          <button
            onClick={handleToastYes}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors
              ${animateBetweenFrames
                ? 'bg-accent-blue text-white'
                : 'border border-accent-blue text-accent-blue hover:bg-accent-blue/10'
              }`}
          >
            Yes
          </button>
          <button
            onClick={handleToastSkip}
            className="px-2 py-0.5 rounded text-[10px] border border-border
                       text-text-muted hover:text-text-primary transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {/* ── Main timeline strip ── */}
      <div
        className="flex items-center gap-1 px-3 overflow-x-auto"
        style={{
          minHeight: '40px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Play / Stop button */}
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Stop' : 'Play animation'}
          className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors
            ${isPlaying
              ? 'bg-accent-blue text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
        >
          {isPlaying
            ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="3" height="8" rx="1"/>
                <rect x="6" y="1" width="3" height="8" rx="1"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M2 1l7 4-7 4V1z"/>
              </svg>
            )
          }
        </button>

        {/* Animate indicator dot — shown when animateBetweenFrames is on */}
        {animateBetweenFrames && (
          <div
            className="w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0"
            title="Position tweening enabled"
          />
        )}

        <div className="w-px h-4 bg-border shrink-0 mx-0.5" />

        {/* Frame chips */}
        {frames.map((frame, index) => {
          const isActive   = index === currentFrameIndex
          const canDelete  = index !== 0  // frame 0 is protected
          const phaseColor = PHASES.find((p) => p.id === frame.phase)?.color

          return (
            <div
              key={frame.id}
              onClick={() => handleSelectFrame(index)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border cursor-pointer shrink-0
                          transition-colors group
                ${isActive
                  ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
                  : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
                }`}
            >
              {/* Phase colour dot */}
              {phaseColor && (
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: phaseColor }}
                />
              )}

              {editingId === frame.id ? (
                <input
                  ref={inputRef}
                  defaultValue={frame.label}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => handleRenameCommit(frame.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCommit(frame.id, e.target.value)
                    if (e.key === 'Escape') setEditingId(null)
                    e.stopPropagation()
                  }}
                  className="text-[9px] bg-transparent outline-none w-16 border-b border-current"
                />
              ) : (
                <span
                  className="text-[9px] font-medium whitespace-nowrap max-w-[72px] truncate"
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingId(frame.id) }}
                  title={`${frame.label} — double-click to rename`}
                >
                  {frame.label}
                </span>
              )}

              {/* Remove button — hidden on frame 0 */}
              {canDelete && (
                <button
                  onClick={(e) => handleRemove(e, frame.id)}
                  title="Remove frame"
                  className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity
                             text-text-muted hover:text-red-400 leading-none shrink-0"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 1l6 6M7 1L1 7"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}

        {/* Add Frame button */}
        {frames.length < 8 && (
          <button
            onClick={handleAddFrame}
            title="Add frame (snapshot)"
            className="flex items-center gap-1 text-[9px] text-text-muted hover:text-text-primary
                       px-2 py-0.5 rounded border border-dashed border-border hover:border-text-muted
                       transition-colors shrink-0"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 1v6M1 4h6"/>
            </svg>
            Frame
          </button>
        )}

        {frames.length >= 8 && (
          <span className="text-[9px] text-text-muted italic shrink-0">Max 8 frames</span>
        )}
      </div>
    </div>
  )
}
