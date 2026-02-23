/**
 * PitchLines — translates the reference SVGs directly to Konva shapes.
 *
 * The SVG files use a HORIZONTAL coordinate system:
 *   Pitch rect: x=6, y=6, width=105, height=68
 *   Long axis (105m) runs LEFT→RIGHT   (x direction)
 *   Short axis (68m)  runs TOP→BOTTOM  (y direction)
 *   Then the whole group is rotated -90° to render vertically.
 *
 * Our Konva canvas is already VERTICAL:
 *   W = 68m axis  (left→right)
 *   H = 105m axis (top→bottom)
 *   HOME end = bottom (y + H),  AWAY end = top (y)
 *
 * Coordinate mapping from SVG source → our canvas:
 *   SVG x position  →  our Y:  svgY_canvas = pitchRect.y + (svgX - 6) / 105 * H
 *   SVG y position  →  our X:  svgX_canvas = pitchRect.x + (svgY - 6) / 68  * W
 *   SVG width       →  our H delta:  (svgWidth  / 105) * H
 *   SVG height      →  our W delta:  (svgHeight / 68)  * W
 *
 * We use two helper functions: svgX→canvasY and svgY→canvasX.
 */

import { Layer, Rect, Line, Circle, Shape, Text } from 'react-konva'

// ── Colours (from SVG) ────────────────────────────────────────────────────────
const C_SURFACE  = '#2d8a4e'   // dark green stripe
const C_ALT      = '#34a058'   // light green stripe
const C_LINE     = '#ffffff'
const C_GOAL     = '#267843'   // goal box fill
const C_ZONE_FILL = 'rgba(255,255,255,0.07)'
const C_ZONE_LINE = 'rgba(255,255,255,0.22)'
const C_ZONE_TEXT = 'rgba(255,255,255,0.55)'

// ── Penalty arc helper (open arc via canvas ctx.arc) ─────────────────────────
function OpenArc({ cx, cy, r, startDeg, endDeg, stroke, sw }) {
  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath()
        ctx.arc(cx, cy, r,
          (startDeg * Math.PI) / 180,
          (endDeg   * Math.PI) / 180,
          false)
        ctx.strokeShape(shape)
      }}
      stroke={stroke} strokeWidth={sw} listening={false}
    />
  )
}

// ── Zone overlays ─────────────────────────────────────────────────────────────

/**
 * Classic stripes — SVG has 12 vertical stripes (width=8.75 each, alternating colours).
 * After -90° rotation they become 12 HORIZONTAL bands.
 * x positions: 6, 14.75, 23.5 … each 8.75 wide → H fraction = 8.75/105
 */
function ClassicStripes({ px, py, W, H }) {
  // SVG stripe x-starts (relative to pitch left=6): 0, 8.75, 17.5, …
  // After rotation → y-starts in our canvas
  const stripeH = (8.75 / 105) * H
  const colors  = [C_SURFACE, C_ALT]
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <Rect key={i}
          x={px} y={py + i * stripeH}
          width={W} height={stripeH}
          fill={colors[i % 2]}
          listening={false}
        />
      ))}
    </>
  )
}

/**
 * 5 Lanes — SVG source (pitch-5-lanes.svg):
 *   4 horizontal lines at SVG y = 19.85, 30.84, 49.16, 60.15
 *   After -90° rotation → 4 VERTICAL lines in our canvas at W positions:
 *     (svgY - 6) / 68 * W
 */
function Zones5({ px, py, W, H }) {
  // Lane divider positions as fraction of W
  const svgYs   = [19.85, 30.84, 49.16, 60.15]
  const xFracs  = svgYs.map(y => (y - 6) / 68)   // [0.2037, 0.3653, 0.6347, 0.7963]
  const labels  = ['Wide', 'Half-space', 'Centre', 'Half-space', 'Wide']

  // Lane boundaries: [0, xFracs[0], xFracs[1], xFracs[2], xFracs[3], 1]
  const bounds = [0, ...xFracs, 1]

  return (
    <>
      {/* Subtle tint on outer lanes (Wide) and centre lane */}
      {bounds.slice(0, -1).map((start, i) => {
        const lx = px + start * W
        const lw = (bounds[i + 1] - start) * W
        return i % 2 === 0 ? (
          <Rect key={`lf${i}`} x={lx} y={py} width={lw} height={H}
            fill={C_ZONE_FILL} listening={false} />
        ) : null
      })}

      {/* Divider lines */}
      {xFracs.map((f, i) => (
        <Line key={`ld${i}`}
          points={[px + f * W, py, px + f * W, py + H]}
          stroke={C_LINE} strokeWidth={0.8} opacity={0.5} listening={false}
        />
      ))}

      {/* Labels centred in each lane */}
      {labels.map((label, i) => {
        const start = bounds[i]
        const end   = bounds[i + 1]
        const lx    = px + start * W
        const lw    = (end - start) * W
        return (
          <Text key={`ll${i}`}
            x={lx} y={py + H / 2 - 7} width={lw}
            text={label}
            fontSize={Math.min(10, lw * 0.16)}
            fill={C_ZONE_TEXT} align="center" listening={false}
          />
        )
      })}
    </>
  )
}

/**
 * 18 Zones — SVG source (pitch-18-zones.svg):
 *
 *   5 vertical lines at SVG x = 23.5, 41, 58.5, 76, 93.5
 *     → after rotation = 5 HORIZONTAL lines in our canvas at H fractions:
 *       (svgX - 6) / 105
 *       = 17.5/105, 35/105, 52.5/105, 70/105, 87.5/105
 *
 *   2 horizontal lines at SVG y = 28.6667, 51.3333
 *     → after rotation = 2 VERTICAL lines in our canvas at W fractions:
 *       (svgY - 6) / 68
 *       = 22.6667/68, 45.3333/68   (≈ 1/3, ≈ 2/3)
 *
 *   Zone text centres (SVG x, SVG y) → our (canvasY, canvasX):
 *     SVG text x values (column centres): 14.75, 32.25, 49.75, 67.25, 84.75, 102.25
 *     SVG text y values (row centres):    17.333, 40, 62.667
 *     Zone numbers go column-by-column: col0→1,2,3  col1→4,5,6 … col5→16,17,18
 */
function Zones18({ px, py, W, H }) {
  // Horizontal dividers (H fractions)
  const hSvgX  = [23.5, 41, 58.5, 76, 93.5]
  const hFracs = hSvgX.map(x => (x - 6) / 105)

  // Vertical dividers (W fractions)
  const vSvgY  = [28.6667, 51.3333]
  const vFracs = vSvgY.map(y => (y - 6) / 68)

  // Row and column boundaries
  const rowBounds = [0, ...hFracs, 1]   // 7 values → 6 rows
  const colBounds = [0, ...vFracs, 1]   // 4 values → 3 cols

  // Zone text centres: SVG col-centre x values and row-centre y values
  const colCentreX = [14.75, 32.25, 49.75, 67.25, 84.75, 102.25]
  const rowCentreY = [17.3333, 40, 62.6667]

  return (
    <>
      {/* Zone divider lines — horizontal */}
      {hFracs.map((f, i) => (
        <Line key={`zh${i}`}
          points={[px, py + f * H, px + W, py + f * H]}
          stroke={C_LINE} strokeWidth={0.6} opacity={0.55}
          dash={[3, 2.4]} listening={false}
        />
      ))}

      {/* Zone divider lines — vertical */}
      {vFracs.map((f, i) => (
        <Line key={`zv${i}`}
          points={[px + f * W, py, px + f * W, py + H]}
          stroke={C_LINE} strokeWidth={0.6} opacity={0.55}
          dash={[3, 2.4]} listening={false}
        />
      ))}

      {/* Zone numbers 1–18
          SVG: text at (colCentreX[c], rowCentreY[r]) maps to canvas (canvasX, canvasY)
          canvasX = px + (svgY - 6) / 68 * W
          canvasY = py + (svgX - 6) / 105 * H
          Numbered column-first in SVG: zone = c*3 + r + 1  (c=0..5, r=0..2)
      */}
      {colCentreX.map((svgX, c) =>
        rowCentreY.map((svgY, r) => {
          const zoneNum = (5 - c) * 3 + r + 1
          const canvasX = px + ((svgY - 6) / 68) * W
          const canvasY = py + ((svgX - 6) / 105) * H
          return (
            <Text key={`zn${c}-${r}`}
              x={canvasX - 8} y={canvasY - 6}
              width={16}
              text={String(zoneNum)}
              fontSize={Math.min(9, W * 0.055)}
              fontStyle="bold"
              fill={C_ZONE_TEXT} align="center" listening={false}
            />
          )
        })
      )}
    </>
  )
}

/**
 * Thirds — SVG source (pitch-thirds.svg):
 *   2 vertical lines at SVG x = 41, 76
 *     → after rotation = 2 HORIZONTAL lines at H fractions:
 *       (41-6)/105 = 35/105 = 1/3
 *       (76-6)/105 = 70/105 = 2/3
 *   Middle third gets rgba(255,255,255,0.10) fill (from SVG).
 */
function Thirds({ px, py, W, H }) {
  const d1 = (35 / 105) * H
  const d2 = (70 / 105) * H
  const labels = ['Attacking Third', 'Middle Third', 'Defensive Third']

  return (
    <>
      {/* Middle third tint — SVG uses rgba(255,255,255,0.10) */}
      <Rect x={px} y={py + d1} width={W} height={d2 - d1}
        fill="rgba(255,255,255,0.10)" listening={false} />

      {/* Divider lines */}
      <Line points={[px, py + d1, px + W, py + d1]}
        stroke={C_LINE} strokeWidth={0.6} opacity={0.5} listening={false} />
      <Line points={[px, py + d2, px + W, py + d2]}
        stroke={C_LINE} strokeWidth={0.6} opacity={0.5} listening={false} />

      {/* Labels */}
      {[0, d1, d2].map((offset, i) => (
        <Text key={i}
          x={px + W * 0.02} y={py + offset + 4}
          text={labels[i]}
          fontSize={Math.min(10, H * 0.025)}
          fill={C_ZONE_TEXT} listening={false}
        />
      ))}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PitchLines({ pitchRect, zoneOverlay = 'none' }) {
  const { x: px, y: py, width: W, height: H } = pitchRect

  // Line width scales with pitch size
  const sw = Math.max(1, W * 0.0042)

  /**
   * SVG→canvas coordinate helpers.
   * SVG source pitch: x ∈ [6, 111], y ∈ [6, 74]
   *
   * svgX (along 105m axis) → our canvasY
   * svgY (along  68m axis) → our canvasX
   */
  const canvasY = svgX => py + ((svgX - 6) / 105) * H
  const canvasX = svgY => px + ((svgY - 6) / 68)  * W
  const dH      = svgW => (svgW / 105) * H   // SVG width  → H delta
  const dW      = svgH => (svgH / 68)  * W   // SVG height → W delta

  // Centre of pitch (SVG: x=58.5, y=40)
  const cx = canvasX(40)    // px + W/2
  const cy = canvasY(58.5)  // py + H/2

  // ── Pitch markings translated from pitch.svg ───────────────────────────────
  //
  // HOME end = SVG x=6 side  → bottom of our canvas (py + H)
  // AWAY end = SVG x=111 side → top of our canvas (py)
  //
  // Penalty area LEFT (HOME):  SVG rect x=6,  y=19.85, w=16.5, h=40.3
  //   → canvasY(6)=py+H, top=canvasY(6+16.5)=canvasY(22.5)=py+H-dH(16.5)
  //   → left=canvasX(19.85), right=canvasX(19.85+40.3)=canvasX(60.15)
  //   But since we go top-down: y_top = py + H - dH(16.5), height = dH(16.5)
  //
  // Goal LEFT (HOME): SVG rect x=4, y=36.34, w=2, h=7.32
  //   x=4 is 2 units to the LEFT of x=6 (goal line) → extends BELOW py+H
  //   canvasY(4) = py + H + dH(2) [outside the pitch, below goal line]
  //
  // Penalty arc LEFT (HOME):
  //   SVG: M 22.5 32.687 A 9.15 9.15 0 0 1 22.5 47.312
  //   Centre: (cx=17, cy=40) in SVG = our (canvasX(40), canvasY(17)) = (px+W/2, py+H-dH(11))
  //   Radius: 9.15 in SVG y-units → dW(9.15) pixels
  //   In our canvas (after -90° rotation), the arc bulges UPWARD (toward centre).
  //   The arc goes from canvasY(22.5) upward. In canvas angle convention:
  //     start: 233°, end: 307°  (upper semicircle)
  //
  // Corner arcs: SVG "M 7 6 A 1 1 0 0 1 6 7" — 1m radius at each corner.
  //   After rotation, r = dW(1) pixels, centred exactly at each canvas corner.

  // Penalty area
  const penH = dH(16.5)
  const penW = dW(40.3)

  // Goal area (6-yard box)
  const goalAreaH = dH(5.5)
  const goalAreaW = dW(18.32)

  // Goal mouth
  const goalMouthW = dW(7.32)
  const goalDepthH = dH(2)

  // Penalty spot distance from goal line
  const penSpotDist = dH(11)

  // Penalty arc radius (SVG uses y-units = 68m axis = W axis)
  const penArcR = dW(9.15)

  // Centre circle radius
  const centreR = dW(9.15)

  // Corner arc radius
  const cornerR = dW(1)

  return (
    <Layer listening={false}>

      {/* ── Base surface (solid, stripes are the Classic overlay) ─────────── */}
      <Rect x={px} y={py} width={W} height={H} fill={C_SURFACE} listening={false} />

      {/* ── Zone overlay (drawn before pitch lines) ───────────────────────── */}
      {zoneOverlay === 'classic' && <ClassicStripes px={px} py={py} W={W} H={H} />}
      {zoneOverlay === 'zones5'  && <Zones5  px={px} py={py} W={W} H={H} />}
      {zoneOverlay === 'zones18' && <Zones18 px={px} py={py} W={W} H={H} />}
      {zoneOverlay === 'thirds'  && <Thirds  px={px} py={py} W={W} H={H} />}

      {/* ── Outer boundary: SVG rect x=6 y=6 w=105 h=68 ─────────────────── */}
      <Rect x={px} y={py} width={W} height={H}
        stroke={C_LINE} strokeWidth={sw * 1.4} fill="transparent" listening={false} />

      {/* ── Halfway line: SVG line x1=58.5 y1=6 x2=58.5 y2=74 ───────────── */}
      {/* In SVG space this is a vertical line at x=58.5 (centre).
          After -90° rotation → horizontal line at our cy */}
      <Line points={[px, cy, px + W, cy]}
        stroke={C_LINE} strokeWidth={sw} listening={false} />

      {/* ── Centre circle: SVG circle cx=58.5 cy=40 r=9.15 ──────────────── */}
      <Circle x={cx} y={cy} radius={centreR}
        stroke={C_LINE} strokeWidth={sw} fill="transparent" listening={false} />

      {/* ── Centre spot: SVG circle cx=58.5 cy=40 r=0.4 ─────────────────── */}
      <Circle x={cx} y={cy} radius={Math.max(2.5, sw * 1.4)}
        fill={C_LINE} listening={false} />

      {/* ══════════════════════════════════════════════════════════════════════
          HOME END — SVG left side (x=6), our BOTTOM (py + H)
          ══════════════════════════════════════════════════════════════════════ */}

      {/* Penalty area: SVG rect x=6 y=19.85 w=16.5 h=40.3 */}
      <Rect
        x={cx - penW / 2}
        y={py + H - penH}
        width={penW} height={penH}
        stroke={C_LINE} strokeWidth={sw} fill="transparent" listening={false}
      />

      {/* Goal area: SVG rect x=6 y=30.84 w=5.5 h=18.32 */}
      <Rect
        x={cx - goalAreaW / 2}
        y={py + H - goalAreaH}
        width={goalAreaW} height={goalAreaH}
        stroke={C_LINE} strokeWidth={sw} fill="transparent" listening={false}
      />

      {/* Penalty spot: SVG circle cx=17 cy=40 r=0.4  →  dist from x=6 = 11 */}
      <Circle
        x={cx} y={py + H - penSpotDist}
        radius={Math.max(2, sw * 1.2)} fill={C_LINE} listening={false}
      />

      {/* Penalty arc (D): SVG "M 22.5 32.687 A 9.15 9.15 0 0 1 22.5 47.312"
          Centre of arc = penalty spot = (cx, py+H-penSpotDist)
          In our canvas the arc bulges UPWARD (toward centre circle)
          Angle derivation: SVG centre=(17,40), endpoints at x=22.5
            atan2(-7.313, 5.5) = 306.9° → after -90° rotation = 216.9°
            atan2( 7.312, 5.5) =  53.1° → after -90° rotation = -36.9° = 323.1°
          Angles: 217° → 323° */}
      <OpenArc
        cx={cx} cy={py + H - penSpotDist}
        r={penArcR}
        startDeg={217} endDeg={323}
        stroke={C_LINE} sw={sw}
      />

      {/* Goal mouth: SVG rect x=4 y=36.34 w=2 h=7.32
          x=4 is 2 units LEFT of goal line (x=6) → extends BELOW py+H */}
      <Rect
        x={cx - goalMouthW / 2}
        y={py + H}
        width={goalMouthW} height={goalDepthH}
        stroke={C_LINE} strokeWidth={sw * 0.85} fill={C_GOAL} listening={false}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          AWAY END — SVG right side (x=111), our TOP (py)
          ══════════════════════════════════════════════════════════════════════ */}

      {/* Penalty area: SVG rect x=94.5 y=19.85 w=16.5 h=40.3 */}
      <Rect
        x={cx - penW / 2}
        y={py}
        width={penW} height={penH}
        stroke={C_LINE} strokeWidth={sw} fill="transparent" listening={false}
      />

      {/* Goal area: SVG rect x=105.5 y=30.84 w=5.5 h=18.32 */}
      <Rect
        x={cx - goalAreaW / 2}
        y={py}
        width={goalAreaW} height={goalAreaH}
        stroke={C_LINE} strokeWidth={sw} fill="transparent" listening={false}
      />

      {/* Penalty spot: SVG circle cx=100 cy=40  →  dist from x=111 = 11 */}
      <Circle
        x={cx} y={py + penSpotDist}
        radius={Math.max(2, sw * 1.2)} fill={C_LINE} listening={false}
      />

      {/* Penalty arc (D): SVG "M 94.5 47.312 A 9.15 9.15 0 0 1 94.5 32.687"
          Bulges DOWNWARD (toward centre circle) in our canvas
          Angle derivation: SVG centre=(100,40), endpoints at x=94.5
            atan2( 7.312, -5.5) = 126.9° → after -90° rotation =  36.9°
            atan2(-7.313, -5.5) = 233.1° → after -90° rotation = 143.1°
          Angles: 37° → 143° */}
      <OpenArc
        cx={cx} cy={py + penSpotDist}
        r={penArcR}
        startDeg={37} endDeg={143}
        stroke={C_LINE} sw={sw}
      />

      {/* Goal mouth: SVG rect x=111 y=36.34 w=2 h=7.32
          x=111 is the goal line, rect extends to x=113 (outside pitch) → above py */}
      <Rect
        x={cx - goalMouthW / 2}
        y={py - goalDepthH}
        width={goalMouthW} height={goalDepthH}
        stroke={C_LINE} strokeWidth={sw * 0.85} fill={C_GOAL} listening={false}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          CORNER ARCS — SVG r=1, one at each corner
          SVG paths (pre-rotation):
            Top-left:     "M 7 6 A 1 1 0 0 1 6 7"        → our top-left     (px, py)
            Top-right:    "M 111 7 A 1 1 0 0 1 110 6"    → our top-right    (px+W, py)
            Bottom-left:  "M 6 73 A 1 1 0 0 1 7 74"      → our bottom-left  (px, py+H)
            Bottom-right: "M 110 74 A 1 1 0 0 1 111 73"  → our bottom-right (px+W, py+H)
          After -90° rotation the arcs curve INTO the pitch:
            top-left:     0° → 90°
            top-right:    90° → 180°
            bottom-left:  270° → 360°
            bottom-right: 180° → 270°
          ══════════════════════════════════════════════════════════════════════ */}

      <OpenArc cx={px}     cy={py}      r={cornerR} startDeg={0}   endDeg={90}
        stroke={C_LINE} sw={sw} />
      <OpenArc cx={px + W} cy={py}      r={cornerR} startDeg={90}  endDeg={180}
        stroke={C_LINE} sw={sw} />
      <OpenArc cx={px}     cy={py + H}  r={cornerR} startDeg={270} endDeg={360}
        stroke={C_LINE} sw={sw} />
      <OpenArc cx={px + W} cy={py + H}  r={cornerR} startDeg={180} endDeg={270}
        stroke={C_LINE} sw={sw} />

    </Layer>
  )
}
