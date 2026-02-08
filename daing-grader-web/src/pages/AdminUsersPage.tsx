/**
 * Admin Users Management Page
 * Features: collapsible tables with role filtering, bulk selection, status toggle modal, user detail modal
 */
import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Shield,
  ShoppingBag,
  User,
  Eye,
  X,
  Mail,
  Calendar,
  Package,
  ShoppingCart,
  ScanLine,
  AlertCircle,
} from 'lucide-react'
import PageTitleHero from '../components/layout/PageTitleHero'
import {
  getAdminUsers,
  getAdminUsersStats,
  toggleUserStatus,
  getAdminUserDetail,
  type AdminUser,
  type AdminUserDetail,
  type AdminUsersStats,
} from '../services/api'

type UserRole = 'admin' | 'seller' | 'user'
type FilterRole = 'all' | UserRole

const roleIcons: Record<UserRole, React.ElementType> = {
  admin: Shield,
  seller: ShoppingBag,
  user: User,
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  seller: 'bg-blue-100 text-blue-700 border-blue-200',
  user: 'bg-slate-100 text-slate-700 border-slate-200',
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrators',
  seller: 'Sellers',
  user: 'Users',
}

function UserTable({
  users,
  title,
  roleType,
  isCollapsed,
  onToggleCollapse,
  showRoleColumn = true,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onStatusClick,
  onViewUser,
}: {
  users: AdminUser[]
  title?: string
  roleType?: UserRole
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  showRoleColumn?: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onStatusClick: (user: AdminUser) => void
  onViewUser: (user: AdminUser) => void
}) {
  const [page, setPage] = useState(1)
  const pageSize = 8
  const totalPages = Math.ceil(users.length / pageSize)
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize)
  const allSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u.id))

  const RoleIcon = roleType ? roleIcons[roleType] : null

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="bg-white border border-blue-200 shadow-sm overflow-hidden transition-all duration-300 rounded-lg">
      {/* Table header with collapse toggle */}
      {title && (
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors bg-gradient-to-r from-white to-blue-50`}
          onClick={onToggleCollapse}
        >
          <div className="flex items-center gap-3">
            {RoleIcon && (
              <div className={`p-2 ${roleColors[roleType!].split(' ')[0]}`}>
                <RoleIcon className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-blue-900 text-base">{title}</span>
            <span className="text-sm text-white bg-blue-600 px-2 py-0.5 rounded">{users.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {isCollapsed ? 'Click to expand' : `Showing ${paginatedUsers.length} of ${users.length}`}
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            )}
          </div>
        </div>
      )}

      {/* Table content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[3000px] opacity-100'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-200">
              <tr>
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) {
                        onSelectAll([])
                      } else {
                        onSelectAll(paginatedUsers.map((u) => u.id))
                      }
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Email
                </th>
                {showRoleColumn && (
                  <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                    Role
                  </th>
                )}
                {(roleType === 'user' || showRoleColumn) ? (
                  <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                    Orders
                  </th>
                ) : null}
                {roleType === 'seller' && (
                  <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                    Products
                  </th>
                )}
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-center px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => onToggleSelect(user.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-blue-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-base font-medium text-blue-700">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900 text-base">{user.name}</div>
                        <div className="text-sm text-slate-600">ID: {user.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-base text-slate-700">{user.email}</td>
                  {showRoleColumn && (
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium border rounded ${
                          roleColors[user.role]
                        }`}
                      >
                        {React.createElement(roleIcons[user.role], { className: 'w-3.5 h-3.5' })}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                  )}
                  {(roleType === 'user' || showRoleColumn) && (
                    <td className="px-4 py-4 text-base text-slate-700">{user.orders_count}</td>
                  )}
                  {roleType === 'seller' && (
                    <td className="px-4 py-4 text-base text-slate-700">{user.products_count}</td>
                  )}
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onStatusClick(user)}
                      className={`inline-block px-3 py-1.5 text-sm font-medium cursor-pointer transition-all hover:opacity-80 rounded ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-base text-slate-600">{formatDate(user.joined_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onViewUser(user)}
                        className="p-2 hover:bg-blue-100 text-slate-500 hover:text-blue-700 border border-transparent hover:border-blue-300 transition-all rounded"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-black/15 bg-slate-50">
            <div className="text-sm text-slate-500">
              {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, users.length)} of {users.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-black/15 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 text-sm border border-black/15 ${
                      page === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-black/15 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Data state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUsersStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [statusModal, setStatusModal] = useState<{ user: AdminUser; open: boolean }>({ user: null as any, open: false })
  const [statusReason, setStatusReason] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  
  const [detailModal, setDetailModal] = useState<{ user: AdminUserDetail | null; open: boolean }>({ user: null, open: false })
  const [detailLoading, setDetailLoading] = useState(false)

  // Collapsed state for each role section
  const [collapsedSections, setCollapsedSections] = useState<Record<UserRole, boolean>>({
    admin: false,
    seller: false,
    user: false,
  })

  const toggleSection = (role: UserRole) => {
    setCollapsedSections((prev) => ({ ...prev, [role]: !prev[role] }))
  }

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, statsRes] = await Promise.all([
        getAdminUsers(1, 100, 'all', 'all', ''),
        getAdminUsersStats(),
      ])
      setUsers(usersRes.users || [])
      setStats(statsRes.stats || null)
    } catch (e) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [users, searchQuery, statusFilter])

  // Group users by role
  const usersByRole = useMemo(() => {
    return {
      admin: filteredUsers.filter((u) => u.role === 'admin'),
      seller: filteredUsers.filter((u) => u.role === 'seller'),
      user: filteredUsers.filter((u) => u.role === 'user'),
    }
  }, [filteredUsers])

  // Determine table order based on filter
  const tableOrder = useMemo((): UserRole[] => {
    if (roleFilter === 'all') return ['admin', 'seller', 'user']
    const others = (['admin', 'seller', 'user'] as UserRole[]).filter((r) => r !== roleFilter)
    return [roleFilter, ...others]
  }, [roleFilter])

  const isSplitView = roleFilter !== 'all'

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = (ids: string[]) => {
    if (ids.length === 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const handleStatusClick = (user: AdminUser) => {
    setStatusModal({ user, open: true })
    setStatusReason('')
  }

  const handleStatusConfirm = async () => {
    if (!statusModal.user) return
    setStatusLoading(true)
    try {
      await toggleUserStatus(statusModal.user.id, statusReason)
      // Refresh data
      await fetchData()
      setStatusModal({ user: null as any, open: false })
    } catch (e) {
      alert('Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleViewUser = async (user: AdminUser) => {
    setDetailLoading(true)
    setDetailModal({ user: null, open: true })
    try {
      const res = await getAdminUserDetail(user.id)
      setDetailModal({ user: res.user, open: true })
    } catch (e) {
      setDetailModal({ user: null, open: false })
      alert('Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6 w-full min-h-screen">
      {/* Page Hero */}
      <PageTitleHero
        title="User Management"
        subtitle="View and manage all registered users, sellers, and administrators."
        backgroundImage="/assets/page-hero/hero-bg.jpg"
      />

      {/* Quick Stats - Simple clean boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-blue-700 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-slate-900">{stats?.total ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-purple-700 mb-1">Admins</div>
          <div className="text-3xl font-bold text-purple-600">{stats?.admins ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-blue-700 mb-1">Sellers</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.sellers ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-slate-700 mb-1">Users</div>
          <div className="text-3xl font-bold text-slate-900">{stats?.users ?? '-'}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-blue-300 bg-white text-base focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as FilterRole)}
            className="px-3 py-2.5 border border-blue-300 bg-white text-base min-w-[140px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="seller">Seller</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2.5 border border-blue-300 bg-white text-base min-w-[130px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Export */}
        <button className="flex items-center gap-2 px-4 py-2.5 border border-blue-300 bg-white text-base hover:bg-blue-50 transition-colors ml-auto rounded font-semibold text-blue-700">
          <Download className="w-4 h-4" />
          Export
        </button>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-2 border border-blue-300 rounded">
            {selectedIds.size} selected
          </div>
        )}
      </div>

      {/* Tables Container */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading users...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : (
        <div
          className={`transition-all duration-500 ease-in-out ${
            isSplitView ? 'space-y-5' : 'space-y-0'
          }`}
        >
          {isSplitView ? (
            /* Split View - 3 Collapsible Tables */
            tableOrder.map((role, index) => (
              <div
                key={role}
                className="transition-all duration-500 ease-in-out transform"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideIn 0.4s ease-out forwards',
                }}
              >
                <UserTable
                  users={usersByRole[role]}
                  title={roleLabels[role]}
                  roleType={role}
                  isCollapsed={collapsedSections[role]}
                  onToggleCollapse={() => toggleSection(role)}
                  showRoleColumn={false}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onStatusClick={handleStatusClick}
                  onViewUser={handleViewUser}
                />
              </div>
            ))
          ) : (
            /* Single Table View - All Users */
            <div className="transition-all duration-500 ease-in-out">
              <UserTable
                users={filteredUsers}
                showRoleColumn={true}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onStatusClick={handleStatusClick}
                onViewUser={handleViewUser}
              />
            </div>
          )}
        </div>
      )}

      {/* Status Toggle Modal */}
      {statusModal.open && statusModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md border border-black/15 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-black/15">
              <h2 className="text-lg font-semibold text-slate-900">
                {statusModal.user.status === 'active' ? 'Deactivate' : 'Activate'} User
              </h2>
              <button onClick={() => setStatusModal({ user: null as any, open: false })} className="p-1 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                {statusModal.user.avatar ? (
                  <img src={statusModal.user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-medium">
                    {statusModal.user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-medium text-slate-900">{statusModal.user.name}</div>
                  <div className="text-sm text-slate-500">{statusModal.user.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  {statusModal.user.status === 'active'
                    ? 'This user will be deactivated and notified via email. They will not be able to log in until reactivated.'
                    : 'This user will be reactivated and notified via email. They will regain access to their account.'}
                </div>
              </div>

              {statusModal.user.status === 'active' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason for deactivation</label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-black/15 text-base focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="Enter reason (will be sent to user via email)..."
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-black/15 bg-slate-50">
              <button
                onClick={() => setStatusModal({ user: null as any, open: false })}
                className="px-4 py-2 border border-black/15 text-base hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusConfirm}
                disabled={statusLoading}
                className={`px-4 py-2 text-white text-base font-medium disabled:opacity-50 ${
                  statusModal.user.status === 'active'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {statusLoading ? 'Processing...' : statusModal.user.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailModal({ user: null, open: false })}>
          <div className="bg-white w-full max-w-lg border border-black/15 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-black/15">
              <h2 className="text-lg font-semibold text-slate-900">User Details</h2>
              <button onClick={() => setDetailModal({ user: null, open: false })} className="p-1 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className="p-10 text-center text-slate-500">Loading...</div>
            ) : detailModal.user ? (
              <div className="p-5 space-y-5">
                {/* Profile header */}
                <div className="flex items-center gap-4">
                  {detailModal.user.avatar ? (
                    <img src={detailModal.user.avatar} alt="" className="w-16 h-16 rounded-full object-cover border border-black/10" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-medium text-slate-600">
                      {detailModal.user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-bold text-slate-900">{detailModal.user.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-sm font-medium border ${roleColors[detailModal.user.role]}`}>
                        {React.createElement(roleIcons[detailModal.user.role], { className: 'w-3.5 h-3.5' })}
                        {detailModal.user.role.charAt(0).toUpperCase() + detailModal.user.role.slice(1)}
                      </span>
                      <span className={`px-2 py-0.5 text-sm font-medium ${detailModal.user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {detailModal.user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Email</div>
                      <div className="text-sm font-medium text-slate-900">{detailModal.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Joined</div>
                      <div className="text-sm font-medium text-slate-900">{formatDate(detailModal.user.joined_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                    <ScanLine className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Scans</div>
                      <div className="text-sm font-medium text-slate-900">{detailModal.user.scans_count}</div>
                    </div>
                  </div>
                  {detailModal.user.role === 'user' && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                      <ShoppingCart className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-500">Orders</div>
                        <div className="text-sm font-medium text-slate-900">{detailModal.user.orders_count}</div>
                      </div>
                    </div>
                  )}
                  {detailModal.user.role === 'seller' && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                      <Package className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-500">Products</div>
                        <div className="text-sm font-medium text-slate-900">{detailModal.user.products_count}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deactivation info */}
                {detailModal.user.status === 'inactive' && detailModal.user.deactivation_reason && (
                  <div className="p-3 bg-red-50 border border-red-200">
                    <div className="text-xs text-red-600 font-medium mb-1">Deactivation Reason</div>
                    <div className="text-sm text-red-800">{detailModal.user.deactivation_reason}</div>
                    {detailModal.user.deactivated_at && (
                      <div className="text-xs text-red-500 mt-1">Deactivated on {formatDate(detailModal.user.deactivated_at)}</div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
            <div className="flex justify-end p-5 border-t border-black/15 bg-slate-50">
              <button
                onClick={() => setDetailModal({ user: null, open: false })}
                className="px-4 py-2 bg-blue-600 text-white text-base font-medium hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
