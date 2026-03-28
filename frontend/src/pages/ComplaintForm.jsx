/**
 * pages/ComplaintForm.jsx — Missing Person Complaint Registration
 *
 * Multipart form that uploads:
 *   - Text fields (name, mobile, contact, etc.)
 *   - person photo (triggers FaceNet embedding extraction on backend)
 *   - ID proof image
 *
 * On success, shows the unique complaint ID for tracking.
 */

import { useState, useRef } from 'react'
import { Upload, User, Phone, FileText, MapPin, CheckCircle, AlertCircle, Camera } from 'lucide-react'
import api from '../api/axios'

export default function ComplaintForm() {
  const [form, setForm] = useState({
    name: '', mobile: '', contact_person: '',
    age: '', gender: '', last_seen_location: '', description: '',
  })
  const [photo, setPhoto]     = useState(null)
  const [idProof, setIdProof] = useState(null)
  const [photoPreview, setPhotoPreview]   = useState(null)
  const [idPreview, setIdPreview]         = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)   // { complaint_id, has_embedding, warning }
  const [error, setError]     = useState('')

  const photoRef  = useRef()
  const idRef     = useRef()

  const handleFile = (file, setFile, setPreview) => {
    if (!file) return
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!photo || !idProof) { setError('Please upload both required photos.'); return }
    setError(''); setLoading(true)

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
    fd.append('photo',    photo)
    fd.append('id_proof', idProof)

    try {
      const res = await api.post('/complaint/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // embedding extraction can take ~10-20s
      })
      setSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="glass-card p-10">
          <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Complaint Registered!</h2>
          <p className="text-cyber-muted mb-6 text-sm">Save your complaint ID for tracking</p>

          <div className="rounded-lg p-4 mb-6"
               style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <p className="text-xs text-cyber-muted mb-1 uppercase tracking-widest">Complaint ID</p>
            <p className="font-mono text-cyber-cyan text-lg break-all">{success.complaint_id}</p>
          </div>

          {success.has_embedding
            ? <p className="text-emerald-400 text-sm flex items-center justify-center gap-2 mb-6">
                <CheckCircle size={14}/> Face embedding extracted — person is now in detection system
              </p>
            : <p className="text-amber-400 text-sm flex items-center justify-center gap-2 mb-6">
                <AlertCircle size={14}/> {success.warning}
              </p>
          }

          <button onClick={() => setSuccess(null)} className="btn-cyber w-full justify-center">
            Register Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Report <span className="text-cyber-cyan glow-text">Missing Person</span>
        </h1>
        <p className="text-cyber-muted text-sm">Fill out all details carefully. A face embedding will be automatically extracted from the photo.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 flex flex-col gap-6">

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Photo uploads */}
        <div className="grid grid-cols-2 gap-4">
          <FileUpload
            id="complaint-photo"
            label="Person Photo *"
            hint="Clear face photo required for AI detection"
            preview={photoPreview}
            icon={<Camera size={24} className="text-cyber-cyan" />}
            inputRef={photoRef}
            onChange={f => handleFile(f, setPhoto, setPhotoPreview)}
          />
          <FileUpload
            id="complaint-id-proof"
            label="ID Proof *"
            hint="Aadhaar / PAN / Passport"
            preview={idPreview}
            icon={<FileText size={24} className="text-cyber-cyan" />}
            inputRef={idRef}
            onChange={f => handleFile(f, setIdProof, setIdPreview)}
          />
        </div>

        {/* Text fields */}
        <div className="grid grid-cols-2 gap-4">
          <Field id="f-name" label="Full Name *" icon={<User size={14}/>}>
            <input required placeholder="Rahul Sharma" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} className="cyber-input" />
          </Field>
          <Field id="f-mobile" label="Mobile Number *" icon={<Phone size={14}/>}>
            <input required placeholder="9876543210" maxLength={10} value={form.mobile}
              onChange={e => setForm({...form, mobile: e.target.value})} className="cyber-input" />
          </Field>
          <Field id="f-contact" label="Contact Person *" icon={<User size={14}/>}>
            <input required placeholder="Relative / Guardian name" value={form.contact_person}
              onChange={e => setForm({...form, contact_person: e.target.value})} className="cyber-input" />
          </Field>
          <Field id="f-age" label="Age" icon={<User size={14}/>}>
            <input type="number" min={1} max={120} placeholder="eg. 25" value={form.age}
              onChange={e => setForm({...form, age: e.target.value})} className="cyber-input" />
          </Field>
          <Field id="f-gender" label="Gender" icon={<User size={14}/>}>
            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
              className="cyber-input">
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field id="f-location" label="Last Seen Location" icon={<MapPin size={14}/>}>
            <input placeholder="Area, City" value={form.last_seen_location}
              onChange={e => setForm({...form, last_seen_location: e.target.value})} className="cyber-input" />
          </Field>
        </div>

        <Field id="f-desc" label="Description" icon={<FileText size={14}/>}>
          <textarea rows={3} placeholder="Clothing, identifying marks, circumstances..."
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="cyber-input resize-none" />
        </Field>

        <button id="complaint-submit" type="submit" disabled={loading}
          className="btn-solid w-full justify-center disabled:opacity-50 disabled:cursor-wait">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Processing &amp; Extracting Face Embedding...
            </span>
          ) : (
            <span className="flex items-center gap-2"><Upload size={16}/> Submit Complaint</span>
          )}
        </button>

        <p className="text-xs text-cyber-muted text-center">
          ⏱ Processing may take 15–30 seconds for face embedding extraction.
        </p>
      </form>
    </div>
  )
}

function FileUpload({ id, label, hint, preview, icon, inputRef, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-cyber-muted uppercase tracking-widest">{label}</label>
      <div
        className="relative flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 overflow-hidden"
        style={{ border: '2px dashed rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.03)', minHeight: '120px' }}
        onClick={() => inputRef.current.click()}>
        {preview
          ? <img src={preview} alt="preview" className="w-full h-full object-cover absolute inset-0" />
          : <>{icon}<p className="text-cyber-muted text-xs mt-2 text-center px-2">{hint}</p></>}
        <input id={id} ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => onChange(e.target.files[0])} />
      </div>
    </div>
  )
}

function Field({ id, label, icon, children }) {
  return (
    <div className="flex flex-col gap-1.5" id={id}>
      <label className="flex items-center gap-1 text-xs text-cyber-muted uppercase tracking-widest">
        {icon}{label}
      </label>
      {children}
    </div>
  )
}
