import { useBoardStore } from '../../store/boardStore'

export default function TopBar() {
  const name        = useBoardStore((s) => s.board.name)
  const setBoardName = useBoardStore((s) => s.setBoardName)

  return (
    <header className="h-11 flex items-center px-4 border-b border-border bg-panel shrink-0 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-accent-blue flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5"/>
            <path d="M7 1 L7 13 M1 7 L13 7 M3 3 L11 11 M11 3 L3 11" stroke="white" strokeWidth="1" opacity="0.6"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight">StartingXI</span>
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Board name — inline editable */}
      <input
        value={name}
        onChange={(e) => setBoardName(e.target.value)}
        className="text-sm text-text-primary bg-transparent border-b border-transparent
                   hover:border-border focus:border-accent-blue outline-none px-0.5 py-0.5
                   min-w-20 max-w-[35vw] md:max-w-64 transition-colors"
        placeholder="Board name..."
      />

      <div className="ml-auto flex items-center gap-2">
        <button
          className="hidden md:block text-[11px] px-3 py-1.5 rounded-md border border-border text-text-muted
                     hover:text-text-primary hover:border-text-muted transition-colors"
          title="Share (coming soon)"
        >
          Share
        </button>
        <button
          className="hidden md:block text-[11px] px-3 py-1.5 rounded-md border border-border text-text-muted
                     hover:text-text-primary hover:border-text-muted transition-colors"
          title="Export PNG (coming soon)"
        >
          Export
        </button>
        <button
          className="text-[11px] px-3 py-1.5 rounded-md bg-accent-blue text-white
                     hover:bg-blue-700 transition-colors font-medium"
          title="Save (coming soon)"
        >
          Save
        </button>
      </div>
    </header>
  )
}
