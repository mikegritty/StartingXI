import { useState, useEffect } from 'react'
import { getStoredLinks, fetchTacticStatuses, deactivateTactic } from '../../lib/publish'

function relativeDate(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function shortDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function isExpired(isoString) {
  return isoString && new Date(isoString) < new Date()
}

export default function SharedLinksPanel({ onClose }) {
  const [links,  setLinks]  = useState([])
  const [live,   setLive]   = useState({})   // slug → { is_active, expires_at, view_count }
  const [loading, setLoading] = useState(true)
  const [error,  setError]  = useState(null)

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const stored = getStoredLinks()
    setLinks(stored)
    if (!stored.length) { setLoading(false); return }

    fetchTacticStatuses(stored.map((l) => l.slug))
      .then((data) => {
        const map = {}
        data.forEach((d) => { map[d.slug] = d })
        setLive(map)
      })
      .catch((err) => setError(err?.message ?? 'Could not load link statuses.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDeactivate = async (slug) => {
    if (!window.confirm('Deactivate this link? It will stop working immediately.')) return
    try {
      await deactivateTactic(slug)
      setLive((prev) => ({ ...prev, [slug]: { ...prev[slug], is_active: false } }))
    } catch (err) {
      alert('Failed: ' + (err?.message ?? 'Unknown error'))
    }
  }

  const handleCopy = (slug) => {
    const url = `${window.location.origin}/t/${slug}`
    navigator.clipboard.writeText(url).catch(() => {})
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">My Shared Game Day Links</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-4 h-4 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
              <span className="text-[12px] text-text-muted">Loading…</span>
            </div>
          )}

          {!loading && error && (
            <p className="text-[12px] text-red-400 py-4">{error}</p>
          )}

          {!loading && !error && links.length === 0 && (
            <p className="text-[12px] text-text-muted py-4 text-center">
              No published links yet. Use "Publish & Share" to create one.
            </p>
          )}

          {!loading && !error && links.length > 0 && (
            <div className="space-y-2">
              {links.map((link) => {
                const liveData  = live[link.slug] ?? {}
                const expired   = isExpired(liveData.expires_at ?? link.expiresAt)
                const inactive  = liveData.is_active === false
                const dead      = expired || inactive
                const views     = liveData.view_count ?? 0
                const expiresAt = liveData.expires_at ?? link.expiresAt

                return (
                  <div
                    key={link.slug}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors
                      ${dead
                        ? 'border-border/40 opacity-50'
                        : 'border-border hover:border-border/80'
                      }`}
                  >
                    {/* Status dot */}
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      dead ? 'bg-text-muted' : 'bg-green-500'
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-text-primary font-medium truncate">
                        {liveData.name ?? link.name}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Published {relativeDate(link.publishedAt)}
                        {expiresAt && !expired && ` · Expires ${shortDate(expiresAt)}`}
                        {expired && ' · EXPIRED'}
                        {inactive && !expired && ' · DEACTIVATED'}
                        {!dead && ` · ${views} view${views !== 1 ? 's' : ''}`}
                      </p>
                      <p className="text-[10px] text-text-muted/60 mt-0.5 truncate">
                        /t/{link.slug}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!dead && (
                        <>
                          <button
                            onClick={() => handleCopy(link.slug)}
                            className="text-[10px] px-2 py-1 rounded border border-border
                                       text-text-muted hover:text-text-primary transition-colors"
                            title="Copy link"
                          >
                            📋
                          </button>
                          <a
                            href={`/t/${link.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] px-2 py-1 rounded border border-border
                                       text-text-muted hover:text-text-primary transition-colors"
                            title="Open link"
                          >
                            ↗
                          </a>
                          <button
                            onClick={() => handleDeactivate(link.slug)}
                            className="text-[10px] px-2 py-1 rounded border border-border
                                       text-red-400/70 hover:text-red-400 hover:border-red-900 transition-colors"
                            title="Deactivate"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="text-[11px] px-3.5 py-1.5 rounded-md bg-accent-blue text-white
                       hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
