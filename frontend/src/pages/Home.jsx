/**
 * pages/Home.jsx — Landing Page
 *
 * Features:
 *  - Hero section with animated stats
 *  - Live stats from /stats API (Chart.js doughnut + bar)
 *  - How it works section
 *  - Quick action cards
 */

import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Eye, Search, AlertTriangle, CheckCircle,
  Clock, ArrowRight, Activity, Cpu, Database
} from 'lucide-react'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import api from '../api/axios'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const CHART_DEFAULTS = {
  plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
  maintainAspectRatio: false,
}

export default function Home() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/stats/').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const doughnutData = {
    labels: ['Pending', 'Solved'],
    datasets: [{
      data: [stats?.pending ?? 0, stats?.solved ?? 0],
      backgroundColor: ['rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)'],
      borderColor: ['rgba(245,158,11,0.3)', 'rgba(16,185,129,0.3)'],
      borderWidth: 1,
    }],
  }

  const barData = {
    labels: ['Total Complaints', 'Pending', 'Solved', 'Alerts'],
    datasets: [{
      label: 'Count',
      data: [
        stats?.total_complaints ?? 0,
        stats?.pending ?? 0,
        stats?.solved ?? 0,
        stats?.total_alerts ?? 0,
      ],
      backgroundColor: [
        'rgba(0,212,255,0.6)', 'rgba(245,158,11,0.6)',
        'rgba(16,185,129,0.6)', 'rgba(239,68,68,0.6)',
      ],
      borderRadius: 6,
    }],
  }

  return (
    <div className="animate-fade-in">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-glow-cyan opacity-20 pointer-events-none" />
        <div className="scan-line" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-medium"
             style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          AI Detection System — Online
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          Guardian
          <span className="text-cyber-cyan glow-text block">Eye AI</span>
        </h1>

        <p className="text-cyber-muted text-lg max-w-2xl mb-10 leading-relaxed">
          Advanced AI-powered missing person detection using
          <span className="text-cyber-cyan"> FaceNet facial recognition</span> and
          <span className="text-cyber-cyan"> real-time camera surveillance</span>.
          Report, detect, and reunite.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/complaint">
            <button className="btn-solid text-base px-8 py-3.5">
              <AlertTriangle size={18} /> Report Missing Person
            </button>
          </Link>
          <Link to="/track">
            <button className="btn-cyber text-base px-8 py-3.5">
              <Search size={18} /> Track Complaint
            </button>
          </Link>
        </div>

        {/* Live stat pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-14">
          {[
            { label: 'Total Complaints', value: stats?.total_complaints ?? '--', color: '#00d4ff' },
            { label: 'Pending',          value: stats?.pending ?? '--',          color: '#f59e0b' },
            { label: 'Solved',           value: stats?.solved ?? '--',           color: '#10b981' },
            { label: 'Alerts Fired',     value: stats?.total_alerts ?? '--',     color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card px-5 py-3 text-center min-w-[110px]">
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs text-cyber-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Charts ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Live <span className="text-cyber-cyan">Statistics</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-cyber-muted mb-4 uppercase tracking-widest">Case Resolution</h3>
            <div className="h-52">
              <Doughnut data={doughnutData} options={{
                ...CHART_DEFAULTS,
                cutout: '65%',
                plugins: {
                  ...CHART_DEFAULTS.plugins,
                  legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } },
                },
              }} />
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-cyber-muted mb-4 uppercase tracking-widest">System Overview</h3>
            <div className="h-52">
              <Bar data={barData} options={{
                ...CHART_DEFAULTS,
                scales: {
                  x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(30,58,95,0.4)' } },
                  y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(30,58,95,0.4)' }, beginAtZero: true },
                },
                plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          How <span className="text-cyber-cyan">It Works</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <AlertTriangle size={28} />, color: '#f59e0b',
              step: '01', title: 'Report',
              desc: 'Submit a complaint with the missing person\'s photo. FaceNet automatically extracts a 512-dim face embedding and stores it.',
            },
            {
              icon: <Cpu size={28} />, color: '#00d4ff',
              step: '02', title: 'Detect',
              desc: 'Real-time camera frames are processed by FaceNet every few seconds and compared against all stored face embeddings using cosine similarity.',
            },
            {
              icon: <CheckCircle size={28} />, color: '#10b981',
              step: '03', title: 'Alert',
              desc: 'When a match is found (similarity ≥ 0.6), an instant alert is generated with the detected face, location, and timestamp.',
            },
          ].map(({ icon, color, step, title, desc }) => (
            <div key={step} className="glass-card p-6 relative overflow-hidden group hover:border-cyber-cyan/30 transition-all duration-300">
              <div className="absolute top-4 right-4 text-5xl font-bold opacity-10 font-mono"
                   style={{ color }}>{step}</div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
                {icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-cyber-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { to: '/complaint', icon: <AlertTriangle size={20}/>, label: 'Register Complaint', color: '#f59e0b', desc: 'Report a missing person with photo' },
            { to: '/track',     icon: <Search size={20}/>,        label: 'Track Your Case',   color: '#00d4ff', desc: 'Check status with complaint ID' },
            { to: '/login',     icon: <Shield size={20}/>,        label: 'Admin Dashboard',   color: '#7c3aed', desc: 'Monitor detections in real-time' },
          ].map(({ to, icon, label, color, desc }) => (
            <Link to={to} key={to}>
              <div className="glass-card p-5 flex items-center gap-4 group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                   style={{ '--hover-color': color }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <div className="text-xs text-cyber-muted">{desc}</div>
                </div>
                <ArrowRight size={16} className="ml-auto text-cyber-muted group-hover:text-cyber-cyan transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-cyber-border mt-12 py-8 text-center text-xs text-cyber-muted">
        <p>Guardian Eye AI &copy; {new Date().getFullYear()} — AI-Based Missing Person Detection System</p>
        <p className="mt-1 font-mono text-cyber-cyan/50">Powered by FaceNet · MongoDB Atlas · FastAPI</p>
      </footer>
    </div>
  )
}
