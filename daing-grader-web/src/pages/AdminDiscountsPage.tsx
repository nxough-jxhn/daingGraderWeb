import React, { useState, useEffect } from 'react'
import { Trash2, Edit2, Eye, Plus, Loader, AlertCircle, ChevronDown, ChevronUp, Search } from 'lucide-react'
import PageTitleHero from '../components/layout/PageTitleHero'
import VoucherDetailModal from '../components/vouchers/VoucherDetailModal'
import CreateVoucherModal from '../components/vouchers/CreateVoucherModal'
import { listVouchers, deleteVoucher } from '../services/api'

export default function AdminDiscountsPage() {
  const [allVouchers, setAllVouchers] = useState<any[]>([])
  const [adminVouchers, setAdminVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [expandedSections, setExpandedSections] = useState({
    adminOwned: true,
    allSellers: true,
  })

  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; voucher: any | null }>({
    isOpen: false,
    voucher: null,
  })
  const [createModal, setCreateModal] = useState<{ isOpen: boolean; editing: any | null }>({
    isOpen: false,
    editing: null,
  })

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchVouchers()
  }, [filterStatus])

  const fetchVouchers = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch all vouchers (both admin's and others')
      const response = await listVouchers(filterStatus)
      const vouchers = response.vouchers || []

      // Note: This assumes the API returns all vouchers with seller_id
      // We need to separate them, but we don't know current user ID from this component
      // For now, we'll fetch separately
      setAllVouchers(vouchers)
      // In a real implementation, filter adminVouchers based on current user ID
      setAdminVouchers([])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load vouchers')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!window.confirm('Are you sure you want to delete this voucher code?')) return

    setDeleteLoading(voucherId)
    try {
      await deleteVoucher(voucherId)
      setAdminVouchers((prev) => prev.filter((v) => v._id !== voucherId))
      setAllVouchers((prev) => prev.filter((v) => v._id !== voucherId))
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete voucher')
    } finally {
      setDeleteLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No limit'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isExpired = (voucher: any) => {
    return voucher.expiration_date && new Date(voucher.expiration_date) <= new Date()
  }

  const getStatus = (voucher: any) => {
    if (isExpired(voucher)) return { label: 'Expired', color: 'text-red-600 bg-red-50' }
    if (!voucher.active) return { label: 'Inactive', color: 'text-slate-600 bg-slate-50' }
    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
      return { label: 'Used Up', color: 'text-orange-600 bg-orange-50' }
    }
    return { label: 'Active', color: 'text-emerald-600 bg-emerald-50' }
  }

  const filteredAdminVouchers = adminVouchers.filter((v) =>
    v.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSellerVouchers = allVouchers.filter((v) =>
    v.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const VoucherTable = ({ vouchers, isAdmin = false, loading = false }: { vouchers: any[]; isAdmin?: boolean; loading?: boolean }) => {
    if (loading) {
      return (
        <div className="px-6 py-12 text-center">
          <Loader className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      )
    }

    if (vouchers.length === 0) {
      return (
        <div className="px-6 py-8 text-center text-slate-500 text-sm">
          {isAdmin ? 'No admin-created voucher codes' : 'No seller voucher codes'}
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">Code</th>
              {!isAdmin && <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">Seller</th>}
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">Type</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">Value</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">Uses</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">Expires</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200">Status</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.map((voucher: any) => {
              const status = getStatus(voucher)
              return (
                <tr key={voucher._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 border-r border-slate-100">
                    <span className="font-bold text-sm text-blue-600">{voucher.code}</span>
                  </td>
                  {!isAdmin && (
                    <td className="px-3 py-3 border-r border-slate-100">
                      <span className="text-sm text-slate-700">{voucher.seller_name || 'Unknown'}</span>
                    </td>
                  )}
                  <td className="px-3 py-3 border-r border-slate-100">
                    <span className="text-sm text-slate-700">
                      {voucher.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100">
                    <span className="font-semibold text-sm text-slate-900">
                      {voucher.discount_type === 'percentage'
                        ? `${voucher.value}%`
                        : `₱${voucher.value.toLocaleString()}`}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100">
                    <span className="text-sm text-slate-700">
                      {voucher.current_uses}{voucher.max_uses ? ` / ${voucher.max_uses}` : ' / ∞'}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100">
                    <span className="text-sm text-slate-600">
                      {voucher.expiration_date ? formatDate(voucher.expiration_date) : 'No limit'}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setDetailModal({ isOpen: true, voucher })}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-md transition-all"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setCreateModal({ isOpen: true, editing: voucher })}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-md transition-all"
                            title="Edit code"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVoucher(voucher._id)}
                            disabled={deleteLoading === voucher._id}
                            className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md transition-all disabled:opacity-50"
                            title="Delete code"
                          >
                            {deleteLoading === voucher._id ? (
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-h-screen">
      <PageTitleHero
        title="Voucher Management System"
        description="Create and manage all discount codes"
        breadcrumb="Discounts"
      />

      {/* ── Main dashboard container ── */}
      <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-visible">
        <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-300/40 to-blue-500/50" />
        <div className="pl-8 pr-4 py-4 space-y-4">

          {/* ── Section 1 Controls ── */}
          <div className="relative">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">1 Controls</div>

        {/* Header with Create Button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-sm font-bold text-slate-800">Voucher Management</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">System-wide discount code administration</p>
          </div>
          <button
            onClick={() => setCreateModal({ isOpen: true, editing: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Code
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-600 font-semibold">Error loading vouchers</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
        </div>
          </div>{/* end section 1 */}

          {/* ── Section 2 Vouchers ── */}
          <div className="relative border-t border-slate-100 pt-4">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">2 Vouchers</div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading vouchers...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Admin Vouchers Section */}
            <div className="bg-white border border-slate-300 overflow-hidden transition-all duration-300 rounded-xl mb-4">
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() =>
                  setExpandedSections((prev) => ({ ...prev, adminOwned: !prev.adminOwned }))
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">MY VOUCHERS (Admin)</span>
                  <span className="text-xs text-white bg-slate-600 px-1.5 py-0.5 rounded">{filteredAdminVouchers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {!expandedSections.adminOwned ? 'Click to expand' : `Showing ${filteredAdminVouchers.length}`}
                  </span>
                  {expandedSections.adminOwned ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  !expandedSections.adminOwned ? 'max-h-0 opacity-0' : 'max-h-[3000px] opacity-100'
                }`}
              >
                {filteredAdminVouchers.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-500">
                    <p>No admin-created voucher codes yet</p>
                    <p className="text-sm mt-2">Create one to get started</p>
                  </div>
                ) : (
                  <VoucherTable vouchers={filteredAdminVouchers} isAdmin={true} />
                )}
              </div>
            </div>

            {/* All Sellers Vouchers Section */}
            <div className="bg-white border border-slate-300 overflow-hidden transition-all duration-300 rounded-xl">
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() =>
                  setExpandedSections((prev) => ({ ...prev, allSellers: !prev.allSellers }))
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">ALL SELLERS' VOUCHERS</span>
                  <span className="text-xs text-white bg-slate-600 px-1.5 py-0.5 rounded">{filteredSellerVouchers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {!expandedSections.allSellers ? 'Click to expand' : `Showing ${filteredSellerVouchers.length}`}
                  </span>
                  {expandedSections.allSellers ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  !expandedSections.allSellers ? 'max-h-0 opacity-0' : 'max-h-[3000px] opacity-100'
                }`}
              >
                <VoucherTable
                  vouchers={filteredSellerVouchers}
                  isAdmin={false}
                  loading={loading}
                />
              </div>
            </div>
          </>
        )}
          </div>{/* end section 2 */}

        </div>{/* end pl-8 inner */}
      </div>{/* end main dashboard container */}

      {/* Modals */}
      <VoucherDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, voucher: null })}
        voucher={detailModal.voucher}
      />
      <CreateVoucherModal
        isOpen={createModal.isOpen}
        onClose={() => setCreateModal({ isOpen: false, editing: null })}
        onSuccess={fetchVouchers}
        editingVoucher={createModal.editing}
      />
    </div>
  )
}
