import { Group, Circle, Text, Rect, RegularPolygon } from 'react-konva'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'
import { normToPixel, pixelToNorm, clampNorm } from '../../utils/positions'

const TOKEN_RADIUS = 18  // 36px diameter

/**
 * Compute a contrasting text colour (black or white) for a given hex background.
 * Uses W3C luminance formula.
 */
function contrastColor(hex) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.55 ? '#111111' : '#ffffff'
  } catch {
    return '#ffffff'
  }
}

export default function PlayerToken({ player, pitchRect, phase, isDropTarget }) {
  const { id, team, role, selected } = player

  // Pull position from the correct phase
  const nx = player[`x_${phase}`] ?? player.x
  const ny = player[`y_${phase}`] ?? player.y
  const number = player.number
  const name   = player.name

  const movePlayer    = useBoardStore((s) => s.movePlayer)
  const removePlayer  = useBoardStore((s) => s.removePlayer)
  const selectPlayer  = useBoardStore((s) => s.selectPlayer)
  const homeColor     = useBoardStore((s) => s.board.teams.home.primaryColor)
  const awayColor     = useBoardStore((s) => s.board.teams.away.primaryColor)
  const showNames     = useSettingsStore((s) => s.showPlayerNames)
  const setSelectedId = useSettingsStore((s) => s.setSelectedPlayerId)

  const { px, py } = normToPixel(nx, ny, pitchRect)

  const isHome = team === 'home'
  const isGK   = role === 'GK'

  const GK_COLOR  = '#f59e0b'
  const fillColor = isGK ? GK_COLOR : (isHome ? homeColor : awayColor)
  const numColor  = contrastColor(fillColor)

  const handleDragEnd = (e) => {
    const node = e.target
    const { nx: newNx, ny: newNy } = pixelToNorm(node.x(), node.y(), pitchRect)
    movePlayer(id, clampNorm(newNx), clampNorm(newNy), phase)
  }

  const handleClick = (e) => {
    e.cancelBubble = true
    selectPlayer(id)
    setSelectedId(id)
  }

  const handleContextMenu = (e) => {
    e.evt.preventDefault()
    e.cancelBubble = true
    removePlayer(id)
    setSelectedId(null)
  }

  const handleDragStart = (e) => {
    e.target.moveToTop()
  }

  return (
    <Group
      x={px}
      y={py}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Invisible hit area — ensures drag works even when inner shapes have listening=false */}
      <Circle radius={TOKEN_RADIUS + 4} fill="transparent" />

      {/* Drop target highlight ring */}
      {isDropTarget && (
        <Circle
          radius={TOKEN_RADIUS + 9}
          stroke="#22d3ee"
          strokeWidth={3}
          fill="rgba(34,211,238,0.15)"
          listening={false}
        />
      )}

      {/* Selection ring */}
      {selected && (
        <Circle
          radius={TOKEN_RADIUS + 6}
          stroke="#ffffff"
          strokeWidth={2.5}
          fill="transparent"
          listening={false}
        />
      )}

      {/* Drop shadow (offset, listening=false, drawn before body) */}
      <Circle
        radius={TOKEN_RADIUS - 1}
        fill="rgba(0,0,0,0.4)"
        offsetX={-2}
        offsetY={-3}
        listening={false}
      />

      {/* Token body — circle for all players (GK distinguished by amber colour) */}
      <Circle
        radius={TOKEN_RADIUS}
        fill={fillColor}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1.5}
        listening={false}
      />

      {/* Jersey number */}
      <Text
        text={String(number)}
        fontSize={13}
        fontStyle="bold"
        fontFamily="Inter, system-ui, sans-serif"
        fill={numColor}
        width={TOKEN_RADIUS * 2}
        align="center"
        x={-TOKEN_RADIUS}
        y={-7}
        listening={false}
      />

      {/* Name label with dark pill background */}
      {showNames && name && (
        <>
          <Rect
            x={-42}
            y={TOKEN_RADIUS + 3}
            width={84}
            height={14}
            cornerRadius={3}
            fill="rgba(0,0,0,0.55)"
            listening={false}
          />
          <Text
            text={name}
            fontSize={9.5}
            fontFamily="Inter, system-ui, sans-serif"
            fill="#ffffff"
            width={84}
            align="center"
            x={-42}
            y={TOKEN_RADIUS + 5}
            listening={false}
          />
        </>
      )}
    </Group>
  )
}
