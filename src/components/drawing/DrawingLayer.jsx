import { Layer } from 'react-konva'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../store/boardStore'
import DrawingElement from './DrawingElement'

/**
 * DrawingLayer — renders all committed drawings from the board store.
 * Sits above PitchLines and below PlayerLayer in the Konva stage.
 *
 * @param {object} pitchRect - { x, y, width, height }
 * @param {Array}  [drawings] - optional override (used in readOnly / frame preview)
 */
export default function DrawingLayer({ pitchRect, drawings: drawingsProp }) {
  const storeDrawings = useBoardStore(useShallow((s) => s.board.drawings))
  const drawings = drawingsProp ?? storeDrawings

  return (
    <Layer listening={false}>
      {drawings.map((d) => (
        <DrawingElement key={d.id} drawing={d} pitchRect={pitchRect} />
      ))}
    </Layer>
  )
}
