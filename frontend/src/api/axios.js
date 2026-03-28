/**
 * api/axios.js — Centralized Axios instance
 *
 * All API calls go through this.
 * - Base URL from VITE_API_URL env variable
 * - JWT token auto-attached via request interceptor
 * - 401 responses auto-clear token and redirect to /login
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30s (face embedding extraction takes time)
})

// ── Request interceptor — attach JWT ──────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guardian_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handle 401 globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('guardian_token')
      localStorage.removeItem('guardian_admin')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
