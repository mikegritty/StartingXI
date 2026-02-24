/**
 * ViewerTopBar — minimal read-only header for the shared tactic viewer (/t/:slug).
 * Shows logo, tactic name, match metadata, and a link back to StartingXI.
 */
export default function ViewerTopBar({ boardName, gameDayMeta }) {
  const { opponentName, matchDate } = gameDayMeta ?? {}

  const formattedDate = matchDate
    ? new Date(matchDate).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <header className="h-11 flex items-center px-4 border-b border-border bg-panel shrink-0 gap-4">
      {/* Logo */}
      <a
        href="/"
        className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        title="Create your own tactical board on StartingXI"
      >
        <div className="w-6 h-6 rounded-md bg-accent-blue flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5"/>
            <path d="M7 1 L7 13 M1 7 L13 7 M3 3 L11 11 M11 3 L3 11" stroke="white" strokeWidth="1" opacity="0.6"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight">StartingXI</span>
      </a>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Tactic info */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Game Day badge */}
        <span className="hidden sm:flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase
                         tracking-wider px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
          🗓️ Game Day
        </span>

        {/* Board / tactic name */}
        <span className="text-sm font-medium text-text-primary truncate">
          {boardName || 'Tactic'}
        </span>

        {/* Match details */}
        {opponentName && (
          <span className="hidden md:block text-xs text-text-muted truncate">
            vs {opponentName}{formattedDate ? ` · ${formattedDate}` : ''}
          </span>
        )}
        {!opponentName && formattedDate && (
          <span className="hidden md:block text-xs text-text-muted">{formattedDate}</span>
        )}
      </div>

      {/* CTA — drive traffic to the app */}
      <a
        href="/"
        className="hidden sm:flex shrink-0 items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md
                   bg-accent-blue text-white hover:bg-blue-700 transition-colors font-medium"
      >
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 1v8M4 4l3-3 3 3"/>
          <path d="M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2"/>
        </svg>
        Create your own
      </a>
    </header>
  )
}
