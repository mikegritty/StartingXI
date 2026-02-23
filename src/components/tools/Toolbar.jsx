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

export default function Toolbar() {
  const activeTool    = useSettingsStore((s) => s.activeTool)
  const setActiveTool = useSettingsStore((s) => s.setActiveTool)

  return (
    <footer className="h-11 border-t border-border bg-panel flex items-center px-3 gap-0.5 shrink-0">
      {TOOLS.map((tool, i) => (
        <React.Fragment key={tool.id}>
          {/* Separator before eraser */}
          {i === TOOLS.length - 1 && (
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

      {/* Right side: keyboard hint */}
      <div className="ml-auto text-[10px] text-text-muted opacity-50 select-none pr-1">
        Right-click player to delete · V to select · A to draw arrows
      </div>
    </footer>
  )
}
