import React, { useState, useEffect, useRef } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { authService } from '../services/auth.service'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Camera } from 'lucide-react'

interface User {
  id?: string
  name: string
  email: string
  avatar_url?: string | null
}

export default function ProfilePage() {
  const { setUser: setAuthUser } = useAuth()
  const { showToast, hideToast } = useToast()
  const [user, setUser] = useState<User>({ name: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser({
        id: currentUser.id,
        name: currentUser.name || '',
        email: currentUser.email || '',
        avatar_url: currentUser.avatar_url ?? null,
      })
    } catch {
      setUser({ name: 'User', email: 'user@example.com' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    showToast('Updating profile...')
    try {
      const updated = await authService.updateProfile({ name: user.name })
      setUser((u) => ({ ...u, name: updated.name ?? u.name }))
      setAuthUser((prev) => (prev ? { ...prev, name: updated.name ?? prev.name } : null))
      hideToast()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      hideToast()
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    setUploadingAvatar(true)
    showToast('Uploading image...')
    try {
      const data = await authService.uploadProfileAvatar(file)
      const url = data.avatar_url || null
      setUser((u) => ({ ...u, avatar_url: url }))
      setAuthUser((prev) => (prev ? { ...prev, avatar_url: url } : null))
      hideToast()
    } catch (err: any) {
      hideToast()
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    try {
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
          <div className="flex flex-col items-center gap-3">
            <label className="relative cursor-pointer group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              <div className="w-28 h-28 rounded-full border-4 border-slate-200 overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-pointer">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow border-2 border-white">
                <Camera className="w-4 h-4" />
              </span>
            </label>
            <span className="text-xs text-slate-500">
              {uploadingAvatar ? 'Uploading…' : 'Click photo to upload (saved to backend)'}
            </span>
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
            disabled
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1 cursor-pointer">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => loadUser()}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <div className="md:col-span-2 space-y-6">
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Change Password</h3>
          <PasswordChangeForm onSubmit={handlePasswordChange} />
        </div>

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
      <Button type="submit" variant="outline" className="cursor-pointer">
        Update Password
      </Button>
    </form>
  )
}
