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

  const zoneOverlay        = useBoardStore((s) => s.board.pitch.zoneOverlay)
  const deselectAll        = useBoardStore((s) => s.deselectAll)
  const players            = useBoardStore((s) => s.board.players)
  const substitutePlayer   = useBoardStore((s) => s.substitutePlayer)
  const setSelectedPlayerId = useSettingsStore((s) => s.setSelectedPlayerId)
  const activePhase        = useSettingsStore((s) => s.activePhase)
  const pendingSubId       = useSettingsStore((s) => s.pendingSubId)
  const setPendingSubId    = useSettingsStore((s) => s.setPendingSubId)

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

  // Combined drop target: HTML5 drag-and-drop (desktop) OR pending touch sub (mobile)
  const effectiveDropTarget = dropTarget

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
        perfectDrawEnabled={false}
        pixelRatio={Math.min(window.devicePixelRatio ?? 1, 2)}
      >
        <PitchLines pitchRect={pitchRect} zoneOverlay={zoneOverlay} />
        <PlayerLayer
          pitchRect={pitchRect}
          activePhase={activePhase}
          dropTargetId={effectiveDropTarget}
          pendingSubMode={!!pendingSubId}
          tokenScale={tokenScale}
        />
      </Stage>

      {/* Mobile substitution mode banner — overlays pitch */}
      {pendingSubId && (
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
