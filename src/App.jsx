import { useState } from 'react'
import TopBar from './components/panels/TopBar'
import LeftPanel from './components/panels/LeftPanel'
import RightPanel from './components/panels/RightPanel'
import PitchCanvas from './components/pitch/PitchCanvas'
import Toolbar from './components/tools/Toolbar'
import ConfirmFormationModal from './components/ui/Modal'
import { useMobile } from './hooks/useMobile'

export default function App() {
  const isMobile = useMobile()
  // null = closed, 'left' = Team Setup, 'right' = Squad
  const [activeSheet, setActiveSheet] = useState(null)

  const toggleSheet = (panel) => {
    setActiveSheet((prev) => (prev === panel ? null : panel))
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      <TopBar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Desktop panels (md+) ── */}
        {!isMobile && <LeftPanel />}
        <PitchCanvas />
        {!isMobile && <RightPanel />}

        {/* ── Mobile bottom sheet ── */}
        {isMobile && (
          <>
            {/* Backdrop */}
            {activeSheet && (
              <div
                className="absolute inset-0 z-30 bg-black/40"
                onClick={() => setActiveSheet(null)}
              />
            )}

            {/* Sheet */}
            <div
              className="absolute bottom-0 left-0 right-0 z-40 bg-panel rounded-t-2xl
                         border-t border-border shadow-2xl
                         transition-transform duration-200 ease-out"
              style={{
                maxHeight: '65vh',
                transform: activeSheet ? 'translateY(0)' : 'translateY(100%)',
              }}
            >
              {/* Drag handle pill */}
              <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border opacity-60" />
              </div>

              {/* Sheet content */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(65vh - 28px)' }}>
                {activeSheet === 'left' && <LeftPanel />}
                {activeSheet === 'right' && <RightPanel />}
              </div>
            </div>
          </>
        )}
      </div>

      <Toolbar
        isMobile={isMobile}
        activeSheet={activeSheet}
        onToggleSheet={toggleSheet}
      />
      <ConfirmFormationModal />
    </div>
  )
}
