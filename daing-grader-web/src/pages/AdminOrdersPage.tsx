/**
 * Admin Orders Management Page
 * Features: collapsible tables with filtering by status/seller, order detail modal
 */
import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import PageTitleHero from '../components/layout/PageTitleHero'
import {
  getAdminOrders,
  getAdminOrdersStats,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  type AdminOrder,
  type AdminOrderDetail,
  type AdminOrdersStats,
} from '../services/api'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
type FilterStatus = 'all' | OrderStatus
type FilterSeller = 'all' | string

const statusIcons: Record<OrderStatus, React.ElementType> = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  shipped: Truck,
  delivered: ShoppingCart,
  cancelled: X,
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function OrdersTable({
  orders,
  title,
  filterType,
  filterValue,
  isCollapsed,
  onToggleCollapse,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewOrder,
}: {
  orders: AdminOrder[]
  title?: string
  filterType?: 'status' | 'seller'
  filterValue?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onViewOrder: (order: AdminOrder) => void
}) {
  const [page, setPage] = useState(1)
  const pageSize = 8
  const totalPages = Math.ceil(orders.length / pageSize)
  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize)
  const allSelected = paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.has(o.id))

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusColor = (status: OrderStatus) => statusColors[status]
  const StatusIcon = filterType && filterValue ? statusIcons[filterValue as OrderStatus] : null

  return (
    <div className="bg-white border border-blue-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Table header with collapse toggle */}
      {title && (
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors bg-gradient-to-r from-white to-blue-50`}
          onClick={onToggleCollapse}
        >
          <div className="flex items-center gap-3">
            {StatusIcon && (
              <div className={`p-2 rounded ${getStatusColor(filterValue as OrderStatus).split(' ')[0]}`}>
                <StatusIcon className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-blue-900 text-base">{title}</span>
            <span className="text-sm text-white bg-blue-600 px-2 py-0.5 rounded">{orders.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {isCollapsed ? 'Click to expand' : `Showing ${paginatedOrders.length} of ${orders.length}`}
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
                        onSelectAll(paginatedOrders.map((o) => o.id))
                      }
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Order #
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Seller
                </th>
                <th className="text-right px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-center px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => onToggleSelect(order.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">{order.order_number}</td>
                  <td className="px-4 py-4 text-slate-700">{order.buyer_name}</td>
                  <td className="px-4 py-4 text-slate-700">{order.seller_name}</td>
                  <td className="px-4 py-4 text-right font-semibold text-blue-700">
                    ₱{order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium border rounded ${getStatusColor(order.status)}`}>
                      {React.createElement(statusIcons[order.status], { className: 'w-3.5 h-3.5' })}
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="p-2 hover:bg-blue-100 text-slate-500 hover:text-blue-700 border border-transparent hover:border-blue-300 transition-all"
                      >
                        <Eye className="w-4 h-4" />
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
          <div className="flex items-center justify-between px-5 py-4 border-t border-blue-200 bg-slate-50">
            <div className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 border border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const [stats, setStats] = useState<AdminOrdersStats | null>(null)
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([])
  const [sellers, setSellers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sellerFilter, setSellerFilter] = useState<FilterSeller>('all')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState({
    byStatus: false,
    bySeller: false,
    all: false,
  })

  const [detailModal, setDetailModal] = useState<{ order: AdminOrder | null; open: boolean }>({ order: null, open: false })
  const [detailLoading, setDetailLoading] = useState(false)
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes] = await Promise.all([getAdminOrdersStats(), getAdminOrders(1, 500)])

      setStats(statsRes.stats)
      setAllOrders(ordersRes.orders)

      // Extract unique sellers
      const uniqueSellers = Array.from(new Set(ordersRes.orders.map((o) => o.seller_name)))

      setSellers(uniqueSellers.sort())
    } catch (error) {
      console.error('Failed to load orders data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    let filtered = allOrders
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .filter((o) => sellerFilter === 'all' || o.seller_name === sellerFilter)
      .filter(
        (o) =>
          searchQuery === '' ||
          o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.seller_name.toLowerCase().includes(searchQuery.toLowerCase())
      )

    return filtered
  }, [allOrders, searchQuery, statusFilter, sellerFilter])

  // Split data based on active filters
  const ordersByStatus = useMemo(() => {
    const grouped: Record<OrderStatus, AdminOrder[]> = {
      pending: [],
      confirmed: [],
      shipped: [],
      delivered: [],
      cancelled: [],
    }

    filteredOrders.forEach((order) => {
      grouped[order.status].push(order)
    })

    return grouped
  }, [filteredOrders])

  const ordersBySeller = useMemo(() => {
    if (sellerFilter === 'all') {
      const grouped: Record<string, AdminOrder[]> = {}
      sellers.forEach((seller) => {
        grouped[seller] = filteredOrders.filter((o) => o.seller_name === seller)
      })
      return grouped
    }
    return {}
  }, [filteredOrders, sellers, sellerFilter])

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids))
  }

  const handleViewOrder = async (order: AdminOrder) => {
    setDetailModal({ ...detailModal, open: true, order })
    setDetailLoading(true)
    try {
      const res = await getAdminOrderDetail(order.id)
      setOrderDetail(res.order)
    } catch (error) {
      console.error('Failed to load order detail:', error)
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

  if (loading) {
    return (
      <div className="space-y-6 w-full min-h-screen">
        <PageTitleHero
          title="Order Management"
          subtitle="View and manage all customer orders"
          backgroundImage="/assets/page-hero/orders.jpg"
        />
        <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>
      </div>
    )
  }

  const hasActiveFilter = statusFilter !== 'all' || sellerFilter !== 'all'

  return (
    <div className="space-y-6 w-full min-h-screen">
      {/* Page Hero */}
      <PageTitleHero
        title="Order Management"
        subtitle="View and manage all customer orders"
        backgroundImage="/assets/page-hero/hero-bg.jpg"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg">
          <div className="text-xs font-bold text-blue-700 mb-1">Total Orders</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_orders ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-yellow-50 border border-yellow-200 shadow-md p-4 rounded-lg">
          <div className="text-xs font-bold text-yellow-700 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.pending_orders ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg">
          <div className="text-xs font-bold text-blue-700 mb-1">Confirmed</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.confirmed_orders ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 shadow-md p-4 rounded-lg">
          <div className="text-xs font-bold text-purple-700 mb-1">Shipped</div>
          <div className="text-2xl font-bold text-purple-600">{stats?.shipped_orders ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50 border border-green-200 shadow-md p-4 rounded-lg">
          <div className="text-xs font-bold text-green-700 mb-1">Delivered</div>
          <div className="text-2xl font-bold text-green-600">{stats?.delivered_orders ?? '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50 border border-amber-200 shadow-md p-4 rounded-lg">
          <div className="text-xs font-bold text-amber-700 mb-1">Total Revenue</div>
          <div className="text-xl font-bold text-amber-700">₱{(stats?.total_revenue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
          <input
            type="text"
            placeholder="Search order #, buyer, seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-blue-300 bg-white text-base focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2.5 border border-blue-300 bg-white text-base min-w-[120px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <select
          value={sellerFilter}
          onChange={(e) => setSellerFilter(e.target.value as FilterSeller)}
          className="px-3 py-2.5 border border-blue-300 bg-white text-base min-w-[140px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Sellers</option>
          {sellers.map((seller) => (
            <option key={seller} value={seller}>
              {seller}
            </option>
          ))}
        </select>
      </div>

      {/* Tables Section */}
      <div className="space-y-4">
        {hasActiveFilter ? (
          /* Split View - Filtered & Others */
          <>
            {/* Filtered Orders */}
            <div className="transition-all duration-500 ease-in-out">
              <OrdersTable
                orders={filteredOrders}
                title={
                  statusFilter !== 'all'
                    ? `Orders: ${statusLabels[statusFilter]}`
                    : `Orders: ${sellerFilter}`
                }
                filterType={statusFilter !== 'all' ? 'status' : 'seller'}
                filterValue={
                  statusFilter !== 'all'
                    ? statusFilter
                    : sellerFilter
                }
                isCollapsed={collapsedSections.all}
                onToggleCollapse={() => toggleSection('all')}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onViewOrder={handleViewOrder}
              />
            </div>

            {/* Other Orders */}
            {filteredOrders.length < allOrders.length && (
              <div className="transition-all duration-500 ease-in-out">
                <OrdersTable
                  orders={allOrders.filter(
                    (o) =>
                      !(
                        (statusFilter !== 'all' && o.status === statusFilter) ||
                        (sellerFilter !== 'all' && o.seller_name === sellerFilter)
                      )
                  )}
                  title="Other Orders"
                  isCollapsed={collapsedSections.byStatus}
                  onToggleCollapse={() => toggleSection('byStatus')}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onViewOrder={handleViewOrder}
                />
              </div>
            )}
          </>
        ) : (
          /* Default View - By Status */
          <>
            {Object.entries(ordersByStatus).map(([status, orders], index) =>
              orders.length > 0 ? (
                <div
                  key={status}
                  className="transition-all duration-500 ease-in-out"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideIn 0.4s ease-out forwards',
                  }}
                >
                  <OrdersTable
                    orders={orders}
                    title={`${statusLabels[status as OrderStatus]}`}
                    filterType="status"
                    filterValue={status}
                    isCollapsed={collapsedSections.byStatus}
                    onToggleCollapse={() => toggleSection('byStatus')}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={handleSelectAll}
                    onViewOrder={handleViewOrder}
                  />
                </div>
              ) : null
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {detailModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetailModal({ order: null, open: false })}
        >
          <div
            className="bg-white w-full max-w-lg border border-black/15 shadow-xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-black/15 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>
              <button onClick={() => setDetailModal({ order: null, open: false })} className="p-1 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-10 text-center text-slate-500">Loading...</div>
            ) : orderDetail ? (
              <div className="p-5 space-y-5">
                {/* Order Header */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-black/10">
                  <div>
                    <div className="text-sm text-slate-500">Order Number</div>
                    <div className="text-lg font-bold text-slate-900">{orderDetail.order_number}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded ${statusColors[orderDetail.status]}`}
                  >
                    {React.createElement(statusIcons[orderDetail.status], { className: 'w-4 h-4' })}
                    {statusLabels[orderDetail.status]}
                  </span>
                </div>

                {/* Buyer & Seller Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-medium text-blue-700">
                      {orderDetail.buyer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Buyer</div>
                      <div className="text-sm font-medium text-slate-900">{orderDetail.buyer_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-black/10">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-medium text-purple-700">
                      {orderDetail.seller_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Seller</div>
                      <div className="text-sm font-medium text-slate-900">{orderDetail.seller_name}</div>
                    </div>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/10">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Total Amount</div>
                      <div className="text-sm font-bold text-slate-900">
                        ₱{orderDetail.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/10">
                    <Package className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Items</div>
                      <div className="text-sm font-bold text-slate-900">{orderDetail.total_items}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/10">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Order Date</div>
                      <div className="text-sm font-medium text-slate-900">{formatDate(orderDetail.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/10">
                    <ShoppingCart className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Category</div>
                      <div className="text-sm font-medium text-slate-900">{orderDetail.category}</div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-2">Order Items</div>
                  <div className="border border-black/10">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-black/10">
                        <tr>
                          <th className="text-left px-3 py-2 font-bold">Product</th>
                          <th className="text-right px-3 py-2 font-bold">Qty</th>
                          <th className="text-right px-3 py-2 font-bold">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {orderDetail.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="text-right px-3 py-2">{item.qty}</td>
                            <td className="text-right px-3 py-2 font-medium">
                              ₱{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-2">Shipping Address</div>
                  <div className="p-3 bg-slate-50 border border-black/10 text-sm text-slate-700 space-y-1">
                    <div>
                      <strong>{orderDetail.address.full_name}</strong>
                    </div>
                    <div>{orderDetail.address.address_line}</div>
                    <div>
                      {orderDetail.address.city}, {orderDetail.address.province} {orderDetail.address.postal_code}
                    </div>
                    {orderDetail.address.notes && (
                      <div className="text-xs text-slate-600">{orderDetail.address.notes}</div>
                    )}
                    <div className="pt-2 border-t border-black/10">
                      <Phone className="w-4 h-4 inline-block mr-1" />
                      {orderDetail.address.phone}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="p-3 bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-700 font-medium">Payment Method</div>
                  <div className="text-sm font-medium text-blue-900">{orderDetail.payment_method}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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
