import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PitchCanvas from '../components/pitch/PitchCanvas'
import ViewerTopBar from '../components/panels/ViewerTopBar'

/**
 * SharedTacticView — public read-only page for a published Game Day tactic.
 * Route: /t/:slug
 *
 * Fetches the tactic from Supabase by slug, validates it is active and not
 * expired, then renders a read-only pitch canvas and viewer top bar.
 * Also increments the view_count in the background.
 */
export default function SharedTacticView() {
  const { slug } = useParams()

  const [status, setStatus] = useState('loading') // 'loading' | 'found' | 'notfound' | 'expired' | 'error'
  const [board, setBoard]   = useState(null)
  const [meta, setMeta]     = useState(null) // { name, match_date, expires_at }

  useEffect(() => {
    if (!slug) {
      setStatus('notfound')
      return
    }

    let cancelled = false

    async function fetchTactic() {
      try {
        const { data, error } = await supabase
          .from('game_day_tactics')
          .select('slug, name, match_date, board_state, expires_at, is_active, view_count')
          .eq('slug', slug)
          .maybeSingle()

        if (cancelled) return

        if (error) {
          console.error('[SharedTacticView] Supabase error:', error)
          setStatus('error')
          return
        }

        if (!data) {
          setStatus('notfound')
          return
        }

        // Client-side validity checks (belt + suspenders on top of RLS)
        if (!data.is_active) {
          setStatus('notfound')
          return
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setStatus('expired')
          return
        }

        setBoard(data.board_state)
        setMeta({
          name:      data.name,
          matchDate: data.match_date,
          expiresAt: data.expires_at,
        })
        setStatus('found')

        // Increment view_count in background — fire-and-forget, no await
        supabase
          .from('game_day_tactics')
          .update({ view_count: (data.view_count ?? 0) + 1 })
          .eq('slug', slug)
          .then(({ error: updateErr }) => {
            if (updateErr) console.warn('[SharedTacticView] view_count update failed:', updateErr)
          })
      } catch (err) {
        if (!cancelled) {
          console.error('[SharedTacticView] Unexpected error:', err)
          setStatus('error')
        }
      }
    }

    fetchTactic()
    return () => { cancelled = true }
  }, [slug])

  // ── Loading ──────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading tactic…</p>
        </div>
      </div>
    )
  }

  // ── Error states ─────────────────────────────────────────────────────────

  if (status !== 'found') {
    const msgs = {
      notfound: {
        icon: '🔍',
        title: 'Tactic not found',
        body:  'This link may have been deactivated or never existed.',
      },
      expired: {
        icon: '⏰',
        title: 'Link expired',
        body:  'Shared links are valid for 90 days. This one has expired.',
      },
      error: {
        icon: '⚠️',
        title: 'Something went wrong',
        body:  'We couldn\'t load this tactic. Please try again later.',
      },
    }
    const { icon, title, body } = msgs[status] ?? msgs.error

    return (
      <div className="flex h-screen flex-col bg-bg-main">
        {/* Minimal header — no board data */}
        <header className="h-11 flex items-center px-4 border-b border-border bg-panel shrink-0 gap-3">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-accent-blue flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5"/>
                <path d="M7 1 L7 13 M1 7 L13 7 M3 3 L11 11 M11 3 L3 11" stroke="white" strokeWidth="1" opacity="0.6"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-tight">StartingXI</span>
          </a>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center flex flex-col items-center gap-3 px-6 max-w-sm">
            <span className="text-4xl">{icon}</span>
            <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
            <p className="text-sm text-text-muted leading-relaxed">{body}</p>
            <a
              href="/"
              className="mt-2 text-[12px] px-4 py-2 rounded-md bg-accent-blue text-white hover:bg-blue-700 transition-colors font-medium"
            >
              Create your own tactic
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Found — render read-only pitch ───────────────────────────────────────

  const gameDayMeta = board?.gameDayMeta ?? { opponentName: null, matchDate: meta.matchDate }

  return (
    <div className="flex flex-col h-screen bg-bg-main overflow-hidden">
      <ViewerTopBar
        boardName={meta.name}
        gameDayMeta={gameDayMeta}
      />

      {/* Subs bench — shown below pitch if there are substitutes */}
      <div className="flex flex-1 overflow-hidden">
        <PitchCanvas readOnly board={board} />

        {/* Bench sidebar — substitutes list (desktop only) */}
        <SubsBench board={board} />
      </div>
    </div>
  )
}

// ── Subs bench sidebar ───────────────────────────────────────────────────────

function SubsBench({ board }) {
  if (!board) return null

  const subs = (board.players ?? []).filter((p) => p.isStarter === false)
  if (!subs.length) return null

  const homeTeamName = board.teams?.home?.name ?? 'Home'
  const homeSubs = subs.filter((p) => p.team === 'home')
  const awaySubs = subs.filter((p) => p.team === 'away')

  return (
    <aside className="hidden md:flex flex-col w-48 shrink-0 border-l border-border bg-panel overflow-y-auto">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Substitutes
        </h3>
      </div>

      {homeSubs.length > 0 && (
        <div className="px-3 py-2">
          {awaySubs.length > 0 && (
            <p className="text-[9px] uppercase tracking-wider text-text-muted mb-1.5 font-medium">
              {homeTeamName}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {homeSubs.map((p) => (
              <SubRow key={p.id} player={p} color={board.teams?.home?.primaryColor ?? '#1a56db'} />
            ))}
          </div>
        </div>
      )}

      {awaySubs.length > 0 && (
        <div className="px-3 py-2 border-t border-border">
          {homeSubs.length > 0 && (
            <p className="text-[9px] uppercase tracking-wider text-text-muted mb-1.5 font-medium">
              {board.teams?.away?.name ?? 'Away'}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {awaySubs.map((p) => (
              <SubRow key={p.id} player={p} color={board.teams?.away?.primaryColor ?? '#dc2626'} />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

function SubRow({ player, color }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* Number badge */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: color }}
      >
        <span className="text-[9px] font-bold text-white leading-none">
          {player.number}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-text-primary font-medium truncate leading-tight">
          {player.name || '—'}
        </p>
        {player.position && (
          <p className="text-[9px] text-text-muted truncate leading-tight">
            {player.position}
          </p>
        )}
      </div>
    </div>
  )
}
