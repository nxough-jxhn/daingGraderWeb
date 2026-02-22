/**
 * History page: side-by-side layout.
 * Left  – two image containers (your scans above, others below).
 * Right – Recharts vertical LineChart showing distribution by daing type with
 *         date-range and scope (mine / everyone) filters.
 */
import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageTitleHero from '../components/layout/PageTitleHero'
import {
  getDetailedHistory,
  getHistoryChart,
  type DetailedHistoryEntry,
  type ScanChartDistribution,
} from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
  History,
  X,
  Loader2,
  ImageOff,
  Filter,
  Calendar,
  Eye,
  User,
  Users,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/* ─── helpers ─── */
function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const GRADE_COLORS: Record<string, string> = {
  Export: '#22c55e',  // green-500
  Local: '#3b82f6',   // blue-500
  Reject: '#ef4444',  // red-500
}

/* ─── image card shared by both containers ─── */
function ScanCard({ entry, onClick }: { entry: DetailedHistoryEntry; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/card relative overflow-hidden border border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-lg"
    >
      <div className="aspect-square overflow-hidden bg-blue-100">
        <img
          src={entry.url}
          alt={`${entry.fish_type} – ${entry.grade}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover/card:translate-y-0 transition-transform">
        <div className="text-white text-sm font-semibold truncate">{entry.fish_type || 'Unknown'}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="px-2 py-0.5 bg-blue-400/60 text-white text-xs font-medium rounded">{entry.grade || 'N/A'}</span>
          <span className="text-white/80 text-xs">{formatTime(entry.timestamp)}</span>
        </div>
      </div>
      {/* Static label */}
      <div className="p-2 bg-gradient-to-r from-white to-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-900 truncate font-semibold">{entry.fish_type || 'Unknown'}</p>
        <p className="text-xs text-blue-700">{entry.grade || 'N/A'} • {formatTime(entry.timestamp)}</p>
      </div>
    </button>
  )
}

/* ─── scrollable image container ─── */
function ImageContainer({
  title,
  icon,
  entries,
  onItemClick,
  emptyText,
}: {
  title: string
  icon: React.ReactNode
  entries: DetailedHistoryEntry[]
  onItemClick: (e: DetailedHistoryEntry) => void
  emptyText: string
}) {
  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        {icon}
        <h3 className="font-semibold text-blue-900 text-sm">{title}</h3>
        <span className="ml-auto text-xs text-slate-500">{entries.length} scan{entries.length !== 1 ? 's' : ''}</span>
      </div>
      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-sm">{emptyText}</div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[40vh] p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {entries.map((entry) => (
            <ScanCard key={entry.id} entry={entry} onClick={() => onItemClick(entry)} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── main page ─── */
export default function HistoryPage() {
  const { isLoggedIn, user } = useAuth()

  /* images state */
  const [entries, setEntries] = useState<DetailedHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* chart state */
  const [chartData, setChartData] = useState<ScanChartDistribution[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  /* chart filters */
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [scope, setScope] = useState<'all' | 'mine'>('all')

  /* modal */
  const [modalEntry, setModalEntry] = useState<DetailedHistoryEntry | null>(null)

  /* ── fetch images ── */
  useEffect(() => {
    const controller = new AbortController()
    getDetailedHistory(controller.signal)
      .then((data) => {
        setEntries(data.entries)
        setError(null)
      })
      .catch((err) => {
        if ((err as { code?: string }).code === 'ERR_CANCELED') return
        setError('Could not load history. Is the backend running?')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  /* ── fetch chart data (re-fetch when filters change) ── */
  useEffect(() => {
    const controller = new AbortController()
    setChartLoading(true)
    const params: Record<string, string> = { scope }
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    getHistoryChart(params as any, controller.signal)
      .then((data) => setChartData(data.data))
      .catch((err) => {
        if ((err as { code?: string }).code === 'ERR_CANCELED') return
      })
      .finally(() => setChartLoading(false))
    return () => controller.abort()
  }, [startDate, endDate, scope])

  /* ── split images by user ── */
  const { myScans, otherScans } = useMemo(() => {
    const mine: DetailedHistoryEntry[] = []
    const others: DetailedHistoryEntry[] = []
    for (const e of entries) {
      if (user?.id && e.user_id === user.id) {
        mine.push(e)
      } else {
        others.push(e)
      }
    }
    return { myScans: mine, otherScans: others }
  }, [entries, user])

  /* ── not logged in gate ── */
  if (!isLoggedIn) {
    return (
      <div className="space-y-8">
        <PageTitleHero
          title="Scan History"
          description="Your saved analysis images from the cloud, organized by date."
          breadcrumb="History"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-8 text-center shadow-lg">
            <History className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Login to view your scan history</h2>
            <p className="text-slate-600 mb-6">Sign in to access your saved fish analysis images and grading history.</p>
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

  return (
    <div className="space-y-8">
      <PageTitleHero
        title="Scan History"
        description="Your saved analysis images and grading analytics."
        breadcrumb="History"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="card max-w-xl">
          <div className="text-red-600 flex items-center gap-2">
            <ImageOff className="w-5 h-5" />
            {error}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="card max-w-xl text-center py-12">
          <History className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">No scans yet</h2>
          <p className="text-slate-600 mb-4">Analyze a dried fish image on the Grade page to see your history here.</p>
          <Link
            to="/grade"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Go to Grade
          </Link>
        </div>
      ) : (
        /* ── main side-by-side layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-1">
          {/* ── LEFT: Scan Images ── */}
          <div className="space-y-6">
            <ImageContainer
              title="Your Scans"
              icon={<User className="w-4 h-4 text-blue-600" />}
              entries={myScans}
              onItemClick={setModalEntry}
              emptyText="No scans from you yet."
            />
            <ImageContainer
              title="Other Users' Scans"
              icon={<Users className="w-4 h-4 text-indigo-600" />}
              entries={otherScans}
              onItemClick={setModalEntry}
              emptyText="No scans from other users yet."
            />
          </div>

          {/* ── RIGHT: Chart & Filters ── */}
          <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Chart header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
              <Eye className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-blue-900 text-sm">Grade Distribution by Fish Type</h3>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-blue-100 bg-slate-50/60">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">Filters</span>
              </div>

              {/* Scope toggle */}
              <div className="flex items-center bg-white border border-blue-200 rounded-lg overflow-hidden text-xs">
                <button
                  onClick={() => setScope('all')}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    scope === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  Everyone
                </button>
                <button
                  onClick={() => setScope('mine')}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    scope === 'mine'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  My Scans
                </button>
              </div>

              {/* Date range */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 border border-blue-200 text-xs bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Start"
                />
                <span className="text-xs text-slate-400">–</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-blue-200 text-xs bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="End"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate('') }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Chart */}
            <div className="flex-1 p-4 min-h-[350px] flex items-center justify-center">
              {chartLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              ) : chartData.length === 0 ? (
                <p className="text-slate-400 text-sm">No data available for the selected filters.</p>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart
                    layout="vertical"
                    data={chartData.map(d => ({ ...d, label: `${d.fish_type} (${d.Total})` }))}
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="label"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={140}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload as ScanChartDistribution & { label: string }
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
                            <p className="font-bold text-slate-900 mb-1">{d.fish_type}</p>
                            <p className="text-slate-600 mb-2">Total detected: <span className="font-semibold">{d.Total}</span></p>
                            <div className="space-y-1">
                              {(['Export', 'Local', 'Reject'] as const).map(g => (
                                <div key={g} className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GRADE_COLORS[g] }} />
                                  <span className="text-slate-600">{g}:</span>
                                  <span className="font-semibold">{(d as any)[g]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Line
                      dataKey="Export"
                      stroke={GRADE_COLORS.Export}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      dataKey="Local"
                      stroke={GRADE_COLORS.Local}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      dataKey="Reject"
                      stroke={GRADE_COLORS.Reject}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Summary rows: per-type counts + grade totals */}
            {!chartLoading && chartData.length > 0 && (
              <div className="border-t border-blue-100 bg-slate-50/60">
                {/* Fish type counts */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs border-b border-blue-50">
                  <span className="font-semibold text-slate-700">Detected:</span>
                  {chartData.filter(d => d.Total > 0).map(d => (
                    <span key={d.fish_type} className="text-slate-600">
                      {d.Total} <span className="font-medium text-slate-800">{d.fish_type}</span>
                    </span>
                  ))}
                </div>
                {/* Grade totals */}
                <div className="flex items-center justify-around px-4 py-2.5 text-xs">
                  {Object.entries(GRADE_COLORS).map(([grade, color]) => {
                    const total = chartData.reduce((sum, d) => sum + ((d as any)[grade] ?? 0), 0)
                    return (
                      <div key={grade} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-700">{grade}</span>
                        <span className="text-slate-500">{total}</span>
                      </div>
                    )
                  })}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="font-medium text-slate-700">Total</span>
                    <span className="text-slate-500">{chartData.reduce((s, d) => s + d.Total, 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-size image modal with detailed data */}
      {modalEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalEntry(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View image"
        >
          <button
            type="button"
            onClick={() => setModalEntry(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col lg:flex-row gap-6 items-start"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="flex-1 min-w-0">
              <img
                src={modalEntry.url}
                alt={`${modalEntry.fish_type} – ${modalEntry.grade}`}
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg shadow-2xl mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Details panel */}
            <div className="w-full lg:w-72 shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 space-y-4">
              <div>
                <p className="text-white text-lg font-bold">{modalEntry.fish_type || 'Unknown Fish'}</p>
                <p className="text-white/60 text-xs mt-0.5">
                  {formatDateLabel(modalEntry.timestamp)} at {formatTime(modalEntry.timestamp)}
                </p>
              </div>
              {/* Grade badge */}
              {(() => {
                const gradeColor = modalEntry.grade === 'Export' ? 'bg-emerald-500' : modalEntry.grade === 'Local' ? 'bg-blue-500' : 'bg-red-500'
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${gradeColor}`}>
                    <span className="text-white text-sm font-bold">{modalEntry.grade || 'N/A'} Grade</span>
                  </div>
                )
              })()}
              {/* Numerical data */}
              <div className="space-y-3">
                {modalEntry.score != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Confidence</span>
                    <span className="text-white font-semibold">{Math.round(modalEntry.score * 100)}%</span>
                  </div>
                )}
                {modalEntry.score != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">AI Score</span>
                    <span className="text-white font-semibold">{modalEntry.score.toFixed(4)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Defect Est.</span>
                  <span className="text-white font-semibold">{modalEntry.score != null ? `${Math.max(0, Math.round((1 - modalEntry.score) * 60))}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Mold Est.</span>
                  <span className="text-white font-semibold">{modalEntry.score != null ? `${Math.max(0, Math.round((1 - modalEntry.score) * 30))}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Price Est.</span>
                  <span className="text-white font-semibold">
                    {(() => {
                      if (modalEntry.score == null) return 'N/A'
                      const priceMap: Record<string, [number, number]> = { Export: [350, 520], Local: [200, 349], Reject: [60, 199] }
                      const [lo, hi] = priceMap[modalEntry.grade] ?? [0, 0]
                      return `₱${Math.round(lo + (hi - lo) * modalEntry.score)}/kg`
                    })()}
                  </span>
                </div>
              </div>
              {/* Scanned by */}
              {modalEntry.user_name && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-white/50 text-xs">Scanned by</p>
                  <p className="text-white/90 text-sm font-medium">{modalEntry.user_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
