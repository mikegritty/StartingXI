import { useRef, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { pixelToNorm, clampNorm } from '../../utils/positions'
import { useSettingsStore } from '../../store/settingsStore'
import { useBoardStore } from '../../store/boardStore'

/**
 * useDrawingPointer
 *
 * Encapsulates all pointer-event logic for the drawing tools.
 * Returns handlers to attach to the Konva Stage (onPointerDown/Move/Up)
 * and a preview state object for the PreviewLayer to render.
 *
 * @param {object} pitchRect - { x, y, width, height } from getPitchRect()
 * @param {object} stageRef  - ref to the Konva Stage instance
 * @returns {{ preview, textPending, handlers, clearTextPending }}
 */
export function useDrawingPointer(pitchRect, stageRef) {
  const activeTool   = useSettingsStore((s) => s.activeTool)
  const drawColor    = useSettingsStore((s) => s.drawColor)
  const addDrawing   = useBoardStore((s) => s.addDrawing)
  const removeDrawing = useBoardStore((s) => s.removeDrawing)
  const drawings     = useBoardStore((s) => s.board.drawings)

  // Live preview state (not stored until pointer up)
  const [preview, setPreview] = useState(null)

  // For text tool: pending { nx, ny } position where the overlay should appear
  const [textPending, setTextPending] = useState(null)

  const isDrawing = useRef(false)
  const startNorm = useRef(null)   // { nx, ny }
  const freePoints = useRef([])    // flat array [x0,y0,x1,y1,...] normalized

  // Helper: get normalized coords from stage pointer position
  const getNorm = useCallback((stage) => {
    const pos = stage.getPointerPosition()
    if (!pos) return null
    return {
      nx: clampNorm((pos.x - pitchRect.x) / pitchRect.width),
      ny: clampNorm((pos.y - pitchRect.y) / pitchRect.height),
    }
  }, [pitchRect])

  const handlePointerDown = useCallback((e) => {
    if (activeTool === 'select') return
    // Only respond to left mouse / primary touch
    if (e.evt.button !== undefined && e.evt.button !== 0) return

    const stage = stageRef.current
    if (!stage) return
    const norm = getNorm(stage)
    if (!norm) return

    if (activeTool === 'eraser') {
      // Erase the topmost drawing whose bounding box contains the click point
      // We'll do a simple proximity check on first/last points
      const hit = findHitDrawing(drawings, norm, pitchRect)
      if (hit) removeDrawing(hit.id)
      return
    }

    if (activeTool === 'text') {
      // Show text overlay at this position — no preview needed
      setTextPending({ nx: norm.nx, ny: norm.ny })
      return
    }

    isDrawing.current = true
    startNorm.current = norm

    if (activeTool === 'zone' || activeTool === 'highlight') {
      setPreview({ type: activeTool, x1: norm.nx, y1: norm.ny, x2: norm.nx, y2: norm.ny, color: drawColor })
    } else if (activeTool === 'pass' || activeTool === 'run' || activeTool === 'dribble') {
      setPreview({ type: activeTool, x1: norm.nx, y1: norm.ny, x2: norm.nx, y2: norm.ny, color: drawColor })
    } else if (activeTool === 'free') {
      freePoints.current = [norm.nx, norm.ny]
      setPreview({ type: 'free', points: [norm.nx, norm.ny], color: drawColor })
    }
  }, [activeTool, drawColor, drawings, getNorm, pitchRect, removeDrawing, stageRef])

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current) return
    if (activeTool === 'select' || activeTool === 'eraser' || activeTool === 'text') return

    const stage = stageRef.current
    if (!stage) return
    const norm = getNorm(stage)
    if (!norm) return

    if (activeTool === 'free') {
      freePoints.current = [...freePoints.current, norm.nx, norm.ny]
      setPreview((prev) => ({ ...prev, points: [...freePoints.current] }))
    } else {
      setPreview((prev) => prev ? { ...prev, x2: norm.nx, y2: norm.ny } : prev)
    }
  }, [activeTool, getNorm, stageRef])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false

    const start = startNorm.current
    if (!start) { setPreview(null); return }

    const current = preview
    if (!current) { setPreview(null); return }

    // Minimum drag threshold to avoid accidental single-click drawings
    const dx = (current.x2 ?? current.x1) - start.nx
    const dy = (current.y2 ?? current.y1) - start.ny
    const hasMoved = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01

    if (!hasMoved && activeTool !== 'free') {
      setPreview(null)
      return
    }

    // Commit drawing to store
    const base = { id: uuidv4(), color: drawColor }

    if (activeTool === 'pass') {
      addDrawing({ ...base, type: 'pass', x1: start.nx, y1: start.ny, x2: current.x2, y2: current.y2 })
    } else if (activeTool === 'run') {
      addDrawing({ ...base, type: 'run', x1: start.nx, y1: start.ny, x2: current.x2, y2: current.y2 })
    } else if (activeTool === 'dribble') {
      addDrawing({ ...base, type: 'dribble', x1: start.nx, y1: start.ny, x2: current.x2, y2: current.y2 })
    } else if (activeTool === 'zone') {
      addDrawing({ ...base, type: 'zone', x1: start.nx, y1: start.ny, x2: current.x2, y2: current.y2 })
    } else if (activeTool === 'highlight') {
      addDrawing({ ...base, type: 'highlight', x1: start.nx, y1: start.ny, x2: current.x2, y2: current.y2 })
    } else if (activeTool === 'free') {
      if (freePoints.current.length >= 4) {
        addDrawing({ ...base, type: 'free', points: [...freePoints.current] })
      }
      freePoints.current = []
    }

    setPreview(null)
    startNorm.current = null
  }, [activeTool, drawColor, preview, addDrawing])

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
// Returns the most-recently-added drawing that contains the click point.
// Uses normalized coordinates throughout.

function findHitDrawing(drawings, norm, pitchRect) {
  const HIT_R = 0.05  // normalized hit radius

  // Iterate in reverse to hit topmost drawings first
  for (let i = drawings.length - 1; i >= 0; i--) {
    const d = drawings[i]
    if (hitTest(d, norm, HIT_R)) return d
  }
  return null
}

function hitTest(d, { nx, ny }, r) {
  if (d.type === 'pass' || d.type === 'run' || d.type === 'dribble') {
    return pointNearSegment(nx, ny, d.x1, d.y1, d.x2, d.y2, r)
  }
  if (d.type === 'zone' || d.type === 'highlight') {
    const minX = Math.min(d.x1, d.x2) - r
    const maxX = Math.max(d.x1, d.x2) + r
    const minY = Math.min(d.y1, d.y2) - r
    const maxY = Math.max(d.y1, d.y2) + r
    return nx >= minX && nx <= maxX && ny >= minY && ny <= maxY
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
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay) < r
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy) < r
}
