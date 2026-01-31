import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Add JWT token to requests if user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

/** POST image to /analyze; returns blob (image/jpeg). Used by Grade page. */
export async function analyzeImage(file: File): Promise<Blob> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<Blob>('/analyze', formData, { responseType: 'blob' })
  return response.data
}

export default api
