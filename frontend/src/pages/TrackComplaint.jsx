/**
 * pages/TrackComplaint.jsx — Track Complaint by ID
 */

import { useState } from 'react'
import { Search, FileText, AlertCircle, CheckCircle, Clock, User, Phone, MapPin } from 'lucide-react'
import api from '../api/axios'

export default function TrackComplaint() {
  const [complaintId, setComplaintId] = useState('')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!complaintId.trim()) return
    setError(''); setResult(null); setLoading(true)
    try {
      const res = await api.get(`/complaint/${complaintId.trim()}`)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.status === 404
        ? 'No complaint found with that ID.'
        : 'Error fetching complaint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          Track <span className="text-cyber-cyan glow-text">Complaint</span>
        </h1>
        <p className="text-cyber-muted">Enter your complaint ID to check status</p>
      </div>

      {/* Search */}
      <div className="glass-card p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
            <input
              id="track-search-input"
              type="text"
              placeholder="Enter Complaint ID (UUID)"
              value={complaintId}
              onChange={e => setComplaintId(e.target.value)}
              className="cyber-input pl-10 font-mono text-sm"
            />
          </div>
          <button id="track-search-btn" type="submit" disabled={loading} className="btn-solid px-5">
            {loading
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Search size={16} />}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg text-sm"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass-card overflow-hidden animate-slide-in">
          {/* Status banner */}
          <div className={`px-6 py-3 flex items-center gap-3 ${
            result.status === 'solved'
              ? 'bg-emerald-500/10 border-b border-emerald-500/20'
              : 'bg-amber-500/10 border-b border-amber-500/20'
          }`}>
            {result.status === 'solved'
              ? <CheckCircle size={18} className="text-emerald-400" />
              : <Clock size={18} className="text-amber-400" />}
            <span className={`font-semibold capitalize ${result.status === 'solved' ? 'text-emerald-400' : 'text-amber-400'}`}>
              Status: {result.status}
            </span>
          </div>

          <div className="p-6 grid gap-5">
            {/* Photo */}
            {result.photo_path && (
              <div className="flex justify-center">
                <img
                  src={`${API_URL}/${result.photo_path}`}
                  alt={result.name}
                  className="w-32 h-32 rounded-xl object-cover"
                  style={{ border: '2px solid rgba(0,212,255,0.3)' }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem icon={<User size={14}/>}      label="Name"            value={result.name} />
              <InfoItem icon={<Phone size={14}/>}     label="Mobile"          value={result.mobile} />
              <InfoItem icon={<User size={14}/>}      label="Contact Person"  value={result.contact_person} />
              <InfoItem icon={<MapPin size={14}/>}    label="Last Seen"       value={result.last_seen_location || 'Not specified'} />
              <InfoItem icon={<FileText size={14}/>}  label="Complaint ID"    value={result.complaint_id} mono />
              <InfoItem icon={<Clock size={14}/>}     label="Registered On"
                value={new Date(result.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
            </div>

            {result.description && (
              <div className="pt-4 border-t border-cyber-border">
                <p className="text-xs text-cyber-muted uppercase tracking-widest mb-1">Description</p>
                <p className="text-cyber-text text-sm">{result.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-cyber-muted pt-2 border-t border-cyber-border">
              <span className={`w-2 h-2 rounded-full ${result.has_embedding ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {result.has_embedding
                ? 'Face embedding stored — active in detection system'
                : 'No face embedding — photo may need to be clearer'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ icon, label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-cyber-muted text-xs uppercase tracking-widest">{icon}{label}</div>
      <span className={`text-cyber-text font-medium ${mono ? 'font-mono text-xs text-cyber-cyan break-all' : ''}`}>{value}</span>
    </div>
  )
}
