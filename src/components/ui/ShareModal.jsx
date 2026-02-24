import { useState } from 'react'
import { deactivateTactic } from '../../lib/publish'

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function ShareModal({ slug, boardName, expiresAt, onClose }) {
  const url = `${window.location.origin}/t/${slug}`
  const [copied, setCopied]           = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deactivated, setDeactivated]   = useState(false)

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the text
    }
  }

  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate this link? Anyone with the URL will no longer be able to view the tactic.')) return
    setDeactivating(true)
    try {
      await deactivateTactic(slug)
      setDeactivated(true)
    } catch (err) {
      alert('Failed to deactivate: ' + (err?.message ?? 'Unknown error'))
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <h2 className="text-sm font-semibold text-text-primary">Tactic Published!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Board name + expiry */}
          <div>
            <p className="text-[12px] text-text-primary font-medium truncate">{boardName}</p>
            {expiresAt && (
              <p className="text-[11px] text-text-muted mt-0.5">
                Valid until <span className="text-text-primary">{formatDate(expiresAt)}</span> · 90 days
              </p>
            )}
          </div>

          {/* Deactivated state */}
          {deactivated ? (
            <div className="rounded-md bg-red-950/40 border border-red-900/50 px-3 py-2">
              <p className="text-[11px] text-red-400">This link has been deactivated.</p>
            </div>
          ) : (
            <>
              {/* Share URL */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Share link</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={url}
                    className="flex-1 min-w-0 text-[11px] bg-surface border border-border rounded-md
                               px-2.5 py-1.5 text-text-primary outline-none select-all"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 text-[11px] px-3 py-1.5 rounded-md border transition-colors font-medium
                      ${copied
                        ? 'border-green-600 bg-green-900/30 text-green-400'
                        : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
                      }`}
                  >
                    {copied ? 'Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>

              {/* Open in new tab */}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-[11px] text-accent-blue hover:underline"
              >
                Open in new tab ↗
              </a>
            </>
          )}

          {/* Footer */}
          <div className="flex gap-2 justify-between pt-1 border-t border-border">
            {!deactivated && (
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="text-[11px] px-3 py-1.5 rounded-md border border-border
                           text-red-400 hover:text-red-300 hover:border-red-900 transition-colors
                           disabled:opacity-50"
              >
                {deactivating ? 'Deactivating…' : 'Deactivate link'}
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-auto text-[11px] px-3.5 py-1.5 rounded-md bg-accent-blue text-white
                         hover:bg-blue-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
