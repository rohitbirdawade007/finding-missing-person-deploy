/**
 * pages/Login.jsx — Admin Login Page
 * Cyber-themed login form with JWT authentication.
 */

import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Already logged in → go to dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow-purple opacity-30 pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
               style={{ background: 'linear-gradient(135deg, #00d4ff22, #7c3aed22)', border: '1px solid #00d4ff44' }}>
            <Shield size={32} className="text-cyber-cyan" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin <span className="text-cyber-cyan glow-text">Access</span>
          </h1>
          <p className="text-cyber-muted text-sm">Authorized personnel only</p>
        </div>

        {/* Login card */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="scan-line" />

          {/* Corner decoration */}
          <div className="absolute top-0 right-0 w-16 h-16 opacity-20"
               style={{ background: 'linear-gradient(225deg, #00d4ff, transparent)' }} />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-cyber-muted uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@guardian.ai"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="cyber-input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-cyber-muted uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="cyber-input pl-10 pr-10"
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors"
                  onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={loading}
              className="btn-solid w-full justify-center mt-2 disabled:opacity-50 disabled:cursor-wait">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield size={16} /> Login to Dashboard
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-cyber-muted mt-6">
            Default: <span className="font-mono text-cyber-cyan">admin@guardian.ai</span>
            {' '}/ <span className="font-mono text-cyber-cyan">Admin@1234</span>
          </p>
        </div>
      </div>
    </div>
  )
}
