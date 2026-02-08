import api from './api'

export const authService = {
  /**
   * Login user
   * Frontend wiring - will call backend when /auth/login endpoint is ready
   */
  async login(email: string, password: string, admin_code?: string) {
    try {
      const response = await api.post('/auth/login', { email, password, admin_code })
      return response.data
    } catch (error: any) {
      // If backend endpoint doesn't exist yet, return mock response for development
      if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
        console.warn('Backend auth endpoint not available. Using mock response.')
        // Mock successful login for frontend development
        return {
          token: 'mock-token-' + Date.now(),
          user: { email, name: email.split('@')[0], role: 'user' },
        }
      }
      throw error
    }
  },

  /**
   * Register new user
   * Frontend wiring - will call backend when /auth/register endpoint is ready
   */
  async register(userData: { name: string; email: string; password: string; role?: string; admin_code?: string }) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error: any) {
      // If backend endpoint doesn't exist yet, return mock response for development
      if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
        console.warn('Backend auth endpoint not available. Using mock response.')
        // Mock successful registration for frontend development
        return {
          token: 'mock-token-' + Date.now(),
          user: { email: userData.email, name: userData.name, role: userData.role ?? 'user' },
        }
      }
      throw error
    }
  },

  /**
   * Logout user - clears stored token
   */
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('rememberEmail')
  },

  /**
   * Get current user from token (GET /auth/me)
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
        const token = localStorage.getItem('token')
        if (token) {
          return {
            email: 'user@example.com',
            name: 'User',
            full_name: 'User Example',
            phone: '',
            city: '',
            street_address: '',
            province: '',
            gender: '',
            avatar_url: null,
            role: 'user',
          }
        }
      }
      throw error
    }
  },

  /**
   * Update profile (name) - PATCH /auth/profile
   */
  async updateProfile(data: {
    name?: string
    full_name?: string
    phone?: string
    email?: string
    city?: string
    street_address?: string
    province?: string
    gender?: string
  }) {
    const response = await api.patch('/auth/profile', data)
    return response.data
  },

  /**
   * Upload profile avatar - POST /auth/profile/avatar (saves to Cloudinary + MongoDB)
   */
  async uploadProfileAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/auth/profile/avatar', formData)
    return response.data
  },
}
