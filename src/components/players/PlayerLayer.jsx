import { Layer } from 'react-konva'
import { useBoardStore } from '../../store/boardStore'
import PlayerToken from './PlayerToken'

export default function PlayerLayer({ pitchRect, activePhase, dropTargetId }) {
  const players = useBoardStore((s) => s.board.players)

  // Only render starters on the pitch canvas — subs appear in the right panel
  const starters = players.filter((p) => p.isStarter !== false)

  return (
    <Layer>
      {starters.map((player) => {
        // Show the phase for this player's team
        const phase = activePhase?.[player.team] ?? 'in'
        return (
          <PlayerToken
            key={player.id}
            player={player}
            pitchRect={pitchRect}
            phase={phase}
            isDropTarget={player.id === dropTargetId}
          />
        )
      })}
    </Layer>
  )
}
