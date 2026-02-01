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
      const response = await authService.register({
        name,
        email,
        password,
      })

      if (response.token) {
        localStorage.setItem('token', response.token)
        login(response.token, {
          id: response.user?.id,
          name: response.user?.name || name,
          email: response.user?.email || email,
          avatar_url: response.user?.avatar_url ?? null,
        })
        hideToast()
        navigate('/profile')
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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
