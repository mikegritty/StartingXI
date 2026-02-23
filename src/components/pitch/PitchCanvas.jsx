import { Stage } from 'react-konva'
import { useRef, useState, useEffect } from 'react'
import PitchLines from './PitchLines'
import PlayerLayer from '../players/PlayerLayer'
import { getPitchRect, normToPixel } from '../../utils/positions'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

const TOKEN_RADIUS = 18  // must match PlayerToken.jsx

export default function PitchCanvas() {
  const containerRef = useRef(null)
  const [stageSize, setStageSize]   = useState({ width: 800, height: 600 })
  const [dropTarget, setDropTarget] = useState(null) // starterId being hovered over

  const zoneOverlay       = useBoardStore((s) => s.board.pitch.zoneOverlay)
  const deselectAll       = useBoardStore((s) => s.deselectAll)
  const players           = useBoardStore((s) => s.board.players)
  const substitutePlayer  = useBoardStore((s) => s.substitutePlayer)
  const setSelectedPlayerId = useSettingsStore((s) => s.setSelectedPlayerId)
  const activePhase       = useSettingsStore((s) => s.activePhase)

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

  const handleStageClick = (e) => {
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
    // Only respond if we have a subId being dragged
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
    setDropTarget(null)
  }

  const handleDrop = (e) => {
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

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{ background: '#0f1117' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <PitchLines pitchRect={pitchRect} zoneOverlay={zoneOverlay} />
        <PlayerLayer
          pitchRect={pitchRect}
          activePhase={activePhase}
          dropTargetId={dropTarget}
        />
      </Stage>
    </div>
  )
}
