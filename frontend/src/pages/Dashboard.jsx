/**
 * pages/Dashboard.jsx — Admin Dashboard & Live Detection
 *
 * Core features:
 * 1. Live camera feed using native HTML5 Video
 * 2. Background task: capture frame every 3s → send to /detect/frame
 * 3. Fetch and display alerts
 * 4. Fetch and display pending complaints
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera, AlertCircle, CheckCircle, Video, Play, Pause, Bell, Users,
  MapPin, Clock, Eye, X
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const CAPTURE_INTERVAL_MS = 3000 // 3 seconds

export default function Dashboard() {
  const { admin } = useAuth()
  const [isDetecting, setIsDetecting] = useState(false)
  const [alerts, setAlerts]           = useState([])
  const [complaints, setComplaints]   = useState([])
  const [stats, setStats]             = useState(null)
  const [camError, setCamError]       = useState('')

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const intervalRef = useRef(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // ── Fetch Initial Data ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [alertsRes, complaintsRes, statsRes] = await Promise.all([
        api.get('/alerts/?limit=10'),
        api.get('/complaint/?status_filter=pending&limit=10'),
        api.get('/stats/')
      ])
      setAlerts(alertsRes.data.alerts)
      setComplaints(complaintsRes.data.complaints)
      setStats(statsRes.data)
    } catch (err) {
      console.error("Failed to fetch dashboard data", err)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const dataInterval = setInterval(fetchData, 10000) // refresh data every 10s
    return () => clearInterval(dataInterval)
  }, [fetchData])

  // ── Camera Control ───────────────────────────────────────────
  const startCamera = async () => {
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
      setIsDetecting(true)
    } catch (err) {
      console.error(err)
      setCamError('Microphone/Camera access denied or unavailable.')
      setIsDetecting(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  // Toggle Camera
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // ── Detection Loop ───────────────────────────────────────────
  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || !isDetecting) return

    const video = videoRef.current
    if (video.readyState !== 4) return // wait until video is fully playing

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Draw video frame to canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get base64 jpeg
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    const base64Str = dataUrl.split(',')[1] // remove 'data:image/jpeg;base64,' prefix

    try {
      const res = await api.post('/detect/frame', {
        frame_b64: base64Str,
        location: 'Dashboard Web Cam'
      })

      if (res.data.matched && res.data.alerts?.length > 0) {
        // Trigger immediate fetch to show new alerts
        fetchData()
      }
    } catch (err) {
      console.error("Detection error:", err)
    }
  }, [isDetecting, fetchData])

  useEffect(() => {
    if (isDetecting) {
      intervalRef.current = setInterval(captureAndDetect, CAPTURE_INTERVAL_MS)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isDetecting, captureAndDetect])

  // ── Handlers ─────────────────────────────────────────────────
  const handleAcknowledge = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/ack`)
      // Optimistic update
      setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, acknowledged: true } : a))
      fetchData()
    } catch (err) {
      console.error("Failed to ack alert", err)
    }
  }

  const handleMarkSolved = async (complaintId) => {
    try {
      const fd = new FormData()
      fd.append('new_status', 'solved')
      await api.patch(`/complaint/${complaintId}/status`, fd)
      fetchData()
    } catch (err) {
       console.error("Failed to update status", err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Command <span className="text-cyber-cyan glow-text">Center</span>
          </h1>
          <p className="text-cyber-muted text-sm mt-1">
            Logged in as <span className="font-mono text-cyber-cyan">{admin?.email}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <StatBox label="Pending Cases" value={stats?.pending ?? '--'} color="#f59e0b" />
          <StatBox label="Active Alerts" value={stats?.unacknowledged_alerts ?? '--'} color="#ef4444" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left Column: Camera Feed ────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          <div className="glass-card p-6 border-t-2" style={{ borderTopColor: isDetecting ? '#10b981' : '#3b82f6' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video size={20} className={isDetecting ? 'text-emerald-400' : 'text-cyber-cyan'} />
                Live Camera Feed
              </h2>
              <div className="flex gap-3">
                {isDetecting ? (
                  <button onClick={stopCamera} className="btn-danger py-1.5 px-4 text-sm">
                    <Pause size={14} /> Stop Scanning
                  </button>
                ) : (
                  <button onClick={startCamera} className="btn-solid py-1.5 px-4 text-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <Play size={14} /> Start Camera
                  </button>
                )}
              </div>
            </div>

            {camError && (
              <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {camError}
              </div>
            )}

            {/* Video Container */}
            <div className={`relative bg-cyber-bg rounded-lg overflow-hidden border ${isDetecting ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-cyber-border' } aspect-video flex items-center justify-center`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isDetecting ? 'hidden' : ''}`}
              />

              {!isDetecting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-cyber-muted opacity-50">
                  <Camera size={48} className="mb-2" />
                  <p>Camera offline</p>
                </div>
              )}

              {/* Scanning Overlay Animation */}
              {isDetecting && (
                <>
                  <div className="scan-line" style={{ animationDuration: '2s', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)' }} />
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur rounded border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    AI DETECTING
                  </div>
                </>
              )}
            </div>

            {/* Hidden canvas for capturing frames */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4 text-xs text-cyber-muted flex justify-between">
              <span>Resolution: {isDetecting && videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'Offline'}</span>
              <span>Scan Interval: {CAPTURE_INTERVAL_MS / 1000}s</span>
            </div>
          </div>

          {/* Pending Complaints Table */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Users size={20} className="text-amber-400" />
              Active Pending Cases
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-cyber-muted uppercase bg-cyber-bg/50 border-b border-cyber-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Photo</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Last Seen</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-cyber-muted">No pending cases.</td>
                    </tr>
                  ) : (
                    complaints.map(complaint => (
                      <tr key={complaint.complaint_id} className="border-b border-cyber-border/50 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                           {complaint.photo_path ? (
                              <img src={`${API_URL}/${complaint.photo_path}`} className="w-10 h-10 rounded object-cover border border-cyber-border" alt={complaint.name} />
                           ) : (
                              <div className="w-10 h-10 rounded bg-cyber-bg flex items-center justify-center"><User size={16} className="opacity-50"/></div>
                           )}
                        </td>
                        <td className="px-4 py-3 font-medium text-cyber-text">{complaint.name}</td>
                        <td className="px-4 py-3 text-cyber-muted">{complaint.last_seen_location || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleMarkSolved(complaint.complaint_id)} className="text-xs py-1 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                            <CheckCircle size={12}/> Mark Solved
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── Right Column: Alerts Feed ───────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="glass-card p-5 sticky top-20 flex flex-col h-[calc(100vh-6rem)]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Bell size={20} className="text-red-400" />
              Recent Alerts
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-10 text-cyber-muted flex flex-col items-center">
                   <Shield size={32} className="mb-2 opacity-20" />
                   <p>No recent detections.</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.alert_id} className={`p-4 rounded-lg border relative transition-all ${!alert.acknowledged ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-cyber-bg border-cyber-border opacity-60 grayscale-[50%]'}`}>
                    {!alert.acknowledged && (
                       <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}

                    <div className="flex gap-3 mb-3">
                      {/* Detected Face Snippet */}
                      {alert.detected_face_b64 ? (
                        <div className="relative shrink-0">
                          <img src={`data:image/jpeg;base64,${alert.detected_face_b64}`} className="w-16 h-16 rounded border-2 border-red-500/50 object-cover" alt="Detected" />
                          <div className="absolute -bottom-2 -left-2 bg-black px-1 rounded text-[10px] text-red-400 font-mono border border-red-500/50 flex items-center gap-1">
                            <Eye size={10}/> MATCH
                          </div>
                        </div>
                      ) : (
                         <div className="w-16 h-16 rounded bg-black/50 border border-cyber-border shrink-0 flex items-center justify-center">N/A</div>
                      )}

                      <div>
                        <h3 className="font-bold text-white text-sm">{alert.name}</h3>
                        <p className="text-xs text-cyber-muted font-mono mt-1 break-all">ID: {alert.complaint_id.substring(0,8)}...</p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-cyber-cyan border border-cyber-cyan/30 font-mono">
                             Conf: {(alert.score * 100).toFixed(1)}%
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-cyber-muted mb-3 p-2 bg-black/20 rounded">
                       <div className="flex items-center gap-1"><MapPin size={12}/> {alert.location}</div>
                       <div className="flex items-center gap-1"><Clock size={12}/> {new Date(alert.created_at).toLocaleTimeString()}</div>
                    </div>

                    {!alert.acknowledged && (
                       <button onClick={() => handleAcknowledge(alert.alert_id)} className="w-full py-1.5 text-xs font-semibold text-cyber-text bg-cyber-bg border border-cyber-border rounded hover:bg-white/5 transition-colors">
                         Acknowledge Alert
                       </button>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="glass-card px-4 py-2 flex flex-col items-center min-w-[100px]" style={{ borderBottomColor: color, borderBottomWidth: '2px' }}>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] text-cyber-muted uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  )
}
