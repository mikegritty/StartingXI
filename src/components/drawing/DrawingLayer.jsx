import { Layer } from 'react-konva'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'
import DrawingElement from './DrawingElement'

/**
 * DrawingLayer — renders all committed drawings from the board store.
 * Sits above PitchLines and below PlayerLayer in the Konva stage.
 *
 * In edit mode (readOnly=false), drawings are interactive:
 *   - In 'select' tool mode: tap a drawing to select it, drag handles to edit endpoints.
 *   - In any other tool mode: drawings are non-interactive (drawing/eraser takes over).
 *
 * @param {object}   pitchRect       - { x, y, width, height }
 * @param {Array}    [drawings]      - optional override (used in readOnly / frame preview)
 * @param {boolean}  [readOnly]      - if true, layer is purely decorative
 * @param {function} [onEditDrawing] - (id) => void — called when user double-clicks a text drawing
 */
export default function DrawingLayer({ pitchRect, drawings: drawingsProp, readOnly = false, onEditDrawing }) {
  const storeDrawings      = useBoardStore(useShallow((s) => s.board.drawings))
  const updateDrawing      = useBoardStore((s) => s.updateDrawing)
  const removeDrawing      = useBoardStore((s) => s.removeDrawing)
  const selectedDrawingId  = useSettingsStore((s) => s.selectedDrawingId)
  const setSelectedDrawingId = useSettingsStore((s) => s.setSelectedDrawingId)
  const activeTool         = useSettingsStore((s) => s.activeTool)

  const drawings = drawingsProp ?? storeDrawings

  // Only allow selection interaction in 'select' mode and not readOnly
  const isSelectMode = !readOnly && activeTool === 'select'

  const handleSelect = (id) => {
    if (!isSelectMode) return
    setSelectedDrawingId(selectedDrawingId === id ? null : id)
  }

  const handleDelete = (id) => {
    removeDrawing(id)
    setSelectedDrawingId(null)
  }

  const handleUpdate = (id, patch) => {
    updateDrawing(id, patch)
  }

  const handleEdit = (id) => {
    if (!isSelectMode || !onEditDrawing) return
    onEditDrawing(id)
  }

  // The layer itself needs to listen only in select mode (for click-through deselect)
  // Individual element listening is handled per DrawingElement based on readOnly
  return (
    <Layer listening={isSelectMode}>
      {drawings.map((d) => (
        <DrawingElement
          key={d.id}
          drawing={d}
          pitchRect={pitchRect}
          selected={isSelectMode && selectedDrawingId === d.id}
          readOnly={readOnly || !isSelectMode}
          onSelect={() => handleSelect(d.id)}
          onDelete={() => handleDelete(d.id)}
          onUpdate={(patch) => handleUpdate(d.id, patch)}
          onEdit={() => handleEdit(d.id)}
        />
      ))}
    </Layer>
  )
}
