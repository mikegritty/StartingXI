import { useEffect, useRef, useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'
import { PHASES } from '../../data/phases'

const TOAST_DISMISS_MS  = 5000  // animate toast auto-dismiss
const MIN_DURATION = 0.5
const MAX_DURATION = 5.0
const DURATION_STEP = 0.5

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
 *  - Play / Stop — cycles through all frames using per-frame duration (setTimeout chain)
 *  - Per-frame duration — click the duration badge on each chip to show a slider
 *  - Animate mode toggle — ✎ Draw / ▶ Animate button
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
  const setCurrentFrameIndex    = useBoardStore((s) => s.setCurrentFrameIndex)
  const setAnimateBetweenFrames = useBoardStore((s) => s.setAnimateBetweenFrames)

  const isPlaying           = useSettingsStore((s) => s.isPlaying)
  const setIsPlaying        = useSettingsStore((s) => s.setIsPlaying)
  const frameToastPending   = useSettingsStore((s) => s.frameToastPending)
  const setFrameToastPending = useSettingsStore((s) => s.setFrameToastPending)
  const animateMode         = useSettingsStore((s) => s.animateMode)
  const setAnimateMode      = useSettingsStore((s) => s.setAnimateMode)

  const [editingId, setEditingId]       = useState(null) // frame id being renamed
  const [durationEditId, setDurationEditId] = useState(null) // frame id with open duration slider

  const inputRef        = useRef(null)
  const playTimerRef    = useRef(null)
  const playIndexRef    = useRef(0)
  const toastTimerRef   = useRef(null)
  const framesRef       = useRef(frames)
  framesRef.current     = frames

  // Auto-focus rename input
  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.select()
  }, [editingId])

  // ── Playback using setTimeout chain (supports per-frame duration) ──────────

  const stopPlayback = () => {
    clearTimeout(playTimerRef.current)
    playTimerRef.current = null
  }

  const scheduleNextFrame = () => {
    const currentFrames = framesRef.current
    const nextIndex = (playIndexRef.current + 1) % currentFrames.length
    playIndexRef.current = nextIndex
    setCurrentFrameIndex(nextIndex)

    const nextDuration = currentFrames[nextIndex]?.duration ?? 1.5
    playTimerRef.current = setTimeout(scheduleNextFrame, nextDuration * 1000)
  }

  useEffect(() => {
    if (!isPlaying || frames.length < 2) {
      stopPlayback()
      return
    }

    // Start playback: show current frame for its duration, then advance
    playIndexRef.current = currentFrameIndex
    const startDuration = frames[currentFrameIndex]?.duration ?? 1.5
    playTimerRef.current = setTimeout(scheduleNextFrame, startDuration * 1000)

    return () => stopPlayback()
  }, [isPlaying, frames.length]) // eslint-disable-line

  // Stop playback when there's only one frame
  useEffect(() => {
    if (frames.length < 2) setIsPlaying(false)
  }, [frames.length]) // eslint-disable-line

  // Clean up timers on unmount
  useEffect(() => () => {
    clearTimeout(playTimerRef.current)
    clearTimeout(toastTimerRef.current)
  }, [])

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

  const handleDurationChange = (frameId, value) => {
    const d = Math.round(parseFloat(value) / DURATION_STEP) * DURATION_STEP
    const clamped = Math.max(MIN_DURATION, Math.min(MAX_DURATION, d))
    updateFrame(frameId, { duration: clamped })
  }

  // Only render when there are multiple frames
  if (frames.length < 2) return null

  const timelineHeight = animateMode ? '64px' : '40px'

  return (
    <div
      className="shrink-0 bg-panel border-t border-border relative transition-all duration-200"
      style={{ minHeight: timelineHeight }}
    >
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
          minHeight: timelineHeight,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Draw / Animate mode toggle */}
        <button
          onClick={() => {
            const next = !animateMode
            setAnimateMode(next)
            // Stop playback when switching back to draw mode
            if (!next) setIsPlaying(false)
          }}
          title={animateMode ? 'Switch to Draw mode' : 'Switch to Animate mode'}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium
                      border transition-colors shrink-0
                      ${animateMode
                        ? 'bg-accent-blue border-accent-blue text-white'
                        : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
                      }`}
        >
          {animateMode ? (
            <>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
                <path d="M2 1l7 4-7 4V1z"/>
              </svg>
              Animate
            </>
          ) : (
            <>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8l4-6 2 3 1.5-2"/>
              </svg>
              Draw
            </>
          )}
        </button>

        {/* Play / Stop button */}
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Stop' : 'Play animation'}
          className={`flex items-center justify-center rounded-md shrink-0 transition-colors
            ${animateMode ? 'w-9 h-9' : 'w-7 h-7'}
            ${isPlaying
              ? 'bg-accent-blue text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
        >
          {isPlaying
            ? (
              <svg width={animateMode ? 12 : 10} height={animateMode ? 12 : 10} viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="3" height="8" rx="1"/>
                <rect x="6" y="1" width="3" height="8" rx="1"/>
              </svg>
            ) : (
              <svg width={animateMode ? 12 : 10} height={animateMode ? 12 : 10} viewBox="0 0 10 10" fill="currentColor">
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
          const dur        = frame.duration ?? 1.5
          const showDurationSlider = durationEditId === frame.id

          return (
            <div
              key={frame.id}
              onClick={() => handleSelectFrame(index)}
              className={`flex flex-col items-start px-2 rounded border cursor-pointer shrink-0
                          transition-colors group relative
                ${animateMode ? 'py-1.5 gap-1' : 'py-0.5 gap-0'}
                ${isActive
                  ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
                  : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
                }`}
            >
              {/* Top row: phase dot + label + delete */}
              <div className="flex items-center gap-1 w-full">
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
                               text-text-muted hover:text-red-400 leading-none shrink-0 ml-0.5"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 1l6 6M7 1L1 7"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Duration badge — shown inline in animate mode, as an absolute overlay
                  on chip hover in draw mode. pointer-events-none when invisible
                  ensures e.stopPropagation() never swallows chip click events. */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDurationEditId(showDurationSlider ? null : frame.id)
                }}
                title="Set frame duration"
                className={`text-[8px] font-mono leading-none px-1 py-0.5 rounded transition-all
                            ${animateMode ? '' : 'absolute bottom-0.5 right-0.5'}
                            ${showDurationSlider
                              ? 'bg-accent-blue/20 text-accent-blue'
                              : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none hover:bg-surface text-text-muted hover:text-text-primary'
                            }`}
              >
                {dur.toFixed(1)}s
              </button>

              {/* Inline duration slider — shown when badge is clicked */}
              {showDurationSlider && (
                <div
                  className="absolute bottom-full left-0 mb-1 z-30 bg-panel border border-border
                             rounded-md p-2 shadow-lg flex flex-col gap-1 min-w-[120px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-text-muted">Duration</span>
                    <span className="text-[9px] font-mono text-accent-blue">{dur.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    step={DURATION_STEP}
                    value={dur}
                    onChange={(e) => handleDurationChange(frame.id, e.target.value)}
                    className="w-full accent-accent-blue"
                  />
                  <div className="flex justify-between text-[8px] text-text-muted">
                    <span>{MIN_DURATION}s</span>
                    <span>{MAX_DURATION}s</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Add Frame button */}
        {frames.length < 8 && (
          <button
            onClick={handleAddFrame}
            title="Add frame (snapshot)"
            className={`flex items-center gap-1 text-text-muted hover:text-text-primary
                       px-2 rounded border border-dashed border-border hover:border-text-muted
                       transition-colors shrink-0
                       ${animateMode ? 'py-1.5 text-[10px]' : 'py-0.5 text-[9px]'}`}
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

      {/* Close duration slider on outside click */}
      {durationEditId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setDurationEditId(null)}
        />
      )}
    </div>
  )
}
