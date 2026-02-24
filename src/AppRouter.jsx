import { Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import SharedTacticView from './pages/SharedTacticView'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/"        element={<App />} />
      <Route path="/t/:slug" element={<SharedTacticView />} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  )
}
