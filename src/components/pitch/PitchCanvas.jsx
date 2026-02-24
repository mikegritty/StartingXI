import { Stage } from 'react-konva'
import { useRef, useState, useEffect } from 'react'
import PitchLines from './PitchLines'
import PlayerLayer from '../players/PlayerLayer'
import DrawingLayer from '../drawing/DrawingLayer'
import PreviewLayer from '../drawing/PreviewLayer'
import TextInputOverlay from '../drawing/TextInputOverlay'
import { useDrawingPointer } from '../drawing/useDrawingPointer'
import { getPitchRect, normToPixel } from '../../utils/positions'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

const TOKEN_RADIUS = 18  // must match PlayerToken.jsx

/**
 * PitchCanvas renders the Konva stage with pitch lines, drawings, and player tokens.
 *
 * Props:
 *   readOnly  – when true, renders in viewer mode: no drag/drop, no click handlers,
 *               cursor is default. Pass `board` prop to supply data from outside the store.
 *   board     – optional board snapshot (used in readOnly viewer mode instead of store)
 */
export default function PitchCanvas({ readOnly = false, board: boardProp = null }) {
  const containerRef = useRef(null)
  const stageRef     = useRef(null)
  const [stageSize, setStageSize]   = useState({ width: 800, height: 600 })
  const [dropTarget, setDropTarget] = useState(null) // starterId being hovered over

  // In readOnly mode we read from the prop; in edit mode from the store
  const storeZoneOverlay      = useBoardStore((s) => s.board.pitch.zoneOverlay)
  const storePlayers          = useBoardStore((s) => s.board.players)
  const deselectAll           = useBoardStore((s) => s.deselectAll)
  const substitutePlayer      = useBoardStore((s) => s.substitutePlayer)
  const setSelectedPlayerId   = useSettingsStore((s) => s.setSelectedPlayerId)
  const activePhase           = useSettingsStore((s) => s.activePhase)
  const pendingSubId          = useSettingsStore((s) => s.pendingSubId)
  const setPendingSubId       = useSettingsStore((s) => s.setPendingSubId)
  const activeTool            = useSettingsStore((s) => s.activeTool)
  const setActiveTool         = useSettingsStore((s) => s.setActiveTool)

  const zoneOverlay = readOnly ? (boardProp?.pitch?.zoneOverlay ?? 'none') : storeZoneOverlay
  const players     = readOnly ? (boardProp?.players ?? [])                : storePlayers

  // ── Responsive stage sizing ──────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return
    const update = (entries) => {
      const { width, height } = entries[0].contentRect
      setStageSize({ width: Math.floor(width), height: Math.floor(height) })
    }
    const observer = new ResizeObserver(update)
    observer.observe(containerRef.current)
    const rect = containerRef.current.getBoundingClientRect()
    setStageSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    return () => observer.disconnect()
  }, [])

  const pitchRect = getPitchRect(stageSize.width, stageSize.height, 36)

  // Scale tokens relative to pitch width — keeps them proportional on narrow mobile screens
  // Reference width 560px = 1.0 scale. Clamp between 0.7 and 1.1.
  const tokenScale = Math.min(1.1, Math.max(0.7, stageSize.width / 560))

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    if (readOnly) return
    const SHORTCUTS = {
      v: 'select',
      a: 'pass',
      c: 'run',
      d: 'dribble',
      z: 'zone',
      h: 'highlight',
      t: 'text',
      e: 'eraser',
    }
    const handleKey = (ev) => {
      // Don't capture when typing in an input
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return
      const tool = SHORTCUTS[ev.key.toLowerCase()]
      if (tool) setActiveTool(tool)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [readOnly, setActiveTool])

  // ── Drawing pointer hook ──────────────────────────────────────────────────

  const { preview, textPending, clearTextPending, handlers: drawHandlers } =
    useDrawingPointer(pitchRect, stageRef)

  // ── Edit-mode handlers (no-ops in readOnly) ──────────────────────────────

  const handleStageClick = (e) => {
    if (readOnly) return
    if (activeTool !== 'select') return  // drawing tools handle their own pointer events
    if (e.target === e.target.getStage()) {
      deselectAll()
      setSelectedPlayerId(null)
    }
  }

  // Hit-test drop position against all home starters, return closest within radius
  const hitTestStarter = (dropX, dropY) => {
    const starters = players.filter((p) => p.team === 'home' && p.isStarter !== false)
    let closest = null
    let closestDist = TOKEN_RADIUS * 2.5  // generous hit radius

    for (const p of starters) {
      const phase = activePhase?.home ?? 'in'
      const nx = p[`x_${phase}`] ?? p.x
      const ny = p[`y_${phase}`] ?? p.y
      const { px, py } = normToPixel(nx, ny, pitchRect)
      const dist = Math.hypot(dropX - px, dropY - py)
      if (dist < closestDist) {
        closestDist = dist
        closest = p
      }
    }
    return closest
  }

  const handleDragOver = (e) => {
    if (readOnly) return
    if (!e.dataTransfer.types.includes('subid')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const target = hitTestStarter(x, y)
    setDropTarget(target?.id ?? null)
  }

  const handleDragLeave = () => {
    if (readOnly) return
    setDropTarget(null)
  }

  const handleDrop = (e) => {
    if (readOnly) return
    e.preventDefault()
    const subId = e.dataTransfer.getData('subId')
    if (!subId) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const target = hitTestStarter(x, y)

    if (target) {
      substitutePlayer(subId, target.id)
    }
    setDropTarget(null)
  }

  const effectiveDropTarget = readOnly ? null : dropTarget

  // Stage cursor
  const getCursor = () => {
    if (readOnly) return 'default'
    if (activeTool === 'eraser') return 'cell'
    if (activeTool !== 'select') return 'crosshair'
    return 'default'
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{
        background: '#0f1117',
        cursor: getCursor(),
      }}
      onDragOver={readOnly ? undefined : handleDragOver}
      onDragLeave={readOnly ? undefined : handleDragLeave}
      onDrop={readOnly ? undefined : handleDrop}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={readOnly ? undefined : handleStageClick}
        onTap={readOnly ? undefined : handleStageClick}
        onPointerDown={readOnly ? undefined : drawHandlers.onPointerDown}
        onPointerMove={readOnly ? undefined : drawHandlers.onPointerMove}
        onPointerUp={readOnly ? undefined : drawHandlers.onPointerUp}
        perfectDrawEnabled={false}
        pixelRatio={Math.min(window.devicePixelRatio ?? 1, 2)}
      >
        <PitchLines pitchRect={pitchRect} zoneOverlay={zoneOverlay} />

        {/* Committed drawings */}
        <DrawingLayer
          pitchRect={pitchRect}
          drawings={readOnly ? (boardProp?.drawings ?? []) : undefined}
        />

        {/* Live preview while drawing */}
        {!readOnly && (
          <PreviewLayer preview={preview} pitchRect={pitchRect} />
        )}

        <PlayerLayer
          pitchRect={pitchRect}
          activePhase={readOnly ? { home: 'in', away: 'in' } : activePhase}
          dropTargetId={effectiveDropTarget}
          pendingSubMode={readOnly ? false : !!pendingSubId}
          tokenScale={tokenScale}
          readOnly={readOnly}
          boardPlayers={readOnly ? players : null}
        />
      </Stage>

      {/* Text input overlay — DOM element, positioned over canvas */}
      {!readOnly && textPending && (
        <TextInputOverlay
          textPending={textPending}
          onClose={clearTextPending}
          pitchRect={pitchRect}
          containerRef={containerRef}
        />
      )}

      {/* Mobile substitution mode banner — overlays pitch (edit mode only) */}
      {!readOnly && pendingSubId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10
                        flex items-center gap-2 px-3 py-1.5 rounded-full
                        bg-accent-blue/90 backdrop-blur-sm shadow-lg">
          <span className="text-[11px] text-white font-medium whitespace-nowrap">
            Tap a player to substitute
          </span>
          <button
            onClick={() => setPendingSubId(null)}
            className="text-white/70 hover:text-white text-xs leading-none"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
