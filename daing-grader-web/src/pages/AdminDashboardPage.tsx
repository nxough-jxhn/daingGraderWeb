/**
 * Admin Dashboard - sharp-corner layout inspired by the provided reference.
 * Uses backend scan data for the graph + table.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart2,
  Users,
  ScanLine,
  Database,
  MessageCircle,
  ShoppingBag,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAdminScanPage, getAdminScanSummary, type AdminScanEntry, type AdminScanMonthSummary } from '../services/api'

const stats = [
  { label: 'Sales', value: '₱248,032', change: '+2.15%', trend: 'up' },
  { label: 'Avg Order Value', value: '₱561.20', change: '-1.35%', trend: 'down' },
  { label: 'Total Orders', value: '1,230', change: '+2.15%', trend: 'up' },
]

const communityHighlights = [
  { title: 'Best drying technique for Danggit?', likes: 214, author: 'Angie M.' },
  { title: 'Export-grade visuals checklist', likes: 182, author: 'Rico S.' },
  { title: 'Color grading tips from QA', likes: 154, author: 'Mel D.' },
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [range, setRange] = useState<'12m' | '6m'>('12m')
  const [summary, setSummary] = useState<AdminScanMonthSummary[]>([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [tableEntries, setTableEntries] = useState<AdminScanEntry[]>([])
  const [tableTotal, setTableTotal] = useState(0)
  const [tableLoading, setTableLoading] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)

  useEffect(() => {
    setSummaryLoading(true)
    setSummaryError(null)
    getAdminScanSummary(year)
      .then((data) => {
        setSummary(data.months || [])
      })
      .catch(() => setSummaryError('Failed to load scan summary'))
      .finally(() => setSummaryLoading(false))
  }, [year])

  useEffect(() => {
    setTableLoading(true)
    setTableError(null)
    getAdminScanPage(page, pageSize)
      .then((data) => {
        setTableEntries(data.entries || [])
        setTableTotal(data.total || 0)
      })
      .catch(() => setTableError('Failed to load scan table'))
      .finally(() => setTableLoading(false))
  }, [page])

  const monthsForChart = useMemo(() => {
    const safe = summary.length ? summary : []
    return range === '6m' ? safe.slice(-6) : safe
  }, [summary, range])

  const chartPoints = useMemo(() => {
    const width = 600
    const height = 200
    const padding = 20
    const counts = monthsForChart.map((m) => m.count)
    const maxCount = Math.max(1, ...counts)
    const stepX = counts.length > 1 ? (width - padding * 2) / (counts.length - 1) : 0
    const points = counts.map((count, i) => {
      const x = padding + i * stepX
      const y = padding + (height - padding * 2) * (1 - count / maxCount)
      return `${x},${y}`
    })
    return { points: points.join(' '), width, height, padding, maxCount }
  }, [monthsForChart])

  const totalPages = Math.max(1, Math.ceil(tableTotal / pageSize))
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

  const formatDate = (timestamp: string) => {
    if (!timestamp) return '—'
    const d = new Date(timestamp)
    if (Number.isNaN(d.getTime())) return timestamp
    return d.toISOString().slice(0, 10)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back {user?.name || 'Admin'}</h1>
          <p className="text-sm text-slate-500">You have 2 unread notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border border-black/20 bg-white text-sm font-medium hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 inline-block mr-2" />
            Date
          </button>
          <button className="px-3 py-2 border border-black/20 bg-white text-sm font-medium hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 inline-block mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">{stat.label}</div>
              <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</div>
            <div className="text-xs text-slate-400 mt-1">From Jan 01, 2026 - Feb 07, 2026</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders by time (heat map style) */}
        <div className="bg-white border border-black/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-800">Orders by Time</div>
            <div className="text-xs text-slate-400">0 — 250</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 border border-black/10 ${i % 6 === 0 ? 'bg-blue-600/40' : i % 4 === 0 ? 'bg-blue-400/30' : 'bg-blue-200/20'}`}
              />
            ))}
          </div>
        </div>

        {/* Number of scans (backend-driven chart) */}
        <div className="bg-white border border-black/20 p-4 lg:col-span-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
            <div className="text-sm font-semibold text-slate-800">Number of Scans</div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-2 py-1 border border-black/20 bg-white text-xs"
                aria-label="Select year"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="flex border border-black/20">
                <button
                  type="button"
                  onClick={() => setRange('12m')}
                  className={`px-2 py-1 text-xs ${range === '12m' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                >
                  12 Months
                </button>
                <button
                  type="button"
                  onClick={() => setRange('6m')}
                  className={`px-2 py-1 text-xs border-l border-black/20 ${range === '6m' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                >
                  6 Months
                </button>
              </div>
            </div>
          </div>

          {summaryLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-500">Loading chart…</div>
          ) : summaryError ? (
            <div className="h-48 flex items-center justify-center text-sm text-red-600">{summaryError}</div>
          ) : (
            <div>
              <div className="w-full h-48">
                <svg viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`} className="w-full h-full">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = chartPoints.padding + (i * (chartPoints.height - chartPoints.padding * 2)) / 4
                    return (
                      <line
                        key={`h-${i}`}
                        x1={chartPoints.padding}
                        y1={y}
                        x2={chartPoints.width - chartPoints.padding}
                        y2={y}
                        stroke="#E2E8F0"
                      />
                    )
                  })}

                  {monthsForChart.map((_, i) => {
                    const stepX = monthsForChart.length > 1
                      ? (chartPoints.width - chartPoints.padding * 2) / (monthsForChart.length - 1)
                      : 0
                    const x = chartPoints.padding + i * stepX
                    return (
                      <line
                        key={`v-${i}`}
                        x1={x}
                        y1={chartPoints.padding}
                        x2={x}
                        y2={chartPoints.height - chartPoints.padding}
                        stroke="#E2E8F0"
                      />
                    )
                  })}

                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    points={chartPoints.points}
                  />
                  {chartPoints.points.split(' ').map((p, idx) => {
                    const [x, y] = p.split(',')
                    return <circle key={`p-${idx}`} cx={x} cy={y} r="3" fill="#3B82F6" />
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                {monthsForChart.map((m) => (
                  <span key={m.key}>{m.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table + Community highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-black/20 p-4 lg:col-span-2">
          <div className="text-sm font-semibold text-slate-800 mb-3">Results of Scans</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 border-b border-black/10">
                <tr>
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Fish Type</th>
                  <th className="text-left py-2">Grade</th>
                  <th className="text-left py-2">Score</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">User</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">Loading scans…</td>
                  </tr>
                ) : tableError ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-red-600">{tableError}</td>
                  </tr>
                ) : tableEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">No scans found</td>
                  </tr>
                ) : (
                  tableEntries.map((row) => (
                    <tr key={row.id} className="border-b border-black/10">
                      <td className="py-2 font-medium text-slate-800">{row.id}</td>
                      <td className="py-2">{row.fish_type || 'Unknown'}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 border border-black/20 text-xs font-semibold">
                          {row.grade || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-2">{row.score != null ? row.score.toFixed(2) : '—'}</td>
                      <td className="py-2">{formatDate(row.timestamp)}</td>
                      <td className="py-2">{row.user_name || 'Unknown'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-slate-500">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-black/20 bg-white disabled:opacity-50"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-black/20 bg-white disabled:opacity-50"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/20 p-4">
          <div className="text-sm font-semibold text-slate-800 mb-3">Most Liked Community Post</div>
          <div className="space-y-3">
            {communityHighlights.map((post, idx) => (
              <div key={post.title} className="border border-black/10 p-3">
                <div className="text-xs text-slate-500">#{idx + 1} • {post.likes} likes</div>
                <div className="font-semibold text-slate-900 mt-1">{post.title}</div>
                <div className="text-xs text-slate-500 mt-1">by {post.author}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/forum" className="text-sm font-semibold text-blue-600 hover:underline">View Forum</Link>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Analytics', to: '/analytics', icon: BarChart2 },
          { label: 'History', to: '/history', icon: ScanLine },
          { label: 'Dataset', to: '/dataset', icon: Database },
          { label: 'E-commerce', to: '/shop', icon: ShoppingBag },
          { label: 'Community', to: '/forum', icon: MessageCircle },
          { label: 'Users', to: '/profile', icon: Users },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-3 bg-white border border-black/20 px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <item.icon className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-medium text-slate-800">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
