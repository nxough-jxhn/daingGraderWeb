import React, { useState, useEffect } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { authService } from '../services/auth.service'

interface User {
  name: string
  email: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User>({ name: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load current user
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser({ name: currentUser.name || '', email: currentUser.email || '' })
      } catch (err) {
        // If not logged in, use placeholder
        setUser({ name: 'User', email: 'user@example.com' })
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      // Frontend wiring - will call backend when /auth/profile endpoint is ready
      // For now, just update local state
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      
      // In real implementation:
      // await api.put('/auth/profile', user)
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    try {
      // Frontend wiring - will call backend when endpoint is ready
      // await api.put('/auth/password', { oldPassword, newPassword })
      alert('Password change feature will be available when backend is ready')
    } catch (err: any) {
      console.error('Password change error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Profile</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex justify-center">
            <div className="w-28 h-28 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
              Profile updated successfully!
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Name"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            placeholder="Your name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            placeholder="you@school.edu"
            required
          />
          
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.location.reload()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <div className="md:col-span-2 space-y-6">
        {/* Password change section */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Change Password</h3>
          <PasswordChangeForm onSubmit={handlePasswordChange} />
        </div>

        {/* Activity section */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Activity</h3>
          <div className="space-y-3">
            <div className="text-sm text-slate-500">
              Recent uploads and scans will appear here once backend integration is complete.
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-400">No activity yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordChangeForm({ onSubmit }: { onSubmit: (oldPassword: string, newPassword: string) => void }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    onSubmit(oldPassword, newPassword)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      <Input
        label="Current Password"
        type="password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        placeholder="••••••"
        required
      />
      <Input
        label="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="••••••"
        required
      />
      <Input
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••"
        required
      />
      <Button type="submit" variant="outline">
        Update Password
      </Button>
    </form>
  )
}
