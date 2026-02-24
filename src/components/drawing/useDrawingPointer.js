import { useRef, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { clampNorm } from '../../utils/positions'
import { useSettingsStore } from '../../store/settingsStore'
import { useBoardStore } from '../../store/boardStore'

/**
 * useDrawingPointer
 *
 * Encapsulates all pointer-event logic for the drawing tools.
 * Returns handlers to attach to the Konva Stage (onPointerDown/Move/Up)
 * and a preview state object for the PreviewLayer to render.
 *
 * Design notes:
 *  - All mutable drawing-in-progress state lives in refs to avoid stale closures
 *    in the pointer callbacks (which are registered once on the Konva stage).
 *  - previewRef mirrors preview React state so handlePointerUp never reads stale state.
 *  - activeTool/drawColor/drawings are mirrored to refs on every render so callbacks
 *    always see the latest values without being recreated on every change.
 *
 * @param {object} pitchRect - { x, y, width, height } from getPitchRect()
 * @param {object} stageRef  - ref to the Konva Stage instance
 * @returns {{ preview, textPending, handlers, clearTextPending }}
 */
export function useDrawingPointer(pitchRect, stageRef) {
  const activeTool           = useSettingsStore((s) => s.activeTool)
  const drawColor            = useSettingsStore((s) => s.drawColor)
  const setSelectedDrawingId = useSettingsStore((s) => s.setSelectedDrawingId)
  const addDrawing    = useBoardStore((s) => s.addDrawing)
  const removeDrawing = useBoardStore((s) => s.removeDrawing)
  const drawings      = useBoardStore((s) => s.board.drawings)

  // React state for rendering the live preview
  const [preview, setPreview] = useState(null)

  // For text tool: pending { nx, ny } position where the overlay should appear
  const [textPending, setTextPending] = useState(null)

  // ── Mutable refs — no stale-closure risk ────────────────────────────────
  const isDrawing              = useRef(false)
  const startNorm              = useRef(null)         // { nx, ny }
  const freePoints             = useRef([])           // flat array [x0,y0,x1,y1,...] normalized
  const previewRef             = useRef(null)         // mirrors preview state so handlePointerUp is stable
  const activeToolRef          = useRef(activeTool)   // mirrors activeTool — updated every render
  const drawColorRef           = useRef(drawColor)    // mirrors drawColor — updated every render
  const drawingsRef            = useRef(drawings)     // mirrors drawings — updated every render
  const setSelectedDrawingRef  = useRef(setSelectedDrawingId) // stable ref so handlePointerDown can clear selection

  // Keep refs in sync with store values on every render
  activeToolRef.current         = activeTool
  drawColorRef.current          = drawColor
  drawingsRef.current           = drawings
  setSelectedDrawingRef.current = setSelectedDrawingId

  // Helper: sync preview state + ref together
  const updatePreview = (valOrFn) => {
    const val = typeof valOrFn === 'function' ? valOrFn(previewRef.current) : valOrFn
    previewRef.current = val
    setPreview(val)
  }

  // Helper: get normalized coords from stage pointer position
  const getNorm = useCallback((stage) => {
    const pos = stage.getPointerPosition()
    if (!pos) return null
    return {
      nx: clampNorm((pos.x - pitchRect.x) / pitchRect.width),
      ny: clampNorm((pos.y - pitchRect.y) / pitchRect.height),
    }
  }, [pitchRect])

  // ── Pointer handlers ──────────────────────────────────────────────────────
  // These have minimal deps — they read live values from refs to avoid recreation.

  const handlePointerDown = useCallback((e) => {
    const tool  = activeToolRef.current
    const color = drawColorRef.current

    if (tool === 'select') return
    // Any drawing action clears the drawing selection
    setSelectedDrawingRef.current?.(null)
    // Only respond to left mouse / primary touch
    if (e.evt.button !== undefined && e.evt.button !== 0) return

    const stage = stageRef.current
    if (!stage) return
    const norm = getNorm(stage)
    if (!norm) return

    if (tool === 'eraser') {
      const hit = findHitDrawing(drawingsRef.current, norm)
      if (hit) removeDrawing(hit.id)
      return
    }

    if (tool === 'text') {
      setTextPending({ nx: norm.nx, ny: norm.ny })
      return
    }

    isDrawing.current = true
    startNorm.current = norm

    if (tool === 'zone' || tool === 'highlight' ||
        tool === 'pass' || tool === 'run' || tool === 'dribble') {
      updatePreview({ type: tool, x1: norm.nx, y1: norm.ny, x2: norm.nx, y2: norm.ny, color })
    } else if (tool === 'free') {
      freePoints.current = [norm.nx, norm.ny]
      updatePreview({ type: 'free', points: [norm.nx, norm.ny], color })
    }
  }, [getNorm, removeDrawing, stageRef])

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current) return
    const tool = activeToolRef.current
    if (tool === 'select' || tool === 'eraser' || tool === 'text') return

    const stage = stageRef.current
    if (!stage) return
    const norm = getNorm(stage)
    if (!norm) return

    if (tool === 'free') {
      freePoints.current = [...freePoints.current, norm.nx, norm.ny]
      updatePreview((prev) => prev ? { ...prev, points: [...freePoints.current] } : prev)
    } else {
      updatePreview((prev) => prev ? { ...prev, x2: norm.nx, y2: norm.ny } : prev)
    }
  }, [getNorm, stageRef])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false

    const tool    = activeToolRef.current
    const color   = drawColorRef.current
    const current = previewRef.current   // always fresh — no stale closure issue
    const start   = startNorm.current

    if (!start || !current) { updatePreview(null); return }

    // Minimum drag threshold to avoid accidental single-click drawings
    const hasMoved =
      Math.abs((current.x2 ?? current.x1) - start.nx) > 0.01 ||
      Math.abs((current.y2 ?? current.y1) - start.ny) > 0.01

    if (!hasMoved && tool !== 'free') {
      updatePreview(null)
      return
    }

    // Commit drawing to store
    const base = { id: uuidv4(), color }

    if (tool === 'pass' || tool === 'run' || tool === 'dribble') {
      addDrawing({ ...base, type: tool, x1: start.nx, y1: start.ny, x2: current.x2, y2: current.y2 })
    } else if (tool === 'zone' || tool === 'highlight') {
      addDrawing({ ...base, type: tool, x1: start.nx, y1: start.ny, x2: current.x2, y2: current.y2 })
    } else if (tool === 'free') {
      if (freePoints.current.length >= 4) {
        addDrawing({ ...base, type: 'free', points: [...freePoints.current] })
      }
      freePoints.current = []
    }

    updatePreview(null)
    startNorm.current = null
  }, [addDrawing])

  const clearTextPending = useCallback(() => setTextPending(null), [])

  return {
    preview,
    textPending,
    clearTextPending,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp:   handlePointerUp,
    },
  }
}

// ── Eraser hit detection ──────────────────────────────────────────────────────

function findHitDrawing(drawings, norm) {
  const HIT_R = 0.05  // normalized hit radius — generous for touch targets

  // Iterate in reverse to erase the topmost (most-recently-drawn) first
  for (let i = drawings.length - 1; i >= 0; i--) {
    if (hitTest(drawings[i], norm, HIT_R)) return drawings[i]
  }
  return null
}

function hitTest(d, { nx, ny }, r) {
  if (d.type === 'pass' || d.type === 'run' || d.type === 'dribble') {
    return pointNearSegment(nx, ny, d.x1, d.y1, d.x2, d.y2, r)
  }
  if (d.type === 'zone' || d.type === 'highlight') {
    return nx >= Math.min(d.x1, d.x2) - r &&
           nx <= Math.max(d.x1, d.x2) + r &&
           ny >= Math.min(d.y1, d.y2) - r &&
           ny <= Math.max(d.y1, d.y2) + r
  }
  if (d.type === 'free') {
    const pts = d.points
    for (let i = 0; i < pts.length - 2; i += 2) {
      if (pointNearSegment(nx, ny, pts[i], pts[i + 1], pts[i + 2], pts[i + 3], r)) return true
    }
  }
  if (d.type === 'text') {
    return Math.hypot(nx - d.nx, ny - d.ny) < r * 1.5
  }
  return false
}

function pointNearSegment(px, py, ax, ay, bx, by, r) {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay) < r
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) < r
}
