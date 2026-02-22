/**
 * Admin Dashboard — New multi-section analytics page.
 * 5 inner tabs: Users, Scans, Market, Community, Activities
 * Users & Market: Real data from backend. Other tabs: Sample data.
 */
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  Users, ScanLine, ShoppingBag, MessageCircle, Activity,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Filter, Download, ChevronLeft, ChevronRight, Search,
  Calendar, Maximize2, UserX, Package, DollarSign, BarChart3,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import {
  Badge, TextInput, ActionIcon, Group, Button, Modal, Tooltip,
} from '@mantine/core'
import { DatePickerInput, DatesRangeValue } from '@mantine/dates'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, createColumnHelper, type SortingState,
} from '@tanstack/react-table'
import AdminReportPanel from '../components/admin/AdminReportPanel'
import AdminScansSection from '../components/admin/AdminScansSection'
import { KpiCard } from '../components/ui/KpiCard'
import { DynamicPercentageBadge } from '../components/ui/DynamicPercentageBadge'
import {
  getAdminUserKpis, getAdminUserChart, getAdminUserCalendar,
  getAdminUserSegmentation, getAdminUsers,
  getAdminMarketKpis, getAdminMarketChart, getAdminMarketSegmentation, getAdminMarketTable,
  getAdminMarketCalendar,
  getCommunityAnalytics, getActivitiesAnalytics,
  getCommunityChart, getCommunityCalendar,
  getActivitiesChart, getActivitiesCalendar,
  type AdminUserKpis, type AdminUserChartPoint, type AdminUserCalendarResponse,
  type AdminUser, type AdminMarketKpis, type AdminMarketChartPoint,
  type AdminMarketSegmentation, type AdminMarketProduct, type AdminMarketTableResponse,
  type CommunityAnalyticsResponse, type ActivitiesAnalyticsResponse,
  type CommunityChartPoint, type ActivitiesChartPoint,
} from '../services/api'

// ─────────────────────────────────────── Types ───
type SectionKey = 'users' | 'scans' | 'market' | 'community' | 'activities'

interface KpiItem {
  label: string; value: string; change: number; subtitle: string
  icon: React.ElementType; iconBg: string; iconColor: string
}
interface ChartPoint { period: string; value: number }
interface ProgressItem { label: string; value: number; max: number; description: string }
interface DonutSlice { label: string; value: number; color: string }
interface TableRow { id: string; cols: string[] }
interface SectionData {
  kpis: KpiItem[]; chartTitle: string; chartData: ChartPoint[]; chartColor: string
  progressA: { title: string; subtitle: string; items: ProgressItem[] }
  progressB: { title: string; subtitle: string; items: ProgressItem[] }
  donut: { title: string; slices: DonutSlice[] }
  table: { headers: string[]; rows: TableRow[] }
}

// ──────────────────────────────── Section Tabs ───
const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType }[] = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'scans', label: 'Scans', icon: ScanLine },
  { key: 'market', label: 'Market', icon: ShoppingBag },
  { key: 'community', label: 'Community', icon: MessageCircle },
  { key: 'activities', label: 'Activities', icon: Activity },
]

const SECTION_DESCRIPTIONS: Record<SectionKey, string> = {
  users: 'Monitor account growth, role distribution, and user records.',
  scans: 'Track scan volume, quality mix, and latest scan records.',
  market: 'Review orders, revenue trends, and product marketplace records.',
  community: 'Analyze post engagement, moderation trends, and top content.',
  activities: 'Observe platform events, error trends, and activity logs.',
}

const SECTION_NAV_ACCENT: Record<SectionKey, { bg: string; glow: string }> = {
  users: { bg: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.35)' },
  scans: { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)' },
  market: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.35)' },
  community: { bg: '#f43f5e', glow: 'rgba(244, 63, 94, 0.35)' },
  activities: { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)' },
}

const SECTION_SEARCH_FOCUS: Record<SectionKey, string> = {
  users: 'focus:!border-sky-500 focus:!ring-2 focus:!ring-sky-200',
  scans: 'focus:!border-amber-500 focus:!ring-2 focus:!ring-amber-200',
  market: 'focus:!border-emerald-500 focus:!ring-2 focus:!ring-emerald-200',
  community: 'focus:!border-rose-500 focus:!ring-2 focus:!ring-rose-200',
  activities: 'focus:!border-cyan-500 focus:!ring-2 focus:!ring-cyan-200',
}

// ────────────────────────── Sample Data (generic sections) ──

function buildSampleData(): Record<'scans', SectionData> {
  return {
    scans: {
      kpis: [
        { label: 'Total Scans', value: '45,832', change: 22.3, subtitle: 'All-time scan count', icon: ScanLine, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
        { label: 'Scans Today', value: '287', change: 5.4, subtitle: 'Since midnight', icon: Activity, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
        { label: 'Avg per Day', value: '156', change: -1.2, subtitle: 'Last 30 days average', icon: TrendingUp, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
        { label: 'Unique Users', value: '3,891', change: 10.8, subtitle: 'Distinct scanners', icon: Users, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
      ],
      chartTitle: 'Scan Activity', chartColor: 'amber',
      chartData: [
        { period: 'Jan', value: 3200 }, { period: 'Feb', value: 3650 }, { period: 'Mar', value: 4100 },
        { period: 'Apr', value: 3800 }, { period: 'May', value: 4300 }, { period: 'Jun', value: 4700 },
        { period: 'Jul', value: 3900 }, { period: 'Aug', value: 4200 }, { period: 'Sep', value: 3500 },
        { period: 'Oct', value: 3800 }, { period: 'Nov', value: 4400 }, { period: 'Dec', value: 4832 },
      ],
      progressA: { title: 'Scan Results', subtitle: 'Classification breakdown', items: [
        { label: 'Grade A (Premium)', value: 18332, max: 45832, description: 'Highest quality scans' },
        { label: 'Grade B (Standard)', value: 15845, max: 45832, description: 'Standard quality scans' },
        { label: 'Grade C (Below Avg)', value: 11655, max: 45832, description: 'Below average quality' },
      ]},
      progressB: { title: 'Scan Sources', subtitle: 'Where scans originate', items: [
        { label: 'Mobile App', value: 32083, max: 45832, description: 'From DaingApp mobile' },
        { label: 'Web Upload', value: 9166, max: 45832, description: 'Via web interface' },
        { label: 'API Calls', value: 4583, max: 45832, description: 'External API integrations' },
      ]},
      donut: { title: 'Scan Types', slices: [{ label: 'Daing', value: 62, color: '#f59e0b' }, { label: 'Tuyo', value: 23, color: '#fbbf24' }, { label: 'Other', value: 15, color: '#fde68a' }] },
      table: { headers: ['Scan ID', 'User', 'Result', 'Grade', 'Confidence', 'Date'], rows: [
        { id: '1', cols: ['SCN-4832', 'Juan dela Cruz', 'Galunggong', 'A', '96.3%', 'Feb 18, 2026'] },
        { id: '2', cols: ['SCN-4831', 'Maria Santos', 'Bangus', 'B', '88.1%', 'Feb 18, 2026'] },
        { id: '3', cols: ['SCN-4830', 'Pedro Reyes', 'Tilapia', 'A', '94.7%', 'Feb 17, 2026'] },
        { id: '4', cols: ['SCN-4829', 'Ana Garcia', 'Daing', 'A', '97.2%', 'Feb 17, 2026'] },
        { id: '5', cols: ['SCN-4828', 'Jose Rizal', 'Tuyo', 'B', '85.4%', 'Feb 17, 2026'] },
      ]},
    },
  }
}

// ────────────────────────────── Straight Angle Pie (Recharts) ───
const RADIAN = Math.PI / 180
function StraightAnglePie({ slices, height = 150, onSelect }: { slices: DonutSlice[]; height?: number; onSelect?: (slice: DonutSlice | null, i: number) => void }) {
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null)
  const pieData = slices.map(s => ({ name: s.label, value: s.value }))
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
          <Pie data={pieData} dataKey="value" startAngle={180} endAngle={0}
            cx="50%" cy="92%" outerRadius={height * 0.58} innerRadius={height * 0.22}
            label={renderLabel} isAnimationActive={true} stroke="none"
            onClick={(_, index) => {
              const newIdx = selectedIdx === index ? null : index
              setSelectedIdx(newIdx)
              onSelect?.(newIdx !== null ? slices[newIdx] : null, newIdx ?? -1)
            }}>
            {pieData.map((_, i) => (
              <Cell key={i} fill={slices[i]?.color || '#94a3b8'} cursor="pointer"
                stroke={selectedIdx === i ? '#1e293b' : 'transparent'}
                strokeWidth={selectedIdx === i ? 4 : 0} />
            ))}
          </Pie>
          <RechTooltip formatter={(val: any, name: any) => [`${val}%`, name]}
            contentStyle={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Stacked Area Chart wrapper (Recharts) ─────────
function AdminStackedAreaChart({
  data, areas, xKey, height = 256,
  valueFormatter = (v: number) => v.toLocaleString(),
  showLegend = true,
}: {
  data: Record<string, any>[]
  areas: { key: string; color: string }[]
  xKey: string
  height?: number
  valueFormatter?: (v: number) => string
  showLegend?: boolean
}) {
  const gradId = areas.map(a => a.key.replace(/\s+/g, '_')).join('_')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          {areas.map(a => (
            <linearGradient key={a.key} id={`sa-${gradId}-${a.key.replace(/\s+/g, '_')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.color} stopOpacity={0.75} />
              <stop offset="95%" stopColor={a.color} stopOpacity={0.18} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={valueFormatter} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
        <RechTooltip
          formatter={(val: any, name: any) => [valueFormatter(Number(val)), name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '6px 12px' }}
          cursor={{ stroke: 'rgba(100,116,139,0.15)', strokeWidth: 1 }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />}
        {areas.map(a => (
          <Area key={a.key} type="monotone" dataKey={a.key}
            stackId="1"
            stroke={a.color} strokeWidth={2}
            fill={`url(#sa-${gradId}-${a.key.replace(/\s+/g, '_')})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Column Helpers ──────────
const usersColumnHelper = createColumnHelper<AdminUser>()
const marketColumnHelper = createColumnHelper<AdminMarketProduct>()

// ──────────────────────────────── Main Component ─
export default function AdminDashboardPageNew() {
  const [activeSection, setActiveSection] = useState<SectionKey>('users')
  const [reportPanelOpen, setReportPanelOpen] = useState(false)
  const reportPanelAnchorRef = useRef<HTMLDivElement>(null)

  // ─── Generic section state ───
  const [genericSearch, setGenericSearch] = useState('')
  const [genericPage, setGenericPage] = useState(1)
  const genericPageSize = 10
  const sampleData = useMemo(() => buildSampleData(), [])

  // ═══════════════════ USERS STATE ═══════════════════
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [usersKpis, setUsersKpis] = useState<AdminUserKpis | null>(null)
  const [usersKpisLoading, setUsersKpisLoading] = useState(false)
  const [usersChartData, setUsersChartData] = useState<AdminUserChartPoint[]>([])
  const [usersChartLoading, setUsersChartLoading] = useState(false)
  const [usersGranularity, setUsersGranularity] = useState<'week' | 'month' | 'year'>('week')
  const [usersDateRange, setUsersDateRange] = useState<DatesRangeValue>([null, null])
  const [usersCalendar, setUsersCalendar] = useState<AdminUserCalendarResponse | null>(null)
  const [usersCalendarLoading, setUsersCalendarLoading] = useState(false)
  const [usersHeatMapYear, setUsersHeatMapYear] = useState(currentYear)
  const [usersHeatMapMonth, setUsersHeatMapMonth] = useState(currentMonth)
  const [usersSegmentation, setUsersSegmentation] = useState<{ total: number; roles: Record<string, number>; statuses: Record<string, number> } | null>(null)
  const [usersTableData, setUsersTableData] = useState<AdminUser[]>([])
  const [usersTableTotal, setUsersTableTotal] = useState(0)
  const [usersTablePage, setUsersTablePage] = useState(1)
  const [usersTableSearch, setUsersTableSearch] = useState('')
  const [usersTableLoading, setUsersTableLoading] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [expandedChart, setExpandedChart] = useState(false)
  const usersTablePageSize = 10
  const [donutRoleFilter, setDonutRoleFilter] = useState<'all' | 'user' | 'seller' | 'admin'>('all')

  // ═══════════════════ MARKET STATE ═══════════════════
  const [marketKpis, setMarketKpis] = useState<AdminMarketKpis | null>(null)
  const [marketKpisLoading, setMarketKpisLoading] = useState(false)
  const [marketChartData, setMarketChartData] = useState<AdminMarketChartPoint[]>([])
  const [marketChartLoading, setMarketChartLoading] = useState(false)
  const [marketGranularity, setMarketGranularity] = useState<'week' | 'month' | 'year'>('week')
  const [marketDateRange, setMarketDateRange] = useState<DatesRangeValue>([null, null])
  const [marketSegmentation, setMarketSegmentation] = useState<AdminMarketSegmentation | null>(null)
  const [marketTableData, setMarketTableData] = useState<AdminMarketProduct[]>([])
  const [marketTableTotal, setMarketTableTotal] = useState(0)
  const [marketTablePage, setMarketTablePage] = useState(1)
  const [marketTableSearch, setMarketTableSearch] = useState('')
  const [marketTableLoading, setMarketTableLoading] = useState(false)
  const [marketSortState, setMarketSortState] = useState<SortingState>([])
  const [marketSellerFilter, setMarketSellerFilter] = useState('all')
  const [marketCategoryFilter, setMarketCategoryFilter] = useState('all')
  const [marketStatusFilter, setMarketStatusFilter] = useState('all')
  const [marketSellers, setMarketSellers] = useState<{ id: string; name: string }[]>([])
  const [marketCategories, setMarketCategories] = useState<string[]>([])
  const [marketChartSellerFilter, setMarketChartSellerFilter] = useState('all')
  const [expandedMarketChart, setExpandedMarketChart] = useState(false)
  const marketTablePageSize = 10
  const [marketCalendar, setMarketCalendar] = useState<AdminUserCalendarResponse | null>(null)
  const [marketCalendarLoading, setMarketCalendarLoading] = useState(false)
  const [marketHeatMapYear, setMarketHeatMapYear] = useState(currentYear)
  const [marketHeatMapMonth, setMarketHeatMapMonth] = useState(currentMonth)

  // ═══════════════════ COMMUNITY STATE ═══════════════════
  const [communityData, setCommunityData] = useState<CommunityAnalyticsResponse | null>(null)
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityChartData, setCommunityChartData] = useState<CommunityChartPoint[]>([])
  const [communityChartLoading, setCommunityChartLoading] = useState(false)
  const [communityGranularity, setCommunityGranularity] = useState<'week' | 'month' | 'year'>('week')
  const [communityDateRange, setCommunityDateRange] = useState<DatesRangeValue>([null, null])
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState('all')
  const [expandedCommunityChart, setExpandedCommunityChart] = useState(false)
  const [communityCalendar, setCommunityCalendar] = useState<AdminUserCalendarResponse | null>(null)
  const [communityCalendarLoading, setCommunityCalendarLoading] = useState(false)
  const [communityHeatMapYear, setCommunityHeatMapYear] = useState(currentYear)
  const [communityHeatMapMonth, setCommunityHeatMapMonth] = useState(currentMonth)
  const [communityTableSearch, setCommunityTableSearch] = useState('')

  // ═══════════════════ ACTIVITIES STATE ═══════════════════
  const [activitiesData, setActivitiesData] = useState<ActivitiesAnalyticsResponse | null>(null)
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesChartData, setActivitiesChartData] = useState<ActivitiesChartPoint[]>([])
  const [activitiesChartLoading, setActivitiesChartLoading] = useState(false)
  const [activitiesGranularity, setActivitiesGranularity] = useState<'week' | 'month' | 'year'>('week')
  const [activitiesDateRange, setActivitiesDateRange] = useState<DatesRangeValue>([null, null])
  const [activitiesCategoryFilter, setActivitiesCategoryFilter] = useState('all')
  const [expandedActivitiesChart, setExpandedActivitiesChart] = useState(false)
  const [activitiesCalendar, setActivitiesCalendar] = useState<AdminUserCalendarResponse | null>(null)
  const [activitiesCalendarLoading, setActivitiesCalendarLoading] = useState(false)
  const [activitiesHeatMapYear, setActivitiesHeatMapYear] = useState(currentYear)
  const [activitiesHeatMapMonth, setActivitiesHeatMapMonth] = useState(currentMonth)
  const [activitiesTableSearch, setActivitiesTableSearch] = useState('')

  // ═══════════════════ USERS DATA LOADERS ═══════════════════
  const loadUsersKpis = useCallback(async () => {
    setUsersKpisLoading(true)
    try { const res = await getAdminUserKpis(); setUsersKpis(res.kpis) }
    catch (e) { console.error('Failed to load user KPIs:', e) }
    finally { setUsersKpisLoading(false) }
  }, [])

  const loadUsersChart = useCallback(async (gran: 'week' | 'month' | 'year', range: DatesRangeValue) => {
    setUsersChartLoading(true)
    try {
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      let res
      if (range[0] && range[1]) {
        const s = range[0] instanceof Date ? range[0] : new Date(range[0])
        const e = range[1] instanceof Date ? range[1] : new Date(range[1])
        res = await getAdminUserChart({ granularity: 'daily', start_date: fmt(s), end_date: fmt(e) })
      } else if (gran === 'week') { res = await getAdminUserChart({ granularity: 'daily', days: 7 }) }
      else if (gran === 'month') { res = await getAdminUserChart({ granularity: 'monthly' }) }
      else { res = await getAdminUserChart({ granularity: 'yearly' }) }
      setUsersChartData(res.data)
    } catch (e) { console.error('Failed to load user chart:', e) }
    finally { setUsersChartLoading(false) }
  }, [])

  const loadUsersCalendar = useCallback(async (year: number, month: number) => {
    setUsersCalendarLoading(true)
    try { const res = await getAdminUserCalendar(year, month); setUsersCalendar(res) }
    catch (e) { console.error('Failed to load user calendar:', e) }
    finally { setUsersCalendarLoading(false) }
  }, [])

  const loadUsersSegmentation = useCallback(async () => {
    try {
      const res = await getAdminUserSegmentation()
      setUsersSegmentation({ total: res.total, roles: res.roles, statuses: res.statuses })
    } catch (e) { console.error('Failed to load user segmentation:', e) }
  }, [])

  const loadUsersTable = useCallback(async (page: number, search: string) => {
    setUsersTableLoading(true)
    try { const res = await getAdminUsers(page, usersTablePageSize, 'all', 'all', search); setUsersTableData(res.users); setUsersTableTotal(res.total) }
    catch (e) { console.error('Failed to load users table:', e) }
    finally { setUsersTableLoading(false) }
  }, [])

  // ═══════════════════ MARKET DATA LOADERS ═══════════════════
  const loadMarketKpis = useCallback(async () => {
    setMarketKpisLoading(true)
    try { const res = await getAdminMarketKpis(); setMarketKpis(res.kpis) }
    catch (e) { console.error('Failed to load market KPIs:', e) }
    finally { setMarketKpisLoading(false) }
  }, [])

  const loadMarketChart = useCallback(async (gran: 'week' | 'month' | 'year', range: DatesRangeValue, sellerId?: string) => {
    setMarketChartLoading(true)
    try {
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      const params: Record<string, any> = {}
      if (sellerId && sellerId !== 'all') params.seller_id = sellerId
      if (range[0] && range[1]) {
        const s = range[0] instanceof Date ? range[0] : new Date(range[0])
        const e = range[1] instanceof Date ? range[1] : new Date(range[1])
        Object.assign(params, { granularity: 'daily', start_date: fmt(s), end_date: fmt(e) })
      } else if (gran === 'week') { Object.assign(params, { granularity: 'daily', days: 7 }) }
      else if (gran === 'month') { Object.assign(params, { granularity: 'monthly' }) }
      else { Object.assign(params, { granularity: 'yearly' }) }
      const res = await getAdminMarketChart(params)
      setMarketChartData(res.data)
    } catch (e) { console.error('Failed to load market chart:', e) }
    finally { setMarketChartLoading(false) }
  }, [])

  const loadMarketSegmentation = useCallback(async () => {
    try { const res = await getAdminMarketSegmentation(); setMarketSegmentation(res) }
    catch (e) { console.error('Failed to load market segmentation:', e) }
  }, [])

  const loadMarketTable = useCallback(async (page: number, search: string, seller: string, category: string, status: string) => {
    setMarketTableLoading(true)
    try {
      const res = await getAdminMarketTable({ page, page_size: marketTablePageSize, search: search || undefined, seller_id: seller !== 'all' ? seller : undefined, category: category !== 'all' ? category : undefined, status: status !== 'all' ? status : undefined })
      setMarketTableData(res.products); setMarketTableTotal(res.total)
      if (res.sellers) setMarketSellers(res.sellers)
      if (res.categories) setMarketCategories(res.categories)
    } catch (e) { console.error('Failed to load market table:', e) }
    finally { setMarketTableLoading(false) }
  }, [])

  const loadMarketCalendar = useCallback(async (year: number, month: number) => {
    setMarketCalendarLoading(true)
    try { const res = await getAdminMarketCalendar(year, month); setMarketCalendar(res) }
    catch (e) { console.error('Failed to load market calendar:', e) }
    finally { setMarketCalendarLoading(false) }
  }, [])

  // ═══════════════════ COMMUNITY DATA LOADERS ═══════════════════
  const loadCommunityAnalytics = useCallback(async () => {
    setCommunityLoading(true)
    try { const res = await getCommunityAnalytics(); setCommunityData(res) }
    catch (e) { console.error('Failed to load community analytics:', e) }
    finally { setCommunityLoading(false) }
  }, [])

  const loadCommunityChart = useCallback(async (gran: 'week' | 'month' | 'year', range: DatesRangeValue, category?: string) => {
    setCommunityChartLoading(true)
    try {
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      const params: Record<string, any> = {}
      if (category && category !== 'all') params.category = category
      if (range[0] && range[1]) {
        const s = range[0] instanceof Date ? range[0] : new Date(range[0])
        const e = range[1] instanceof Date ? range[1] : new Date(range[1])
        Object.assign(params, { granularity: 'daily', start_date: fmt(s), end_date: fmt(e) })
      } else if (gran === 'week') { Object.assign(params, { granularity: 'daily', days: 7 }) }
      else if (gran === 'month') { Object.assign(params, { granularity: 'monthly' }) }
      else { Object.assign(params, { granularity: 'yearly' }) }
      const res = await getCommunityChart(params)
      setCommunityChartData(res.data)
    } catch (e) { console.error('Failed to load community chart:', e) }
    finally { setCommunityChartLoading(false) }
  }, [])

  const loadCommunityCalendar = useCallback(async (year: number, month: number) => {
    setCommunityCalendarLoading(true)
    try { const res = await getCommunityCalendar(year, month); setCommunityCalendar(res) }
    catch (e) { console.error('Failed to load community calendar:', e) }
    finally { setCommunityCalendarLoading(false) }
  }, [])

  // ═══════════════════ ACTIVITIES DATA LOADERS ═══════════════════
  const loadActivitiesAnalytics = useCallback(async () => {
    setActivitiesLoading(true)
    try { const res = await getActivitiesAnalytics(); setActivitiesData(res) }
    catch (e) { console.error('Failed to load activities analytics:', e) }
    finally { setActivitiesLoading(false) }
  }, [])

  const loadActivitiesChart = useCallback(async (gran: 'week' | 'month' | 'year', range: DatesRangeValue, category?: string) => {
    setActivitiesChartLoading(true)
    try {
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      const params: Record<string, any> = {}
      if (category && category !== 'all') params.category = category
      if (range[0] && range[1]) {
        const s = range[0] instanceof Date ? range[0] : new Date(range[0])
        const e = range[1] instanceof Date ? range[1] : new Date(range[1])
        Object.assign(params, { granularity: 'daily', start_date: fmt(s), end_date: fmt(e) })
      } else if (gran === 'week') { Object.assign(params, { granularity: 'daily', days: 7 }) }
      else if (gran === 'month') { Object.assign(params, { granularity: 'monthly' }) }
      else { Object.assign(params, { granularity: 'yearly' }) }
      const res = await getActivitiesChart(params)
      setActivitiesChartData(res.data)
    } catch (e) { console.error('Failed to load activities chart:', e) }
    finally { setActivitiesChartLoading(false) }
  }, [])

  const loadActivitiesCalendar = useCallback(async (year: number, month: number) => {
    setActivitiesCalendarLoading(true)
    try { const res = await getActivitiesCalendar(year, month); setActivitiesCalendar(res) }
    catch (e) { console.error('Failed to load activities calendar:', e) }
    finally { setActivitiesCalendarLoading(false) }
  }, [])

  // ═══════════════════ EFFECTS ═══════════════════
  useEffect(() => {
    if (activeSection === 'users') {
      loadUsersKpis(); loadUsersChart(usersGranularity, usersDateRange)
      loadUsersCalendar(usersHeatMapYear, usersHeatMapMonth)
      loadUsersSegmentation(); loadUsersTable(1, '')
    } else if (activeSection === 'market') {
      loadMarketKpis(); loadMarketChart(marketGranularity, marketDateRange, marketChartSellerFilter)
      loadMarketSegmentation(); loadMarketTable(1, '', 'all', 'all', 'all')
      loadMarketCalendar(marketHeatMapYear, marketHeatMapMonth)
    } else if (activeSection === 'community') {
      loadCommunityAnalytics()
      loadCommunityChart(communityGranularity, communityDateRange, communityCategoryFilter)
      loadCommunityCalendar(communityHeatMapYear, communityHeatMapMonth)
    } else if (activeSection === 'activities') {
      loadActivitiesAnalytics()
      loadActivitiesChart(activitiesGranularity, activitiesDateRange, activitiesCategoryFilter)
      loadActivitiesCalendar(activitiesHeatMapYear, activitiesHeatMapMonth)
    }
  }, [activeSection]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'users' && !usersDateRange[0] && !usersDateRange[1]) loadUsersChart(usersGranularity, [null, null])
  }, [usersGranularity]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'users') loadUsersCalendar(usersHeatMapYear, usersHeatMapMonth)
  }, [usersHeatMapYear, usersHeatMapMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'users') loadUsersTable(usersTablePage, usersTableSearch)
  }, [usersTablePage, usersTableSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'market' && !marketDateRange[0] && !marketDateRange[1]) loadMarketChart(marketGranularity, [null, null], marketChartSellerFilter)
  }, [marketGranularity, marketChartSellerFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'market') loadMarketTable(marketTablePage, marketTableSearch, marketSellerFilter, marketCategoryFilter, marketStatusFilter)
  }, [marketTablePage, marketTableSearch, marketSellerFilter, marketCategoryFilter, marketStatusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'market') loadMarketCalendar(marketHeatMapYear, marketHeatMapMonth)
  }, [marketHeatMapYear, marketHeatMapMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // Community chart/calendar effects
  useEffect(() => {
    if (activeSection === 'community' && !communityDateRange[0] && !communityDateRange[1]) loadCommunityChart(communityGranularity, [null, null], communityCategoryFilter)
  }, [communityGranularity, communityCategoryFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'community') loadCommunityCalendar(communityHeatMapYear, communityHeatMapMonth)
  }, [communityHeatMapYear, communityHeatMapMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // Activities chart/calendar effects
  useEffect(() => {
    if (activeSection === 'activities' && !activitiesDateRange[0] && !activitiesDateRange[1]) loadActivitiesChart(activitiesGranularity, [null, null], activitiesCategoryFilter)
  }, [activitiesGranularity, activitiesCategoryFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === 'activities') loadActivitiesCalendar(activitiesHeatMapYear, activitiesHeatMapMonth)
  }, [activitiesHeatMapYear, activitiesHeatMapMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════ USERS HANDLERS ═══════════════════
  const handleUsersToggleGranularity = () => {
    const next = usersGranularity === 'week' ? 'month' : usersGranularity === 'month' ? 'year' : 'week'
    setUsersGranularity(next); setUsersDateRange([null, null])
  }
  const handleUsersDateRangeChange = (val: DatesRangeValue) => {
    setUsersDateRange(val)
    if (val[0] && val[1]) loadUsersChart(usersGranularity, val)
    else if (!val[0] && !val[1]) loadUsersChart(usersGranularity, [null, null])
  }

  // ═══════════════════ MARKET HANDLERS ═══════════════════
  const handleMarketToggleGranularity = () => {
    const next = marketGranularity === 'week' ? 'month' : marketGranularity === 'month' ? 'year' : 'week'
    setMarketGranularity(next); setMarketDateRange([null, null])
  }
  const handleMarketDateRangeChange = (val: DatesRangeValue) => {
    setMarketDateRange(val)
    if (val[0] && val[1]) loadMarketChart(marketGranularity, val, marketChartSellerFilter)
    else if (!val[0] && !val[1]) loadMarketChart(marketGranularity, [null, null], marketChartSellerFilter)
  }

  // ═══════════════════ COMMUNITY HANDLERS ═══════════════════
  const handleCommunityToggleGranularity = () => {
    const next = communityGranularity === 'week' ? 'month' : communityGranularity === 'month' ? 'year' : 'week'
    setCommunityGranularity(next); setCommunityDateRange([null, null])
  }
  const handleCommunityDateRangeChange = (val: DatesRangeValue) => {
    setCommunityDateRange(val)
    if (val[0] && val[1]) loadCommunityChart(communityGranularity, val, communityCategoryFilter)
    else if (!val[0] && !val[1]) loadCommunityChart(communityGranularity, [null, null], communityCategoryFilter)
  }

  // ═══════════════════ ACTIVITIES HANDLERS ═══════════════════
  const handleActivitiesToggleGranularity = () => {
    const next = activitiesGranularity === 'week' ? 'month' : activitiesGranularity === 'month' ? 'year' : 'week'
    setActivitiesGranularity(next); setActivitiesDateRange([null, null])
  }
  const handleActivitiesDateRangeChange = (val: DatesRangeValue) => {
    setActivitiesDateRange(val)
    if (val[0] && val[1]) loadActivitiesChart(activitiesGranularity, val, activitiesCategoryFilter)
    else if (!val[0] && !val[1]) loadActivitiesChart(activitiesGranularity, [null, null], activitiesCategoryFilter)
  }

  // ─── TanStack Table for Users ───
  const usersColumns = useMemo(() => [
    usersColumnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <div className="flex items-center gap-2">
          {info.row.original.avatar ? (
            <img src={info.row.original.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
              {info.getValue()?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <span className="font-medium text-slate-800 text-sm">{info.getValue()}</span>
        </div>
      ),
    }),
    usersColumnHelper.accessor('email', { header: 'Email', cell: info => <span className="text-sm text-slate-600">{info.getValue()}</span> }),
    usersColumnHelper.accessor('role', { header: 'Role', cell: info => <Badge size="sm" variant="light" color={info.getValue() === 'admin' ? 'violet' : info.getValue() === 'seller' ? 'blue' : 'gray'}>{info.getValue()}</Badge> }),
    usersColumnHelper.accessor('status', { header: 'Status', cell: info => <Badge size="sm" variant="light" color={info.getValue() === 'active' ? 'green' : 'red'}>{info.getValue()}</Badge> }),
    usersColumnHelper.accessor('joined_at', { header: 'Joined', cell: info => { const val = info.getValue(); return <span className="text-xs text-slate-500">{val ? new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span> } }),
  ], [])

  const usersTable = useReactTable({ data: usersTableData, columns: usersColumns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  // ─── TanStack Table for Market ───
  const marketColumns = useMemo(() => [
    marketColumnHelper.accessor('name', { header: 'Product', cell: info => <span className="font-medium text-slate-800 text-sm">{info.getValue()}</span> }),
    marketColumnHelper.accessor('seller_name', { header: 'Seller', cell: info => <span className="text-sm text-slate-600">{info.getValue()}</span> }),
    marketColumnHelper.accessor('category_name', { header: 'Category', cell: info => <Badge size="sm" variant="light" color="blue">{info.getValue()}</Badge> }),
    marketColumnHelper.accessor('price', { header: 'Price', cell: info => <span className="text-sm font-semibold text-slate-800">₱{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> }),
    marketColumnHelper.accessor('stock_qty', { header: 'Stock', cell: info => <span className={`text-sm font-medium ${info.getValue() <= 0 ? 'text-red-600' : info.getValue() < 10 ? 'text-amber-600' : 'text-slate-700'}`}>{info.getValue()}</span> }),
    marketColumnHelper.accessor('sold_count', { header: 'Sold', cell: info => <span className="text-sm text-slate-600">{info.getValue()}</span> }),
    marketColumnHelper.accessor('status', { header: 'Status', cell: info => <Badge size="sm" variant="light" color={info.getValue() === 'available' ? 'green' : info.getValue() === 'out_of_stock' ? 'red' : 'gray'}>{info.getValue() === 'out_of_stock' ? 'Out of Stock' : info.getValue()}</Badge> }),
  ], [])

  const marketTable = useReactTable({ data: marketTableData, columns: marketColumns, state: { sorting: marketSortState }, onSortingChange: setMarketSortState, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  // ─── Generic section helpers ───
  const genericData = (activeSection === 'scans')
    ? sampleData['scans']
    : null
  const genericFilteredRows = useMemo(() => {
    if (!genericData) return []
    if (!genericSearch.trim()) return genericData.table.rows
    const q = genericSearch.toLowerCase()
    return genericData.table.rows.filter(row => row.cols.some(c => c.toLowerCase().includes(q)))
  }, [genericData, genericSearch])
  const genericTotalPages = Math.max(1, Math.ceil(genericFilteredRows.length / genericPageSize))
  const genericPaginatedRows = genericFilteredRows.slice((genericPage - 1) * genericPageSize, genericPage * genericPageSize)

  const handleSectionChange = (key: SectionKey) => { setActiveSection(key); setGenericSearch(''); setGenericPage(1) }

  const activeSectionIndex = Math.max(0, SECTIONS.findIndex(s => s.key === activeSection))
  const activeNavAccent = SECTION_NAV_ACCENT[activeSection]
  const navSearchEnabled = activeSection === 'users' || activeSection === 'market' || activeSection === 'scans' || activeSection === 'community' || activeSection === 'activities'
  const navSearchValue = activeSection === 'users'
    ? usersTableSearch
    : activeSection === 'market'
      ? marketTableSearch
      : activeSection === 'scans'
        ? genericSearch
        : activeSection === 'community'
          ? communityTableSearch
          : activeSection === 'activities'
            ? activitiesTableSearch
            : ''
  const handleNavSearchChange = (value: string) => {
    if (activeSection === 'users') { setUsersTableSearch(value); setUsersTablePage(1); return }
    if (activeSection === 'market') { setMarketTableSearch(value); setMarketTablePage(1); return }
    if (activeSection === 'scans') { setGenericSearch(value); setGenericPage(1); return }
    if (activeSection === 'community') { setCommunityTableSearch(value); return }
    if (activeSection === 'activities') { setActivitiesTableSearch(value) }
  }

  // ─── Report Data Builder ───
  const usersReportData: SectionData = useMemo(() => {
    const kpis: KpiItem[] = usersKpis ? [
      { label: 'Total Users', value: usersKpis.total_users.toLocaleString(), change: usersKpis.total_change, subtitle: 'All registered accounts', icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
      { label: 'Active Users', value: usersKpis.active_users.toLocaleString(), change: usersKpis.active_change, subtitle: 'Not disabled', icon: Activity, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
      { label: 'Verified Sellers', value: usersKpis.verified_sellers.toLocaleString(), change: usersKpis.sellers_change, subtitle: 'Active seller accounts', icon: ShoppingBag, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
      { label: 'Disabled Users', value: usersKpis.disabled_users.toLocaleString(), change: usersKpis.disabled_change, subtitle: 'Deactivated accounts', icon: TrendingDown, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    ] : []
    return {
      kpis, chartTitle: 'User Signups', chartData: usersChartData.map(d => ({ period: d.period, value: d['New Users'] })), chartColor: 'blue',
      progressA: { title: 'User Segmentation', subtitle: 'Breakdown by role', items: usersSegmentation ? Object.entries(usersSegmentation.roles).map(([label, value]) => ({ label, value, max: usersSegmentation.total, description: `${((value / (usersSegmentation.total || 1)) * 100).toFixed(1)}% of total` })) : [] },
      progressB: { title: 'Account Status', subtitle: 'Active vs inactive', items: usersSegmentation ? Object.entries(usersSegmentation.statuses).map(([label, value]) => ({ label, value, max: usersSegmentation.total, description: `${((value / (usersSegmentation.total || 1)) * 100).toFixed(1)}% of total` })) : [] },
      donut: { title: 'User Roles', slices: usersSegmentation ? [{ label: 'Regular', value: usersSegmentation.roles['Regular Users'] || 0, color: '#3b82f6' }, { label: 'Sellers', value: usersSegmentation.roles['Sellers'] || 0, color: '#22c55e' }, { label: 'Admins', value: usersSegmentation.roles['Admins'] || 0, color: '#ef4444' }] : [] },
      table: { headers: ['Name', 'Email', 'Role', 'Status', 'Joined'], rows: usersTableData.map(u => ({ id: u.id, cols: [u.name, u.email, u.role, u.status, u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'] })) },
    }
  }, [usersKpis, usersChartData, usersSegmentation, usersTableData])

  const marketReportData: SectionData = useMemo(() => {
    const kpis: KpiItem[] = marketKpis ? [
      { label: 'Total Revenue', value: `₱${marketKpis.total_revenue.toLocaleString()}`, change: marketKpis.revenue_change, subtitle: 'From delivered orders', icon: DollarSign, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
      { label: 'Total Orders', value: marketKpis.total_orders.toLocaleString(), change: marketKpis.orders_change, subtitle: 'All orders', icon: ShoppingBag, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
      { label: 'Active Products', value: marketKpis.active_products.toLocaleString(), change: 0, subtitle: 'Available listings', icon: Package, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
      { label: 'Avg Order Value', value: `₱${marketKpis.avg_order_value.toLocaleString()}`, change: 0, subtitle: 'Per transaction', icon: BarChart3, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    ] : []
    return {
      kpis, chartTitle: 'Market Revenue', chartData: marketChartData.map(d => ({ period: d.period, value: d.Revenue })), chartColor: 'green',
      progressA: { title: 'Order Status', subtitle: 'Order breakdown', items: marketSegmentation ? Object.entries(marketSegmentation.order_statuses).map(([label, value]) => ({ label, value, max: marketSegmentation.total_orders || 1, description: `${((value / (marketSegmentation.total_orders || 1)) * 100).toFixed(1)}%` })) : [] },
      progressB: { title: 'Categories', subtitle: 'Products by category', items: marketSegmentation ? Object.entries(marketSegmentation.category_breakdown).slice(0, 5).map(([label, value]) => {
        const total = Object.values(marketSegmentation.category_breakdown).reduce((a, b) => a + b, 0)
        return { label, value, max: total || 1, description: `${((value / (total || 1)) * 100).toFixed(1)}%` }
      }) : [] },
      donut: { title: 'Order Status', slices: marketSegmentation ? Object.entries(marketSegmentation.order_statuses).map(([label, value], i) => ({ label, value, color: ['#22c55e', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'][i] || '#94a3b8' })) : [] },
      table: { headers: ['Product', 'Seller', 'Category', 'Price', 'Stock', 'Sold', 'Status'], rows: marketTableData.map(p => ({ id: p.id, cols: [p.name, p.seller_name, p.category_name, `₱${p.price.toLocaleString()}`, String(p.stock_qty), String(p.sold_count), p.status] })) },
    }
  }, [marketKpis, marketChartData, marketSegmentation, marketTableData])

  // ═══════════════════ COMMUNITY REPORT DATA ═══════════════════
  const communityReportData: SectionData = useMemo(() => {
    if (!communityData) return { kpis: [], chartTitle: 'Community Engagement', chartData: [], chartColor: 'rose', progressA: { title: 'Content Breakdown', subtitle: '', items: [] }, progressB: { title: 'Moderation Stats', subtitle: '', items: [] }, donut: { title: 'Engagement', slices: [] }, table: { headers: [], rows: [] } }
    const k = communityData.kpis
    const totalPosts = k.total_posts || 1
    const catEntries = Object.entries(communityData.category_breakdown)
    const catTotal = catEntries.reduce((s, [, v]) => s + v, 0) || 1
    const modTotal = communityData.moderation.active + communityData.moderation.disabled + communityData.moderation.deleted || 1
    const engTotal = communityData.engagement_donut.likes + communityData.engagement_donut.comments || 1
    return {
      kpis: [
        { label: 'Total Posts', value: k.total_posts.toLocaleString(), change: 0, subtitle: 'Forum posts & articles', icon: MessageCircle, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
        { label: 'Total Comments', value: k.total_comments.toLocaleString(), change: 0, subtitle: 'User discussions', icon: MessageCircle, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
        { label: 'Active Threads', value: k.active_threads.toLocaleString(), change: 0, subtitle: 'Posts with comments', icon: Activity, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { label: 'Disabled Posts', value: k.disabled_posts.toLocaleString(), change: 0, subtitle: 'Pending moderation', icon: TrendingDown, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
      ],
      chartTitle: 'Community Engagement', chartColor: 'rose',
      chartData: communityData.chart_data.map(d => ({ period: d.period, value: d.Posts })),
      progressA: { title: 'Content Breakdown', subtitle: 'Posts by category', items: catEntries.slice(0, 5).map(([label, value]) => ({ label, value, max: catTotal, description: `${((value / catTotal) * 100).toFixed(1)}% of posts` })) },
      progressB: { title: 'Moderation Stats', subtitle: 'Content status', items: [
        { label: 'Active', value: communityData.moderation.active, max: modTotal, description: `${((communityData.moderation.active / modTotal) * 100).toFixed(1)}%` },
        { label: 'Disabled', value: communityData.moderation.disabled, max: modTotal, description: `${((communityData.moderation.disabled / modTotal) * 100).toFixed(1)}%` },
        { label: 'Deleted', value: communityData.moderation.deleted, max: modTotal, description: `${((communityData.moderation.deleted / modTotal) * 100).toFixed(1)}%` },
      ]},
      donut: { title: 'Engagement Type', slices: [
        { label: 'Likes', value: Math.round((communityData.engagement_donut.likes / engTotal) * 100), color: '#f43f5e' },
        { label: 'Comments', value: Math.round((communityData.engagement_donut.comments / engTotal) * 100), color: '#fb7185' },
      ]},
      table: { headers: ['Title', 'Author', 'Category', 'Likes', 'Comments', 'Created'], rows: communityData.top_posts.map(p => ({ id: p.id, cols: [p.title, p.author, p.category, String(p.likes), String(p.comments), p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'] })) },
    }
  }, [communityData])

  // Build genericData for community from real data
  const communityGenericData: SectionData | null = useMemo(() => {
    if (!communityData) return null
    return communityReportData
  }, [communityData, communityReportData])

  // ═══════════════════ ACTIVITIES REPORT DATA ═══════════════════
  const activitiesReportData: SectionData = useMemo(() => {
    if (!activitiesData) return { kpis: [], chartTitle: 'Platform Activity', chartData: [], chartColor: 'cyan', progressA: { title: 'Event Categories', subtitle: '', items: [] }, progressB: { title: 'Event Status', subtitle: '', items: [] }, donut: { title: 'Actor Roles', slices: [] }, table: { headers: [], rows: [] } }
    const k = activitiesData.kpis
    const catEntries = Object.entries(activitiesData.category_breakdown)
    const catTotal = catEntries.reduce((s, [, v]) => s + v, 0) || 1
    const statusTotal = k.success_count + k.warning_count + k.error_count || 1
    const roleEntries = Object.entries(activitiesData.role_breakdown)
    const roleTotal = roleEntries.reduce((s, [, v]) => s + v, 0) || 1
    const roleColors: Record<string, string> = { user: '#06b6d4', admin: '#8b5cf6', seller: '#22c55e', system: '#94a3b8' }
    return {
      kpis: [
        { label: 'Total Events', value: k.total_events.toLocaleString(), change: 0, subtitle: 'All tracked events', icon: Activity, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
        { label: 'Today', value: k.today_events.toLocaleString(), change: 0, subtitle: 'Events logged today', icon: Activity, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
        { label: 'Error Rate', value: `${k.error_rate}%`, change: 0, subtitle: `${k.error_count} errors total`, icon: TrendingDown, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
        { label: 'Unique Actors', value: k.unique_actors.toLocaleString(), change: 0, subtitle: 'Distinct users/systems', icon: Users, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
      ],
      chartTitle: 'Platform Activity', chartColor: 'cyan',
      chartData: activitiesData.chart_data.map(d => ({ period: d.period, value: d.Events })),
      progressA: { title: 'Event Categories', subtitle: 'Activity type breakdown', items: catEntries.slice(0, 6).map(([label, value]) => ({ label, value, max: catTotal, description: `${((value / catTotal) * 100).toFixed(1)}% of events` })) },
      progressB: { title: 'Event Status', subtitle: 'Success / Warning / Error', items: [
        { label: 'Success', value: k.success_count, max: statusTotal, description: `${((k.success_count / statusTotal) * 100).toFixed(1)}%` },
        { label: 'Warning', value: k.warning_count, max: statusTotal, description: `${((k.warning_count / statusTotal) * 100).toFixed(1)}%` },
        { label: 'Error', value: k.error_count, max: statusTotal, description: `${((k.error_count / statusTotal) * 100).toFixed(1)}%` },
      ]},
      donut: { title: 'Actor Roles', slices: roleEntries.map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value: Math.round((value / roleTotal) * 100), color: roleColors[label] || '#94a3b8' })) },
      table: { headers: ['Category', 'Actor', 'Action', 'Status', 'Timestamp'], rows: activitiesData.recent_events.map(e => ({ id: e.id, cols: [e.category, e.actor, e.action, e.status, e.timestamp ? new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'] })) },
    }
  }, [activitiesData])

  const activitiesGenericData: SectionData | null = useMemo(() => {
    if (!activitiesData) return null
    return activitiesReportData
  }, [activitiesData, activitiesReportData])

  const communityFilteredRows = useMemo(() => {
    if (!communityData) return []
    if (!communityTableSearch.trim()) return communityReportData.table.rows
    const q = communityTableSearch.toLowerCase()
    return communityReportData.table.rows.filter(row => row.cols.some(c => c.toLowerCase().includes(q)))
  }, [communityData, communityReportData, communityTableSearch])

  const activitiesFilteredRows = useMemo(() => {
    if (!activitiesData) return []
    if (!activitiesTableSearch.trim()) return activitiesReportData.table.rows
    const q = activitiesTableSearch.toLowerCase()
    return activitiesReportData.table.rows.filter(row => row.cols.some(c => c.toLowerCase().includes(q)))
  }, [activitiesData, activitiesReportData, activitiesTableSearch])

  const reportData: SectionData = activeSection === 'users' ? usersReportData
    : activeSection === 'market' ? marketReportData
    : activeSection === 'community' ? communityReportData
    : activeSection === 'activities' ? activitiesReportData
    : sampleData['scans']

  // ─── Users Donut with filter ───
  const usersDonutSlices: DonutSlice[] = useMemo(() => {
    if (!usersSegmentation) return []
    const total = usersSegmentation.total || 1
    const all = [
      { label: 'Regular Users', value: Math.round(((usersSegmentation.roles['Regular Users'] || 0) / total) * 100), color: '#3b82f6' },
      { label: 'Sellers', value: Math.round(((usersSegmentation.roles['Sellers'] || 0) / total) * 100), color: '#22c55e' },
      { label: 'Admins', value: Math.round(((usersSegmentation.roles['Admins'] || 0) / total) * 100), color: '#ef4444' },
    ]
    if (donutRoleFilter === 'all') return all
    if (donutRoleFilter === 'user') return [all[0]]
    if (donutRoleFilter === 'seller') return [all[1]]
    return [all[2]]
  }, [usersSegmentation, donutRoleFilter])

  const usersTotalPages = Math.max(1, Math.ceil(usersTableTotal / usersTablePageSize))
  const marketTotalPages = Math.max(1, Math.ceil(marketTableTotal / marketTablePageSize))

  // ─── Calendar stats (to fill whitespace) ───
  const calendarStats = useMemo(() => {
    if (!usersCalendar?.weeks) return { total: 0, max: 0, avg: 0, activeDays: 0 }
    const days = usersCalendar.weeks.flat().filter(d => d.day !== null)
    const total = days.reduce((s, d) => s + d.count, 0)
    const activeDays = days.filter(d => d.count > 0).length
    return { total, max: usersCalendar.max_count, avg: activeDays > 0 ? (total / activeDays).toFixed(1) : '0', activeDays }
  }, [usersCalendar])

  const communityCalendarStats = useMemo(() => {
    if (!communityCalendar?.weeks) return { total: 0, max: 0, avg: 0, activeDays: 0 }
    const days = communityCalendar.weeks.flat().filter(d => d.day !== null)
    const total = days.reduce((s, d) => s + d.count, 0)
    const activeDays = days.filter(d => d.count > 0).length
    return { total, max: communityCalendar.max_count, avg: activeDays > 0 ? (total / activeDays).toFixed(1) : '0', activeDays }
  }, [communityCalendar])

  const activitiesCalendarStats = useMemo(() => {
    if (!activitiesCalendar?.weeks) return { total: 0, max: 0, avg: 0, activeDays: 0 }
    const days = activitiesCalendar.weeks.flat().filter(d => d.day !== null)
    const total = days.reduce((s, d) => s + d.count, 0)
    const activeDays = days.filter(d => d.count > 0).length
    return { total, max: activitiesCalendar.max_count, avg: activeDays > 0 ? (total / activeDays).toFixed(1) : '0', activeDays }
  }, [activitiesCalendar])

  const marketCalendarStats = useMemo(() => {
    if (!marketCalendar?.weeks) return { total: 0, max: 0, avg: 0, activeDays: 0 }
    const days = marketCalendar.weeks.flat().filter(d => d.day !== null)
    const total = days.reduce((s, d) => s + d.count, 0)
    const activeDays = days.filter(d => d.count > 0).length
    return { total, max: marketCalendar.max_count, avg: activeDays > 0 ? (total / activeDays).toFixed(1) : '0', activeDays }
  }, [marketCalendar])

  // ─── Market donut slices ───
  const marketCategoryDonut: DonutSlice[] = useMemo(() => {
    if (!marketSegmentation) return []
    const entries = Object.entries(marketSegmentation.category_breakdown)
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1
    const colors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#99f6e4']
    return entries.slice(0, 6).map(([label, value], i) => ({ label, value: Math.round((value / total) * 100), color: colors[i] || '#94a3b8' }))
  }, [marketSegmentation])

  // ═══════════════════ PAGINATION COMPONENT ═══════════════════
  const PaginationBar = ({ page, totalPages, total, onPageChange }: { page: number; totalPages: number; total: number; onPageChange: (p: number) => void }) => (
    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
      <p className="text-xs text-slate-500">Page {page} of {totalPages} ({total} total)</p>
      <div className="flex items-center gap-1">
        <ActionIcon variant="subtle" color="gray" size="sm" disabled={page === 1} onClick={() => onPageChange(1)}>
          <ChevronLeft className="w-3.5 h-3.5" /><ChevronLeft className="w-3.5 h-3.5 -ml-2" />
        </ActionIcon>
        <ActionIcon variant="subtle" color="gray" size="sm" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </ActionIcon>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4))
          const pn = start + i
          if (pn > totalPages) return null
          return <button key={pn} onClick={() => onPageChange(pn)} className={`w-7 h-7 rounded text-xs font-medium transition-colors ${pn === page ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>{pn}</button>
        })}
        <ActionIcon variant="subtle" color="gray" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
          <ChevronRight className="w-3.5 h-3.5" />
        </ActionIcon>
        <ActionIcon variant="subtle" color="gray" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
          <ChevronRight className="w-3.5 h-3.5" /><ChevronRight className="w-3.5 h-3.5 -ml-2" />
        </ActionIcon>
      </div>
    </div>
  )

  // ═══════════════════ RENDER ═══════════════════
  return (
    <div className="min-h-screen bg-[var(--bg)]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div className="px-6 pb-8 pt-0 max-w-[1400px] mx-auto">

        {/* Header Hero (full width, directly below app header line) */}
        <div className="-mt-6 mb-6 relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden border-y border-slate-300 shadow-sidebar-subtle h-64">
          <div
            className="absolute inset-0 bg-center bg-cover scale-110 blur-sm"
            style={{ backgroundImage: "url('/assets/page-hero/login.jpg')" }}
          />
          <div className="absolute inset-0 bg-slate-900/32" />
          <div className="absolute inset-0 z-10 flex flex-col justify-between">
            <div className="w-full max-w-[1400px] mx-auto px-6 pt-6 self-start">
              <div className="text-sm text-white/75 font-medium"
                style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}>
                <span>Pages</span><span className="mx-2">/</span><span>Admin Dashboard</span>
              </div>
            </div>
            <div className="w-full px-6 pb-6">
              <div className="w-1/2 bg-slate-900/65 backdrop-blur-sm rounded-lg px-8 py-6 shadow-xl border border-white/10">
                <h1 className="text-4xl font-bold text-white"
                  style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.55), 0 0 1px rgba(0,0,0,0.8)' }}>
                  Admin Dashboard
                </h1>
                <p className="text-white/90 mt-2 text-lg"
                  style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)' }}>
                  Platform analytics, monitoring, and management
                </p>
              </div>
            </div>
            <div className="w-full max-w-[1400px] mx-auto px-6 pb-6 flex items-end gap-4 text-white/80 font-medium"
              style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}>
              <span>DaingGrader</span>
              <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Analytics Navigation */}
        <div className="relative z-20 overflow-visible mb-6 bg-white/75 border border-slate-200 rounded-xl p-3 shadow-sm backdrop-blur-[2px]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-slate-900">Analytics / {SECTIONS.find(s => s.key === activeSection)?.label}</h2>
              <p className="text-xs text-slate-600 italic mt-0.5">{SECTION_DESCRIPTIONS[activeSection]}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <TextInput
                placeholder={navSearchEnabled ? `Search ${SECTIONS.find(s => s.key === activeSection)?.label?.toLowerCase()} data...` : 'Search not available in this view'}
                size="xs"
                radius="md"
                value={navSearchValue}
                disabled={!navSearchEnabled}
                onChange={(e) => handleNavSearchChange(e.currentTarget.value)}
                leftSection={<Search className="w-4 h-4 text-slate-400" />}
                classNames={{ input: navSearchEnabled ? SECTION_SEARCH_FOCUS[activeSection] : '' }}
                className="w-64"
              />
              <div ref={reportPanelAnchorRef} className="relative">
                <button onClick={() => setReportPanelOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 border border-slate-300 bg-white transition-all duration-300 hover:border-slate-400 hover:shadow-sm active:scale-[0.98]"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(15,23,42,.06)' }}>
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
                <AdminReportPanel open={reportPanelOpen} onClose={() => setReportPanelOpen(false)} section={activeSection}
                  sectionLabel={SECTIONS.find(s => s.key === activeSection)?.label ?? ''} data={reportData} anchorRef={reportPanelAnchorRef} />
              </div>
            </div>
          </div>

          <div className="mt-3 relative p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            <div
              className="absolute top-1 bottom-1 rounded-md transition-transform duration-500"
              style={{
                width: `calc((100% - 8px) / ${SECTIONS.length})`,
                transform: `translateX(calc(${activeSectionIndex} * 100%))`,
                backgroundColor: activeNavAccent.bg,
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: `0 4px 14px ${activeNavAccent.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}
            />
            <div className="relative z-10 grid grid-cols-5">
              {SECTIONS.map(sec => {
                const isActive = activeSection === sec.key
                return (
                  <button
                    key={sec.key}
                    onClick={() => handleSectionChange(sec.key)}
                    className={`px-2 py-2 text-[11px] font-semibold tracking-wider uppercase transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-800 hover:text-slate-900'}`}
                  >
                    {sec.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════ USERS SECTION ══════════════════ */}
        {activeSection === 'users' && (
          <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
            <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-300/40 to-blue-500/50" />
            <div className="pl-8 pr-3 py-3 space-y-4">
            {/* ROW 1: KPIs */}
            <div className="relative">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">1 KPI</div>
              <div className="bg-white/80 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {usersKpisLoading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-300 rounded-xl p-4 min-h-[130px] animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-24 mb-3" /><div className="h-7 bg-slate-200 rounded w-20 mb-2" /><div className="h-3 bg-slate-200 rounded w-32" />
                </div>
              )) : usersKpis ? (<>
                <KpiCard icon={<Users className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" emoji="👥" title="Total Users"
                  value={usersKpis.total_users.toLocaleString()} badge={<DynamicPercentageBadge value={usersKpis.total_change} size="xs" />}
                  badgeLabel="vs last 30 days" description="Total number of registered accounts on the platform" />
                <KpiCard icon={<Activity className="w-5 h-5 text-green-600" />} iconBg="bg-green-100" emoji="✅" title="Active Users"
                  value={usersKpis.active_users.toLocaleString()} badge={<DynamicPercentageBadge value={usersKpis.active_change} size="xs" />}
                  badgeLabel="vs last 30 days" description="Users whose accounts are not disabled or deactivated" />
                <KpiCard icon={<ShoppingBag className="w-5 h-5 text-violet-600" />} iconBg="bg-violet-100" emoji="🏪" title="Verified Sellers"
                  value={usersKpis.verified_sellers.toLocaleString()} badge={<DynamicPercentageBadge value={usersKpis.sellers_change} size="xs" />}
                  badgeLabel="vs last 30 days" description="Active seller accounts with marketplace access" />
                <KpiCard icon={<UserX className="w-5 h-5 text-red-600" />} iconBg="bg-red-100" emoji="🚫" title="Disabled Users"
                  value={usersKpis.disabled_users.toLocaleString()} badge={<DynamicPercentageBadge value={usersKpis.disabled_change} size="xs" />}
                  badgeLabel="vs last 30 days" description="Accounts that have been deactivated by administrators" />
              </>) : null}
              </div>
            </div>

            {/* ROW 2: Bar Chart — Blue=Users, Green=Sellers, Red=Admins */}
            <div className="relative pt-2 border-t border-slate-200/70">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">2 Trend</div>
              <div className="bg-white border border-slate-300 rounded-xl p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-900 font-bold">📈 User Signups</p>
                  <p className="text-xs text-slate-500 mt-1">{usersGranularity === 'week' ? 'Daily signups (last 7 days)' : usersGranularity === 'month' ? 'Monthly signups (this year)' : 'Yearly signups (last 5 years)'}</p>
                </div>
                <Group gap="xs">
                  <Button variant="default" size="xs" onClick={handleUsersToggleGranularity} className="text-xs font-medium min-w-[62px]">
                    {usersGranularity === 'week' ? 'Week' : usersGranularity === 'month' ? 'Month' : 'Year'}
                  </Button>
                  <DatePickerInput type="range" placeholder="Date range" value={usersDateRange} onChange={handleUsersDateRangeChange}
                    leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()}
                    styles={{ input: { border: '1px solid rgb(203 213 225)', borderRadius: '0.5rem', fontSize: '0.875rem' } }} />
                  <ActionIcon variant="default" onClick={() => setExpandedChart(true)}><Maximize2 className="w-4 h-4" /></ActionIcon>
                </Group>
              </div>
              {usersChartLoading ? (
                <div className="h-64 flex items-center justify-center"><span className="text-slate-500">Loading chart...</span></div>
              ) : (
                <AdminStackedAreaChart data={usersChartData} xKey="period"
                  areas={[
                    { key: 'New Users', color: '#3b82f6' },
                    { key: 'New Sellers', color: '#22c55e' },
                    { key: 'New Admins', color: '#ef4444' },
                  ]}
                  height={256} />
              )}
              </div>
            </div>

            {/* Expanded chart modal */}
            <Modal opened={expandedChart} onClose={() => setExpandedChart(false)} size="90%" title={<span className="font-bold text-lg">User Signups — Expanded</span>} centered>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="default" size="xs" onClick={handleUsersToggleGranularity}>{usersGranularity === 'week' ? 'Week' : usersGranularity === 'month' ? 'Month' : 'Year'}</Button>
                  <DatePickerInput type="range" placeholder="Date range" value={usersDateRange} onChange={handleUsersDateRangeChange}
                    leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()} />
                </div>
                <AdminStackedAreaChart data={usersChartData} xKey="period"
                  areas={[
                    { key: 'New Users', color: '#3b82f6' },
                    { key: 'New Sellers', color: '#22c55e' },
                    { key: 'New Admins', color: '#ef4444' },
                  ]}
                  height={500} />
              </div>
            </Modal>

            {/* ROW 3: Segmentation + Calendar Heatmap + Role Donut */}
            <div className="relative pt-2 border-t border-slate-200/70">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">3 Breakdown</div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* User Segmentation */}
              <div className="bg-white border border-slate-300 rounded-xl p-4">
                <p className="text-xs text-slate-900 font-bold">📊 User Segmentation</p>
                <p className="text-[10px] text-slate-500 mb-4 italic">Breakdown by role and status</p>
                {usersSegmentation ? (
                  <div className="space-y-4">
                    {Object.entries(usersSegmentation.roles).map(([label, value], i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">{label}</span>
                          <span className="text-xs font-semibold text-slate-700">{value.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (value / (usersSegmentation.total || 1)) * 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-1">{((value / (usersSegmentation.total || 1)) * 100).toFixed(1)}% of total</p>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 pt-3 mt-3">
                      <p className="text-[10px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Account Status</p>
                      {Object.entries(usersSegmentation.statuses).map(([label, value], i) => (
                        <div key={i} className="mb-2.5">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900">{label}</span>
                            <span className="text-xs font-semibold text-slate-700">{value.toLocaleString()}</span>
                          </div>
                          <div className={`w-full h-2.5 ${label === 'Active' ? 'bg-green-100' : 'bg-red-100'} rounded-full overflow-hidden`}>
                            <div className={`h-full ${label === 'Active' ? 'bg-green-500' : 'bg-red-500'} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, (value / (usersSegmentation.total || 1)) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Loading...</div>}
              </div>

              {/* Calendar Heatmap with Tooltip */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-900 font-bold">📅 Signup Calendar</p>
                </div>
                <p className="text-[10px] text-slate-500 mb-3 italic">Daily new user signups heatmap</p>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <select value={usersHeatMapYear} onChange={(e) => setUsersHeatMapYear(Number(e.target.value))}
                    className="px-2 py-1 border border-blue-300 shadow-sm bg-white text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded">
                    {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={usersHeatMapMonth} onChange={(e) => setUsersHeatMapMonth(Number(e.target.value))}
                    className="px-2 py-1 border border-blue-300 shadow-sm bg-white text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded">
                    {[{ val: 1, name: 'Jan' }, { val: 2, name: 'Feb' }, { val: 3, name: 'Mar' }, { val: 4, name: 'Apr' }, { val: 5, name: 'May' },
                      { val: 6, name: 'Jun' }, { val: 7, name: 'Jul' }, { val: 8, name: 'Aug' }, { val: 9, name: 'Sep' }, { val: 10, name: 'Oct' },
                      { val: 11, name: 'Nov' }, { val: 12, name: 'Dec' }].map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                  </select>
                  <div className="text-[10px] text-slate-500 ml-auto">{usersCalendar ? `0 — ${usersCalendar.max_count} signups` : '0 — 0'}</div>
                </div>
                {usersCalendarLoading ? (
                  <div className="h-32 flex items-center justify-center text-sm text-slate-500">Loading...</div>
                ) : usersCalendar && usersCalendar.weeks ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-center">{d}</div>)}
                    </div>
                    {usersCalendar.weeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="grid grid-cols-7 gap-1">
                        {week.map((day, dayIdx) => {
                          const maxCount = usersCalendar.max_count || 1
                          const intensity = day.day !== null && day.count > 0 ? Math.min(day.count / maxCount, 1) : 0
                          return (
                            <Tooltip key={dayIdx} label={day.day !== null ? `${usersCalendar.month_name} ${day.day}: ${day.count} signup${day.count !== 1 ? 's' : ''}` : ''} disabled={day.day === null} position="top" withArrow>
                              <div
                                className={`h-7 border border-slate-200 flex items-center justify-center text-[9px] font-medium rounded-sm cursor-default transition-transform hover:scale-110 ${
                                  day.day === null ? 'bg-slate-50' :
                                  intensity > 0.7 ? 'bg-blue-600 text-white' :
                                  intensity > 0.4 ? 'bg-blue-400 text-white' :
                                  intensity > 0 ? 'bg-blue-200 text-blue-900' :
                                  'bg-blue-50 text-slate-400'
                                }`}
                              >
                                {day.day !== null ? (day.count || '') : ''}
                              </div>
                            </Tooltip>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : <div className="h-32 flex items-center justify-center text-sm text-slate-500">No data</div>}

                {/* Calendar statistics to fill whitespace */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{calendarStats.total}</p>
                    <p className="text-[10px] text-slate-500">Total Signups</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{calendarStats.max}</p>
                    <p className="text-[10px] text-slate-500">Peak Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{calendarStats.avg}</p>
                    <p className="text-[10px] text-slate-500">Avg / Active Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{calendarStats.activeDays}</p>
                    <p className="text-[10px] text-slate-500">Active Days</p>
                  </div>
                </div>
              </div>

              {/* User Roles Donut with radio filter */}
              <div className="bg-white border border-slate-300 rounded-xl p-4">
                <p className="text-xs text-slate-900 font-bold">🍩 User Roles</p>
                <p className="text-[10px] text-slate-500 mb-3 italic">Distribution by role</p>

                {/* Radio Buttons */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {([
                    { key: 'all' as const, label: 'All', color: 'bg-slate-600' },
                    { key: 'user' as const, label: 'Users', color: 'bg-blue-500' },
                    { key: 'seller' as const, label: 'Sellers', color: 'bg-green-500' },
                    { key: 'admin' as const, label: 'Admins', color: 'bg-red-500' },
                  ]).map(opt => (
                    <button key={opt.key} onClick={() => setDonutRoleFilter(opt.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        donutRoleFilter === opt.key ? `${opt.color} text-white shadow-sm` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${donutRoleFilter === opt.key ? 'bg-white' : opt.color}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Straight Angle Pie Chart */}
                <div className="flex flex-col items-center relative">
                  <StraightAnglePie slices={usersDonutSlices} />
                  <div className="mt-4 w-full space-y-2">
                    {usersDonutSlices.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs text-slate-700 flex-1">{s.label}</span>
                        <span className="text-xs font-semibold text-slate-900">{s.value}%</span>
                        {usersSegmentation && (
                          <span className="text-[10px] text-slate-400">
                            ({(donutRoleFilter === 'all'
                              ? (s.label === 'Regular Users' ? usersSegmentation.roles['Regular Users'] : s.label === 'Sellers' ? usersSegmentation.roles['Sellers'] : usersSegmentation.roles['Admins'])
                              : Object.values(usersSegmentation.roles).find((_, idx) => idx === i)
                            || 0).toLocaleString()})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {usersSegmentation && (
                    <div className="mt-3 pt-2 border-t border-slate-100 w-full text-center">
                      <p className="text-xs text-slate-500">Total: <span className="font-semibold text-slate-800">{usersSegmentation.total.toLocaleString()}</span></p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>

            {/* ROW 4: Users Table */}
            <div className="relative pt-2 border-t border-slate-200/70">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">4 Records</div>
              <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-900 font-bold">📋 Users Data</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{usersTableLoading ? 'Loading...' : `Showing ${usersTableData.length} of ${usersTableTotal} users`}</p>
                </div>
                <TextInput placeholder="Search users..." size="xs" radius="md" value={usersTableSearch}
                  onChange={e => { setUsersTableSearch(e.currentTarget.value); setUsersTablePage(1) }}
                  leftSection={<Search className="w-3.5 h-3.5 text-slate-400" />} classNames={{ input: SECTION_SEARCH_FOCUS.users }} className="w-64" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    {usersTable.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>{hg.headers.map(header => (
                        <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                          className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100 select-none border-r border-slate-200 last:border-r-0">
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                          </div>
                        </th>
                      ))}</tr>
                    ))}
                  </thead>
                  <tbody>
                    {usersTableData.length === 0 && !usersTableLoading ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No users found</td></tr>
                    ) : usersTable.getRowModel().rows.map(row => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-blue-50/30 transition-colors">
                        {row.getVisibleCells().map(cell => <td key={cell.id} className="px-4 py-3 border-r border-slate-100 last:border-r-0">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar page={usersTablePage} totalPages={usersTotalPages} total={usersTableTotal} onPageChange={setUsersTablePage} />
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ══════════════════ MARKET SECTION ══════════════════ */}
        {activeSection === 'market' && (
          <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
            <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-500/50 via-emerald-300/40 to-emerald-500/50" />
            <div className="pl-8 pr-3 py-3 space-y-4">
            {/* ROW 1: KPIs */}
            <div className="relative">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold shadow-sm">1 KPI</div>
              <div className="bg-white/80 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {marketKpisLoading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-300 rounded-xl p-4 min-h-[130px] animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-24 mb-3" /><div className="h-7 bg-slate-200 rounded w-20 mb-2" /><div className="h-3 bg-slate-200 rounded w-32" />
                </div>
              )) : marketKpis ? (<>
                <KpiCard icon={<DollarSign className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-100" emoji="💰" title="Total Revenue"
                  value={`₱${marketKpis.total_revenue.toLocaleString()}`} badge={<DynamicPercentageBadge value={marketKpis.revenue_change} size="xs" />}
                  badgeLabel="vs last 30 days" description="Revenue from delivered orders only" />
                <KpiCard icon={<ShoppingBag className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" emoji="📦" title="Total Orders"
                  value={marketKpis.total_orders.toLocaleString()} badge={<DynamicPercentageBadge value={marketKpis.orders_change} size="xs" />}
                  badgeLabel="vs last 30 days" description={`Delivered: ${marketKpis.delivered_orders} · Pending: ${marketKpis.pending_orders} · Cancelled: ${marketKpis.cancelled_orders}`} />
                <KpiCard icon={<Package className="w-5 h-5 text-violet-600" />} iconBg="bg-violet-100" emoji="🏷️" title="Products & Stock"
                  value={`${marketKpis.active_products} active`}
                  badge={<Badge size="xs" variant="light" color={marketKpis.out_of_stock > 0 ? 'red' : 'green'}>{marketKpis.out_of_stock} out of stock</Badge>}
                  badgeLabel="" description={`Total stock: ${marketKpis.total_stock.toLocaleString()} units across ${marketKpis.total_products} products`} />
                <KpiCard icon={<BarChart3 className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-100" emoji="📊" title="Averages"
                  value={`₱${marketKpis.avg_order_value.toLocaleString()}`}
                  badge={<Badge size="xs" variant="light" color="blue">{marketKpis.active_sellers} active sellers</Badge>}
                  badgeLabel="" description={`Average order value · ${marketKpis.total_sellers} total sellers on platform`} />
              </>) : null}
              </div>
            </div>

            {/* ROW 2: Market Bar Chart — Orders & Revenue */}
            <div className="relative pt-2 border-t border-slate-200/70">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold shadow-sm">2 Trend</div>
              <div className="bg-white border border-slate-300 rounded-xl p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-900 font-bold">📈 Market Activity</p>
                  <p className="text-xs text-slate-500 mt-1">Orders count & revenue per period</p>
                </div>
                <Group gap="xs">
                  <select value={marketChartSellerFilter} onChange={e => setMarketChartSellerFilter(e.target.value)}
                    className="px-2 py-1 border border-slate-300 bg-white text-xs rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="all">All Sellers</option>
                    {marketSellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <Button variant="default" size="xs" onClick={handleMarketToggleGranularity} className="text-xs font-medium min-w-[62px]">
                    {marketGranularity === 'week' ? 'Week' : marketGranularity === 'month' ? 'Month' : 'Year'}
                  </Button>
                  <DatePickerInput type="range" placeholder="Date range" value={marketDateRange} onChange={handleMarketDateRangeChange}
                    leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()}
                    styles={{ input: { border: '1px solid rgb(203 213 225)', borderRadius: '0.5rem', fontSize: '0.875rem' } }} />
                  <ActionIcon variant="default" onClick={() => setExpandedMarketChart(true)}><Maximize2 className="w-4 h-4" /></ActionIcon>
                </Group>
              </div>
              {marketChartLoading ? (
                <div className="h-64 flex items-center justify-center"><span className="text-slate-500">Loading chart...</span></div>
              ) : (
                <AdminStackedAreaChart data={marketChartData} xKey="period"
                  areas={[
                    { key: 'Orders', color: '#3b82f6' },
                    { key: 'Revenue', color: '#10b981' },
                  ]}
                  height={256}
                  valueFormatter={(v: number) => v >= 1000 ? `₱${(v / 1000).toFixed(1)}k` : v.toLocaleString()} />
              )}
              </div>
            </div>

            {/* Expanded Market chart modal */}
            <Modal opened={expandedMarketChart} onClose={() => setExpandedMarketChart(false)} size="90%" title={<span className="font-bold text-lg">Market Activity — Expanded</span>} centered>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <select value={marketChartSellerFilter} onChange={e => setMarketChartSellerFilter(e.target.value)}
                    className="px-2 py-1 border border-slate-300 bg-white text-xs rounded"><option value="all">All Sellers</option>
                    {marketSellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <Button variant="default" size="xs" onClick={handleMarketToggleGranularity}>{marketGranularity === 'week' ? 'Week' : marketGranularity === 'month' ? 'Month' : 'Year'}</Button>
                  <DatePickerInput type="range" placeholder="Date range" value={marketDateRange} onChange={handleMarketDateRangeChange}
                    leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()} />
                </div>
                <AdminStackedAreaChart data={marketChartData} xKey="period"
                  areas={[
                    { key: 'Orders', color: '#3b82f6' },
                    { key: 'Revenue', color: '#10b981' },
                  ]}
                  height={500}
                  valueFormatter={(v: number) => v >= 1000 ? `₱${(v / 1000).toFixed(1)}k` : v.toLocaleString()} />
              </div>
            </Modal>

            {/* ROW 3: Order Status + Top Sellers + Category Donut */}
            <div className="relative pt-2 border-t border-slate-200/70">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold shadow-sm">3 Breakdown</div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Order Status Breakdown */}
              <div className="bg-white border border-slate-300 rounded-xl p-4">
                <p className="text-xs text-slate-900 font-bold">📊 Order Status</p>
                <p className="text-[10px] text-slate-500 mb-4 italic">Breakdown by order status</p>
                {marketSegmentation ? (
                  <div className="space-y-4">
                    {Object.entries(marketSegmentation.order_statuses).map(([label, value], i) => {
                      const colors = { Pending: 'bg-amber-500', Confirmed: 'bg-blue-500', Shipped: 'bg-indigo-500', Delivered: 'bg-green-500', Cancelled: 'bg-red-500' }
                      const bgColors = { Pending: 'bg-amber-100', Confirmed: 'bg-blue-100', Shipped: 'bg-indigo-100', Delivered: 'bg-green-100', Cancelled: 'bg-red-100' }
                      return (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900">{label}</span>
                            <span className="text-xs font-semibold text-slate-700">{value.toLocaleString()}</span>
                          </div>
                          <div className={`w-full h-2.5 ${bgColors[label as keyof typeof bgColors] || 'bg-slate-100'} rounded-full overflow-hidden`}>
                            <div className={`h-full ${colors[label as keyof typeof colors] || 'bg-slate-500'} rounded-full transition-all duration-700`}
                              style={{ width: `${Math.min(100, (value / (marketSegmentation.total_orders || 1)) * 100)}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-500 italic mt-1">{((value / (marketSegmentation.total_orders || 1)) * 100).toFixed(1)}% of total</p>
                        </div>
                      )
                    })}
                  </div>
                ) : <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Loading...</div>}
              </div>

              {/* Orders Calendar Heatmap */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-900 font-bold">📅 Orders Calendar</p>
                </div>
                <p className="text-[10px] text-slate-500 mb-3 italic">Daily order count heatmap</p>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <select value={marketHeatMapYear} onChange={(e) => setMarketHeatMapYear(Number(e.target.value))}
                    className="px-2 py-1 border border-emerald-300 shadow-sm bg-white text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded">
                    {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={marketHeatMapMonth} onChange={(e) => setMarketHeatMapMonth(Number(e.target.value))}
                    className="px-2 py-1 border border-emerald-300 shadow-sm bg-white text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded">
                    {[{ val: 1, name: 'Jan' }, { val: 2, name: 'Feb' }, { val: 3, name: 'Mar' }, { val: 4, name: 'Apr' }, { val: 5, name: 'May' },
                      { val: 6, name: 'Jun' }, { val: 7, name: 'Jul' }, { val: 8, name: 'Aug' }, { val: 9, name: 'Sep' }, { val: 10, name: 'Oct' },
                      { val: 11, name: 'Nov' }, { val: 12, name: 'Dec' }].map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                  </select>
                  <div className="text-[10px] text-slate-500 ml-auto">{marketCalendar ? `0 — ${marketCalendar.max_count} orders` : '0 — 0'}</div>
                </div>
                {marketCalendarLoading ? (
                  <div className="h-32 flex items-center justify-center text-sm text-slate-500">Loading...</div>
                ) : marketCalendar && marketCalendar.weeks ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-center">{d}</div>)}
                    </div>
                    {marketCalendar.weeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="grid grid-cols-7 gap-1">
                        {week.map((day, dayIdx) => {
                          const maxCount = marketCalendar.max_count || 1
                          const intensity = day.day !== null && day.count > 0 ? Math.min(day.count / maxCount, 1) : 0
                          return (
                            <Tooltip key={dayIdx} label={day.day !== null ? `${marketCalendar.month_name} ${day.day}: ${day.count} order${day.count !== 1 ? 's' : ''}` : ''} disabled={day.day === null} position="top" withArrow>
                              <div
                                className={`h-7 border border-slate-200 flex items-center justify-center text-[9px] font-medium rounded-sm cursor-default transition-transform hover:scale-110 ${
                                  day.day === null ? 'bg-slate-50' :
                                  intensity > 0.7 ? 'bg-emerald-600 text-white' :
                                  intensity > 0.4 ? 'bg-emerald-400 text-white' :
                                  intensity > 0 ? 'bg-emerald-200 text-emerald-900' :
                                  'bg-emerald-50 text-slate-400'
                                }`}
                              >
                                {day.day !== null ? (day.count || '') : ''}
                              </div>
                            </Tooltip>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : <div className="h-32 flex items-center justify-center text-sm text-slate-500">No data</div>}

                {/* Calendar statistics */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{marketCalendarStats.total}</p>
                    <p className="text-[10px] text-slate-500">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{marketCalendarStats.max}</p>
                    <p className="text-[10px] text-slate-500">Peak Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{marketCalendarStats.avg}</p>
                    <p className="text-[10px] text-slate-500">Avg / Active Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{marketCalendarStats.activeDays}</p>
                    <p className="text-[10px] text-slate-500">Active Days</p>
                  </div>
                </div>
              </div>

              {/* Category Donut */}
              <div className="bg-white border border-slate-300 rounded-xl p-4">
                <p className="text-xs text-slate-900 font-bold">🍩 Products by Category</p>
                <p className="text-[10px] text-slate-500 mb-3 italic">Distribution breakdown</p>
                <div className="flex flex-col items-center">
                  <StraightAnglePie slices={marketCategoryDonut} />
                  <div className="mt-4 w-full space-y-2">
                    {marketCategoryDonut.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs text-slate-700 flex-1 truncate">{s.label}</span>
                        <span className="text-xs font-semibold text-slate-900">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* ROW 4: Market Table with Filters */}
            <div className="relative pt-2 border-t border-slate-200/70">
              <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold shadow-sm">4 Records</div>
              <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-900 font-bold">📋 Products Data</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{marketTableLoading ? 'Loading...' : `Showing ${marketTableData.length} of ${marketTableTotal} products`}</p>
                  </div>
                  <TextInput placeholder="Search products..." size="xs" radius="md" value={marketTableSearch}
                    onChange={e => { setMarketTableSearch(e.currentTarget.value); setMarketTablePage(1) }}
                    leftSection={<Search className="w-3.5 h-3.5 text-slate-400" />} classNames={{ input: SECTION_SEARCH_FOCUS.market }} className="w-64" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-medium">Filters:</span>
                  </div>
                  <select value={marketSellerFilter} onChange={e => { setMarketSellerFilter(e.target.value); setMarketTablePage(1) }}
                    className="px-2 py-1 border border-slate-300 bg-white text-xs rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="all">All Sellers</option>
                    {marketSellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={marketCategoryFilter} onChange={e => { setMarketCategoryFilter(e.target.value); setMarketTablePage(1) }}
                    className="px-2 py-1 border border-slate-300 bg-white text-xs rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="all">All Categories</option>
                    {marketCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={marketStatusFilter} onChange={e => { setMarketStatusFilter(e.target.value); setMarketTablePage(1) }}
                    className="px-2 py-1 border border-slate-300 bg-white text-xs rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="all">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  {(marketSellerFilter !== 'all' || marketCategoryFilter !== 'all' || marketStatusFilter !== 'all') && (
                    <button onClick={() => { setMarketSellerFilter('all'); setMarketCategoryFilter('all'); setMarketStatusFilter('all'); setMarketTablePage(1) }}
                      className="text-[10px] text-blue-600 hover:underline">Clear all</button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    {marketTable.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>{hg.headers.map(header => (
                        <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                          className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100 select-none border-r border-slate-200 last:border-r-0">
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                          </div>
                        </th>
                      ))}</tr>
                    ))}
                  </thead>
                  <tbody>
                    {marketTableData.length === 0 && !marketTableLoading ? (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No products found</td></tr>
                    ) : marketTable.getRowModel().rows.map(row => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-blue-50/30 transition-colors">
                        {row.getVisibleCells().map(cell => <td key={cell.id} className="px-4 py-3 border-r border-slate-100 last:border-r-0">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar page={marketTablePage} totalPages={marketTotalPages} total={marketTableTotal} onPageChange={setMarketTablePage} />
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ══════════════════ COMMUNITY SECTION ══════════════════ */}
        {activeSection === 'community' && (
          <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
            <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-rose-500/50 via-rose-300/40 to-rose-500/50" />
            <div className="pl-8 pr-3 py-3 space-y-4">
            {communityLoading ? (
              <div className="bg-white/70 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-300 rounded-xl p-4 min-h-[130px] animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-24 mb-3" /><div className="h-7 bg-slate-200 rounded w-20 mb-2" /><div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                ))}
              </div>
            ) : communityGenericData ? (
              <>
                {/* ROW 1: KPIs */}
                <div className="relative">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-semibold shadow-sm">1 KPI</div>
                  <div className="bg-white/80 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {communityGenericData.kpis.map((kpi, i) => {
                    const Icon = kpi.icon
                    return <KpiCard key={i} icon={<Icon className={`w-5 h-5 ${kpi.iconColor}`} />} iconBg={kpi.iconBg}
                      title={kpi.label} value={kpi.value} badge={<DynamicPercentageBadge value={kpi.change} size="xs" />} badgeLabel="vs last period" description={kpi.subtitle} />
                  })}
                  </div>
                </div>

                {/* ROW 2: Bar Chart with filters */}
                <div className="relative pt-2 border-t border-slate-200/70">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-semibold shadow-sm">2 Trend</div>
                  <div className="bg-white border border-slate-300 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-900 font-bold">📈 Community Engagement</p>
                      <p className="text-xs text-slate-500 mt-1">{communityGranularity === 'week' ? 'Daily posts & comments (last 7 days)' : communityGranularity === 'month' ? 'Monthly trend (this year)' : 'Yearly trend (last 5 years)'}</p>
                    </div>
                    <Group gap="xs">
                      <select value={communityCategoryFilter} onChange={e => setCommunityCategoryFilter(e.target.value)}
                        className="px-2 py-1 border border-slate-300 bg-white text-xs rounded focus:border-rose-500 focus:ring-1 focus:ring-rose-500">
                        <option value="all">All Categories</option>
                        {communityData && Object.keys(communityData.category_breakdown).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Button variant="default" size="xs" onClick={handleCommunityToggleGranularity} className="text-xs font-medium min-w-[62px]">
                        {communityGranularity === 'week' ? 'Week' : communityGranularity === 'month' ? 'Month' : 'Year'}
                      </Button>
                      <DatePickerInput type="range" placeholder="Date range" value={communityDateRange} onChange={handleCommunityDateRangeChange}
                        leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()}
                        styles={{ input: { border: '1px solid rgb(203 213 225)', borderRadius: '0.5rem', fontSize: '0.875rem' } }} />
                      <ActionIcon variant="default" onClick={() => setExpandedCommunityChart(true)}><Maximize2 className="w-4 h-4" /></ActionIcon>
                    </Group>
                  </div>
                  {communityChartLoading ? (
                    <div className="h-64 flex items-center justify-center"><span className="text-slate-500">Loading chart...</span></div>
                  ) : (
                    <AdminStackedAreaChart data={communityChartData} xKey="period"
                      areas={[
                        { key: 'Posts', color: '#f43f5e' },
                        { key: 'Comments', color: '#ec4899' },
                      ]}
                      height={256} />
                  )}
                  </div>
                </div>

                {/* Expanded chart modal */}
                <Modal opened={expandedCommunityChart} onClose={() => setExpandedCommunityChart(false)} size="90%" title={<span className="font-bold text-lg">Community Engagement — Expanded</span>} centered>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <select value={communityCategoryFilter} onChange={e => setCommunityCategoryFilter(e.target.value)}
                        className="px-2 py-1 border border-slate-300 bg-white text-xs rounded">
                        <option value="all">All Categories</option>
                        {communityData && Object.keys(communityData.category_breakdown).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Button variant="default" size="xs" onClick={handleCommunityToggleGranularity}>{communityGranularity === 'week' ? 'Week' : communityGranularity === 'month' ? 'Month' : 'Year'}</Button>
                      <DatePickerInput type="range" placeholder="Date range" value={communityDateRange} onChange={handleCommunityDateRangeChange}
                        leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()} />
                    </div>
                    <AdminStackedAreaChart data={communityChartData} xKey="period"
                      areas={[
                        { key: 'Posts', color: '#f43f5e' },
                        { key: 'Comments', color: '#ec4899' },
                      ]}
                      height={500} />
                  </div>
                </Modal>

                {/* ROW 3: Content Breakdown + Calendar Heatmap + Engagement Donut */}
                <div className="relative pt-2 border-t border-slate-200/70">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-semibold shadow-sm">3 Breakdown</div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Content Breakdown (progress bars) */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">📊 Content Breakdown</p>
                    <p className="text-[10px] text-slate-500 mb-4 italic">Posts by category</p>
                    <div className="space-y-4">
                      {communityGenericData.progressA.items.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1"><span className="text-xs font-bold text-slate-900">{item.label}</span><span className="text-xs font-semibold text-slate-700">{item.value.toLocaleString()}</span></div>
                          <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} /></div>
                          <p className="text-[10px] text-slate-500 italic mt-1">{item.description}</p>
                        </div>
                      ))}
                    </div>
                    {/* Moderation Stats below (compact) */}
                    <div className="border-t border-slate-100 pt-3 mt-3">
                      <p className="text-[10px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Moderation Status</p>
                      {communityGenericData.progressB.items.map((item, i) => (
                        <div key={i} className="mb-2.5">
                          <div className="flex justify-between mb-1"><span className="text-xs font-bold text-slate-900">{item.label}</span><span className="text-xs font-semibold text-slate-700">{item.value.toLocaleString()}</span></div>
                          <div className={`w-full h-2.5 ${item.label === 'Active' ? 'bg-green-100' : item.label === 'Disabled' ? 'bg-amber-100' : 'bg-red-100'} rounded-full overflow-hidden`}>
                            <div className={`h-full ${item.label === 'Active' ? 'bg-green-500' : item.label === 'Disabled' ? 'bg-amber-500' : 'bg-red-500'} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar Heatmap */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4 relative">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-slate-900 font-bold">📅 Post Calendar</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Daily new posts heatmap</p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <select value={communityHeatMapYear} onChange={(e) => setCommunityHeatMapYear(Number(e.target.value))}
                        className="px-2 py-1 border border-rose-300 shadow-sm bg-white text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded">
                        {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={communityHeatMapMonth} onChange={(e) => setCommunityHeatMapMonth(Number(e.target.value))}
                        className="px-2 py-1 border border-rose-300 shadow-sm bg-white text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded">
                        {[{ val: 1, name: 'Jan' }, { val: 2, name: 'Feb' }, { val: 3, name: 'Mar' }, { val: 4, name: 'Apr' }, { val: 5, name: 'May' },
                          { val: 6, name: 'Jun' }, { val: 7, name: 'Jul' }, { val: 8, name: 'Aug' }, { val: 9, name: 'Sep' }, { val: 10, name: 'Oct' },
                          { val: 11, name: 'Nov' }, { val: 12, name: 'Dec' }].map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                      </select>
                      <div className="text-[10px] text-slate-500 ml-auto">{communityCalendar ? `0 — ${communityCalendar.max_count} posts` : '0 — 0'}</div>
                    </div>
                    {communityCalendarLoading ? (
                      <div className="h-32 flex items-center justify-center text-sm text-slate-500">Loading...</div>
                    ) : communityCalendar && communityCalendar.weeks ? (
                      <div className="space-y-1">
                        <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-center">{d}</div>)}
                        </div>
                        {communityCalendar.weeks.map((week, weekIdx) => (
                          <div key={weekIdx} className="grid grid-cols-7 gap-1">
                            {week.map((day, dayIdx) => {
                              const maxCount = communityCalendar.max_count || 1
                              const intensity = day.day !== null && day.count > 0 ? Math.min(day.count / maxCount, 1) : 0
                              return (
                                <Tooltip key={dayIdx} label={day.day !== null ? `${communityCalendar.month_name} ${day.day}: ${day.count} post${day.count !== 1 ? 's' : ''}` : ''} disabled={day.day === null} position="top" withArrow>
                                  <div
                                    className={`h-7 border border-slate-200 flex items-center justify-center text-[9px] font-medium rounded-sm cursor-default transition-transform hover:scale-110 ${
                                      day.day === null ? 'bg-slate-50' :
                                      intensity > 0.7 ? 'bg-rose-600 text-white' :
                                      intensity > 0.4 ? 'bg-rose-400 text-white' :
                                      intensity > 0 ? 'bg-rose-200 text-rose-900' :
                                      'bg-rose-50 text-slate-400'
                                    }`}
                                  >
                                    {day.day !== null ? (day.count || '') : ''}
                                  </div>
                                </Tooltip>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ) : <div className="h-32 flex items-center justify-center text-sm text-slate-500">No data</div>}

                    {/* Calendar statistics */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{communityCalendarStats.total}</p>
                        <p className="text-[10px] text-slate-500">Total Posts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{communityCalendarStats.max}</p>
                        <p className="text-[10px] text-slate-500">Peak Day</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{communityCalendarStats.avg}</p>
                        <p className="text-[10px] text-slate-500">Avg / Active Day</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{communityCalendarStats.activeDays}</p>
                        <p className="text-[10px] text-slate-500">Active Days</p>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Donut */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">🍩 Engagement Type</p>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Likes vs Comments</p>
                    <div className="flex flex-col items-center">
                      <StraightAnglePie slices={communityGenericData.donut.slices} />
                      <div className="mt-4 w-full space-y-2">
                        {communityGenericData.donut.slices.map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-xs text-slate-700 flex-1">{s.label}</span>
                            <span className="text-xs font-semibold text-slate-900">{s.value}%</span>
                            {communityData && (
                              <span className="text-[10px] text-slate-400">
                                ({(s.label === 'Likes' ? communityData.engagement_donut.likes : communityData.engagement_donut.comments).toLocaleString()})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {communityData && (
                        <div className="mt-3 pt-2 border-t border-slate-100 w-full text-center">
                          <p className="text-xs text-slate-500">Total: <span className="font-semibold text-slate-800">{(communityData.engagement_donut.likes + communityData.engagement_donut.comments).toLocaleString()}</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* ROW 4: Table */}
                <div className="relative pt-2 border-t border-slate-200/70">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-semibold shadow-sm">4 Records</div>
                  <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div><p className="text-xs text-slate-900 font-bold">📋 Top Community Posts</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Ranked by likes</p></div>
                    <TextInput placeholder="Search posts..." size="xs" radius="md" value={communityTableSearch}
                      onChange={e => setCommunityTableSearch(e.currentTarget.value)}
                      leftSection={<Search className="w-3.5 h-3.5 text-slate-400" />} classNames={{ input: SECTION_SEARCH_FOCUS.community }} className="w-64" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>{communityGenericData.table.headers.map((h, i) => <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200 last:border-r-0">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {communityFilteredRows.length === 0 ? (
                          <tr><td colSpan={communityGenericData.table.headers.length} className="text-center py-8 text-slate-400 text-sm">No posts found</td></tr>
                        ) : communityFilteredRows.map(row => (
                          <tr key={row.id} className="border-b border-slate-200 hover:bg-rose-50/30 transition-colors">
                            {row.cols.map((cell, ci) => (
                              <td key={ci} className={`px-4 py-3 border-r border-slate-100 last:border-r-0 ${ci === 0 ? 'font-medium text-sm text-slate-800' : ci === 2 ? 'text-sm' : 'text-sm text-slate-600'}`}>
                                {ci === 2 ? <Badge size="sm" variant="light" color="rose">{cell}</Badge> : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400">No community data available</div>
            )}
            </div>
          </div>
        )}

        {/* ══════════════════ ACTIVITIES SECTION ══════════════════ */}
        {activeSection === 'activities' && (
          <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
            <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-cyan-500/50 via-cyan-300/40 to-cyan-500/50" />
            <div className="pl-8 pr-3 py-3 space-y-4">
            {activitiesLoading ? (
              <div className="bg-white/70 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-300 rounded-xl p-4 min-h-[130px] animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-24 mb-3" /><div className="h-7 bg-slate-200 rounded w-20 mb-2" /><div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                ))}
              </div>
            ) : activitiesGenericData ? (
              <>
                {/* ROW 1: KPIs */}
                <div className="relative">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-cyan-600 text-white text-[10px] font-semibold shadow-sm">1 KPI</div>
                  <div className="bg-white/80 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {activitiesGenericData.kpis.map((kpi, i) => {
                    const Icon = kpi.icon
                    return <KpiCard key={i} icon={<Icon className={`w-5 h-5 ${kpi.iconColor}`} />} iconBg={kpi.iconBg}
                      title={kpi.label} value={kpi.value} badge={<DynamicPercentageBadge value={kpi.change} size="xs" />} badgeLabel="vs last period" description={kpi.subtitle} />
                  })}
                  </div>
                </div>

                {/* ROW 2: Bar Chart with filters */}
                <div className="relative pt-2 border-t border-slate-200/70">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-cyan-600 text-white text-[10px] font-semibold shadow-sm">2 Trend</div>
                  <div className="bg-white border border-slate-300 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-900 font-bold">📈 Platform Activity</p>
                      <p className="text-xs text-slate-500 mt-1">{activitiesGranularity === 'week' ? 'Daily events & errors (last 7 days)' : activitiesGranularity === 'month' ? 'Monthly trend (this year)' : 'Yearly trend (last 5 years)'}</p>
                    </div>
                    <Group gap="xs">
                      <select value={activitiesCategoryFilter} onChange={e => setActivitiesCategoryFilter(e.target.value)}
                        className="px-2 py-1 border border-slate-300 bg-white text-xs rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                        <option value="all">All Categories</option>
                        {activitiesData && Object.keys(activitiesData.category_breakdown).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Button variant="default" size="xs" onClick={handleActivitiesToggleGranularity} className="text-xs font-medium min-w-[62px]">
                        {activitiesGranularity === 'week' ? 'Week' : activitiesGranularity === 'month' ? 'Month' : 'Year'}
                      </Button>
                      <DatePickerInput type="range" placeholder="Date range" value={activitiesDateRange} onChange={handleActivitiesDateRangeChange}
                        leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()}
                        styles={{ input: { border: '1px solid rgb(203 213 225)', borderRadius: '0.5rem', fontSize: '0.875rem' } }} />
                      <ActionIcon variant="default" onClick={() => setExpandedActivitiesChart(true)}><Maximize2 className="w-4 h-4" /></ActionIcon>
                    </Group>
                  </div>
                  {activitiesChartLoading ? (
                    <div className="h-64 flex items-center justify-center"><span className="text-slate-500">Loading chart...</span></div>
                  ) : (
                    <AdminStackedAreaChart data={activitiesChartData} xKey="period"
                      areas={[
                        { key: 'Events', color: '#06b6d4' },
                        { key: 'Errors', color: '#ef4444' },
                      ]}
                      height={256} />
                  )}
                  </div>
                </div>

                {/* Expanded chart modal */}
                <Modal opened={expandedActivitiesChart} onClose={() => setExpandedActivitiesChart(false)} size="90%" title={<span className="font-bold text-lg">Platform Activity — Expanded</span>} centered>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <select value={activitiesCategoryFilter} onChange={e => setActivitiesCategoryFilter(e.target.value)}
                        className="px-2 py-1 border border-slate-300 bg-white text-xs rounded">
                        <option value="all">All Categories</option>
                        {activitiesData && Object.keys(activitiesData.category_breakdown).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Button variant="default" size="xs" onClick={handleActivitiesToggleGranularity}>{activitiesGranularity === 'week' ? 'Week' : activitiesGranularity === 'month' ? 'Month' : 'Year'}</Button>
                      <DatePickerInput type="range" placeholder="Date range" value={activitiesDateRange} onChange={handleActivitiesDateRangeChange}
                        leftSection={<Calendar className="w-4 h-4" />} size="xs" clearable maxDate={new Date()} />
                    </div>
                    <AdminStackedAreaChart data={activitiesChartData} xKey="period"
                      areas={[
                        { key: 'Events', color: '#06b6d4' },
                        { key: 'Errors', color: '#ef4444' },
                      ]}
                      height={500} />
                  </div>
                </Modal>

                {/* ROW 3: Event Categories + Calendar Heatmap + Actor Roles Donut */}
                <div className="relative pt-2 border-t border-slate-200/70">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-cyan-600 text-white text-[10px] font-semibold shadow-sm">3 Breakdown</div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Event Categories (progress bars) */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">📊 Event Categories</p>
                    <p className="text-[10px] text-slate-500 mb-4 italic">Activity type breakdown</p>
                    <div className="space-y-4">
                      {activitiesGenericData.progressA.items.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1"><span className="text-xs font-bold text-slate-900">{item.label}</span><span className="text-xs font-semibold text-slate-700">{item.value.toLocaleString()}</span></div>
                          <div className="w-full h-2.5 bg-cyan-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} /></div>
                          <p className="text-[10px] text-slate-500 italic mt-1">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar Heatmap */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4 relative">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-slate-900 font-bold">📅 Activity Calendar</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Daily events heatmap</p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <select value={activitiesHeatMapYear} onChange={(e) => setActivitiesHeatMapYear(Number(e.target.value))}
                        className="px-2 py-1 border border-cyan-300 shadow-sm bg-white text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded">
                        {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={activitiesHeatMapMonth} onChange={(e) => setActivitiesHeatMapMonth(Number(e.target.value))}
                        className="px-2 py-1 border border-cyan-300 shadow-sm bg-white text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded">
                        {[{ val: 1, name: 'Jan' }, { val: 2, name: 'Feb' }, { val: 3, name: 'Mar' }, { val: 4, name: 'Apr' }, { val: 5, name: 'May' },
                          { val: 6, name: 'Jun' }, { val: 7, name: 'Jul' }, { val: 8, name: 'Aug' }, { val: 9, name: 'Sep' }, { val: 10, name: 'Oct' },
                          { val: 11, name: 'Nov' }, { val: 12, name: 'Dec' }].map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                      </select>
                      <div className="text-[10px] text-slate-500 ml-auto">{activitiesCalendar ? `0 — ${activitiesCalendar.max_count} events` : '0 — 0'}</div>
                    </div>
                    {activitiesCalendarLoading ? (
                      <div className="h-32 flex items-center justify-center text-sm text-slate-500">Loading...</div>
                    ) : activitiesCalendar && activitiesCalendar.weeks ? (
                      <div className="space-y-1">
                        <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-center">{d}</div>)}
                        </div>
                        {activitiesCalendar.weeks.map((week, weekIdx) => (
                          <div key={weekIdx} className="grid grid-cols-7 gap-1">
                            {week.map((day, dayIdx) => {
                              const maxCount = activitiesCalendar.max_count || 1
                              const intensity = day.day !== null && day.count > 0 ? Math.min(day.count / maxCount, 1) : 0
                              return (
                                <Tooltip key={dayIdx} label={day.day !== null ? `${activitiesCalendar.month_name} ${day.day}: ${day.count} event${day.count !== 1 ? 's' : ''}` : ''} disabled={day.day === null} position="top" withArrow>
                                  <div
                                    className={`h-7 border border-slate-200 flex items-center justify-center text-[9px] font-medium rounded-sm cursor-default transition-transform hover:scale-110 ${
                                      day.day === null ? 'bg-slate-50' :
                                      intensity > 0.7 ? 'bg-cyan-600 text-white' :
                                      intensity > 0.4 ? 'bg-cyan-400 text-white' :
                                      intensity > 0 ? 'bg-cyan-200 text-cyan-900' :
                                      'bg-cyan-50 text-slate-400'
                                    }`}
                                  >
                                    {day.day !== null ? (day.count || '') : ''}
                                  </div>
                                </Tooltip>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ) : <div className="h-32 flex items-center justify-center text-sm text-slate-500">No data</div>}

                    {/* Calendar statistics */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{activitiesCalendarStats.total}</p>
                        <p className="text-[10px] text-slate-500">Total Events</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{activitiesCalendarStats.max}</p>
                        <p className="text-[10px] text-slate-500">Peak Day</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{activitiesCalendarStats.avg}</p>
                        <p className="text-[10px] text-slate-500">Avg / Active Day</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">{activitiesCalendarStats.activeDays}</p>
                        <p className="text-[10px] text-slate-500">Active Days</p>
                      </div>
                    </div>
                  </div>

                  {/* Actor Roles Donut */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">🍩 Actor Roles</p>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Events by actor role</p>
                    <div className="flex flex-col items-center">
                      <StraightAnglePie slices={activitiesGenericData.donut.slices} />
                      <div className="mt-4 w-full space-y-2">
                        {activitiesGenericData.donut.slices.map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-xs text-slate-700 flex-1">{s.label}</span>
                            <span className="text-xs font-semibold text-slate-900">{s.value}%</span>
                            {activitiesData && (
                              <span className="text-[10px] text-slate-400">
                                ({(activitiesData.role_breakdown[s.label.toLowerCase()] || 0).toLocaleString()})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {activitiesData && (
                        <div className="mt-3 pt-2 border-t border-slate-100 w-full text-center">
                          <p className="text-xs text-slate-500">Total: <span className="font-semibold text-slate-800">{Object.values(activitiesData.role_breakdown).reduce((s, v) => s + v, 0).toLocaleString()}</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* ROW 4: Table */}
                <div className="relative pt-2 border-t border-slate-200/70">
                  <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-cyan-600 text-white text-[10px] font-semibold shadow-sm">4 Records</div>
                  <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div><p className="text-xs text-slate-900 font-bold">📋 Recent Activity Log</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Last 15 events</p></div>
                    <TextInput placeholder="Search activities..." size="xs" radius="md" value={activitiesTableSearch}
                      onChange={e => setActivitiesTableSearch(e.currentTarget.value)}
                      leftSection={<Search className="w-3.5 h-3.5 text-slate-400" />} classNames={{ input: SECTION_SEARCH_FOCUS.activities }} className="w-64" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>{activitiesGenericData.table.headers.map((h, i) => <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200 last:border-r-0">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {activitiesFilteredRows.length === 0 ? (
                          <tr><td colSpan={activitiesGenericData.table.headers.length} className="text-center py-8 text-slate-400 text-sm">No activity events found</td></tr>
                        ) : activitiesFilteredRows.map(row => (
                          <tr key={row.id} className="border-b border-slate-200 hover:bg-cyan-50/30 transition-colors">
                            {row.cols.map((cell, ci) => (
                              <td key={ci} className={`px-4 py-3 border-r border-slate-100 last:border-r-0 ${ci === 0 ? 'font-medium text-sm text-slate-800' : 'text-sm text-slate-600'}`}>
                                {activitiesGenericData.table.headers[ci] === 'Status' ? (
                                  <Badge size="sm" variant="light" color={cell === 'success' ? 'green' : cell === 'warning' ? 'yellow' : cell === 'error' ? 'red' : 'gray'}>{cell}</Badge>
                                ) : ci === 0 ? <Badge size="sm" variant="light" color="cyan">{cell}</Badge> : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400">No activity data available</div>
            )}
            </div>
          </div>
        )}

        {/* ══════════════════ SCANS SECTION ══════════════════ */}
        {activeSection === 'scans' && (
          <AdminScansSection searchValue={genericSearch} />
        )}

      </div>
    </div>
  )
}
