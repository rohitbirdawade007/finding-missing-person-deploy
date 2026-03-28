import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ComplaintForm from './pages/ComplaintForm'
import TrackComplaint from './pages/TrackComplaint'

export default function App() {
  return (
    <div className="cyber-bg min-h-screen">
      <Navbar />
      <main>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/complaint" element={<ComplaintForm />} />
          <Route path="/track"     element={<TrackComplaint />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          {/* Fallback */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
              <span className="text-6xl font-bold text-cyber-cyan glow-text">404</span>
              <p className="text-cyber-muted">Page not found</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}
