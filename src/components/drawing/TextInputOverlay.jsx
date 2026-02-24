import { useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { normToPixel } from '../../utils/positions'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

/**
 * TextInputOverlay — DOM textarea that appears over the canvas when the text
 * tool is active and the user clicks on the pitch.
 *
 * Positioning is computed from the container element's bounding rect +
 * the normalized click coordinates converted to pixels.
 *
 * @param {object}   textPending     - { nx, ny } in normalized coords
 * @param {function} onClose         - call to dismiss the overlay
 * @param {object}   pitchRect       - { x, y, width, height }
 * @param {object}   containerRef    - ref to the canvas container div
 */
export default function TextInputOverlay({ textPending, onClose, pitchRect, containerRef }) {
  const textareaRef  = useRef(null)
  const addDrawing   = useBoardStore((s) => s.addDrawing)
  const drawColor    = useSettingsStore((s) => s.drawColor)

  // Auto-focus when the overlay appears
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [textPending])

  if (!textPending || !pitchRect) return null

  // Compute pixel position relative to the viewport
  const containerRect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
  const { px, py } = normToPixel(textPending.nx, textPending.ny, pitchRect)
  const left = containerRect.left + px
  const top  = containerRect.top  + py

  const commit = () => {
    const text = textareaRef.current?.value?.trim()
    if (text) {
      addDrawing({
        id:    uuidv4(),
        type:  'text',
        nx:    textPending.nx,
        ny:    textPending.ny,
        text,
        color: drawColor,
      })
    }
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <>
      {/* Invisible backdrop — click to commit */}
      <div
        className="fixed inset-0 z-50"
        onClick={commit}
      />

      {/* Text input */}
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={120}
        placeholder="Type text…"
        className="fixed z-50 rounded px-2 py-1 text-sm font-bold resize-none
                   outline-none bg-transparent border-0 shadow-none
                   min-w-[80px] max-w-[240px]"
        style={{
          left,
          top,
          color: drawColor,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          caretColor: drawColor,
          // Auto-height via rows=1; grows with content via field-sizing or manual approach
          height: 'auto',
          overflow: 'hidden',
        }}
        onInput={(e) => {
          // Auto-resize height
          e.target.style.height = 'auto'
          e.target.style.height = `${e.target.scrollHeight}px`
        }}
      />
    </>
  )
}
