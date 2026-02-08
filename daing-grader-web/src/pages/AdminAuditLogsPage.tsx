import React, { useEffect, useMemo, useState } from 'react'
import { Filter, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import PageTitleHero from '../components/layout/PageTitleHero'
import { getAdminAuditLogs, type AdminAuditLogEntry } from '../services/api'

type AuditCategory = 'Scans' | 'Users' | 'Community' | 'Auth' | 'Dataset' | 'Comments'
type AuditStatus = 'success' | 'warning' | 'error'

const categoryOptions: Array<'All' | AuditCategory> = ['All', 'Scans', 'Users', 'Community', 'Auth', 'Dataset', 'Comments']
const statusOptions: Array<'All' | AuditStatus> = ['All', 'success', 'warning', 'error']

// Category descriptions for activity labels
const categoryDescriptions: Record<AuditCategory, { title: string; description: string; activities: string[] }> = {
  'Scans': {
    title: 'Scan Activities',
    description: 'Fish scanning and grading actions',
    activities: ['Created fish scan', 'Disabled scan', 'Enabled scan', 'Permanently deleted scan']
  },
  'Community': {
    title: 'Community Activities',
    description: 'Community posts and interactions',
    activities: ['Created community post', 'Liked post', 'Unliked post', 'Deleted post']
  },
  'Comments': {
    title: 'Comment Activities',
    description: 'Post comments and replies',
    activities: ['Created comment', 'Deleted comment', 'Edited comment']
  },
  'Users': {
    title: 'User Management Activities',
    description: 'User account and role management',
    activities: ['Updated user role', 'Changed user status', 'Disabled user account', 'Enabled user account']
  },
  'Auth': {
    title: 'Authentication Activities',
    description: 'Login and account security events',
    activities: ['User login', 'User logout', 'Password changed', 'Email verified', 'Login failed']
  },
  'Dataset': {
    title: 'Dataset Management',
    description: 'Dataset upload and management',
    activities: ['Uploaded dataset image', 'Deleted dataset entry', 'Bulk uploaded dataset']
  }
}

// Status explanations
const statusExplanations: Record<AuditStatus, string> = {
  'success': 'Activity completed successfully',
  'warning': 'Activity completed with potential issues or warnings',
  'error': 'Activity failed to complete'
}

const formatDate = (timestamp: string) => {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return timestamp
  return d.toISOString().slice(0, 10)
}

const formatTime = (timestamp: string) => {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(11, 19)
}

export default function AdminAuditLogsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [range, setRange] = useState<'12m' | '6m'>('12m')
  const [halfYear, setHalfYear] = useState<'H1' | 'H2'>('H1')
  
  const [category, setCategory] = useState<'All' | AuditCategory>('All')
  const [status, setStatus] = useState<'All' | AuditStatus>('All')
  const [actorQuery, setActorQuery] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [filteredCollapsed, setFilteredCollapsed] = useState(false)
  const [allActivityCollapsed, setAllActivityCollapsed] = useState(false)
  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [allActivityPage, setAllActivityPage] = useState(1)
  const allActivityPageSize = 10

  const loadLogs = () => {
    setLogsLoading(true)
    setLogsError(null)
    getAdminAuditLogs()
      .then((data) => setLogs(data.entries || []))
      .catch(() => setLogsError('Failed to load audit logs'))
      .finally(() => setLogsLoading(false))
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const categoryMatch = category === 'All' || log.category === category
      const statusMatch = status === 'All' || log.status === status
      const actorMatch = actorQuery.trim().length === 0
        || log.actor.toLowerCase().includes(actorQuery.trim().toLowerCase())
      return categoryMatch && statusMatch && actorMatch
    })
  }, [logs, category, status, actorQuery])

  const isFiltered = category !== 'All' || status !== 'All' || actorQuery.trim().length > 0

  // Date range filtering for chart - show only logs within selected range
  const logsForChart = useMemo(() => {
    const base = isFiltered ? filteredLogs : logs
    const now = new Date(year, 11, 31) // Last day of the year
    
    if (range === '6m') {
      const startMonth = halfYear === 'H1' ? 0 : 6
      const startDate = new Date(year, startMonth, 1)
      const endDate = halfYear === 'H1' 
        ? new Date(year, 5, 30) 
        : new Date(year, 11, 31)
      
      return base.filter((log) => {
        const logDate = new Date(log.timestamp)
        return logDate >= startDate && logDate <= endDate
      })
    }
    
    return base.filter((log) => {
      const logDate = new Date(log.timestamp)
      return logDate.getFullYear() === year
    })
  }, [logs, isFiltered, filteredLogs, year, range, halfYear])

  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const generateDates = () => {
      const dates = []
      if (range === '6m') {
        const startMonth = halfYear === 'H1' ? 0 : 6
        const endMonth = halfYear === 'H1' ? 5 : 11
        for (let m = startMonth; m <= endMonth; m++) {
          const monthDate = new Date(year, m, 15)
          const key = monthDate.toISOString().slice(0, 7) // YYYY-MM
          const label = monthNames[m]
          dates.push({ key, label, count: 0 })
        }
      } else {
        // 12 months of the year
        for (let m = 0; m < 12; m++) {
          const monthDate = new Date(year, m, 15)
          const key = monthDate.toISOString().slice(0, 7)
          const label = monthNames[m]
          dates.push({ key, label, count: 0 })
        }
      }
      return dates
    }
    const days = generateDates()

    const index = new Map(days.map((d) => [d.key, d]))
    logsForChart.forEach((log) => {
      const key = range === '6m' || range === '12m' ? formatDate(log.timestamp).slice(0, 7) : formatDate(log.timestamp)
      const entry = index.get(key)
      if (entry) entry.count += 1
    })

    return days
  }, [logsForChart, range, year, halfYear])

  const chartPoints = useMemo(() => {
    const width = 600
    const height = 180
    const padding = 24
    const counts = chartData.map((d) => d.count)
    const maxCount = Math.max(1, ...counts)
    const stepX = chartData.length > 1 ? (width - padding * 2) / (chartData.length - 1) : 0
    const points = chartData.map((d, i) => {
      const x = padding + i * stepX
      const y = padding + (height - padding * 2) * (1 - d.count / maxCount)
      return { x, y }
    })
    return { width, height, padding, maxCount, points }
  }, [chartData])

  const kpis = useMemo(() => {
    const total = logs.length
    const recent = logs.filter((log) => {
      const d = new Date(log.timestamp)
      const diff = Date.now() - d.getTime()
      return diff <= 24 * 60 * 60 * 1000
    }).length
    const topActor = logs[0]?.actor || 'N/A'
    const categories = [...new Set(logs.map((log) => log.category))]
    const topCategory = categories.length > 0 ? categories[0] : 'N/A'

    return [
      { label: 'Total Events', value: total.toString() },
      { label: 'Last 24h', value: recent.toString() },
      { label: 'Top Actor', value: topActor },
      { label: 'Top Category', value: topCategory },
    ]
  }, [logs])

  return (
    <div className="space-y-6 w-full min-h-screen">
      {/* Page Hero */}
      <PageTitleHero
        title="Audit & Activity Logs"
        subtitle="Monitor system activities, user actions, and security events across the platform."
        backgroundImage="/assets/page-hero/hero-bg.jpg"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Activity Monitoring</h2>
          <p className="text-sm text-slate-500">Real-time audit log analytics and filtering</p>
        </div>
        <button
          onClick={loadLogs}
          className="px-3 py-2 border border-black shadow-md bg-white text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 rounded"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="text-xs font-semibold text-blue-600">{kpi.label}</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Chart with Date Range Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 lg:col-span-3 rounded-lg relative">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-900">Activity Trend</div>
                <div className="text-xs text-slate-600">{range === '6m' ? `H${halfYear === 'H1' ? '1' : '2'} ${year}` : `Year ${year}`}</div>
              </div>
              <button
                onClick={() => setChartModalOpen(true)}
                className="p-2 hover:bg-blue-100 rounded transition-colors"
                title="Expand chart"
              >
                <Maximize2 className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-2 py-1 border border-black shadow-md bg-white text-xs font-semibold rounded"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => setRange('12m')}
                  className={`px-2 py-1 text-xs font-semibold rounded ${range === '12m'
                    ? 'border border-black shadow-md bg-slate-900 text-white'
                    : 'border border-black shadow-md bg-white text-slate-900'}`}
                >
                  12m
                </button>
                <button
                  onClick={() => setRange('6m')}
                  className={`px-2 py-1 text-xs font-semibold rounded ${range === '6m'
                    ? 'border border-black shadow-md bg-slate-900 text-white'
                    : 'border border-black shadow-md bg-white text-slate-900'}`}
                >
                  6m
                </button>
              </div>
              {range === '6m' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setHalfYear('H1')}
                    className={`px-2 py-1 text-xs font-semibold rounded ${halfYear === 'H1'
                      ? 'border border-black shadow-md bg-slate-900 text-white'
                      : 'border border-black shadow-md bg-white text-slate-900'}`}
                  >
                    H1
                  </button>
                  <button
                    onClick={() => setHalfYear('H2')}
                    className={`px-2 py-1 text-xs font-semibold rounded ${halfYear === 'H2'
                      ? 'border border-black shadow-md bg-slate-900 text-white'
                      : 'border border-black shadow-md bg-white text-slate-900'}`}
                  >
                    H2
                  </button>
                </div>
              )}
            </div>
          </div>
          {logsLoading ? (
            <div className="h-44 flex items-center justify-center text-sm text-slate-500">Loading activity…</div>
          ) : logsError ? (
            <div className="h-44 flex items-center justify-center text-sm text-red-600">{logsError}</div>
          ) : (
            <>
              <div className="relative w-full h-44">
                <svg viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`} preserveAspectRatio="none" className="w-full h-full">
                  {chartPoints.points.map((point, idx) => {
                    const barWidth = chartPoints.points.length > 1
                      ? (chartPoints.width - chartPoints.padding * 2) / chartPoints.points.length - 8
                      : 24
                    const barX = point.x - barWidth / 2
                    const barHeight = chartPoints.height - chartPoints.padding - point.y
                    const isHovered = hoveredIndex === idx
                    return (
                      <g
                        key={`bar-${idx}`}
                        onMouseEnter={(e) => {
                          setHoveredIndex(idx)
                          const svg = e.currentTarget.closest('svg')
                          if (svg) {
                            const rect = svg.getBoundingClientRect()
                            const svgX = (point.x / chartPoints.width) * rect.width
                            const svgY = (point.y / chartPoints.height) * rect.height
                            setTooltipPos({ x: rect.left + svgX, y: rect.top + svgY - 50 })
                          }
                        }}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x={barX}
                          y={point.y}
                          width={barWidth}
                          height={barHeight}
                          rx={4}
                          fill={isHovered ? '#2563EB' : '#3B82F6'}
                        />
                      </g>
                    )
                  })}
                </svg>
                {hoveredIndex !== null && (
                  <div
                    className="fixed bg-slate-800 text-white px-3 py-2 rounded text-xs whitespace-nowrap shadow-lg pointer-events-none z-50"
                    style={{
                      left: tooltipPos.x,
                      top: tooltipPos.y,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="font-semibold">{chartData[hoveredIndex!].key}</div>
                    <div>{chartData[hoveredIndex!].count} events</div>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                {chartData.map((d) => (
                  <span key={d.key}>{d.label}</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg">
          <div className="text-sm font-bold text-blue-900 mb-3">Filter Options</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'All' | AuditCategory)}
                className="w-full mt-1 px-2 py-1 border border-slate-200 shadow-md bg-white text-xs"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'All' | AuditStatus)}
                className="w-full mt-1 px-2 py-1 border border-slate-200 shadow-md bg-white text-xs"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-2">Status Legend</label>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-100 border border-green-800 rounded"></span>
                  <span className="text-slate-600">Success - Action completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-100 border border-yellow-800 rounded"></span>
                  <span className="text-slate-600">Warning - Completed w/ issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-100 border border-red-800 rounded"></span>
                  <span className="text-slate-600">Error - Action failed</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-2">Search Actor/Activity by ID or Name</label>
              <input
                value={actorQuery}
                onChange={(e) => setActorQuery(e.target.value)}
                placeholder="Enter actor name or ID"
                className="w-full mt-1 px-2 py-1 border border-slate-300 shadow-md text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Activity Table (Collapsible) */}
      {isFiltered && (
        <div className="bg-white border border-blue-200 shadow-md overflow-hidden rounded-lg">
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors bg-gradient-to-r from-white to-blue-50"
            onClick={() => setFilteredCollapsed(!filteredCollapsed)}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {category !== 'All' && category in categoryDescriptions && (
                  <>
                    <span className="font-bold text-blue-900 text-base">{categoryDescriptions[category as AuditCategory].title}</span>
                    <p className="text-xs text-slate-700">{categoryDescriptions[category as AuditCategory].description}</p>
                  </>
                )}
                {category === 'All' && (
                  <>
                    <span className="font-bold text-blue-900 text-base">Filtered Activity</span>
                    <p className="text-xs text-slate-700">Activities matching current filters</p>
                  </>
                )}
              </div>
              <span className="text-sm text-white bg-blue-600 px-3 py-1 font-semibold whitespace-nowrap rounded">{filteredLogs.length}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${filteredCollapsed ? '-rotate-90' : ''}`} />
          </div>

          {!filteredCollapsed && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-700 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                  <tr>
                    <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Time</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Actor</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Role</th>
                    <th className="text-left py-3 px-4 font-bold text-blue-900">Action</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Entity</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Entity ID</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Status</th>
                    <th className="text-left py-3 px-4 font-bold text-blue-900">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">Loading activity…</td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">No activity for this filter.</td>
                    </tr>
                  ) : (
                    filteredLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap text-xs">{formatDate(log.timestamp)} {formatTime(log.timestamp)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{log.actor}</td>
                        <td className="py-3 px-4 capitalize text-xs whitespace-nowrap">{log.role}</td>
                        <td className="py-3 px-4">{log.action}</td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">{log.entity}</td>
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">{log.entity_id?.substring(0, 12)}...</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold capitalize rounded inline-block ${
                            log.status === 'success' ? 'bg-green-100 text-green-800' :
                            log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Activity Table (Collapsible) */}
      <div className="bg-white border border-blue-200 shadow-md overflow-hidden rounded-lg">
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors bg-gradient-to-r from-white to-blue-50"
          onClick={() => setAllActivityCollapsed(!allActivityCollapsed)}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="font-bold text-blue-900 text-base">All Activity</span>
              <p className="text-xs text-slate-700">Complete audit log of all events in the system</p>
            </div>
            <span className="text-sm text-white bg-blue-600 px-3 py-1 font-semibold whitespace-nowrap rounded">{logs.length}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${allActivityCollapsed ? '-rotate-90' : ''}`} />
        </div>

        {!allActivityCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-700 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <tr>
                  <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Time</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Actor</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Role</th>
                  <th className="text-left py-3 px-4 font-bold text-blue-900">Action</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Entity</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Entity ID</th>
                  <th className="text-left py-3 px-4 whitespace-nowrap font-bold text-blue-900">Status</th>
                  <th className="text-left py-3 px-4 font-bold text-blue-900">Details</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">Loading activity…</td>
                  </tr>
                ) : logsError ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-red-600">{logsError}</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">No activity yet</td>
                  </tr>
                ) : (
                  logs.slice((allActivityPage - 1) * allActivityPageSize, allActivityPage * allActivityPageSize).map((log) => (
                    <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap text-xs">{formatDate(log.timestamp)} {formatTime(log.timestamp)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{log.actor}</td>
                      <td className="py-3 px-4 capitalize text-xs whitespace-nowrap">{log.role}</td>
                      <td className="py-3 px-4">{log.action}</td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">{log.entity}</td>
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">{log.entity_id?.substring(0, 12)}...</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold capitalize rounded inline-block ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' :
                          log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}

          {logs.length > allActivityPageSize && (
            <div className="px-5 py-4 border-t border-blue-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Page {allActivityPage} of {Math.ceil(logs.length / allActivityPageSize)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAllActivityPage(Math.max(1, allActivityPage - 1))}
                  disabled={allActivityPage === 1}
                  className="flex items-center gap-1 px-3 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded text-sm font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setAllActivityPage(Math.min(Math.ceil(logs.length / allActivityPageSize), allActivityPage + 1))}
                  disabled={allActivityPage === Math.ceil(logs.length / allActivityPageSize)}
                  className="flex items-center gap-1 px-3 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded text-sm font-medium"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Activity Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-md p-6 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-4 text-xl">Activity Categories Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categoryDescriptions).map(([key, value]) => (
            <div key={key} className="p-4 bg-white border-l-4 border-l-blue-500 shadow hover:shadow-md transition-shadow rounded">
              <div className="font-bold text-slate-900 text-sm mb-1">{value.title}</div>
              <div className="text-xs text-slate-700 mb-3 font-medium">{value.description}</div>
              <div className="text-xs text-slate-700">
                <strong className="text-blue-700">Examples:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {value.activities.map((act, i) => (
                    <li key={i} className="text-slate-800">{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Modal */}
      {chartModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-blue-200 bg-white">
              <div>
                <h3 className="text-lg font-bold text-blue-900">Activity Trend</h3>
                <p className="text-xs text-slate-600 mt-1">{range === '6m' ? `H${halfYear === 'H1' ? '1' : '2'} ${year}` : `Year ${year}`}</p>
              </div>
              <button
                onClick={() => setChartModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="px-2 py-1 border border-black shadow-md bg-white text-xs font-semibold rounded"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={() => setRange('12m')}
                    className={`px-2 py-1 text-xs font-semibold rounded ${range === '12m'
                      ? 'border border-black shadow-md bg-slate-900 text-white'
                      : 'border border-black shadow-md bg-white text-slate-900'}`}
                  >
                    12m
                  </button>
                  <button
                    onClick={() => setRange('6m')}
                    className={`px-2 py-1 text-xs font-semibold rounded ${range === '6m'
                      ? 'border border-black shadow-md bg-slate-900 text-white'
                      : 'border border-black shadow-md bg-white text-slate-900'}`}
                  >
                    6m
                  </button>
                </div>
                {range === '6m' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setHalfYear('H1')}
                      className={`px-2 py-1 text-xs font-semibold rounded ${halfYear === 'H1'
                        ? 'border border-black shadow-md bg-slate-900 text-white'
                        : 'border border-black shadow-md bg-white text-slate-900'}`}
                    >
                      H1
                    </button>
                    <button
                      onClick={() => setHalfYear('H2')}
                      className={`px-2 py-1 text-xs font-semibold rounded ${halfYear === 'H2'
                        ? 'border border-black shadow-md bg-slate-900 text-white'
                        : 'border border-black shadow-md bg-white text-slate-900'}`}
                    >
                      H2
                    </button>
                  </div>
                )}
              </div>

              {logsLoading ? (
                <div className="h-96 flex items-center justify-center text-sm text-slate-500">Loading activity…</div>
              ) : logsError ? (
                <div className="h-96 flex items-center justify-center text-sm text-red-600">{logsError}</div>
              ) : (
                <>
                  <div className="relative w-full h-96">
                    <svg viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`} preserveAspectRatio="none" className="w-full h-full">
                      {chartPoints.points.map((point, idx) => {
                        const barWidth = chartPoints.points.length > 1
                          ? (chartPoints.width - chartPoints.padding * 2) / chartPoints.points.length - 8
                          : 24
                        const barX = point.x - barWidth / 2
                        const barHeight = chartPoints.height - chartPoints.padding - point.y
                        const isHovered = hoveredIndex === idx
                        return (
                          <g
                            key={`bar-${idx}`}
                            onMouseEnter={(e) => {
                              setHoveredIndex(idx)
                              const svg = e.currentTarget.closest('svg')
                              if (svg) {
                                const rect = svg.getBoundingClientRect()
                                const svgX = (point.x / chartPoints.width) * rect.width
                                const svgY = (point.y / chartPoints.height) * rect.height
                                setTooltipPos({ x: rect.left + svgX, y: rect.top + svgY - 50 })
                              }
                            }}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            <rect
                              x={barX}
                              y={point.y}
                              width={barWidth}
                              height={barHeight}
                              rx={4}
                              fill={isHovered ? '#2563EB' : '#3B82F6'}
                            />
                          </g>
                        )
                      })}
                    </svg>
                    {hoveredIndex !== null && (
                      <div
                        className="fixed bg-slate-800 text-white px-3 py-2 rounded text-xs whitespace-nowrap shadow-lg pointer-events-none z-50"
                        style={{
                          left: tooltipPos.x,
                          top: tooltipPos.y,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div className="font-semibold">{chartData[hoveredIndex!].key}</div>
                        <div>{chartData[hoveredIndex!].count} events</div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-4">
                    {chartData.map((d) => (
                      <span key={d.key}>{d.label}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
