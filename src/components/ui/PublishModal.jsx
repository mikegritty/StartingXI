import { useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { publishTactic } from '../../lib/publish'

export default function PublishModal({ onClose, onPublished }) {
  const board = useBoardStore((s) => s.board)
  const [status, setStatus]   = useState('idle')   // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && status !== 'loading') onClose()
  }

  const handlePublish = async () => {
    setStatus('loading')
    try {
      const slug = await publishTactic(board)
      onPublished(slug)
    } catch (err) {
      setErrorMsg(err?.message ?? 'Something went wrong. Please try again.')
      setStatus('error')
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
          <h2 className="text-sm font-semibold text-text-primary">Publish & Share</h2>
          {status !== 'loading' && (
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary text-lg leading-none transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          {status === 'idle' && (
            <>
              <p className="text-[12px] text-text-muted mb-1 leading-relaxed">
                Publish <span className="text-text-primary font-medium">"{board.name}"</span> as a shareable link.
              </p>
              <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
                Anyone with the link can view this tactic for <span className="text-text-primary">90 days</span>. No login required.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="text-[11px] px-3.5 py-1.5 rounded-md border border-border
                             text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  className="text-[11px] px-3.5 py-1.5 rounded-md bg-accent-blue text-white
                             hover:bg-blue-700 transition-colors font-medium"
                >
                  Publish
                </button>
              </div>
            </>
          )}

          {status === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="w-4 h-4 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
              <span className="text-[12px] text-text-muted">Publishing…</span>
            </div>
          )}

          {status === 'error' && (
            <>
              <p className="text-[12px] text-red-400 mb-4 leading-relaxed">{errorMsg}</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="text-[11px] px-3.5 py-1.5 rounded-md border border-border
                             text-text-muted hover:text-text-primary transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handlePublish}
                  className="text-[11px] px-3.5 py-1.5 rounded-md bg-accent-blue text-white
                             hover:bg-blue-700 transition-colors font-medium"
                >
                  Try again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
