import { useRef } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useSettingsStore } from '../../store/settingsStore'

/**
 * TeamNotesPanel — full-width overlay that shows all player notes for the home team,
 * plus a free-form team note section. Supports print / PDF export.
 *
 * Opened by setting teamNotesPanelOpen = true in settingsStore.
 */
export default function TeamNotesPanel() {
  const isOpen  = useSettingsStore((s) => s.teamNotesPanelOpen)
  const setOpen = useSettingsStore((s) => s.setTeamNotesPanelOpen)
  const players = useBoardStore((s) => s.board.players)
  const board   = useBoardStore((s) => s.board)
  const printRef = useRef(null)

  if (!isOpen) return null

  const homePlayers = players.filter((p) => p.team === 'home')
  const starters    = homePlayers.filter((p) => p.isStarter !== false)
  const subs        = homePlayers.filter((p) => p.isStarter === false)
  const withNotes   = homePlayers.filter((p) => p.note?.trim())

  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return

    const win = window.open('', '_blank', 'width=800,height=700')
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${board.name || 'Team Notes'} — Match Sheet</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 13px; color: #555; margin-bottom: 16px; font-weight: normal; }
            h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 20px 0 8px; }
            .player-row { display: flex; gap: 12px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
            .badge { background: #1a56db; color: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; }
            .player-name { font-weight: 600; font-size: 13px; }
            .player-pos { font-size: 11px; color: #777; }
            .player-note { font-size: 12px; color: #333; margin-top: 4px; white-space: pre-wrap; }
            .no-note { font-size: 12px; color: #bbb; font-style: italic; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-panel border-l border-border
                      flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-primary">Match Sheet</h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              {board.teams?.home?.name || 'Home Team'} · {starters.length} starters
              {subs.length > 0 && ` · ${subs.length} subs`}
            </p>
          </div>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]
                       bg-surface border border-border text-text-primary
                       hover:border-text-muted transition-colors font-medium"
            title="Print / Save as PDF"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="1" width="8" height="5" rx="1"/>
              <path d="M3 10H1V6h12v4h-2"/>
              <rect x="3" y="9" width="8" height="4" rx="1"/>
              <circle cx="11" cy="7.5" r="0.8" fill="currentColor"/>
            </svg>
            Print
          </button>

          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-md
                       text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Hidden print-friendly content */}
          <div ref={printRef} style={{ display: 'none' }}>
            <h1>{board.name || 'Match Sheet'}</h1>
            <h2>{board.teams?.home?.name || 'Home Team'}</h2>

            {starters.length > 0 && (
              <>
                <h3>Starting XI</h3>
                {starters.map((p) => (
                  <div key={p.id} className="player-row">
                    <div className="badge">{p.number}</div>
                    <div>
                      <div className="player-name">{p.name || '—'}</div>
                      <div className="player-pos">{p.position || p.role}</div>
                      {p.note?.trim()
                        ? <div className="player-note">{p.note}</div>
                        : <div className="no-note">No instructions</div>
                      }
                    </div>
                  </div>
                ))}
              </>
            )}

            {subs.length > 0 && (
              <>
                <h3>Substitutes</h3>
                {subs.map((p) => (
                  <div key={p.id} className="player-row">
                    <div className="badge">{p.number}</div>
                    <div>
                      <div className="player-name">{p.name || '—'}</div>
                      <div className="player-pos">{p.position || p.role}</div>
                      {p.note?.trim()
                        ? <div className="player-note">{p.note}</div>
                        : <div className="no-note">No instructions</div>
                      }
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Visible panel content */}
          {homePlayers.length === 0 && (
            <p className="text-sm text-text-muted italic">
              No players yet. Apply a formation first.
            </p>
          )}

          {/* Players with notes first */}
          {withNotes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                Individual Instructions ({withNotes.length})
              </h3>
              <div className="space-y-3">
                {withNotes.map((p) => (
                  <PlayerNoteCard key={p.id} player={p} homeColor={board.teams?.home?.primaryColor} />
                ))}
              </div>
            </section>
          )}

          {/* All starters */}
          {starters.length > 0 && (
            <section>
              <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                Starting XI
              </h3>
              <div className="space-y-2">
                {starters.map((p) => (
                  <PlayerSummaryRow key={p.id} player={p} homeColor={board.teams?.home?.primaryColor} />
                ))}
              </div>
            </section>
          )}

          {/* Subs */}
          {subs.length > 0 && (
            <section>
              <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                Substitutes
              </h3>
              <div className="space-y-2">
                {subs.map((p) => (
                  <PlayerSummaryRow key={p.id} player={p} homeColor={board.teams?.home?.primaryColor} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlayerNoteCard({ player, homeColor }) {
  const setNotePlayerId = useSettingsStore((s) => s.setNotePlayerId)
  const setOpen = useSettingsStore((s) => s.setTeamNotesPanelOpen)

  const handleEdit = () => {
    setOpen(false)
    setTimeout(() => setNotePlayerId(player.id), 50)
  }

  return (
    <div className="bg-surface rounded-lg p-3 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: homeColor ?? '#1a56db' }}
        >
          <span className="text-[9px] font-bold text-white">{player.number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-text-primary truncate">{player.name || '—'}</p>
          <p className="text-[10px] text-text-muted">{player.position || player.role}</p>
        </div>
        <button
          onClick={handleEdit}
          className="text-[10px] text-text-muted hover:text-text-primary transition-colors px-2 py-0.5
                     rounded border border-border hover:border-text-muted shrink-0"
        >
          Edit
        </button>
      </div>
      <p className="text-[11px] text-text-primary leading-relaxed whitespace-pre-wrap">
        {player.note}
      </p>
    </div>
  )
}

function PlayerSummaryRow({ player, homeColor }) {
  const setNotePlayerId = useSettingsStore((s) => s.setNotePlayerId)
  const setOpen = useSettingsStore((s) => s.setTeamNotesPanelOpen)

  const handleEdit = () => {
    setOpen(false)
    setTimeout(() => setNotePlayerId(player.id), 50)
  }

  const hasNote = Boolean(player.note?.trim())

  return (
    <div
      onClick={handleEdit}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface
                 transition-colors cursor-pointer group"
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: homeColor ?? '#1a56db' }}
      >
        <span className="text-[8px] font-bold text-white">{player.number}</span>
      </div>
      <span className="text-[10px] font-medium text-text-muted w-8 shrink-0">
        {player.position || player.role}
      </span>
      <span className="flex-1 text-[11px] text-text-primary truncate">
        {player.name || '—'}
      </span>
      {hasNote
        ? <span className="text-[9px] text-green-400 shrink-0">● Note</span>
        : <span className="text-[9px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">+ Add</span>
      }
    </div>
  )
}
