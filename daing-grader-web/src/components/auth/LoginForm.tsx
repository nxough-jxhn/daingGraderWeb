import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../ui/Input'
import PasswordInput from '../ui/PasswordInput'
import Button from '../ui/Button'
import { authService } from '../../services/auth.service'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast, hideToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loginAsAdmin, setLoginAsAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    showToast('Logging in...')

    try {
      const response = await authService.login(email, password, loginAsAdmin ? adminCode.trim() : undefined)

      if (response.token) {
        localStorage.setItem('token', response.token)
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email)
        }
        login(response.token, {
          id: response.user?.id,
          name: response.user?.name || email.split('@')[0],
          email: response.user?.email || email,
          avatar_url: response.user?.avatar_url ?? null,
          role: response.user?.role || 'user',
        })
      }

      hideToast()
      // Redirect admin to admin dashboard, seller to seller dashboard, others to profile
      const userRole = response.user?.role || 'user'
      navigate(userRole === 'admin' ? '/admin' : userRole === 'seller' ? '/seller/dashboard' : '/profile')
    } catch (err: any) {
      hideToast()
      setError(err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@univ.edu"
        required
        error={error && email === '' ? 'Email is required' : null}
      />
      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••"
        required
        error={error && password === '' ? 'Password is required' : null}
      />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={loginAsAdmin}
          onChange={(e) => setLoginAsAdmin(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        Login as Admin
      </label>
      {loginAsAdmin && (
        <Input
          label="Admin Code"
          type="password"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          placeholder="Enter admin code"
          required
        />
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-slate-600">Remember me</span>
        </label>
        <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
          Forgot password?
        </a>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
