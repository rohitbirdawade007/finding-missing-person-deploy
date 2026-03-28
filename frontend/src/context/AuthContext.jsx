/**
 * context/AuthContext.jsx — JWT Authentication Context
 *
 * Provides login state + actions to all components via React Context.
 * JWT token is stored in localStorage under 'guardian_token'.
 *
 * Usage in any component:
 *   const { admin, login, logout, isAuthenticated } = useAuth()
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Restore session from localStorage on app load ──────────
  useEffect(() => {
    const token     = localStorage.getItem('guardian_token')
    const savedAdmin = localStorage.getItem('guardian_admin')
    if (token && savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  // ── Login: call /auth/login → store token ──────────────────
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, email: adminEmail, role } = res.data

    localStorage.setItem('guardian_token', access_token)
    localStorage.setItem('guardian_admin', JSON.stringify({ email: adminEmail, role }))
    setAdmin({ email: adminEmail, role })
    return res.data
  }, [])

  // ── Logout: clear everything ───────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('guardian_token')
    localStorage.removeItem('guardian_admin')
    setAdmin(null)
  }, [])

  const value = {
    admin,
    loading,
    isAuthenticated: !!admin,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
