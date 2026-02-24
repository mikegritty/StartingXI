import React, { useRef } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useBoardStore } from '../../store/boardStore'

const TOOLS = [
  { id: 'select',    label: 'Select (V)',
    tooltip: 'Select & move players. Tap a drawing to edit or delete it.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M2 1l10 5.5-4.5 1.5-2 4.5L2 1z"/>
    </svg>
  )},
  { id: 'pass',      label: 'Pass (A)',
    tooltip: 'Pass — draw a straight arrow showing ball movement. ⚽ marks the start.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12L12 2M12 2H7M12 2V7"/>
    </svg>
  )},
  { id: 'run',       label: 'Run (C)',
    tooltip: 'Run — curved arrow showing a player\'s run off the ball.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12 Q 2 2 12 2" />
      <path d="M12 2H8M12 2V6" fill="none"/>
    </svg>
  )},
  { id: 'dribble',   label: 'Dribble (D)',
    tooltip: 'Dribble — dashed arrow showing a player carrying the ball.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2">
      <path d="M2 12L12 2" strokeDasharray="0"/>
      <path d="M12 2H7M12 2V7" strokeDasharray="0"/>
      <path d="M2 12L9 5"/>
    </svg>
  )},
  { id: 'zone',      label: 'Zone (Z)',
    tooltip: 'Zone — draw a highlighted rectangular area.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="10" height="8" rx="1"/>
    </svg>
  )},
  { id: 'highlight', label: 'Highlight (H)',
    tooltip: 'Highlight — draw a highlighted ellipse to mark a space or player.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5"/>
    </svg>
  )},
  { id: 'text',      label: 'Text (T)',
    tooltip: 'Text — tap the pitch to add a text annotation.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M2 3h10v1.5H8.5v7h-3v-7H2V3z"/>
    </svg>
  )},
  { id: 'eraser',    label: 'Eraser (E)',
    tooltip: 'Eraser — tap a drawing to remove it. Or use Select tool then tap ✕.',
    icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 2L12 5L5 12H2V9L9 2Z"/>
      <path d="M6.5 3.5L10.5 7.5"/>
    </svg>
  )},
]

// Drawing tools (any tool except select shows color picker)
const DRAWING_TOOL_IDS = ['pass', 'run', 'dribble', 'zone', 'highlight', 'text', 'eraser']

// Color presets
const COLOR_PRESETS = [
  { color: '#ffffff', label: 'White'  },
  { color: '#facc15', label: 'Yellow' },
  { color: '#ef4444', label: 'Red'    },
  { color: '#22d3ee', label: 'Cyan'   },
  { color: '#22c55e', label: 'Green'  },
  { color: '#f97316', label: 'Orange' },
]

// On mobile, show only the most-used tools to leave room for panel toggles
const MOBILE_TOOL_IDS = ['select', 'pass', 'run', 'dribble', 'eraser']

export default function Toolbar({ isMobile, activeSheet, onToggleSheet }) {
  const activeTool    = useSettingsStore((s) => s.activeTool)
  const setActiveTool = useSettingsStore((s) => s.setActiveTool)
  const drawColor     = useSettingsStore((s) => s.drawColor)
  const setDrawColor  = useSettingsStore((s) => s.setDrawColor)

  const addFrame              = useBoardStore((s) => s.addFrame)
  const frames                = useBoardStore((s) => s.board.play.frames)
  const setFrameToastPending  = useSettingsStore((s) => s.setFrameToastPending)

  const colorInputRef = useRef(null)

  const visibleTools = isMobile ? TOOLS.filter((t) => MOBILE_TOOL_IDS.includes(t.id)) : TOOLS
  const showColorPicker = DRAWING_TOOL_IDS.includes(activeTool)

  const handleAddFrame = () => {
    if (frames.length >= 8) return
    // addFrame() atomically snapshots the canvas, appends the frame, and jumps to it.
    addFrame()
    // Signal FrameTimeline to show the animate offer toast.
    setFrameToastPending(true)
  }

  return (
    <div className="shrink-0 border-t border-border bg-panel">
      {/* ── Color picker row (visible when a drawing tool is active) ─────── */}
      {showColorPicker && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/50">
          <span className="text-[10px] text-text-muted mr-0.5 select-none">Color:</span>

          {COLOR_PRESETS.map(({ color, label }) => (
            <button
              key={color}
              title={label}
              onClick={() => setDrawColor(color)}
              className="w-5 h-5 rounded-full border transition-all shrink-0"
              style={{
                background: color,
                borderColor: drawColor === color ? '#60a5fa' : 'rgba(255,255,255,0.15)',
                boxShadow:   drawColor === color ? '0 0 0 2px rgba(96,165,250,0.5)' : 'none',
                transform:   drawColor === color ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}

          {/* Custom color swatch */}
          <button
            title="Custom colour"
            onClick={() => colorInputRef.current?.click()}
            className="w-5 h-5 rounded-full border border-dashed border-text-muted/50
                       flex items-center justify-center shrink-0 relative overflow-hidden
                       hover:border-text-primary transition-colors"
            style={{
              background: COLOR_PRESETS.some((p) => p.color === drawColor)
                ? 'transparent'
                : drawColor,
            }}
          >
            {COLOR_PRESETS.some((p) => p.color === drawColor) && (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor"
                   strokeWidth="1.2" className="text-text-muted">
                <path d="M4 1v6M1 4h6"/>
              </svg>
            )}
            <input
              ref={colorInputRef}
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              tabIndex={-1}
            />
          </button>
        </div>
      )}

      {/* ── Tool buttons row ─────────────────────────────────────────────── */}
      <footer
        className="flex items-center px-3 gap-0.5"
        style={{ minHeight: '44px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {visibleTools.map((tool, i) => (
          <React.Fragment key={tool.id}>
            {/* Separator before eraser (desktop) */}
            {!isMobile && i === TOOLS.length - 1 && (
              <div className="w-px h-5 bg-border mx-1.5" />
            )}
            <button
              onClick={() => setActiveTool(tool.id)}
              title={tool.tooltip ?? tool.label}
              className={`
                flex items-center justify-center w-8 h-8 rounded-md transition-colors
                ${activeTool === tool.id
                  ? 'bg-accent-blue text-white'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface'
                }
              `}
            >
              {tool.icon}
            </button>
          </React.Fragment>
        ))}

        {/* Desktop: Add Frame button + keyboard hint */}
        {!isMobile && (
          <div className="ml-auto flex items-center gap-2">
            {/* Add Frame */}
            {frames.length < 8 && (
              <button
                onClick={handleAddFrame}
                title="Add animation frame (snapshot)"
                className="flex items-center gap-1 text-[9px] text-text-muted hover:text-text-primary
                           px-2 py-1 rounded border border-dashed border-border hover:border-text-muted
                           transition-colors"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 1v6M1 4h6"/>
                </svg>
                Add Frame
              </button>
            )}

            <div className="text-[10px] text-text-muted opacity-50 select-none pr-1">
              V select · A pass · C run · D dribble · Z zone · H highlight · T text · E erase
            </div>
          </div>
        )}

        {/* Mobile: panel toggle buttons */}
        {isMobile && (
          <div className="ml-auto flex items-center gap-1">
            <div className="w-px h-5 bg-border mx-1" />

            {/* Team Setup toggle */}
            <button
              onClick={() => onToggleSheet('left')}
              className={`flex flex-col items-center justify-center w-11 h-9 rounded-md
                          transition-colors gap-0.5
                          ${activeSheet === 'left'
                            ? 'bg-accent-blue text-white'
                            : 'text-text-muted hover:text-text-primary hover:bg-surface'
                          }`}
              title="Team Setup"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="5" r="2.5"/>
                <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
              </svg>
              <span className="text-[8px] font-medium leading-none">Team</span>
            </button>

            {/* Squad toggle */}
            <button
              onClick={() => onToggleSheet('right')}
              className={`flex flex-col items-center justify-center w-11 h-9 rounded-md
                          transition-colors gap-0.5
                          ${activeSheet === 'right'
                            ? 'bg-accent-blue text-white'
                            : 'text-text-muted hover:text-text-primary hover:bg-surface'
                          }`}
              title="Squad"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h10M2 7h10M2 10h6"/>
              </svg>
              <span className="text-[8px] font-medium leading-none">Squad</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
