/**
 * Admin Payouts Management Page
 * Features: collapsible payout tables with filtering by seller/status, payout status updates
 */
import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  DollarSign,
  User,
  AlertCircle,
  Download,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageTitleHero from '../components/layout/PageTitleHero'
import { api } from '../services/api'

interface Payout {
  id: string
  seller_id: string
  seller_name: string
  period: string
  total_sales: number
  commission_percent: number
  commission_amount: number
  amount_to_pay: number
  status: 'pending' | 'completed'
  notes: string
  created_at: string
  paid_at?: string
}

interface PayoutsStats {
  total_payouts: number
  pending_payouts: number
  completed_payouts: number
  total_pending_amount: number
  total_paid_amount: number
}

const statusIcons: Record<'pending' | 'completed', React.ElementType> = {
  pending: Clock,
  completed: Check,
}

const statusColors: Record<'pending' | 'completed', string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
}

const statusLabels: Record<'pending' | 'completed', string> = {
  pending: 'Pending',
  completed: 'Completed',
}

function PayoutTable({
  payouts,
  title,
  isCollapsed,
  onToggleCollapse,
  onStatusUpdate,
}: {
  payouts: Payout[]
  title?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onStatusUpdate: (payoutId: string, newStatus: 'pending' | 'completed') => void
}) {
  const [page, setPage] = useState(1)
  const pageSize = 8
  const totalPages = Math.ceil(payouts.length / pageSize)
  const paginatedPayouts = payouts.slice((page - 1) * pageSize, page * pageSize)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusColor = (status: 'pending' | 'completed') => statusColors[status]
  const StatusIcon = statusIcons['pending']

  return (
    <div className="bg-white border border-slate-300 shadow-sm overflow-hidden transition-all duration-300 rounded-xl">
      {/* Table header with collapse toggle */}
      {title && (
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={onToggleCollapse}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100">
              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{title}</span>
            <span className="text-xs text-white bg-slate-600 px-1.5 py-0.5 rounded">{payouts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {isCollapsed ? 'Click to expand' : `Showing ${paginatedPayouts.length} of ${payouts.length}`}
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-500" />
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
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">
                  Seller
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">
                  Period
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">
                  Total Sales
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">
                  Commission
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">
                  To Pay
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">
                  Status
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-sm font-medium text-slate-900 border-r border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    {payout.seller_name}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-slate-700 font-medium border-r border-slate-100">{payout.period}</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-900 font-semibold border-r border-slate-100">
                    ₱{payout.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-red-600 font-semibold border-r border-slate-100">
                    -{payout.commission_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-slate-600 ml-1">({payout.commission_percent}%)</span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-green-600 font-bold border-r border-slate-100">
                    ₱{payout.amount_to_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded ${getStatusColor(
                        payout.status
                      )}`}
                    >
                      {React.createElement(statusIcons[payout.status], { className: 'w-3 h-3' })}
                      {statusLabels[payout.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center">
                      {payout.status === 'pending' ? (
                        <button
                          onClick={() => onStatusUpdate(payout.id, 'completed')}
                          className="px-2.5 py-1 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Paid {formatDate(payout.paid_at || '')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPayoutsPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<PayoutsStats | null>(null)
  const [allPayouts, setAllPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadPayouts()
  }, [])

  const loadPayouts = async () => {
    try {
      const [statsRes, payoutsRes] = await Promise.all([
        api.get('/payouts/admin/stats'),
        api.get('/payouts/admin?page=1&page_size=100'),
      ])

      setStats(statsRes.data.stats)
      setAllPayouts(payoutsRes.data.payouts || [])
    } catch (error) {
      console.error('Failed to load payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (payoutId: string, newStatus: 'pending' | 'completed') => {
    try {
      await api.put(`/payouts/admin/${payoutId}/status`, { status: newStatus })
      await loadPayouts()
    } catch (error) {
      console.error('Failed to update payout status:', error)
    }
  }

  const filteredPayouts = useMemo(() => {
    return allPayouts.filter((payout) => {
      if (statusFilter !== 'all' && payout.status !== statusFilter) return false
      if (searchQuery && !payout.seller_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [allPayouts, statusFilter, searchQuery])

  const payoutsByStatus = useMemo(() => {
    const grouped: Record<'pending' | 'completed', Payout[]> = {
      pending: [],
      completed: [],
    }

    filteredPayouts.forEach((payout) => {
      grouped[payout.status].push(payout)
    })

    return grouped
  }, [filteredPayouts])

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (loading) {
    return (
      <div className="space-y-6 w-full min-h-screen">
        <PageTitleHero
          title="Payout Management"
          description="Track and manage seller payouts"
          breadcrumb="Payouts"
        />
        <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-h-screen pb-6">
      {/* Page Hero */}
      <PageTitleHero
        title="Payout Management"
        description="Track and manage seller payouts"
        breadcrumb="Payouts"
      />

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-300 rounded-xl p-3 min-h-[110px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-50"><DollarSign className="w-3.5 h-3.5 text-blue-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Payouts</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{stats?.total_payouts ?? '-'}</div>
            <div className="text-[10px] italic text-slate-500 mt-1">All recorded payout transactions</div>
          </div>
          <div className="bg-white border border-slate-300 rounded-xl p-3 min-h-[110px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-yellow-50"><Clock className="w-3.5 h-3.5 text-yellow-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{stats?.pending_payouts ?? '-'}</div>
            <div className="text-[10px] italic text-slate-500 mt-1">Awaiting payment processing</div>
          </div>
          <div className="bg-white border border-slate-300 rounded-xl p-3 min-h-[110px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-green-50"><Check className="w-3.5 h-3.5 text-green-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{stats?.completed_payouts ?? '-'}</div>
            <div className="text-[10px] italic text-slate-500 mt-1">Successfully paid out to sellers</div>
          </div>
          <div className="bg-white border border-slate-300 rounded-xl p-3 min-h-[110px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-50"><AlertCircle className="w-3.5 h-3.5 text-orange-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Amount</span>
            </div>
            <div className="text-xl font-bold text-slate-900">₱{formatCurrency(stats?.total_pending_amount ?? 0)}</div>
            <div className="text-[10px] italic text-slate-500 mt-1">Outstanding balance to be paid</div>
          </div>
          <div className="bg-white border border-slate-300 rounded-xl p-3 min-h-[110px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-50"><DollarSign className="w-3.5 h-3.5 text-emerald-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Paid</span>
            </div>
            <div className="text-xl font-bold text-slate-900">₱{formatCurrency(stats?.total_paid_amount ?? 0)}</div>
            <div className="text-[10px] italic text-slate-500 mt-1">Cumulative amount disbursed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search seller name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 bg-white text-sm rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
            className="px-3 py-2 border border-slate-300 bg-white text-sm min-w-[140px] rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={() => navigate('/admin?section=payouts&report=open')}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Tables Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        {Object.entries(payoutsByStatus).map(
          ([status, payouts], index) =>
            payouts.length > 0 && (
              <div
                key={status}
                className="transition-all duration-500 ease-in-out"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideIn 0.4s ease-out forwards',
                }}
              >
                <PayoutTable
                  payouts={payouts}
                  title={`${statusLabels[status as 'pending' | 'completed']} Payouts`}
                  isCollapsed={collapsedSections[`status-${status}`] ?? false}
                  onToggleCollapse={() => toggleSection(`status-${status}`)}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            )
        )}
      </div>

      {filteredPayouts.length === 0 && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center py-10">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No payouts found</p>
        </div>
      )}
    </div>
  )
}
