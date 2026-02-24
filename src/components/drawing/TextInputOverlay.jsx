import { useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { normToPixel } from '../../utils/positions'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

/**
 * TextInputOverlay — DOM textarea that appears over the canvas when the text
 * tool is active and the user clicks on the pitch.
 *
 * Also used for editing existing text drawings when initialText is provided.
 * In that case onClose receives the committed text string (or null on cancel).
 *
 * Positioning is computed from the container element's bounding rect +
 * the normalized click coordinates converted to pixels, then clamped so
 * the overlay never overflows the right/bottom edge of the viewport.
 *
 * Note: The text tool is desktop-primary (requires a keyboard). On mobile
 * it still works but the soft keyboard will shift the layout.
 *
 * @param {object}   textPending     - { nx, ny } in normalized coords
 * @param {string}   [initialText]   - pre-filled text (edit mode)
 * @param {function} onClose         - (text?) => void — text provided only in edit mode
 * @param {object}   pitchRect       - { x, y, width, height }
 * @param {object}   containerRef    - ref to the canvas container div
 */
export default function TextInputOverlay({ textPending, initialText, onClose, pitchRect, containerRef }) {
  const textareaRef  = useRef(null)
  const addDrawing   = useBoardStore((s) => s.addDrawing)
  const drawColor    = useSettingsStore((s) => s.drawColor)
  const isEditMode   = initialText !== undefined

  // Auto-focus and select all when the overlay appears
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      if (isEditMode) {
        textareaRef.current.select()
      }
    }
  }, [textPending]) // eslint-disable-line

  if (!textPending || !pitchRect) return null

  // Compute pixel position relative to the viewport
  const containerRect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
  const { px, py } = normToPixel(textPending.nx, textPending.ny, pitchRect)

  // Clamp so the input (min-width ~80px, estimate ~24px tall) stays in viewport
  const OVERLAY_W = 240
  const OVERLAY_H = 32
  const rawLeft = containerRect.left + px
  const rawTop  = containerRect.top  + py
  const left = Math.min(rawLeft, window.innerWidth  - OVERLAY_W - 8)
  const top  = Math.min(rawTop,  window.innerHeight - OVERLAY_H - 8)

  const commit = () => {
    const text = textareaRef.current?.value?.trim()
    if (isEditMode) {
      // Edit mode: pass text back to caller (even if empty — caller decides)
      onClose(text || null)
    } else {
      // New text mode: add drawing to board
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
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      if (isEditMode) onClose(null)
      else onClose()
    }
  }

  return (
    <>
      {/* Invisible backdrop — click outside to commit */}
      <div
        className="fixed inset-0 z-50"
        onClick={commit}
      />

      {/* Text input — floats over the canvas at the click position */}
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        defaultValue={initialText ?? ''}
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
