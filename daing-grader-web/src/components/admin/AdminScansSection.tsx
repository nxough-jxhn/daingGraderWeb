/**
 * AdminScansSection — Full analytics section for the Scans tab.
 *
 * Analytical Frameworks (aligned with AI scan output):
 *  1. Fish Type Classification   (Donut + Stacked Trend)
 *  2. Mold Comparison by Type    (Grouped Bar)
 *  3. Color Consistency           (Distribution Bars + Trend)
 *  4. Quality Grade               (Donut + Stacked Trend)
 *
 * Design:
 *  - Row 1: 4 KPI cards
 *  - Row 2: Scan volume trend (full-width area chart)
 *  - Row 3: Tabbed breakdown — 3 tabs, each with 2 side-by-side graphs
 *  - Row 4: Unified scan records table (paginated, searchable)
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  ScanLine, Activity, TrendingUp, TrendingDown,
  Search, ChevronLeft, ChevronRight, Maximize2,
  Fish, Calendar,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts'
import { Badge, TextInput, ActionIcon, Group, Button, Modal, Tooltip, Loader } from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import { KpiCard } from '../ui/KpiCard'
import { getAdminScanAnalytics, type AdminScanAnalytics } from '../../services/api'

// ────────────────────────── Types ──────────────────────────
type AnalyticsTab = 'fish-mold' | 'quality' | 'color'
type Granularity = 'week' | 'month' | 'year'

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ────────────────────────── Color Palette ──────────────────────────
const FISH_COLORS: Record<string, string> = {
  Galunggong: '#f59e0b',
  Bangus: '#3b82f6',
  Tilapia: '#10b981',
  Dilis: '#ef4444',
  Tuyo: '#8b5cf6',
  Danggit: '#ec4899',
  'Dalagang Bukid': '#06b6d4',
  Tamban: '#84cc16',
  Unknown: '#94a3b8',
}

const QUALITY_COLORS: Record<string, string> = {
  Export: '#22c55e',
  Local:  '#3b82f6',
  Reject: '#ef4444',
}

// ────────────────────────── Tooltip Styles ──────────────────────────
const TOOLTIP_STYLE = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    padding: '6px 12px',
    backgroundColor: '#fff',
  },
  cursor: { stroke: 'rgba(100,116,139,0.15)', strokeWidth: 1 },
}

// ────────────────────────── Sub-components ──────────────────────────

/** Donut chart matching the StraightAnglePie from the dashboard */
function ScanDonut({ slices, height = 150 }: { slices: { name: string; value: number; color: string }[]; height?: number }) {
  const RADIAN = Math.PI / 180
  const renderLabel = ({ cx, cy, midAngle, outerRadius, name, value, index }: any) => {
    const radius = outerRadius + 20
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 500, fontFamily: 'inherit' }} fill={slices[index]?.color || '#64748b'}>
        {name} ({value}%)
      </text>
    )
  }
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="90%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="value" startAngle={180} endAngle={0}
            cx="50%" cy="92%" outerRadius={height * 0.58} innerRadius={height * 0.22}
            label={renderLabel} isAnimationActive stroke="none">
            {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
          </Pie>
          <RechTooltip formatter={(val: any, name: any) => [`${val}%`, name]}
            {...TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Area chart matching AdminStackedAreaChart from the dashboard */
function ScanAreaChart({
  data, areas, xKey, height = 256, valueFormatter = (v: number) => v.toLocaleString(), showLegend = true,
}: {
  data: Record<string, any>[]; areas: { key: string; color: string }[]; xKey: string
  height?: number; valueFormatter?: (v: number) => string; showLegend?: boolean
}) {
  const gradId = areas.map(a => a.key.replace(/\s+/g, '_')).join('_')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          {areas.map(a => (
            <linearGradient key={a.key} id={`scan-${gradId}-${a.key.replace(/\s+/g, '_')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.color} stopOpacity={0.75} />
              <stop offset="95%" stopColor={a.color} stopOpacity={0.18} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={valueFormatter} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
        <RechTooltip formatter={(val: any, name: any) => [valueFormatter(Number(val)), name]} {...TOOLTIP_STYLE} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />}
        {areas.map(a => (
          <Area key={a.key} type="monotone" dataKey={a.key} stackId="1"
            stroke={a.color} strokeWidth={2}
            fill={`url(#scan-${gradId}-${a.key.replace(/\s+/g, '_')})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Grouped / stacked bar chart */
function ScanBarChart({
  data, bars, xKey, height = 220, valueFormatter = (v: number) => v.toLocaleString(),
  layout = 'vertical', stacked = false,
}: {
  data: Record<string, any>[]; bars: { key: string; color: string }[]; xKey: string
  height?: number; valueFormatter?: (v: number) => string
  layout?: 'vertical' | 'horizontal'; stacked?: boolean
}) {
  if (layout === 'horizontal') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} />
          <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
          <RechTooltip formatter={(val: any, name: any) => [valueFormatter(Number(val)), name]} {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
          {bars.map(b => (
            <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[0, 4, 4, 0]}
              stackId={stacked ? 'stack' : undefined} barSize={stacked ? 18 : 14} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={valueFormatter} />
        <RechTooltip formatter={(val: any, name: any) => [valueFormatter(Number(val)), name]} {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        {bars.map(b => (
          <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined} barSize={stacked ? 28 : 20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ────────────────────────── Main Component ──────────────────────────

export default function AdminScansSection({ searchValue }: { searchValue: string }) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('fish-mold')
  const [expandedChart, setExpandedChart] = useState(false)
  const [tablePage, setTablePage] = useState(1)
  const pageSize = 10

  // ─── Granularity + Date range (inside chart header, like Users section) ───
  const [granularity, setGranularity] = useState<Granularity>('week')
  const [dateRange, setDateRange] = useState<DatesRangeValue>([null, null])

  // ─── API data state ───
  const [data, setData] = useState<AdminScanAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadScansData = useCallback(async (gran: Granularity, range: DatesRangeValue) => {
    setLoading(true)
    setError(null)
    try {
      let params: { start_date?: string; end_date?: string; granularity?: string; days?: number }
      if (range[0] && range[1]) {
        // Custom date range → always daily granularity
        const s = range[0] instanceof Date ? range[0] : new Date(range[0])
        const e = range[1] instanceof Date ? range[1] : new Date(range[1])
        params = { granularity: 'daily', start_date: fmtDate(s), end_date: fmtDate(e) }
      } else if (gran === 'week') {
        params = { granularity: 'daily', days: 7 }
      } else if (gran === 'month') {
        params = { granularity: 'monthly' }
      } else {
        params = { granularity: 'yearly' }
      }
      const res = await getAdminScanAnalytics(params)
      setData(res)
    } catch (err: any) {
      setError(err?.message || 'Failed to load scan analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  // Toggle Week → Month → Year → Week
  const handleToggleGranularity = useCallback(() => {
    const next: Granularity = granularity === 'week' ? 'month' : granularity === 'month' ? 'year' : 'week'
    setGranularity(next)
    setDateRange([null, null])
  }, [granularity])

  // Custom date range change
  const handleDateRangeChange = useCallback((val: DatesRangeValue) => {
    setDateRange(val)
    if (val[0] && val[1]) loadScansData(granularity, val)
    else if (!val[0] && !val[1]) loadScansData(granularity, [null, null])
  }, [granularity, loadScansData])

  // Initial load + re-fetch on granularity change (when no custom range)
  useEffect(() => {
    loadScansData(granularity, dateRange)
  }, [granularity]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived data from API ───
  const records = data?.records ?? []
  const kpis = data?.kpis ?? { total_scans: 0, avg_mold: 0, avg_color: 0, reject_rate: 0 }

  // Add colors to distributions
  const fishTypeDistribution = useMemo(() =>
    (data?.fish_type_distribution ?? []).map(f => ({
      ...f,
      color: FISH_COLORS[f.name] || `#${Math.floor(Math.random() * 0xCCCCCC + 0x333333).toString(16)}`,
    })), [data])

  const qualityDistribution = useMemo(() =>
    (data?.quality_distribution ?? []).map(q => ({
      ...q,
      color: QUALITY_COLORS[q.name] || '#94a3b8',
    })), [data])

  const severityDistribution = data?.severity_distribution ?? []
  const moldByType = data?.mold_by_type ?? []
  const qualityTrend = data?.quality_trend ?? []
  const colorDistribution = data?.color_distribution ?? []
  const colorTrend = data?.color_trend ?? []
  const scanVolumeTrend = data?.scan_volume_trend ?? []

  // ─── Filtered table rows ───
  const filteredRecords = useMemo(() => {
    if (!searchValue.trim()) return records
    const q = searchValue.toLowerCase()
    return records.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.scanner.toLowerCase().includes(q) ||
      r.fishType.toLowerCase().includes(q) ||
      r.qualityGrade.toLowerCase().includes(q) ||
      r.moldSeverity.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  }, [searchValue, records])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const paginatedRecords = filteredRecords.slice((tablePage - 1) * pageSize, tablePage * pageSize)

  // Color trend summary stats
  const colorTrendAvg = useMemo(() => {
    if (!colorTrend.length) return 0
    return Math.round(colorTrend.reduce((s, c) => s + c.score, 0) / colorTrend.length)
  }, [colorTrend])
  const colorTrendLatest = colorTrend.length > 0 ? colorTrend[colorTrend.length - 1].score : 0

  const TABS: { key: AnalyticsTab; label: string; icon: React.ElementType }[] = [
    { key: 'fish-mold', label: 'Fish & Mold', icon: Fish },
    { key: 'quality', label: 'Quality Grades', icon: Activity },
    { key: 'color', label: 'Color Consistency', icon: Activity },
  ]

  // ─── Subtitle text based on granularity ───
  const trendSubtitle = granularity === 'week'
    ? 'Daily scan count (last 7 days)'
    : granularity === 'month'
      ? 'Monthly scan count (this year)'
      : 'Yearly scan count (all time)'

  // ─── Loading / Error states ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader color="orange" size="lg" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-rose-500 font-semibold text-sm">⚠️ {error}</p>
        <Button variant="light" color="yellow" size="xs" className="mt-3" onClick={() => loadScansData(granularity, dateRange)}>Retry</Button>
      </div>
    )
  }
  if (!data || data.total === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400 text-sm">No scan data available{(dateRange[0] || dateRange[1]) ? ' for the selected date range' : ' yet'}.</p>
        {(dateRange[0] || dateRange[1]) && (
          <Button variant="light" color="yellow" size="xs" className="mt-3" onClick={() => { setDateRange([null, null]); loadScansData(granularity, [null, null]) }}>Clear Date Filter</Button>
        )}
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
      {/* Amber accent line */}
      <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-amber-500/50 via-yellow-300/40 to-amber-500/50" />

      <div className="pl-8 pr-3 py-3 space-y-4">

        {/* ═══════════════ DATE FILTER ═══════════════ */}
        {/* ═══════════════ ROW 1: KPI CARDS ═══════════════ */}
        <div className="relative">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold shadow-sm">1 KPI</div>
          <div className="bg-white/80 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={<ScanLine className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-100" emoji="🔬" title="Total Scans"
              value={kpis.total_scans.toLocaleString()}
              badgeLabel="all time" description="All-time fish scans processed by the AI system" />
            <KpiCard icon={<Activity className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100" emoji="🦠" title="Avg Mold %"
              value={`${kpis.avg_mold.toFixed(1)}%`}
              badgeLabel="across all scans" description="Average mold coverage percentage across all scans" />
            <KpiCard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" emoji="🎨" title="Avg Color Score"
              value={`${kpis.avg_color.toFixed(0)}`}
              badgeLabel="0–100 scale" description="Average color consistency score (0–100) across all scans" />
            <KpiCard icon={<TrendingDown className="w-5 h-5 text-rose-600" />} iconBg="bg-rose-100" emoji="🚫" title="Reject Rate"
              value={`${kpis.reject_rate.toFixed(1)}%`}
              badgeLabel="of total scans" description="Percentage of scans graded as Reject quality" />
          </div>
        </div>

        {/* ═══════════════ ROW 2: MAIN TREND CHART ═══════════════ */}
        <div className="relative pt-2 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold shadow-sm">2 Trend</div>
          <div className="bg-white border border-slate-300 rounded-xl p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-900 font-bold">📈 Scan Volume & Quality Trend</p>
                <p className="text-xs text-slate-500 mt-1">{trendSubtitle}</p>
              </div>
              <Group gap="xs">
                <Button variant="default" size="xs" onClick={handleToggleGranularity}
                  className="text-xs font-medium min-w-[62px]">
                  {granularity === 'week' ? 'Week' : granularity === 'month' ? 'Month' : 'Year'}
                </Button>
                <DatePickerInput type="range" placeholder="Date range" value={dateRange}
                  onChange={handleDateRangeChange} leftSection={<Calendar className="w-4 h-4" />}
                  size="xs" clearable maxDate={new Date()}
                  styles={{ input: { border: '1px solid rgb(203 213 225)', borderRadius: '0.5rem', fontSize: '0.75rem' } }}
                  className="w-52" />
                <ActionIcon variant="default" onClick={() => setExpandedChart(true)}><Maximize2 className="w-4 h-4" /></ActionIcon>
              </Group>
            </div>
            <ScanAreaChart data={scanVolumeTrend} xKey="period"
              areas={[
                { key: 'Scans', color: '#f59e0b' },
                { key: 'Mold %', color: '#ef4444' },
              ]}
              height={256} />
          </div>
        </div>

        {/* Expanded chart modal */}
        <Modal opened={expandedChart} onClose={() => setExpandedChart(false)} size="90%" title={<span className="font-bold text-lg">Scan Volume & Mold — Expanded</span>} centered>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">{trendSubtitle}</p>
              <Group gap="xs">
                <Button variant="default" size="xs" onClick={handleToggleGranularity}
                  className="text-xs font-medium min-w-[62px]">
                  {granularity === 'week' ? 'Week' : granularity === 'month' ? 'Month' : 'Year'}
                </Button>
                <DatePickerInput type="range" placeholder="Date range" value={dateRange}
                  onChange={handleDateRangeChange} leftSection={<Calendar className="w-4 h-4" />}
                  size="xs" clearable maxDate={new Date()}
                  styles={{ input: { border: '1px solid rgb(203 213 225)', borderRadius: '0.5rem', fontSize: '0.75rem' } }}
                  className="w-52" />
              </Group>
            </div>
            <ScanAreaChart data={scanVolumeTrend} xKey="period"
              areas={[
                { key: 'Scans', color: '#f59e0b' },
                { key: 'Mold %', color: '#ef4444' },
              ]}
              height={500} />
          </div>
        </Modal>

        {/* ═══════════════ ROW 3: TABBED ANALYTICS ═══════════════ */}
        <div className="relative pt-2 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold shadow-sm">3 Analytics</div>

          {/* Tab navigation */}
          <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2">
              <div className="flex items-center gap-1">
                {TABS.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200
                        ${isActive
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4">
              {/* ───── Tab A: Fish & Mold ───── */}
              {activeTab === 'fish-mold' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Fish Type Distribution (Donut) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">🐟 Fish Type Classification</p>
                    <p className="text-[10px] text-slate-500 mb-2 italic">Distribution of scanned fish types across all scans</p>
                    <ScanDonut slices={fishTypeDistribution} height={160} />
                    <div className="mt-3 space-y-1.5">
                      {fishTypeDistribution.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                          <span className="text-xs text-slate-700 flex-1">{f.name}</span>
                          <span className="text-xs font-semibold text-slate-900">{f.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mold Comparison by Type (Grouped Bar) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">🦠 Mold Comparison by Fish Type</p>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Average, minimum, and maximum mold percentage per type</p>
                    <ScanBarChart
                      data={moldByType}
                      bars={[
                        { key: 'avgMold', color: '#f59e0b' },
                        { key: 'maxMold', color: '#ef4444' },
                        { key: 'minMold', color: '#22c55e' },
                      ]}
                      xKey="type"
                      height={240}
                      valueFormatter={(v) => `${v}%`}
                    />
                    <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} /> Avg Mold %</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#ef4444' }} /> Max Mold %</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#22c55e' }} /> Min Mold %</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ───── Tab B: Quality Grades ───── */}
              {activeTab === 'quality' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Quality Grade Distribution */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">📊 Quality Grade Distribution</p>
                    <p className="text-[10px] text-slate-500 mb-2 italic">Export / Local / Reject classification outcome</p>
                    <ScanDonut slices={qualityDistribution} height={160} />
                    <div className="mt-3 space-y-1.5">
                      {qualityDistribution.map((q, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: q.color }} />
                          <span className="text-xs text-slate-700 flex-1">{q.name}</span>
                          <span className="text-xs font-semibold text-slate-900">{q.value}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Quality trend over time */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-700 font-bold mb-2 uppercase tracking-wide">Quality Mix Over Time (%)</p>
                      <ScanBarChart
                        data={qualityTrend}
                        bars={[
                          { key: 'Export', color: QUALITY_COLORS.Export },
                          { key: 'Local', color: QUALITY_COLORS.Local },
                          { key: 'Reject', color: QUALITY_COLORS.Reject },
                        ]}
                        xKey="period"
                        height={160}
                        stacked
                        valueFormatter={(v) => `${v}%`}
                      />
                    </div>
                  </div>

                  {/* Mold Severity Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">🦠 Mold Severity Breakdown</p>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Distribution of mold severity levels across all scans</p>

                    <ScanDonut slices={severityDistribution.map(s => ({ ...s, color: s.name === 'None' ? '#22c55e' : s.name === 'Low' ? '#f59e0b' : s.name === 'Moderate' ? '#f97316' : '#ef4444' }))} height={160} />
                    <div className="mt-3 space-y-1.5">
                      {severityDistribution.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.name === 'None' ? '#22c55e' : s.name === 'Low' ? '#f59e0b' : s.name === 'Moderate' ? '#f97316' : '#ef4444' }} />
                          <span className="text-xs text-slate-700 flex-1">{s.name}</span>
                          <span className="text-xs font-semibold text-slate-900">{s.value}% ({s.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ───── Tab C: Color Consistency ───── */}
              {activeTab === 'color' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Color Score Distribution */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">🎨 Color Consistency — Score Distribution</p>
                    <p className="text-[10px] text-slate-500 mb-4 italic">Distribution of scans across color quality bands</p>

                    <div className="space-y-3">
                      {colorDistribution.map((band, i) => {
                        const maxCount = Math.max(...colorDistribution.map(d => d.count))
                        const totalColorScans = colorDistribution.reduce((s, d) => s + d.count, 0)
                        const pct = totalColorScans > 0 ? ((band.count / totalColorScans) * 100).toFixed(1) : '0.0'
                        return (
                          <div key={i}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: band.color }} />
                                {band.band}
                              </span>
                              <span className="text-xs text-slate-600">{band.count.toLocaleString()} scans ({pct}%)</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${(band.count / maxCount) * 100}%`, backgroundColor: band.color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Summary stats */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{colorDistribution.reduce((s, d) => s + d.count, 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">Total Assessed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {(() => { const tot = colorDistribution.reduce((s, d) => s + d.count, 0); const good = colorDistribution.filter(d => d.band === 'Excellent' || d.band === 'Good').reduce((s, d) => s + d.count, 0); return tot > 0 ? ((good / tot) * 100).toFixed(1) : '0.0' })()}%
                        </p>
                        <p className="text-[10px] text-slate-500">Good or Better</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Consistency Trend */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">📈 Color Consistency — Avg Score Trend</p>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Average color consistency score over time (0–100)</p>

                    <ScanAreaChart
                      data={colorTrend}
                      areas={[{ key: 'score', color: '#10b981' }]}
                      xKey="period"
                      height={220}
                      showLegend={false}
                      valueFormatter={(v) => `${v}/100`}
                    />

                    {/* Current score highlight */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{colorTrendLatest}</p>
                        <p className="text-[10px] text-slate-500">Latest Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-700">{colorTrendAvg}</p>
                        <p className="text-[10px] text-slate-500">Overall Avg</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════ ROW 4: UNIFIED SCAN RECORDS TABLE ═══════════════ */}
        <div className="relative pt-2 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold shadow-sm">4 Records</div>
          <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-900 font-bold">📋 Scan Records</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Showing {paginatedRecords.length} of {filteredRecords.length} entries
                </p>
              </div>
              <TextInput placeholder="Search scans..." size="xs" radius="md" value={searchValue}
                readOnly
                leftSection={<Search className="w-3.5 h-3.5 text-slate-400" />}
                classNames={{ input: 'focus:!border-amber-500 focus:!ring-2 focus:!ring-amber-200' }}
                className="w-64" />
            </div>

            {/* Table body */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Scan ID', 'Date', 'Scanner', 'Fish Type', 'Mold %', 'Mold Severity', 'Color Score', 'Color Grade', 'Grade', 'Status'].map((h, i) => (
                      <th key={i} className="text-left px-3 py-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-8 text-slate-400 text-sm">No scan records found</td></tr>
                  ) : paginatedRecords.map(row => (
                    <tr key={row.id} className="border-b border-slate-200 hover:bg-amber-50/30 transition-colors">
                      <td className="px-3 py-2.5 border-r border-slate-100 font-mono text-xs text-slate-700">{row.id}</td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs text-slate-600 whitespace-nowrap">{row.date}</td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-sm text-slate-800 font-medium">{row.scanner}</td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <Badge size="sm" variant="light" color="yellow">{row.fishType}</Badge>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs font-semibold" style={{ color: row.moldPct > 40 ? '#ef4444' : row.moldPct > 25 ? '#f59e0b' : '#22c55e' }}>
                        {row.moldPct}%
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <Badge size="sm" variant="light"
                          color={row.moldSeverity === 'None' ? 'green' : row.moldSeverity === 'Low' ? 'yellow' : row.moldSeverity === 'Moderate' ? 'orange' : 'red'}>
                          {row.moldSeverity}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs font-semibold" style={{ color: row.colorScore >= 80 ? '#22c55e' : row.colorScore >= 60 ? '#3b82f6' : row.colorScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {row.colorScore}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <Badge size="sm" variant="light"
                          color={row.colorGrade === 'Export' ? 'green' : row.colorGrade === 'Local' ? 'blue' : 'red'}>
                          {row.colorGrade}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <Badge size="sm" variant="light"
                          color={row.qualityGrade === 'Export' ? 'green' : row.qualityGrade === 'Local' ? 'blue' : 'red'}>
                          {row.qualityGrade}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        <Badge size="sm" variant="light" color="green">{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {tablePage} of {totalPages} ({filteredRecords.length} total)</p>
              <div className="flex items-center gap-1">
                <ActionIcon variant="subtle" color="gray" size="sm" disabled={tablePage === 1} onClick={() => setTablePage(1)}>
                  <ChevronLeft className="w-3.5 h-3.5" /><ChevronLeft className="w-3.5 h-3.5 -ml-2" />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray" size="sm" disabled={tablePage === 1} onClick={() => setTablePage(Math.max(1, tablePage - 1))}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </ActionIcon>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(tablePage - 2, totalPages - 4))
                  const pn = start + i
                  if (pn > totalPages) return null
                  return (
                    <button key={pn} onClick={() => setTablePage(pn)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                        pn === tablePage ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>{pn}</button>
                  )
                })}
                <ActionIcon variant="subtle" color="gray" size="sm" disabled={tablePage >= totalPages} onClick={() => setTablePage(Math.min(totalPages, tablePage + 1))}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray" size="sm" disabled={tablePage >= totalPages} onClick={() => setTablePage(totalPages)}>
                  <ChevronRight className="w-3.5 h-3.5" /><ChevronRight className="w-3.5 h-3.5 -ml-2" />
                </ActionIcon>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
