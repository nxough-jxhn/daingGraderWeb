import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import PageTitleHero from '../components/layout/PageTitleHero'
import { ScrollArea } from '@mantine/core'
import { authService } from '../services/auth.service'
import {
  getAdminAuditLogs,
  getMyActivityLogs,
  getMyCommunityPosts,
  getOrders,
  getSellerOrders,
  getDetailedHistory,
  type AdminAuditLogEntry,
  type OrderDetail,
  type MyCommunityPost,
  type UserActivityLogEntry,
  type DetailedHistoryEntry,
} from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ShoppingCart,
  Trash2,
  PlusCircle,
  Edit3,
  FileText,
  MapPin,
  Phone,
  Mail,
  UserCircle,
  Package,
  Heart,
  ScanLine,
} from 'lucide-react'

interface User {
  id?: string
  full_name: string
  phone: string
  email: string
  city: string
  street_address: string
  province: string
  postal_code: string
  gender: string
  avatar_url?: string | null
  role?: 'user' | 'seller' | 'admin'
}

interface ActivityItem {
  id: string
  type: 'comment' | 'add_to_cart' | 'order' | 'like_post' | 'create_post' | 'delete_post' | 'edit_post'
  description: string
  timestamp: Date
  details?: string
}

interface OrderRow {
  id: string
  order_number: string
  items: number
  total: number
  status: 'processing' | 'on_shipping' | 'arrived' | 'cancelled'
  date: Date
}

interface PostRow {
  id: string
  title: string
  status: 'published' | 'draft' | 'deleted'
  comments: number
  date: Date
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'comment':
      return <MessageSquare className="w-4 h-4" />
    case 'add_to_cart':
      return <ShoppingCart className="w-4 h-4" />
    case 'order':
      return <Package className="w-4 h-4" />
    case 'like_post':
      return <Heart className="w-4 h-4" />
    case 'create_post':
      return <PlusCircle className="w-4 h-4" />
    case 'delete_post':
      return <Trash2 className="w-4 h-4" />
    case 'edit_post':
      return <Edit3 className="w-4 h-4" />
    default:
      return null
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'comment':
      return 'text-blue-600 bg-blue-50'
    case 'add_to_cart':
      return 'text-orange-600 bg-orange-50'
    case 'order':
      return 'text-green-600 bg-green-50'
    case 'like_post':
      return 'text-red-600 bg-red-50'
    case 'create_post':
      return 'text-purple-600 bg-purple-50'
    case 'delete_post':
      return 'text-red-600 bg-red-50'
    case 'edit_post':
      return 'text-yellow-600 bg-yellow-50'
    default:
      return 'text-slate-600 bg-slate-50'
  }
}

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

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
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm shadow-sm">
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

export default function ProfilePage() {
  const { setUser: setAuthUser, isLoggedIn } = useAuth()
  const { showToast, hideToast } = useToast()
  const [user, setUser] = useState<User>({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    street_address: '',
    province: '',
    postal_code: '',
    gender: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [activityPage, setActivityPage] = useState(1)
  const [ordersPage, setOrdersPage] = useState(1)
  const [postsPage, setPostsPage] = useState(1)
  const [adminPage, setAdminPage] = useState(1)
  const [activityRows, setActivityRows] = useState<ActivityItem[]>([])
  const [activityTotal, setActivityTotal] = useState(0)
  const [activityLoading, setActivityLoading] = useState(false)
  const [orderRows, setOrderRows] = useState<OrderRow[]>([])
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [postsRows, setPostsRows] = useState<PostRow[]>([])
  const [postsTotal, setPostsTotal] = useState(0)
  const [postsLoading, setPostsLoading] = useState(false)
  const [adminLogs, setAdminLogs] = useState<AdminAuditLogEntry[]>([])
  const [scanEntries, setScanEntries] = useState<DetailedHistoryEntry[]>([])
  const [scansLoading, setScansLoading] = useState(false)
  const [adminLogsLoading, setAdminLogsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activitiesPerPage = 3
  const ordersPerPage = 3
  const postsPerPage = 3
  const adminPerPage = 5

  const activityTotalPages = Math.max(1, Math.ceil(activityTotal / activitiesPerPage))
  const ordersTotalPages = Math.max(1, Math.ceil(ordersTotal / ordersPerPage))
  const postsTotalPages = Math.max(1, Math.ceil(postsTotal / postsPerPage))
  const adminTotalPages = Math.max(1, Math.ceil(adminLogs.length / adminPerPage))

  const adminStart = (adminPage - 1) * adminPerPage
  const paginatedAdminLogs = adminLogs.slice(adminStart, adminStart + adminPerPage)

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser({
        id: currentUser.id,
        full_name: currentUser.full_name || currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        city: currentUser.city || '',
        street_address: currentUser.street_address || '',
        province: currentUser.province || '',
        postal_code: currentUser.postal_code || '',
        gender: currentUser.gender || '',
        avatar_url: currentUser.avatar_url ?? null,
        role: currentUser.role ?? 'user',
      })
    } catch {
      setUser({
        full_name: 'User',
        phone: '',
        email: 'user@example.com',
        city: '',
        street_address: '',
        province: '',
        postal_code: '',
        gender: '',
        role: 'user',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const validateProfile = () => {
    const errors: Record<string, string> = {}
    const fullName = (user.full_name || '').trim()
    const email = (user.email || '').trim().toLowerCase()
    const phone = (user.phone || '').trim()
    const street = (user.street_address || '').trim()
    const city = (user.city || '').trim()
    const province = (user.province || '').trim()

    if (fullName.length < 2) {
      errors.full_name = 'Full name must be at least 2 characters.'
    }

    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      errors.email = 'Enter a valid email address.'
    }

    if (phone) {
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 10) {
        errors.phone = 'Phone number must be at least 10 digits.'
      }
    }

    const hasAddress = street || city || province
    if (hasAddress) {
      if (!street) errors.street_address = 'Street address is required.'
      if (!city) errors.city = 'City is required.'
      if (!province) errors.province = 'Province is required.'
    }

    if (user.gender && !['female', 'male', 'prefer_not_say'].includes(user.gender)) {
      errors.gender = 'Please select a valid gender.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  useEffect(() => {
    const role = user.role || 'user'
    if (role === 'admin') return

    const loadOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = role === 'seller'
          ? await getSellerOrders(ordersPage, ordersPerPage)
          : await getOrders(ordersPage, ordersPerPage)
        const mapped = (res.orders || []).map((order: OrderDetail) => ({
          id: order.id,
          order_number: order.order_number || order.id,
          items: order.total_items || order.items?.length || 0,
          total: order.total || 0,
          status: (order.status as OrderRow['status']) || 'processing',
          date: new Date(order.created_at || new Date().toISOString()),
        }))
        setOrderRows(mapped)
        setOrdersTotal(res.total || 0)
      } catch {
        setOrderRows([])
        setOrdersTotal(0)
      } finally {
        setOrdersLoading(false)
      }
    }

    loadOrders()
  }, [user.role, ordersPage])

  useEffect(() => {
    const loadActivities = async () => {
      setActivityLoading(true)
      try {
        const res = await getMyActivityLogs(activityPage, activitiesPerPage)
        const mapped = (res.entries || []).map((entry: UserActivityLogEntry) => {
          const mappedType: ActivityItem['type'] = entry.category === 'Community'
            ? 'comment'
            : entry.category === 'Order'
              ? 'order'
              : 'add_to_cart'
          return {
            id: entry.id,
            type: mappedType,
            description: entry.action,
            timestamp: new Date(entry.timestamp || new Date().toISOString()),
            details: entry.details || '',
          }
        })
        setActivityRows(mapped)
        setActivityTotal(res.total || 0)
      } catch {
        setActivityRows([])
        setActivityTotal(0)
      } finally {
        setActivityLoading(false)
      }
    }

    loadActivities()
  }, [activityPage])

  useEffect(() => {
    if (!user.id) return
    setScansLoading(true)
    getDetailedHistory()
      .then((res) => {
        const mine = (res.entries || []).filter((e) => e.user_id === user.id)
        setScanEntries(mine)
      })
      .catch(() => setScanEntries([]))
      .finally(() => setScansLoading(false))
  }, [user.id])

  useEffect(() => {
    const loadPosts = async () => {
      setPostsLoading(true)
      try {
        const res = await getMyCommunityPosts(postsPage, postsPerPage)
        const mapped = (res.posts || []).map((post: MyCommunityPost) => ({
          id: post.id,
          title: post.title,
          status: post.status,
          comments: post.comments_count || 0,
          date: new Date(post.created_at || new Date().toISOString()),
        }))
        setPostsRows(mapped)
        setPostsTotal(res.total || 0)
      } catch {
        setPostsRows([])
        setPostsTotal(0)
      } finally {
        setPostsLoading(false)
      }
    }

    loadPosts()
  }, [postsPage])

  useEffect(() => {
    const role = user.role || 'user'
    if (role !== 'admin') return

    const loadAdminLogs = async () => {
      setAdminLogsLoading(true)
      try {
        const res = await getAdminAuditLogs({ limit: 200 })
        setAdminLogs(res.entries || [])
      } catch {
        setAdminLogs([])
      } finally {
        setAdminLogsLoading(false)
      }
    }

    loadAdminLogs()
  }, [user.role])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateProfile()) {
      showToast('Please fix the highlighted fields')
      return
    }
    setError(null)
    setSuccess(false)
    setSaving(true)
    showToast('Updating profile...')
    try {
      const updated = await authService.updateProfile({
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        city: user.city,
        street_address: user.street_address,
        province: user.province,
        postal_code: user.postal_code,
        gender: user.gender,
      })
      setUser((u) => ({
        ...u,
        full_name: updated.full_name ?? u.full_name,
        phone: updated.phone ?? u.phone,
        email: updated.email ?? u.email,
        city: updated.city ?? u.city,
        street_address: updated.street_address ?? u.street_address,
        province: updated.province ?? u.province,
        postal_code: updated.postal_code ?? u.postal_code,
        gender: updated.gender ?? u.gender,
      }))
      setAuthUser((prev) =>
        prev
          ? {
              ...prev,
              name: updated.full_name ?? prev.name,
              email: updated.email ?? prev.email,
            }
          : null
      )
      // Reload user data from server to ensure everything is synced
      await loadUser()
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

  if (!isLoggedIn) {
    return (
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-8 text-center shadow-lg">
            <UserCircle className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Login to view your profile</h2>
            <p className="text-slate-600 mb-6">Sign in to manage your profile, view orders, and track your activity.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const role = user.role || 'user'
  const ordersTitle = role === 'seller' ? 'Orders' : 'My Orders'

  return (
    <div className="px-6 pb-8 pt-0 max-w-[1400px] mx-auto">
      <PageTitleHero
        title="Profile"
        description="Manage your account details, activity, and preferences."
        breadcrumb="Profile"
      />

      {/* Main Container */}
      <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
        {/* Left vertical accent line */}
        <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-300/40 to-blue-500/50" />
        <div className="pl-8 pr-4 py-4 space-y-4">

          {/* ROW 1: Info */}
          <div className="relative">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">1 Info</div>
            <div className="grid grid-cols-12 gap-4">

              {/* Profile Card */}
              <div className="col-span-12 lg:col-span-3">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <div className="flex flex-col items-center text-center">
                    <label className="relative cursor-pointer group">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar}
                      />
                      <div className="w-28 h-28 rounded-full border-4 border-blue-200 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-pointer">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user.full_name.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow border-2 border-white">
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                    </label>
                    <h2 className="mt-3 text-base font-semibold text-slate-900">{user.full_name || 'User'}</h2>
                    <p className="text-xs text-slate-500 capitalize">{role} account</p>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 w-full text-left">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span>{user.phone || 'No phone set'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{user.city ? `${user.city}, ${user.province}` : 'No address set'}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 w-full space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Account Status</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Active</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Account Type</span>
                        <span className="text-slate-700 font-medium capitalize">{role}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Verification</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium text-[10px]">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Info form */}
              <div className="col-span-12 lg:col-span-5">
                <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">General Information</h3>
                    <UserCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  {success && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs mb-3">Profile updated successfully.</div>
                  )}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">{error}</div>
                  )}
                  <div className="space-y-2.5">
                    <Input label="Full Name" value={user.full_name} onChange={(e) => setUser({ ...user, full_name: e.target.value })} placeholder="Your full name" error={formErrors.full_name} required />
                    <Input label="Email" type="email" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} placeholder="you@school.edu" error={formErrors.email} required />
                    <Input label="Phone" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} placeholder="+63 9xx xxx xxxx" error={formErrors.phone} />
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                      <select value={user.gender} onChange={(e) => setUser({ ...user, gender: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="prefer_not_say">Prefer not to say</option>
                      </select>
                      {formErrors.gender && <div className="text-xs text-red-500 mt-1">{formErrors.gender}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Changes'}</Button>
                    <Button type="button" variant="ghost" onClick={() => loadUser()}>Cancel</Button>
                  </div>
                </form>
              </div>

              {/* Address & Billing */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">Address & Billing</h3>
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <Input label="Street Address" value={user.street_address} onChange={(e) => setUser({ ...user, street_address: e.target.value })} placeholder="Street, Barangay" error={formErrors.street_address} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="City" value={user.city} onChange={(e) => setUser({ ...user, city: e.target.value })} placeholder="City" error={formErrors.city} />
                      <Input label="Province" value={user.province} onChange={(e) => setUser({ ...user, province: e.target.value })} placeholder="Province" error={formErrors.province} />
                    </div>
                    <Input label="Postal Code" value={user.postal_code} onChange={(e) => setUser({ ...user, postal_code: e.target.value })} placeholder="ZIP/Postal Code" error={formErrors.postal_code} />
                  </div>
                  <div className="mt-3 text-xs text-slate-500">Used for checkout and deliveries.</div>
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Delivery Area</span>
                      <span className="text-slate-700 font-medium">{user.city || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Province</span>
                      <span className="text-slate-700 font-medium">{user.province || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">ZIP Code</span>
                      <span className="text-slate-700 font-medium">{user.postal_code || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ROW 2: Activity */}
          <div className="relative border-t border-slate-100 pt-4">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">2 Activity</div>
            <div className="grid grid-cols-12 gap-4">

              {/* Change Password */}
              <div className="col-span-12 lg:col-span-3">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <h4 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />Change Password
                  </h4>
                  <PasswordChangeForm onSubmit={handlePasswordChange} />
                </div>
              </div>

              {/* Activity Logs */}
              <div className="col-span-12 lg:col-span-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">Activity Logs</h3>
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  {activityLoading ? (
                    <div className="text-sm text-slate-500">Loading activity logs...</div>
                  ) : activityRows.length === 0 ? (
                    <div className="text-sm text-slate-500">No activity logs yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {activityRows.map((activity) => (
                        <div key={activity.id} className="flex gap-2.5 p-2.5 border border-slate-100 rounded-lg">
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-900">{activity.description}</div>
                            {activity.details && <div className="text-[10px] text-slate-500 mt-0.5 italic">{activity.details}</div>}
                            <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(activity.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activityTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <button onClick={() => setActivityPage(Math.max(1, activityPage - 1))} disabled={activityPage === 1} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                        <ChevronLeft className="w-3 h-3" />Prev
                      </button>
                      <span className="text-xs text-slate-500">{activityPage}/{activityTotalPages}</span>
                      <button onClick={() => setActivityPage(Math.min(activityTotalPages, activityPage + 1))} disabled={activityPage === activityTotalPages} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                        Next<ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders or Audit Logs */}
              <div className="col-span-12 lg:col-span-4">
                {role === 'admin' ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm">Audit Logs</h3>
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    {adminLogsLoading ? (
                      <div className="text-sm text-slate-500">Loading audit logs...</div>
                    ) : paginatedAdminLogs.length === 0 ? (
                      <div className="text-sm text-slate-500">No audit logs available.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-[10px] text-slate-500 border-b">
                              <th className="py-1.5">Date</th>
                              <th className="py-1.5">Actor</th>
                              <th className="py-1.5">Action</th>
                              <th className="py-1.5">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedAdminLogs.map((log) => (
                              <tr key={log.id} className="border-b last:border-0">
                                <td className="py-1.5 text-[10px] text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleDateString() : '—'}</td>
                                <td className="py-1.5 text-slate-700">{log.actor}</td>
                                <td className="py-1.5 text-slate-600">{log.action}</td>
                                <td className={`py-1.5 ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{log.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {adminTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <button onClick={() => setAdminPage(Math.max(1, adminPage - 1))} disabled={adminPage === 1} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                          <ChevronLeft className="w-3 h-3" />Prev
                        </button>
                        <span className="text-xs text-slate-500">{adminPage}/{adminTotalPages}</span>
                        <button onClick={() => setAdminPage(Math.min(adminTotalPages, adminPage + 1))} disabled={adminPage === adminTotalPages} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                          Next<ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm">{ordersTitle}</h3>
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    {ordersLoading ? (
                      <div className="text-sm text-slate-500">Loading orders...</div>
                    ) : orderRows.length === 0 ? (
                      <div className="text-sm text-slate-500">No orders yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {orderRows.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg">
                            <div>
                              <div className="text-xs font-medium text-slate-900">{order.order_number}</div>
                              <div className="text-[10px] text-slate-500">{order.items} items • {formatDate(order.date)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-slate-900">₱{order.total.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500 capitalize">{order.status.replace('_', ' ')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {ordersTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <button onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))} disabled={ordersPage === 1} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                          <ChevronLeft className="w-3 h-3" />Prev
                        </button>
                        <span className="text-xs text-slate-500">{ordersPage}/{ordersTotalPages}</span>
                        <button onClick={() => setOrdersPage(Math.min(ordersTotalPages, ordersPage + 1))} disabled={ordersPage === ordersTotalPages} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                          Next<ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ROW 3: Content */}
          <div className="relative border-t border-slate-100 pt-4">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">3 Content</div>
            <div className="grid grid-cols-12 gap-4">

              {/* Community Posts */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">Community Posts</h3>
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  {postsLoading ? (
                    <div className="text-sm text-slate-500">Loading posts...</div>
                  ) : postsRows.length === 0 ? (
                    <div className="text-sm text-slate-500">No community posts yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {postsRows.map((post) => (
                        <div key={post.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg">
                          <div>
                            <div className="text-xs font-medium text-slate-900">{post.title}</div>
                            <div className="text-[10px] text-slate-500">{post.comments} comments • {formatDate(post.date)}</div>
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize">{post.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {postsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <button onClick={() => setPostsPage(Math.max(1, postsPage - 1))} disabled={postsPage === 1} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                        <ChevronLeft className="w-3 h-3" />Prev
                      </button>
                      <span className="text-xs text-slate-500">{postsPage}/{postsTotalPages}</span>
                      <button onClick={() => setPostsPage(Math.min(postsTotalPages, postsPage + 1))} disabled={postsPage === postsTotalPages} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs">
                        Next<ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Scans — all roles */}
              <div className="col-span-12 lg:col-span-8">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">My Scans</h3>
                    <ScanLine className="w-4 h-4 text-blue-600" />
                  </div>
                  {scansLoading ? (
                    <div className="text-sm text-slate-500">Loading scans...</div>
                  ) : scanEntries.length === 0 ? (
                    <div className="text-sm text-slate-500">No scans yet.</div>
                  ) : (
                    <ScrollArea h={260}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {scanEntries.slice(0, 9).map((scan) => (
                          <div key={scan.id} className="group relative border border-slate-100 rounded-lg overflow-hidden hover:border-blue-200 transition-colors">
                            <div className="aspect-square bg-slate-100">
                              <img src={scan.url} alt={scan.fish_type} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2">
                              <div className="text-xs font-medium text-slate-900 truncate capitalize">{scan.fish_type.replace(/_/g, ' ')}</div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] text-slate-500">{new Date(scan.timestamp).toLocaleDateString()}</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  scan.grade === 'Export' ? 'bg-blue-50 text-blue-700' :
                                  scan.grade === 'Premium' ? 'bg-emerald-50 text-emerald-700' :
                                  scan.grade === 'Standard' ? 'bg-amber-50 text-amber-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>{scan.grade}</span>
                              </div>
                              {scan.score != null && (
                                <div className="text-[10px] text-slate-400 mt-0.5">Score: {typeof scan.score === 'number' ? scan.score.toFixed(1) : scan.score}%</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  {scanEntries.length > 9 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                      <Link to="/scans" className="text-xs text-blue-600 hover:underline font-medium">View all {scanEntries.length} scans →</Link>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
