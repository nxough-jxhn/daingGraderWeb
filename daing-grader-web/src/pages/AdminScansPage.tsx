/**
 * Admin Scans Management Page
 * Features: scans table with filtering, disable/delete, pagination
 */
import React, { useState, useEffect } from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye,
  X,
  Calendar,
  Image as ImageIcon,
  User,
  Fish,
  Award,
  Copy,
  Check,
  Trash2,
  Ban,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import PageTitleHero from '../components/layout/PageTitleHero'
import {
  getAdminScanPage,
  getAdminScanStats,
  toggleScanStatus,
  deleteAdminScan,
  type AdminScanEntry,
  type AdminScanStats,
} from '../services/api'

type GradeType = 'Export' | 'Local' | 'Reject' | 'Unknown'
type FilterGrade = 'all' | 'Export' | 'Local' | 'Reject'
type FilterDetection = 'all' | 'detected' | 'not-detected'

const gradeColors: Record<GradeType, string> = {
  Export: 'bg-green-100 text-green-800',
  Local: 'bg-blue-100 text-blue-800',
  Reject: 'bg-red-100 text-red-800',
  Unknown: 'bg-slate-100 text-slate-600',
}

// Copy Button Component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded transition-all ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
      title={copied ? 'Copied!' : 'Copy ID'}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

export default function AdminScansPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState<FilterGrade>('all')
  const [fishTypeFilter, setFishTypeFilter] = useState('all')
  const [detectionFilter, setDetectionFilter] = useState<FilterDetection>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Data state
  const [scans, setScans] = useState<AdminScanEntry[]>([])
  const [totalScans, setTotalScans] = useState(0)
  const [stats, setStats] = useState<AdminScanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Detail modal
  const [detailModal, setDetailModal] = useState<{ open: boolean; scan: AdminScanEntry | null }>({ open: false, scan: null })

  // Disable modal
  const [disableModal, setDisableModal] = useState<{ open: boolean; scan: AdminScanEntry | null }>({ open: false, scan: null })
  const [disableReason, setDisableReason] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; scan: AdminScanEntry | null }>({ open: false, scan: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch scans
  const fetchScans = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminScanPage(page, pageSize)
      setScans(res.entries || [])
      setTotalScans(res.total || 0)
    } catch (e) {
      setError('Failed to load scans')
      console.error('Failed to fetch scans:', e)
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await getAdminScanStats()
      setStats(res.stats || null)
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  }

  useEffect(() => {
    fetchScans()
  }, [page])

  useEffect(() => {
    fetchStats()
  }, [])

  // Filter scans locally (search and filters)
  const filteredScans = scans.filter((scan) => {
    const grade = scan.grade || 'Unknown'
    if (gradeFilter !== 'all' && grade !== gradeFilter) return false
    const fishType = scan.fish_type || 'Unknown'
    // Case-insensitive fish type comparison
    if (fishTypeFilter !== 'all' && fishType.toLowerCase() !== fishTypeFilter.toLowerCase()) return false
    // Detection filter
    if (detectionFilter === 'detected' && !scan.detected) return false
    if (detectionFilter === 'not-detected' && scan.detected) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        scan.id.toLowerCase().includes(q) ||
        fishType.toLowerCase().includes(q) ||
        (scan.user_name || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalPages = Math.ceil(totalScans / pageSize)

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredScans.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredScans.map((s) => s.id)))
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getGradeDisplay = (grade: string | null | undefined): GradeType => {
    if (!grade || grade === 'Unknown') return 'Unknown'
    if (grade === 'Export' || grade === 'Local' || grade === 'Reject') return grade
    return 'Unknown'
  }

  const getScoreDisplay = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'N/A'
    return `${(score * 100).toFixed(1)}%`
  }

  const allSelected = filteredScans.length > 0 && selectedIds.size === filteredScans.length

  // Disable handlers
  const handleDisableClick = (scan: AdminScanEntry, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDisableModal({ open: true, scan })
    setDisableReason('')
  }

  const handleDisableConfirm = async () => {
    if (!disableModal.scan) return
    setDisableLoading(true)
    try {
      await toggleScanStatus(disableModal.scan.id, disableReason)
      await fetchScans()
      await fetchStats()
      setDisableModal({ open: false, scan: null })
    } catch (e) {
      alert('Failed to update scan status')
    } finally {
      setDisableLoading(false)
    }
  }

  // Delete handlers
  const handleDeleteClick = (scan: AdminScanEntry, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDeleteModal({ open: true, scan })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.scan) return
    setDeleteLoading(true)
    try {
      await deleteAdminScan(deleteModal.scan.id)
      await fetchScans()
      await fetchStats()
      setDeleteModal({ open: false, scan: null })
      if (detailModal.scan?.id === deleteModal.scan.id) {
        setDetailModal({ open: false, scan: null })
      }
    } catch (e) {
      alert('Failed to delete scan')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full min-h-screen">
      {/* Page Hero */}
      <PageTitleHero
        title="Scans Management"
        subtitle="View and manage all AI grading scan history and results."
        backgroundImage="/assets/page-hero/hero-bg.jpg"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-blue-700 mb-1">Total Scans</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_scans?.toLocaleString() || '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50 border border-green-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-green-700 mb-1">Export Grade</div>
          <div className="text-2xl font-bold text-green-600">{stats?.export_count ?? 0}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-blue-700 mb-1">Local Grade</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.local_count ?? 0}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-red-50 border border-red-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-red-700 mb-1">Reject Grade</div>
          <div className="text-2xl font-bold text-red-600">{stats?.reject_count ?? 0}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-blue-700 mb-1">Unique Users</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.unique_users ?? 0}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-5 rounded-lg hover:shadow-lg transition-shadow">
          <div className="text-sm font-bold text-blue-700 mb-1">Avg Score</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.avg_score !== undefined ? `${(stats.avg_score * 100).toFixed(1)}%` : 'N/A'}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
          <input
            type="text"
            placeholder="Search by ID, fish type, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-blue-300 bg-white text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
          />
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value as FilterGrade)
              setPage(1)
            }}
            className="px-3 py-2.5 border border-blue-300 bg-white text-base text-slate-900 min-w-[130px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
          >
            <option value="all">All Grades</option>
            <option value="Export">Export</option>
            <option value="Local">Local</option>
            <option value="Reject">Reject</option>
          </select>
        </div>

        {/* Fish Type Filter */}
        <select
          value={fishTypeFilter}
          onChange={(e) => {
            setFishTypeFilter(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2.5 border border-blue-300 bg-white text-base text-slate-900 min-w-[160px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
        >
          <option value="all">All Fish Types</option>
          <option value="Danggit">Danggit</option>
          <option value="Espada">Espada</option>
          <option value="Dalagangbukid">Dalagangbukid</option>
          <option value="Flyingfish">Flyingfish</option>
          <option value="Bisugo">Bisugo</option>
          <option value="Unknown">Unknown</option>
        </select>

        {/* Detection Filter */}
        <select
          value={detectionFilter}
          onChange={(e) => {
            setDetectionFilter(e.target.value as FilterDetection)
            setPage(1)
          }}
          className="px-3 py-2.5 border border-blue-300 bg-white text-base text-slate-900 min-w-[160px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
        >
          <option value="all">All Detections</option>
          <option value="detected">Daing Detected</option>
          <option value="not-detected">No Daing Detected</option>
        </select>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-2 border border-blue-300 rounded">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => {
                const firstScan = scans.find((s) => selectedIds.has(s.id))
                if (firstScan) handleDeleteClick(firstScan)
              }}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors rounded"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        )}

        {/* Export */}
        <button className="flex items-center gap-2 px-4 py-2.5 border border-blue-300 bg-white text-base text-blue-700 hover:bg-blue-50 ml-auto font-semibold transition-colors rounded">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Detection Filter Header */}
      {detectionFilter !== 'all' && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
          detectionFilter === 'detected' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {detectionFilter === 'detected' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-semibold ${
            detectionFilter === 'detected' ? 'text-green-800' : 'text-red-800'
          }`}>
            {detectionFilter === 'detected' ? 'Showing Daing Detected Scans' : 'Showing No Daing Detected Scans'}
          </span>
          <span className="text-sm text-slate-600">
            ({filteredScans.length} {filteredScans.length === 1 ? 'scan' : 'scans'})
          </span>
          <button
            onClick={() => setDetectionFilter('all')}
            className="ml-auto flex items-center gap-1 px-2 py-1 text-sm text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filter
          </button>
        </div>
      )}

      {/* Scans Table */}
      <div className="bg-white border border-blue-200 shadow-sm overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-200">
              <tr>
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-blue-600"
                  />
                </th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Image</th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Fish Type</th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Detection</th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Grade</th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Score</th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Date</th>
                <th className="text-center px-4 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-600">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading scans...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-red-600">{error}</td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-600">No scans found</td>
                </tr>
              ) : (
                filteredScans.map((scan) => {
                  const grade = getGradeDisplay(scan.grade)
                  const fishType = scan.fish_type || 'Unknown'
                  const userName = scan.user_name || 'Unknown'
                  const score = scan.score

                  return (
                    <tr key={scan.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(scan.id)}
                          onChange={() => handleToggleSelect(scan.id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-800 font-mono">{scan.id.slice(0, 12)}</span>
                          <CopyButton text={scan.id} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-16 h-16 bg-blue-50 flex items-center justify-center border border-blue-200 overflow-hidden rounded">
                          {scan.url ? (
                            <img src={scan.url} alt="Scan" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Fish className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-slate-800 font-medium">{fishType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${scan.detected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {scan.detected ? 'Detected' : 'No Detection'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${gradeColors[grade]}`}>
                          <Award className="w-3 h-3" />
                          {grade}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {score !== null && score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${score >= 0.9 ? 'bg-green-500' : score >= 0.8 ? 'bg-blue-500' : 'bg-red-500'}`}
                                style={{ width: `${score * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-800 font-medium">{getScoreDisplay(score)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-700">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm text-slate-800">{userName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-800">{formatDate(scan.timestamp)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailModal({ open: true, scan })}
                            className="p-2 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-transparent hover:border-blue-200 transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDisableClick(scan, e)}
                            className="p-2 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-transparent hover:border-orange-200 transition-all"
                            title="Disable Scan"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(scan, e)}
                            className="p-2 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-transparent hover:border-red-200 transition-all"
                            title="Delete Scan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="text-sm text-slate-700">
              {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalScans)} of {totalScans}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-blue-300 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let startPage = Math.max(1, page - 2)
                const endPage = Math.min(totalPages, startPage + 4)
                if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4)
                const pageNum = startPage + i
                if (pageNum > totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 text-sm border rounded transition-colors ${
                      page === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-blue-300 hover:bg-blue-50 text-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-blue-300 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal.open && detailModal.scan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailModal({ open: false, scan: null })}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-black/15 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/15 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">Scan Details</h2>
              <button onClick={() => setDetailModal({ open: false, scan: null })} className="p-1 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="shrink-0">
                  <div className="w-full md:w-64 aspect-square bg-slate-100 border border-black/10 overflow-hidden">
                    {detailModal.scan.url ? (
                      <img src={detailModal.scan.url} alt="Scan" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium ${gradeColors[getGradeDisplay(detailModal.scan.grade)]}`}>
                      <Award className="w-4 h-4" />
                      {getGradeDisplay(detailModal.scan.grade)} Grade
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fish Type</div>
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Fish className="w-4 h-4 text-slate-500" />
                        {detailModal.scan.fish_type || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Confidence Score</div>
                      {detailModal.scan.score !== null && detailModal.scan.score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${detailModal.scan.score >= 0.9 ? 'bg-green-500' : detailModal.scan.score >= 0.8 ? 'bg-blue-500' : 'bg-red-500'}`}
                              style={{ width: `${detailModal.scan.score * 100}%` }}
                            />
                          </div>
                          <span className="text-slate-900 font-medium">{getScoreDisplay(detailModal.scan.score)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">User</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        <User className="w-4 h-4 text-slate-500" />
                        {detailModal.scan.user_name || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Date & Time</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {formatDate(detailModal.scan.timestamp)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Detection Status</div>
                      <div className="flex items-center gap-2">
                        {detailModal.scan.detected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Daing Detected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded">
                            <XCircle className="w-3 h-3" />
                            No Daing Detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scan ID */}
                  <div className="pt-4 border-t border-black/10">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Scan ID</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800">{detailModal.scan.id}</code>
                      <CopyButton text={detailModal.scan.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between p-5 border-t border-black/15 bg-slate-50 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDisableClick(detailModal.scan!)}
                  className="px-4 py-2 border border-orange-300 text-orange-600 text-base font-medium hover:bg-orange-50"
                >
                  Disable Scan
                </button>
                <button
                  onClick={() => handleDeleteClick(detailModal.scan!)}
                  className="px-4 py-2 border border-red-300 text-red-600 text-base font-medium hover:bg-red-50"
                >
                  Delete Scan
                </button>
              </div>
              <button
                onClick={() => setDetailModal({ open: false, scan: null })}
                className="px-4 py-2 bg-blue-600 text-white text-base font-medium hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Scan Modal */}
      {disableModal.open && disableModal.scan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md border border-black/15 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-black/15">
              <h2 className="text-lg font-semibold text-slate-900">Disable Scan</h2>
              <button onClick={() => setDisableModal({ open: false, scan: null })} className="p-1 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-black/10">
                <div className="font-medium text-slate-900">Scan ID: {disableModal.scan.id.slice(0, 20)}...</div>
                <div className="text-sm text-slate-600 mt-1">by {disableModal.scan.user_name || 'Unknown'}</div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  This scan will be disabled and hidden from public view. The user will be notified via email with the reason provided.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">Reason for disabling</label>
                <textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-black/15 text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="e.g., Image quality issues, inappropriate content, copyright violation..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-black/15 bg-slate-50">
              <button
                onClick={() => setDisableModal({ open: false, scan: null })}
                className="px-4 py-2 border border-black/15 text-base text-slate-800 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableConfirm}
                disabled={disableLoading}
                className="px-4 py-2 bg-orange-600 text-white text-base font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {disableLoading ? 'Processing...' : 'Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Scan Modal */}
      {deleteModal.open && deleteModal.scan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md border border-black/15 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-black/15">
              <h2 className="text-lg font-semibold text-slate-900">Delete Scan Permanently</h2>
              <button onClick={() => setDeleteModal({ open: false, scan: null })} className="p-1 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-black/10">
                <div className="font-medium text-slate-900">Scan ID: {deleteModal.scan.id.slice(0, 20)}...</div>
                <div className="text-sm text-slate-600 mt-1">by {deleteModal.scan.user_name || 'Unknown'}</div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-900 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Warning:</strong> This action is permanent and cannot be undone. The scan image will be permanently deleted from the database and cloud storage.
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-black/15 bg-slate-50">
              <button
                onClick={() => setDeleteModal({ open: false, scan: null })}
                className="px-4 py-2 border border-black/15 text-base text-slate-800 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white text-base font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
