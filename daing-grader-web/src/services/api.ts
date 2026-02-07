import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Add JWT token; for FormData leave Content-Type unset so browser sets multipart boundary
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/** GET history entries from Cloudinary (same as mobile). */
export interface HistoryEntry {
  id: string
  timestamp: string
  url: string
  folder: string
}

export async function getHistory(signal?: AbortSignal): Promise<HistoryEntry[]> {
  const response = await api.get<{ status: string; entries: HistoryEntry[] }>('/history', { signal })
  // Backend returns { status: "success", entries: [...] } - parse accordingly
  if (response.data.status !== 'success' || !Array.isArray(response.data.entries)) {
    return []
  }
  return response.data.entries
}

/** Admin scans (web backend): paginated table. */
export interface AdminScanEntry {
  id: string
  timestamp: string
  url?: string | null
  fish_type: string
  grade: string
  score: number | null
  user_name: string
}

export interface AdminScanPage {
  status: string
  page: number
  page_size: number
  total: number
  entries: AdminScanEntry[]
}

export interface AdminScanMonthSummary {
  key: string
  label: string
  count: number
}

export async function getAdminScanPage(page = 1, pageSize = 10): Promise<AdminScanPage> {
  const response = await api.get<AdminScanPage>('/admin/scans', {
    params: { page, page_size: pageSize },
  })
  return response.data
}

export async function getAdminScanSummary(year: number): Promise<{ status: string; year: number; months: AdminScanMonthSummary[] }> {
  const response = await api.get<{ status: string; year: number; months: AdminScanMonthSummary[] }>('/admin/scans/summary', {
    params: { year },
  })
  return response.data
}

/** Contact form payload - used by Contact page. */
export interface ContactPayload {
  name: string
  email: string
  contact_number?: string
  subject: string
  message: string
}

/** POST contact form; sends email to CONTACT_EMAIL (shathesisgroup@gmail.com). */
export async function sendContactMessage(payload: ContactPayload): Promise<{ status: string; message: string }> {
  const response = await api.post<{ status: string; message: string }>('/contact', payload)
  return response.data
}

/** POST image to /analyze; returns blob (image/jpeg). Used by Grade page. */
export async function analyzeImage(file: File): Promise<Blob> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<Blob>('/analyze', formData, { responseType: 'blob' })
  return response.data
}

/**
 * Test if the web app can reach the backend (for Profile button connection test).
 * Uses GET / which returns {"status": "ok"} when the backend is up.
 */
export async function checkBackendConnection(): Promise<void> {
  try {
    await api.get('/')
  } catch (err: unknown) {
    const ax = err as { response?: { status?: number }; code?: string; message?: string }
    if (ax.response != null) return
    if (ax.code === 'ERR_CANCELED') return
    if (ax.code === 'ECONNREFUSED' || ax.message?.includes('Network Error')) {
      throw new Error('Could not connect to backend.')
    }
    throw err
  }
}

export default api
