import { Layer } from 'react-konva'
import { useBoardStore } from '../../store/boardStore'
import { useShallow } from 'zustand/react/shallow'
import PlayerToken from './PlayerToken'

/**
 * PlayerLayer renders all starter tokens onto the Konva canvas.
 *
 * Props:
 *   readOnly    – forwarded to PlayerToken; suppresses all interactions
 *   boardPlayers – in readOnly mode, players come from a prop instead of the store
 */
export default function PlayerLayer({
  pitchRect,
  dropTargetId,
  pendingSubMode,
  tokenScale,
  readOnly = false,
  boardPlayers = null,
}) {
  // useShallow prevents re-renders when unrelated store state changes — the array reference
  // returned by a plain selector changes every render even if contents are identical
  const storePlayers = useBoardStore(useShallow((s) => s.board.players))

  // In readOnly viewer mode, use the boardPlayers prop; otherwise use the store
  const players = readOnly && boardPlayers !== null ? boardPlayers : storePlayers

  // Only render starters on the pitch canvas — subs appear in the right panel
  const starters = players.filter((p) => p.isStarter !== false)

  return (
    <Layer>
      {starters.map((player) => (
        <PlayerToken
          key={player.id}
          player={player}
          pitchRect={pitchRect}
          isDropTarget={player.id === dropTargetId}
          pendingSubMode={pendingSubMode}
          tokenScale={tokenScale ?? 1}
          readOnly={readOnly}
        />
      ))}
    </Layer>
  )
}
