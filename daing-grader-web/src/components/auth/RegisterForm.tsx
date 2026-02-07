import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../ui/Input'
import PasswordInput from '../ui/PasswordInput'
import Button from '../ui/Button'
import { authService } from '../../services/auth.service'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast, hideToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSeller, setIsSeller] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    showToast('Creating account...')

    try {
      // Admin code overrides role; seller checkbox is used when no admin code is provided.
      const role = adminCode.trim() ? 'admin' : (isSeller ? 'seller' : 'user')
      const response = await authService.register({
        name,
        email,
        password,
        role,
        admin_code: adminCode.trim() || undefined,
      })

      if (response.token) {
        localStorage.setItem('token', response.token)
        login(response.token, {
          id: response.user?.id,
          name: response.user?.name || name,
          email: response.user?.email || email,
          avatar_url: response.user?.avatar_url ?? null,
          role: response.user?.role || role,
        })
        hideToast()
        // Redirect admin to dashboard, others to profile
        const userRole = response.user?.role || role
        navigate(userRole === 'admin' ? '/admin' : '/profile')
      } else {
        hideToast()
        navigate('/login')
      }
    } catch (err: any) {
      hideToast()
      setError(err.response?.data?.detail || err.response?.data?.message || 'Registration failed. Please try again.')
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
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="John Doe"
        required
        error={error && name === '' ? 'Name is required' : null}
      />
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
      <PasswordInput
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••"
        required
        error={error && confirmPassword === '' ? 'Please confirm your password' : null}
      />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isSeller}
          onChange={(e) => {
            setIsSeller(e.target.checked)
            // Clear admin code when registering as seller
            if (e.target.checked) setAdminCode('')
          }}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        Register as Seller
      </label>
      {/* Admin code field - only shown when NOT registering as seller */}
      {!isSeller && (
        <Input
          label="Admin Code (admins only)"
          type="password"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          placeholder="Enter admin code if applicable"
        />
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
