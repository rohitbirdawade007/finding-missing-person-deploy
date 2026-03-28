/**
 * components/ProtectedRoute.jsx
 * Wraps any route that requires admin authentication.
 * Redirects to /login if not authenticated.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
