import TopBar from './components/panels/TopBar'
import LeftPanel from './components/panels/LeftPanel'
import RightPanel from './components/panels/RightPanel'
import PitchCanvas from './components/pitch/PitchCanvas'
import Toolbar from './components/tools/Toolbar'
import ConfirmFormationModal from './components/ui/Modal'
export default function App() {
  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <PitchCanvas />
        <RightPanel />
      </div>

      <Toolbar />
      <ConfirmFormationModal />
    </div>
  )
}
