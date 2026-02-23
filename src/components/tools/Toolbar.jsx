import React from 'react'
import { useSettingsStore } from '../../store/settingsStore'

const TOOLS = [
  { id: 'select',  label: 'Select (V)',        icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M2 1l10 5.5-4.5 1.5-2 4.5L2 1z"/>
    </svg>
  )},
  { id: 'arrow',   label: 'Arrow (A)',         icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12L12 2M12 2H7M12 2V7"/>
    </svg>
  )},
  { id: 'curved',  label: 'Curved Arrow (C)',  icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12 Q 2 2 12 2" />
      <path d="M12 2H8M12 2V6" fill="none"/>
    </svg>
  )},
  { id: 'dashed',  label: 'Dashed Arrow (D)',  icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2">
      <path d="M2 12L12 2M12 2H7M12 2V7" strokeDasharray="0"/>
      <path d="M2 12L12 2"/>
    </svg>
  )},
  { id: 'free',    label: 'Freehand (F)',      icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 10 C 4 8 6 4 8 6 C 10 8 10 4 12 4"/>
    </svg>
  )},
  { id: 'circle',  label: 'Circle (O)',        icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5"/>
    </svg>
  )},
  { id: 'rect',    label: 'Rectangle (R)',     icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="10" height="8" rx="1"/>
    </svg>
  )},
  { id: 'text',    label: 'Text (T)',          icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M2 3h10v1.5H8.5v7h-3v-7H2V3z"/>
    </svg>
  )},
  { id: 'erase',   label: 'Eraser (E)',        icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 2L12 5L5 12H2V9L9 2Z"/>
      <path d="M6.5 3.5L10.5 7.5"/>
    </svg>
  )},
]

// On mobile, show only the most-used tools to leave room for panel toggles
const MOBILE_TOOL_IDS = ['select', 'arrow', 'curved', 'free', 'erase']

export default function Toolbar({ isMobile, activeSheet, onToggleSheet }) {
  const activeTool    = useSettingsStore((s) => s.activeTool)
  const setActiveTool = useSettingsStore((s) => s.setActiveTool)

  const visibleTools = isMobile ? TOOLS.filter((t) => MOBILE_TOOL_IDS.includes(t.id)) : TOOLS

  return (
    <footer
      className="border-t border-border bg-panel flex items-center px-3 gap-0.5 shrink-0"
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
            title={tool.label}
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

      {/* Desktop: keyboard hint */}
      {!isMobile && (
        <div className="ml-auto text-[10px] text-text-muted opacity-50 select-none pr-1">
          Right-click player to delete · V to select · A to draw arrows
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
  )
}
