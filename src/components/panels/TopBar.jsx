import { useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'
import GameDayModal    from '../ui/GameDayModal'
import PublishModal    from '../ui/PublishModal'
import ShareModal      from '../ui/ShareModal'
import SharedLinksPanel from '../ui/SharedLinksPanel'

export default function TopBar() {
  const name              = useBoardStore((s) => s.board.name)
  const boardType         = useBoardStore((s) => s.board.type)
  const setBoardName      = useBoardStore((s) => s.setBoardName)
  const setTeamNotesOpen  = useSettingsStore((s) => s.setTeamNotesPanelOpen)

  // Modal states
  const [gameDayOpen,   setGameDayOpen]   = useState(false)
  const [publishOpen,   setPublishOpen]   = useState(false)
  const [shareOpen,     setShareOpen]     = useState(false)
  const [linksOpen,     setLinksOpen]     = useState(false)

  // After publish succeeds, hold the slug + expiry for the share modal
  const [publishedSlug,      setPublishedSlug]      = useState(null)
  const [publishedExpiresAt, setPublishedExpiresAt] = useState(null)

  const isGameDay = boardType === 'gameday'

  const handlePublished = (slug) => {
    // Compute expires_at locally (90 days) — we'll also get it from Supabase but
    // we need it immediately for the ShareModal without an extra fetch.
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)
    setPublishedSlug(slug)
    setPublishedExpiresAt(expiresAt.toISOString())
    setPublishOpen(false)
    setShareOpen(true)
  }

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
      <div className="flex items-center gap-2 min-w-0">
        {isGameDay && (
          <span className="hidden md:flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase
                           tracking-wider px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
            🗓️ Game Day
          </span>
        )}
        <input
          value={name}
          onChange={(e) => setBoardName(e.target.value)}
          className="text-sm text-text-primary bg-transparent border-b border-transparent
                     hover:border-border focus:border-accent-blue outline-none px-0.5 py-0.5
                     min-w-20 max-w-[35vw] md:max-w-64 transition-colors"
          placeholder="Board name..."
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Game Day button — opens setup modal */}
        <button
          onClick={() => setGameDayOpen(true)}
          className={`hidden md:block text-[11px] px-3 py-1.5 rounded-md border transition-colors
            ${isGameDay
              ? 'border-accent-blue/50 bg-accent-blue/10 text-accent-blue'
              : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
            }`}
          title="Set up as a Game Day tactic"
        >
          🗓️ {isGameDay ? 'Game Day ✓' : 'Game Day'}
        </button>

        {/* Publish & Share — only shown for game day boards */}
        {isGameDay && (
          <button
            onClick={() => setPublishOpen(true)}
            className="hidden md:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md
                       bg-green-700 hover:bg-green-600 text-white transition-colors font-medium border-0"
            title="Publish and get a shareable link"
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 1v8M4 4l3-3 3 3"/>
              <path d="M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2"/>
            </svg>
            Publish & Share
          </button>
        )}

        {/* My Links */}
        <button
          onClick={() => setLinksOpen(true)}
          className="hidden md:block text-[11px] px-3 py-1.5 rounded-md border border-border
                     text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
          title="My shared links"
        >
          My links
        </button>

        {/* Match Sheet / Team Notes */}
        <button
          onClick={() => setTeamNotesOpen(true)}
          className="hidden md:block text-[11px] px-3 py-1.5 rounded-md border border-border
                     text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
          title="View match sheet and player notes"
        >
          Match Sheet
        </button>

        {/* Export */}
        <button
          className="hidden md:block text-[11px] px-3 py-1.5 rounded-md border border-border text-text-muted
                     hover:text-text-primary hover:border-text-muted transition-colors"
          title="Export PNG (coming soon)"
        >
          Export
        </button>

        {/* Save */}
        <button
          className="text-[11px] px-3 py-1.5 rounded-md bg-accent-blue text-white
                     hover:bg-blue-700 transition-colors font-medium"
          title="Save (coming soon)"
        >
          Save
        </button>
      </div>

      {/* Modals */}
      {gameDayOpen  && <GameDayModal    onClose={() => setGameDayOpen(false)} />}
      {publishOpen  && <PublishModal    onClose={() => setPublishOpen(false)} onPublished={handlePublished} />}
      {shareOpen    && publishedSlug && (
        <ShareModal
          slug={publishedSlug}
          boardName={name}
          expiresAt={publishedExpiresAt}
          onClose={() => { setShareOpen(false); setPublishedSlug(null) }}
        />
      )}
      {linksOpen    && <SharedLinksPanel onClose={() => setLinksOpen(false)} />}
    </header>
  )
}
