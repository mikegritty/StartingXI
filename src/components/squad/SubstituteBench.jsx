import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../store/boardStore'

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

export default function SubstituteBench() {
  const players   = useBoardStore(useShallow((s) => s.board.players))
  const homeColor = useBoardStore((s) => s.board.teams.home.primaryColor)
  const subs      = players.filter((p) => p.team === 'home' && p.isStarter === false)

  if (subs.length === 0) return null

  const numColor = contrastColor(homeColor)

  return (
    <div className="w-24 shrink-0 border-l border-border bg-panel flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">
          Bench
        </p>
        <p className="text-[10px] text-text-muted">{subs.length} subs</p>
      </div>

      {/* Sub cards */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
        {subs.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-1.5 py-1.5 px-1 rounded-md hover:bg-white/[0.04] transition-colors"
          >
            {/* Number circle */}
            <div
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold leading-none"
              style={{ backgroundColor: homeColor, color: numColor }}
            >
              {player.number || '?'}
            </div>

            {/* Position + name */}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wide truncate leading-tight">
                {player.position || player.role || '—'}
              </p>
              <p className="text-[10px] text-text-primary truncate leading-tight">
                {player.name || '—'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
