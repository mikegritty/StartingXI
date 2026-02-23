import { Layer } from 'react-konva'
import { useBoardStore } from '../../store/boardStore'
import { useShallow } from 'zustand/react/shallow'
import PlayerToken from './PlayerToken'

export default function PlayerLayer({ pitchRect, activePhase, dropTargetId, pendingSubMode, tokenScale }) {
  // useShallow prevents re-renders when unrelated store state changes — the array reference
  // returned by a plain selector changes every render even if contents are identical
  const players = useBoardStore(useShallow((s) => s.board.players))

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
            pendingSubMode={pendingSubMode}
            tokenScale={tokenScale ?? 1}
          />
        )
      })}
    </Layer>
  )
}
