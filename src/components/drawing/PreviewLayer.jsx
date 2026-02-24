import { Layer } from 'react-konva'
import DrawingElement from './DrawingElement'

/**
 * PreviewLayer — renders the in-progress drawing preview while the user is dragging.
 * Sits above DrawingLayer and below PlayerLayer.
 *
 * @param {object|null} preview  - preview state from useDrawingPointer (or null)
 * @param {object}      pitchRect - { x, y, width, height }
 */
export default function PreviewLayer({ preview, pitchRect }) {
  if (!preview) return null

  // Normalize preview into the same shape as a stored drawing
  const previewDrawing = {
    id:     '__preview__',
    type:   preview.type,
    color:  preview.color,
    // arrow / rect / ellipse previews
    x1:     preview.x1,
    y1:     preview.y1,
    x2:     preview.x2 ?? preview.x1,
    y2:     preview.y2 ?? preview.y1,
    // freehand preview
    points: preview.points,
  }

  return (
    <Layer listening={false}>
      <DrawingElement drawing={previewDrawing} pitchRect={pitchRect} opacity={0.75} />
    </Layer>
  )
}
