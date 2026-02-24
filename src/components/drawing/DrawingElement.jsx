import { Arrow, Line, Rect, Circle, Text } from 'react-konva'
import { normToPixel } from '../../utils/positions'

/**
 * DrawingElement — renders a single stored drawing object on a Konva Layer.
 *
 * Supported types: pass, run, dribble, zone, highlight, free, text
 *
 * @param {object} drawing  - drawing object from boardStore
 * @param {object} pitchRect - pixel rect of pitch { x, y, width, height }
 * @param {number} [opacity=1]
 */
export default function DrawingElement({ drawing, pitchRect, opacity = 1 }) {
  const { type, color } = drawing

  if (type === 'pass') {
    return <ArrowDrawing drawing={drawing} pitchRect={pitchRect} dashed={false} curved={false} color={color} opacity={opacity} />
  }
  if (type === 'run') {
    return <ArrowDrawing drawing={drawing} pitchRect={pitchRect} dashed={false} curved={true} color={color} opacity={opacity} />
  }
  if (type === 'dribble') {
    return <ArrowDrawing drawing={drawing} pitchRect={pitchRect} dashed={true} curved={false} color={color} opacity={opacity} />
  }
  if (type === 'zone') {
    return <ZoneDrawing drawing={drawing} pitchRect={pitchRect} color={color} opacity={opacity} />
  }
  if (type === 'highlight') {
    return <HighlightDrawing drawing={drawing} pitchRect={pitchRect} color={color} opacity={opacity} />
  }
  if (type === 'free') {
    return <FreeDrawing drawing={drawing} pitchRect={pitchRect} color={color} opacity={opacity} />
  }
  if (type === 'text') {
    return <TextDrawing drawing={drawing} pitchRect={pitchRect} color={color} opacity={opacity} />
  }
  return null
}

// ── Arrow (pass / run / dribble) ─────────────────────────────────────────────

function ArrowDrawing({ drawing, pitchRect, dashed, curved, color, opacity }) {
  const { x1, y1, x2, y2 } = drawing
  const p1 = normToPixel(x1, y1, pitchRect)
  const p2 = normToPixel(x2, y2, pitchRect)

  if (curved) {
    // Curved run: use a quadratic bezier approximated by many points
    const pts = bezierPoints(p1.px, p1.py, p2.px, p2.py, 20)
    const last4 = pts.slice(-4)
    return (
      <>
        <Line
          points={pts}
          stroke={color}
          strokeWidth={2.5}
          opacity={opacity}
          tension={0}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
        {/* Arrowhead at end */}
        <Arrow
          points={last4}
          pointerLength={10}
          pointerWidth={8}
          fill={color}
          stroke={color}
          strokeWidth={2.5}
          opacity={opacity}
          listening={false}
        />
      </>
    )
  }

  const dashPattern = dashed ? [8, 5] : []

  return (
    <Arrow
      points={[p1.px, p1.py, p2.px, p2.py]}
      stroke={color}
      strokeWidth={2.5}
      pointerLength={10}
      pointerWidth={8}
      fill={color}
      opacity={opacity}
      dash={dashPattern}
      lineCap="round"
      listening={false}
    />
  )
}

// ── Zone (rectangle) ──────────────────────────────────────────────────────────

function ZoneDrawing({ drawing, pitchRect, color, opacity }) {
  const { x1, y1, x2, y2 } = drawing
  const p1 = normToPixel(x1, y1, pitchRect)
  const p2 = normToPixel(x2, y2, pitchRect)
  const rx = Math.min(p1.px, p2.px)
  const ry = Math.min(p1.py, p2.py)
  const rw = Math.abs(p2.px - p1.px)
  const rh = Math.abs(p2.py - p1.py)

  return (
    <Rect
      x={rx}
      y={ry}
      width={rw}
      height={rh}
      stroke={color}
      strokeWidth={2}
      fill={color}
      opacity={opacity * 0.25}
      cornerRadius={3}
      listening={false}
    />
  )
}

// ── Highlight (ellipse / circle) ──────────────────────────────────────────────

function HighlightDrawing({ drawing, pitchRect, color, opacity }) {
  const { x1, y1, x2, y2 } = drawing
  const p1 = normToPixel(x1, y1, pitchRect)
  const p2 = normToPixel(x2, y2, pitchRect)
  const cx = (p1.px + p2.px) / 2
  const cy = (p1.py + p2.py) / 2
  const rx = Math.abs(p2.px - p1.px) / 2
  const ry = Math.abs(p2.py - p1.py) / 2

  // Use a scaled Circle approximation; for true ellipse we'd need Konva Ellipse
  // Import Ellipse separately to avoid bloat — use scaleX/scaleY on a Circle
  return (
    <Circle
      x={cx}
      y={cy}
      radius={Math.max(rx, ry) || 10}
      scaleX={rx > 0 && ry > 0 ? rx / Math.max(rx, ry) : 1}
      scaleY={ry > 0 && rx > 0 ? ry / Math.max(rx, ry) : 1}
      stroke={color}
      strokeWidth={2}
      fill={color}
      opacity={opacity * 0.2}
      listening={false}
    />
  )
}

// ── Freehand line ─────────────────────────────────────────────────────────────

function FreeDrawing({ drawing, pitchRect, color, opacity }) {
  const pixelPoints = []
  const pts = drawing.points
  for (let i = 0; i < pts.length; i += 2) {
    const { px, py } = normToPixel(pts[i], pts[i + 1], pitchRect)
    pixelPoints.push(px, py)
  }

  return (
    <Line
      points={pixelPoints}
      stroke={color}
      strokeWidth={2.5}
      opacity={opacity}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
  )
}

// ── Text annotation ───────────────────────────────────────────────────────────

function TextDrawing({ drawing, pitchRect, color, opacity }) {
  const { nx, ny, text } = drawing
  const { px, py } = normToPixel(nx, ny, pitchRect)

  return (
    <Text
      x={px}
      y={py}
      text={text}
      fontSize={14}
      fontFamily="Inter, system-ui, sans-serif"
      fontStyle="bold"
      fill={color}
      opacity={opacity}
      shadowColor="rgba(0,0,0,0.8)"
      shadowBlur={4}
      shadowOffsetX={1}
      shadowOffsetY={1}
      listening={false}
    />
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate points along a quadratic bezier curve from (x1,y1) to (x2,y2).
 * The control point is offset perpendicular to the midpoint.
 */
function bezierPoints(x1, y1, x2, y2, steps = 20) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  // Perpendicular offset — 25% of the line length
  const offset = len * 0.25
  const cx = mx - (dy / len) * offset
  const cy = my + (dx / len) * offset

  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2
    pts.push(bx, by)
  }
  return pts
}
