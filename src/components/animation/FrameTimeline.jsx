import { useEffect, useRef, useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

const PLAY_INTERVAL_MS = 1200  // ms between frames during playback

/**
 * FrameTimeline — horizontal strip of animation frame thumbnails.
 *
 * Sits between PitchCanvas and Toolbar.
 * Only shown when frames.length > 0 OR the "Add Frame" button is clicked.
 *
 * Features:
 *  - Add frame (snapshot current board state, max 8)
 *  - Remove frame
 *  - Rename frame (click label to edit)
 *  - Preview frame (click chip to restore board state)
 *  - Play / Stop — cycles through frames at 1.2 s interval
 *  - "Live" chip — returns to live board
 */
export default function FrameTimeline() {
  const frames         = useBoardStore((s) => s.board.frames)
  const addFrame       = useBoardStore((s) => s.addFrame)
  const removeFrame    = useBoardStore((s) => s.removeFrame)
  const updateFrame    = useBoardStore((s) => s.updateFrame)
  const restoreFrame   = useBoardStore((s) => s.restoreFrame)

  const activeFrameId  = useSettingsStore((s) => s.activeFrameId)
  const setActiveFrameId = useSettingsStore((s) => s.setActiveFrameId)
  const isPlaying      = useSettingsStore((s) => s.isPlaying)
  const setIsPlaying   = useSettingsStore((s) => s.setIsPlaying)

  const [editingId, setEditingId] = useState(null) // frame id being renamed
  const inputRef = useRef(null)
  const playTimerRef = useRef(null)

  // Auto-focus rename input
  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.select()
  }, [editingId])

  // Playback ticker — use a ref to track current frame index to avoid stale closures
  const playIndexRef = useRef(0)

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      clearInterval(playTimerRef.current)
      return
    }
    const ids = frames.map((f) => f.id)

    // Start from the currently active frame (or frame 0)
    const startIdx = Math.max(0, ids.indexOf(activeFrameId))
    playIndexRef.current = startIdx

    // Show the starting frame immediately
    restoreFrame(ids[startIdx])
    setActiveFrameId(ids[startIdx])

    const advance = () => {
      playIndexRef.current = (playIndexRef.current + 1) % ids.length
      const nextId = ids[playIndexRef.current]
      restoreFrame(nextId)
      setActiveFrameId(nextId)
    }

    playTimerRef.current = setInterval(advance, PLAY_INTERVAL_MS)
    return () => clearInterval(playTimerRef.current)
  }, [isPlaying, frames.length]) // eslint-disable-line

  // Stop playback when frames are removed
  useEffect(() => {
    if (frames.length === 0) {
      setIsPlaying(false)
      setActiveFrameId(null)
    }
  }, [frames.length]) // eslint-disable-line

  // Don't render the bar at all if no frames and user hasn't added any
  // (We always render the + button so the user can start)
  const hasFrames = frames.length > 0

  const handleAddFrame = () => {
    addFrame()
    // After adding, activate the new frame (it'll be the last one)
    // We don't know its id yet so wait a tick
    setTimeout(() => {
      const latest = useBoardStore.getState().board.frames.at(-1)
      if (latest) {
        setActiveFrameId(latest.id)
      }
    }, 0)
  }

  const handleSelectFrame = (id) => {
    setIsPlaying(false)
    restoreFrame(id)
    setActiveFrameId(id)
  }

  const handleLive = () => {
    setIsPlaying(false)
    setActiveFrameId(null)
  }

  const handleRemove = (e, id) => {
    e.stopPropagation()
    removeFrame(id)
    if (activeFrameId === id) setActiveFrameId(null)
  }

  const handleRenameCommit = (id, value) => {
    const label = value.trim()
    if (label) updateFrame(id, { label })
    setEditingId(null)
  }

  const togglePlay = () => {
    if (frames.length === 0) return
    setIsPlaying(!isPlaying)
  }

  if (!hasFrames) {
    // Show a minimal "Add Frame" inline button in the toolbar area — rendered by parent
    return null
  }

  return (
    <div
      className="shrink-0 bg-panel border-t border-border flex items-center gap-1 px-3 overflow-x-auto"
      style={{
        minHeight: '40px',
        // Smooth momentum scrolling on iOS; hide scrollbar visually
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',        // Firefox
        msOverflowStyle: 'none',       // IE/Edge legacy
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

      <div className="w-px h-4 bg-border shrink-0 mx-0.5" />

      {/* "Live" chip */}
      <button
        onClick={handleLive}
        title="Return to live board"
        className={`text-[9px] font-medium px-2 py-0.5 rounded shrink-0 transition-colors border
          ${activeFrameId === null
            ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
            : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
          }`}
      >
        Live
      </button>

      {/* Frame chips */}
      {frames.map((frame) => (
        <div
          key={frame.id}
          onClick={() => handleSelectFrame(frame.id)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border cursor-pointer shrink-0
                      transition-colors group
            ${activeFrameId === frame.id
              ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
              : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
            }`}
        >
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
              className="text-[9px] font-medium whitespace-nowrap"
              onDoubleClick={(e) => { e.stopPropagation(); setEditingId(frame.id) }}
              title="Double-click to rename"
            >
              {frame.label}
            </span>
          )}

          {/* Remove button */}
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
        </div>
      ))}

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
  )
}
