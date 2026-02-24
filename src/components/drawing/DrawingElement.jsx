import { Arrow, Line, Rect, Circle, Text, Group } from 'react-konva'
import { normToPixel, clampNorm } from '../../utils/positions'

// Handle size constants
const HANDLE_R   = 7   // px — endpoint/corner handle radius
const BALL_R     = 5   // px — ball indicator radius
const DEL_R      = 10  // px — delete badge radius

/**
 * DrawingElement — renders a single stored drawing object on a Konva Layer.
 *
 * Supported types: pass, run, dribble, zone, highlight, free, text
 *
 * @param {object}   drawing    - drawing object from boardStore
 * @param {object}   pitchRect  - pixel rect of pitch { x, y, width, height }
 * @param {number}   [opacity=1]
 * @param {boolean}  [selected=false]
 * @param {boolean}  [readOnly=false]
 * @param {function} [onSelect]   - () => void — called on tap/click
 * @param {function} [onDelete]   - () => void
 * @param {function} [onUpdate]   - (patch) => void — patch: { x1,y1,x2,y2 } normalized
 */
export default function DrawingElement({
  drawing,
  pitchRect,
  opacity = 1,
  selected = false,
  readOnly = false,
  onSelect,
  onDelete,
  onUpdate,
}) {
  const { type, color } = drawing
  const sharedProps = { selected, readOnly, onSelect, onDelete, onUpdate, pitchRect, opacity }

  if (type === 'pass') {
    return <ArrowDrawing drawing={drawing} dashed={false} curved={false} color={color} {...sharedProps} />
  }
  if (type === 'run') {
    return <ArrowDrawing drawing={drawing} dashed={false} curved={true} color={color} {...sharedProps} />
  }
  if (type === 'dribble') {
    return <ArrowDrawing drawing={drawing} dashed={true} curved={false} color={color} {...sharedProps} />
  }
  if (type === 'zone') {
    return <ZoneDrawing drawing={drawing} color={color} {...sharedProps} />
  }
  if (type === 'highlight') {
    return <HighlightDrawing drawing={drawing} color={color} {...sharedProps} />
  }
  if (type === 'free') {
    return <FreeDrawing drawing={drawing} color={color} {...sharedProps} />
  }
  if (type === 'text') {
    return <TextDrawing drawing={drawing} color={color} {...sharedProps} />
  }
  return null
}

// ── Arrow (pass / run / dribble) ─────────────────────────────────────────────

function ArrowDrawing({ drawing, pitchRect, dashed, curved, color, opacity, selected, readOnly, onSelect, onDelete, onUpdate }) {
  const { x1, y1, x2, y2 } = drawing
  const p1 = normToPixel(x1, y1, pitchRect)
  const p2 = normToPixel(x2, y2, pitchRect)

  const handleDragMove = (handle, e) => {
    if (!onUpdate) return
    const stage = e.target.getStage()
    const pos   = stage.getPointerPosition()
    if (!pos) return
    const nx = clampNorm((pos.x - pitchRect.x) / pitchRect.width)
    const ny = clampNorm((pos.y - pitchRect.y) / pitchRect.height)
    if (handle === 'tail') onUpdate({ x1: nx, y1: ny })
    else                   onUpdate({ x2: nx, y2: ny })
  }

  // Delete badge position — above the midpoint of the arrow
  const mx = (p1.px + p2.px) / 2
  const my = (p1.py + p2.py) / 2 - 18

  const shapeListening = !readOnly

  if (curved) {
    const pts = bezierPoints(p1.px, p1.py, p2.px, p2.py, 20)
    const last4 = pts.slice(-4)
    return (
      <Group>
        {/* Invisible wide hit area for easier tapping */}
        {!readOnly && (
          <Line
            points={pts}
            stroke="transparent"
            strokeWidth={20}
            tension={0}
            onClick={onSelect}
            onTap={onSelect}
            listening={shapeListening}
          />
        )}
        <Line
          points={pts}
          stroke={selected ? '#60a5fa' : color}
          strokeWidth={2.5}
          opacity={opacity}
          tension={0}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
        <Arrow
          points={last4}
          pointerLength={10}
          pointerWidth={8}
          fill={selected ? '#60a5fa' : color}
          stroke={selected ? '#60a5fa' : color}
          strokeWidth={2.5}
          opacity={opacity}
          listening={false}
        />
        {/* Ball indicator at start */}
        <BallDot x={p1.px} y={p1.py} />
        {/* Selection handles */}
        {selected && !readOnly && (
          <>
            <EndpointHandle x={p1.px} y={p1.py} onDragMove={(e) => handleDragMove('tail', e)} />
            <EndpointHandle x={p2.px} y={p2.py} onDragMove={(e) => handleDragMove('head', e)} />
            <DeleteBadge x={mx} y={my} onDelete={onDelete} />
          </>
        )}
      </Group>
    )
  }

  const dashPattern = dashed ? [8, 5] : []

  return (
    <Group>
      {/* Invisible wide hit area */}
      {!readOnly && (
        <Line
          points={[p1.px, p1.py, p2.px, p2.py]}
          stroke="transparent"
          strokeWidth={20}
          onClick={onSelect}
          onTap={onSelect}
          listening={shapeListening}
        />
      )}
      <Arrow
        points={[p1.px, p1.py, p2.px, p2.py]}
        stroke={selected ? '#60a5fa' : color}
        strokeWidth={2.5}
        pointerLength={10}
        pointerWidth={8}
        fill={selected ? '#60a5fa' : color}
        opacity={opacity}
        dash={dashPattern}
        lineCap="round"
        listening={false}
      />
      {/* Ball indicator at start */}
      <BallDot x={p1.px} y={p1.py} />
      {/* Selection handles + delete */}
      {selected && !readOnly && (
        <>
          <EndpointHandle x={p1.px} y={p1.py} onDragMove={(e) => handleDragMove('tail', e)} />
          <EndpointHandle x={p2.px} y={p2.py} onDragMove={(e) => handleDragMove('head', e)} />
          <DeleteBadge x={mx} y={my} onDelete={onDelete} />
        </>
      )}
    </Group>
  )
}

// ── Zone (rectangle) ──────────────────────────────────────────────────────────

function ZoneDrawing({ drawing, pitchRect, color, opacity, selected, readOnly, onSelect, onDelete, onUpdate }) {
  const { x1, y1, x2, y2 } = drawing
  const p1 = normToPixel(x1, y1, pitchRect)
  const p2 = normToPixel(x2, y2, pitchRect)
  const rx = Math.min(p1.px, p2.px)
  const ry = Math.min(p1.py, p2.py)
  const rw = Math.abs(p2.px - p1.px)
  const rh = Math.abs(p2.py - p1.py)

  const handleCornerDrag = (corner, e) => {
    if (!onUpdate) return
    const stage = e.target.getStage()
    const pos   = stage.getPointerPosition()
    if (!pos) return
    const nx = clampNorm((pos.x - pitchRect.x) / pitchRect.width)
    const ny = clampNorm((pos.y - pitchRect.y) / pitchRect.height)
    // Each corner drags either x1/y1 or x2/y2 (whichever is the "moving" corner)
    if (corner === 'tl') onUpdate({ x1: nx, y1: ny })
    else if (corner === 'tr') onUpdate({ x2: nx, y1: ny })
    else if (corner === 'bl') onUpdate({ x1: nx, y2: ny })
    else if (corner === 'br') onUpdate({ x2: nx, y2: ny })
  }

  // Corners of the rect (actual stored corners)
  const corners = [
    { id: 'tl', cx: Math.min(p1.px, p2.px), cy: Math.min(p1.py, p2.py) },
    { id: 'tr', cx: Math.max(p1.px, p2.px), cy: Math.min(p1.py, p2.py) },
    { id: 'bl', cx: Math.min(p1.px, p2.px), cy: Math.max(p1.py, p2.py) },
    { id: 'br', cx: Math.max(p1.px, p2.px), cy: Math.max(p1.py, p2.py) },
  ]

  return (
    <Group>
      <Rect
        x={rx}
        y={ry}
        width={rw}
        height={rh}
        stroke={selected ? '#60a5fa' : color}
        strokeWidth={selected ? 2.5 : 2}
        fill={color}
        opacity={opacity * 0.25}
        cornerRadius={3}
        onClick={onSelect}
        onTap={onSelect}
        listening={!readOnly}
      />
      {selected && !readOnly && (
        <>
          {corners.map((c) => (
            <EndpointHandle key={c.id} x={c.cx} y={c.cy} onDragMove={(e) => handleCornerDrag(c.id, e)} />
          ))}
          <DeleteBadge x={rx + rw / 2} y={ry - 18} onDelete={onDelete} />
        </>
      )}
    </Group>
  )
}

// ── Highlight (ellipse) ──────────────────────────────────────────────────────

function HighlightDrawing({ drawing, pitchRect, color, opacity, selected, readOnly, onSelect, onDelete, onUpdate }) {
  const { x1, y1, x2, y2 } = drawing
  const p1 = normToPixel(x1, y1, pitchRect)
  const p2 = normToPixel(x2, y2, pitchRect)
  const cx = (p1.px + p2.px) / 2
  const cy = (p1.py + p2.py) / 2
  const rx = Math.abs(p2.px - p1.px) / 2
  const ry = Math.abs(p2.py - p1.py) / 2

  const handleCornerDrag = (corner, e) => {
    if (!onUpdate) return
    const stage = e.target.getStage()
    const pos   = stage.getPointerPosition()
    if (!pos) return
    const nx = clampNorm((pos.x - pitchRect.x) / pitchRect.width)
    const ny = clampNorm((pos.y - pitchRect.y) / pitchRect.height)
    if (corner === 'tl') onUpdate({ x1: nx, y1: ny })
    else if (corner === 'tr') onUpdate({ x2: nx, y1: ny })
    else if (corner === 'bl') onUpdate({ x1: nx, y2: ny })
    else if (corner === 'br') onUpdate({ x2: nx, y2: ny })
  }

  const corners = [
    { id: 'tl', cx: Math.min(p1.px, p2.px), cy: Math.min(p1.py, p2.py) },
    { id: 'tr', cx: Math.max(p1.px, p2.px), cy: Math.min(p1.py, p2.py) },
    { id: 'bl', cx: Math.min(p1.px, p2.px), cy: Math.max(p1.py, p2.py) },
    { id: 'br', cx: Math.max(p1.px, p2.px), cy: Math.max(p1.py, p2.py) },
  ]

  return (
    <Group>
      <Circle
        x={cx}
        y={cy}
        radius={Math.max(rx, ry) || 10}
        scaleX={rx > 0 && ry > 0 ? rx / Math.max(rx, ry) : 1}
        scaleY={ry > 0 && rx > 0 ? ry / Math.max(rx, ry) : 1}
        stroke={selected ? '#60a5fa' : color}
        strokeWidth={selected ? 2.5 : 2}
        fill={color}
        opacity={opacity * 0.2}
        onClick={onSelect}
        onTap={onSelect}
        listening={!readOnly}
      />
      {selected && !readOnly && (
        <>
          {corners.map((c) => (
            <EndpointHandle key={c.id} x={c.cx} y={c.cy} onDragMove={(e) => handleCornerDrag(c.id, e)} />
          ))}
          <DeleteBadge x={cx} y={Math.min(p1.py, p2.py) - 18} onDelete={onDelete} />
        </>
      )}
    </Group>
  )
}

// ── Freehand line ─────────────────────────────────────────────────────────────

function FreeDrawing({ drawing, pitchRect, color, opacity, selected, readOnly, onSelect, onDelete }) {
  const pixelPoints = []
  const pts = drawing.points
  for (let i = 0; i < pts.length; i += 2) {
    const { px, py } = normToPixel(pts[i], pts[i + 1], pitchRect)
    pixelPoints.push(px, py)
  }

  // Midpoint for delete badge
  const mid = Math.floor(pixelPoints.length / 4) * 2
  const bx = pixelPoints[mid] ?? (pixelPoints[0] ?? 0)
  const by = (pixelPoints[mid + 1] ?? (pixelPoints[1] ?? 0)) - 18

  return (
    <Group>
      {/* Wide hit area */}
      {!readOnly && (
        <Line
          points={pixelPoints}
          stroke="transparent"
          strokeWidth={20}
          tension={0.4}
          onClick={onSelect}
          onTap={onSelect}
        />
      )}
      <Line
        points={pixelPoints}
        stroke={selected ? '#60a5fa' : color}
        strokeWidth={2.5}
        opacity={opacity}
        tension={0.4}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      {selected && !readOnly && (
        <DeleteBadge x={bx} y={by} onDelete={onDelete} />
      )}
    </Group>
  )
}

// ── Text annotation ───────────────────────────────────────────────────────────

function TextDrawing({ drawing, pitchRect, color, opacity, selected, readOnly, onSelect, onDelete }) {
  const { nx, ny, text } = drawing
  const { px, py } = normToPixel(nx, ny, pitchRect)

  return (
    <Group>
      {/* Invisible background hit area */}
      {!readOnly && (
        <Rect
          x={px - 4}
          y={py - 4}
          width={Math.max(60, text.length * 8)}
          height={22}
          fill="transparent"
          onClick={onSelect}
          onTap={onSelect}
        />
      )}
      {selected && !readOnly && (
        <Rect
          x={px - 4}
          y={py - 4}
          width={Math.max(60, text.length * 8)}
          height={22}
          fill="rgba(96,165,250,0.12)"
          stroke="#60a5fa"
          strokeWidth={1}
          cornerRadius={3}
          listening={false}
        />
      )}
      <Text
        x={px}
        y={py}
        text={text}
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="bold"
        fill={selected ? '#60a5fa' : color}
        opacity={opacity}
        shadowColor="rgba(0,0,0,0.8)"
        shadowBlur={4}
        shadowOffsetX={1}
        shadowOffsetY={1}
        listening={false}
      />
      {selected && !readOnly && (
        <DeleteBadge x={px + Math.max(60, text.length * 8) / 2} y={py - 18} onDelete={onDelete} />
      )}
    </Group>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

/**
 * Draggable endpoint handle shown on selected drawings.
 * White circle with blue border — draggable to reposition endpoints.
 *
 * The handle drags freely in Konva for smooth visual feedback.
 * onDragMove streams live updates to the store (arrow redraws in real time),
 * and onDragEnd finalizes. We pass the Konva node's current position so the
 * arrow body follows the handle during drag without jitter.
 */
function EndpointHandle({ x, y, onDragMove }) {
  return (
    <Circle
      x={x}
      y={y}
      radius={HANDLE_R}
      fill="white"
      stroke="#60a5fa"
      strokeWidth={2}
      draggable
      onDragMove={onDragMove}
      onDragEnd={onDragMove}
      onDragStart={(e) => { e.cancelBubble = true }}
      shadowColor="rgba(0,0,0,0.5)"
      shadowBlur={4}
      hitStrokeWidth={8}
    />
  )
}

/**
 * Small ⚽ ball dot shown at the start (x1,y1) of arrow drawings.
 * White circle with thin dark border — indicates "ball starts here".
 */
function BallDot({ x, y }) {
  return (
    <Circle
      x={x}
      y={y}
      radius={BALL_R}
      fill="white"
      stroke="rgba(0,0,0,0.6)"
      strokeWidth={1}
      listening={false}
    />
  )
}

/**
 * Delete badge — red circle with ✕, shown on selected drawings.
 */
function DeleteBadge({ x, y, onDelete }) {
  const handleClick = (e) => {
    e.cancelBubble = true
    onDelete?.()
  }
  return (
    <Group x={x} y={y} onClick={handleClick} onTap={handleClick}>
      <Circle
        radius={DEL_R}
        fill="#ef4444"
        shadowColor="rgba(0,0,0,0.6)"
        shadowBlur={4}
      />
      <Text
        text="✕"
        fontSize={9}
        fontStyle="bold"
        fill="white"
        offsetX={4}
        offsetY={4}
        listening={false}
      />
    </Group>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate points along a quadratic bezier curve from (x1,y1) to (x2,y2).
 */
function bezierPoints(x1, y1, x2, y2, steps = 20) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const offset = len * 0.25
  const cx = mx - (dy / len) * offset
  const cy = my + (dx / len) * offset

  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t  = i / steps
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2
    pts.push(bx, by)
  }
  return pts
}
