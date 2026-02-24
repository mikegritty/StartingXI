import { Stage } from 'react-konva'
import Konva from 'konva'
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
import { PHASES } from '../../data/phases'
import { useMobile } from '../../hooks/useMobile'

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
  const removeDrawing         = useBoardStore((s) => s.removeDrawing)
  const substitutePlayer      = useBoardStore((s) => s.substitutePlayer)
  const setSelectedPlayerId   = useSettingsStore((s) => s.setSelectedPlayerId)
  const selectedDrawingId     = useSettingsStore((s) => s.selectedDrawingId)
  const setSelectedDrawingId  = useSettingsStore((s) => s.setSelectedDrawingId)
  const activePhase           = useSettingsStore((s) => s.activePhase)
  const isPlaying             = useSettingsStore((s) => s.isPlaying)
  const pendingSubId          = useSettingsStore((s) => s.pendingSubId)
  const setPendingSubId       = useSettingsStore((s) => s.setPendingSubId)
  const activeTool            = useSettingsStore((s) => s.activeTool)
  const setActiveTool         = useSettingsStore((s) => s.setActiveTool)

  const isMobile   = useMobile()
  const phaseColor = PHASES.find((p) => p.id === activePhase)?.color

  // Tween state — for position animation between frames
  const animateBetweenFrames = useBoardStore((s) => s.board.play.animateBetweenFrames)
  const frames               = useBoardStore((s) => s.board.play.frames)
  const currentFrameIndex    = useBoardStore((s) => s.board.play.currentFrameIndex)
  const prevFrameIndexRef    = useRef(currentFrameIndex)

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
  // Keep a ref to pitchRect so the tween effect always reads the latest value
  // even when stageSize changes between renders.
  const pitchRectRef = useRef(pitchRect)
  pitchRectRef.current = pitchRect

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

      // Delete / Backspace — delete selected drawing
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        const selId = useSettingsStore.getState().selectedDrawingId
        if (selId) {
          ev.preventDefault()
          removeDrawing(selId)
          setSelectedDrawingId(null)
          return
        }
      }

      const tool = SHORTCUTS[ev.key.toLowerCase()]
      if (tool) setActiveTool(tool)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [readOnly, setActiveTool, removeDrawing, setSelectedDrawingId])

  // ── Konva.Tween — tween player positions between frames during playback ──

  useEffect(() => {
    const prevIdx = prevFrameIndexRef.current
    prevFrameIndexRef.current = currentFrameIndex

    // Only tween when playing with animation enabled and the index actually changed
    if (!isPlaying || !animateBetweenFrames) return
    if (prevIdx === currentFrameIndex) return
    if (!stageRef.current) return

    const prevFrame = frames[prevIdx]
    const nextFrame = frames[currentFrameIndex]
    if (!prevFrame || !nextFrame) return

    nextFrame.players.forEach((nextPlayer) => {
      const prev = prevFrame.players.find((p) => p.id === nextPlayer.id)
      if (!prev) return
      // Skip players that haven't moved
      if (prev.x === nextPlayer.x && prev.y === nextPlayer.y) return

      const node = stageRef.current.findOne(`#player-${nextPlayer.id}`)
      if (!node) return

      const { px: targetX, py: targetY } = normToPixel(nextPlayer.x, nextPlayer.y, pitchRectRef.current)
      const tween = new Konva.Tween({
        node,
        duration: 0.8,   // 800ms per spec
        easing: Konva.Easings.EaseInOut,
        x: targetX,
        y: targetY,
        onFinish: () => tween.destroy(),
      })
      tween.play()
    })
  }, [currentFrameIndex]) // eslint-disable-line

  // ── Text drawing edit state ───────────────────────────────────────────────
  // When set, shows the TextInputOverlay pre-filled for editing an existing text drawing.
  const [editingDrawingId, setEditingDrawingId] = useState(null)
  const updateDrawing  = useBoardStore((s) => s.updateDrawing)
  const storeDrawings  = useBoardStore((s) => s.board.drawings)
  const editingDrawing = storeDrawings.find((d) => d.id === editingDrawingId) ?? null

  const handleEditDrawing = (id) => {
    setEditingDrawingId(id)
  }

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
      setSelectedDrawingId(null)   // clear drawing selection on background tap
    }
  }

  // Hit-test drop position against all home starters, return closest within radius
  const hitTestStarter = (dropX, dropY) => {
    const starters = players.filter((p) => p.team === 'home' && p.isStarter !== false)
    let closest = null
    let closestDist = TOKEN_RADIUS * 2.5  // generous hit radius

    for (const p of starters) {
      const { px, py } = normToPixel(p.x, p.y, pitchRect)
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
      {/* Phase colour band — 3px strip on left edge (desktop) or top edge (mobile) */}
      {!readOnly && phaseColor && (
        <div
          className="absolute z-10 pointer-events-none"
          style={isMobile
            ? { top: 0, left: 0, right: 0, height: 3, backgroundColor: phaseColor }
            : { top: 0, left: 0, bottom: 0, width: 3, backgroundColor: phaseColor }
          }
        />
      )}

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
          readOnly={readOnly}
          onEditDrawing={readOnly ? undefined : handleEditDrawing}
        />

        {/* Live preview while drawing */}
        {!readOnly && (
          <PreviewLayer preview={preview} pitchRect={pitchRect} />
        )}

        <PlayerLayer
          pitchRect={pitchRect}
          dropTargetId={effectiveDropTarget}
          pendingSubMode={readOnly ? false : !!pendingSubId}
          tokenScale={tokenScale}
          readOnly={readOnly}
          boardPlayers={readOnly ? players : null}
        />
      </Stage>

      {/* Text input overlay — DOM element, positioned over canvas (new text) */}
      {!readOnly && textPending && (
        <TextInputOverlay
          textPending={textPending}
          onClose={clearTextPending}
          pitchRect={pitchRect}
          containerRef={containerRef}
        />
      )}

      {/* Text edit overlay — pre-filled for editing an existing text drawing */}
      {!readOnly && editingDrawing && (
        <TextInputOverlay
          textPending={{ nx: editingDrawing.nx, ny: editingDrawing.ny }}
          initialText={editingDrawing.text}
          onClose={(newText) => {
            if (newText && newText !== editingDrawing.text) {
              updateDrawing(editingDrawing.id, { text: newText })
            }
            setEditingDrawingId(null)
          }}
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
