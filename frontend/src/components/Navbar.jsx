/**
 * components/Navbar.jsx — Main navigation bar
 * Cyber-themed sticky navbar with mobile hamburger menu.
 */

import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Menu, X, Eye, LogOut } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated, logout, admin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const links = [
    { to: '/',          label: 'Home' },
    { to: '/complaint', label: 'Report Missing' },
    { to: '/track',     label: 'Track Complaint' },
    { to: '/about',     label: 'About' },
  ]

  return (
    <nav className="sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-lg"
               style={{ background: 'linear-gradient(135deg, #00d4ff22, #7c3aed22)', border: '1px solid #00d4ff44' }}>
            <Eye size={20} className="text-cyber-cyan group-hover:animate-pulse" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">Guardian</span>
            <span className="text-cyber-cyan glow-text">Eye</span>
            <span className="text-cyber-muted text-xs ml-1.5 font-mono">AI</span>
          </span>
        </NavLink>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          )}
        </div>

        {/* Auth actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-xs text-cyber-muted font-mono truncate max-w-[140px]">
                {admin?.email}
              </span>
              <button onClick={handleLogout}
                className="btn-danger py-2 px-4 text-sm gap-1.5">
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <NavLink to="/login">
              <button className="btn-cyber py-2 px-4 text-sm">
                <Shield size={14} /> Admin Login
              </button>
            </NavLink>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-cyber-muted hover:text-cyber-cyan transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-3 border-t border-cyber-border pt-3 flex flex-col gap-3 animate-slide-in">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link text-base ${isActive ? 'active' : ''}`}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link text-base ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          )}
          <div className="pt-2 border-t border-cyber-border">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn-danger py-2 px-4 text-sm w-full justify-center">
                <LogOut size={14} /> Logout
              </button>
            ) : (
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                <button className="btn-cyber py-2 px-4 text-sm w-full justify-center">
                  <Shield size={14} /> Admin Login
                </button>
              </NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
