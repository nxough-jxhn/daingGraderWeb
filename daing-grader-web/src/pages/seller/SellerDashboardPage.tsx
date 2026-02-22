import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingCart, Star, X, Phone, User, Info, Filter, Search, ChevronLeft, ChevronRight, Maximize2, Calendar, Download } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import PageTitleHero from '../../components/layout/PageTitleHero'
import { Modal, TextInput, Textarea, Button, Group, Paper, Avatar, Badge, ActionIcon, Menu, ScrollArea, Text, Flex, Popover, Checkbox, RangeSlider } from '@mantine/core'
import { DatePickerInput, DatesRangeValue } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import {
  getSellerKPIs,
  getSellerRecentOrders,
  getSellerSalesCategories,
  getSellerSalesOverview,
  getSellerRecentReviews,
  getSellerStoreDetails,
  getOrderById,
  downloadOrderReceipt,
  createCategory,
  type SellerKPIs,
  type RecentOrder,
  type SalesCategory,
  type SellerReview,
  type OrderDetail,
  type SellerStoreDetails
} from '../../services/api'
import { censorBadWords, validateCategoryName } from '../../utils/validation'
import { DynamicPercentageBadge } from '../../components/ui/DynamicPercentageBadge'
import ReportPanel from '../../components/seller/ReportPanel'

export default function SellerDashboardPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()
  
  // State
  const [kpis, setKpis] = useState<SellerKPIs | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [salesCategories, setSalesCategories] = useState<SalesCategory[]>([])
  const [salesData, setSalesData] = useState<{ period: string; amount: number }[]>([])
  const [recentReviews, setRecentReviews] = useState<SellerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(false)
  const [viewDetailsOrder, setViewDetailsOrder] = useState<OrderDetail | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [expandedChart, setExpandedChart] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [dateRange, setDateRange] = useState<DatesRangeValue>([null, null])
  const [granularity, setGranularity] = useState<'week' | 'month' | 'year'>('week')
  const [comparisonMode, setComparisonMode] = useState(false)
  const [dateRange1, setDateRange1] = useState<DatesRangeValue>([null, null])
  const [dateRange2, setDateRange2] = useState<DatesRangeValue>([null, null])
  const [filterPopoverOpened, setFilterPopoverOpened] = useState(false)
  const [tableFilters, setTableFilters] = useState({
    priceMin: 0,
    priceMax: 100000,
    categories: [] as string[],
    dateRange: [null, null] as DatesRangeValue
  })
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])

  // Modal comparison KPIs
  const [compKpi1, setCompKpi1] = useState<{ total: number; orders: number } | null>(null)
  const [compKpi2, setCompKpi2] = useState<{ total: number; orders: number } | null>(null)
  const [compKpiLoading1, setCompKpiLoading1] = useState(false)
  const [compKpiLoading2, setCompKpiLoading2] = useState(false)
  // Comparison chart-specific data (fetched per range, not filtered from salesData)
  const [compChartData1, setCompChartData1] = useState<{ period: string; amount: number }[]>([])
  const [compChartData2, setCompChartData2] = useState<{ period: string; amount: number }[]>([])

  // Store details for Row 3
  const [storeDetails, setStoreDetails] = useState<SellerStoreDetails | null>(null)
  // Category donut selection
  const [selectedCategoryView, setSelectedCategoryView] = useState<'all' | string>('all')
  // Report panel
  const [reportPanelOpen, setReportPanelOpen] = useState(false)

  // Load sales chart data based on current granularity / date range
  const loadSalesData = async (
    gran: 'week' | 'month' | 'year',
    range: DatesRangeValue
  ) => {
    setSalesLoading(true)
    try {
      let salesRes
      if (range[0] && range[1]) {
        // Custom date range — daily buckets
        const fmt = (d: string | Date) => (d instanceof Date ? d : new Date(d)).toISOString().split('T')[0]
        salesRes = await getSellerSalesOverview({
          granularity: 'daily',
          start_date: fmt(range[0]),
          end_date: fmt(range[1]),
        })
      } else if (gran === 'week') {
        salesRes = await getSellerSalesOverview({ granularity: 'daily', days: 7 })
      } else if (gran === 'month') {
        salesRes = await getSellerSalesOverview({ granularity: 'monthly' })
      } else {
        salesRes = await getSellerSalesOverview({ granularity: 'yearly', count: 10 })
      }
      setSalesData(salesRes.data)
    } catch {
      // silently fail — keep old data
    } finally {
      setSalesLoading(false)
    }
  }

  const handleToggleGranularity = () => {
    const next = granularity === 'week' ? 'month' : granularity === 'month' ? 'year' : 'week'
    setGranularity(next)
    setDateRange([null, null]) // clear custom range when toggling
  }

  const handleDateRangeChange = (val: DatesRangeValue) => {
    setDateRange(val)
    if (val[0] && val[1]) {
      loadSalesData(granularity, val)
    } else if (!val[0] && !val[1]) {
      loadSalesData(granularity, [null, null])
    }
  }

  // Re-fetch sales whenever granularity changes (but not when dateRange active)
  useEffect(() => {
    if (!dateRange[0] && !dateRange[1]) {
      loadSalesData(granularity, [null, null])
    }
  }, [granularity])

  const filteredSalesData = salesData
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: ''})
  const [categoryFormErrors, setCategoryFormErrors] = useState<{ name?: string; description?: string }>({})
  const [saving, setSaving] = useState(false)

  // Handlers for order action buttons
  const handleViewDetails = async (orderId: string) => {
    setViewDetailsLoading(true)
    setViewDetailsOpen(true)
    try {
      const res = await getOrderById(orderId)
      setViewDetailsOrder(res.order)
    } catch (e) {
      showToast('Failed to load order details')
      setViewDetailsOpen(false)
    } finally {
      setViewDetailsLoading(false)
    }
  }

  const handleDownloadReceipt = async (orderId: string) => {
    setDownloadingId(orderId)
    try {
      const { blob, filename } = await downloadOrderReceipt(orderId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      showToast('Failed to download receipt')
    } finally {
      setDownloadingId(null)
    }
  }

  // Load Data
  const loadDashboardData = async () => {
    setLoading(true)
    setSalesLoading(true)
    try {
      const [kpisRes, ordersRes, categoriesRes, salesRes, reviewsRes, storeRes] = await Promise.all([
        getSellerKPIs(),
        getSellerRecentOrders(100),
        getSellerSalesCategories(),
        getSellerSalesOverview({ granularity: 'daily', days: 7 }),
        getSellerRecentReviews(5),
        getSellerStoreDetails(),
      ])
      
      setKpis(kpisRes.kpis)
      setRecentOrders(ordersRes.orders)
      setSalesCategories(categoriesRes.categories)
      setSalesData(salesRes.data)
      setRecentReviews(reviewsRes.reviews)
      setStoreDetails(storeRes)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      showToast('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setSalesLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Category Modal Handlers
  const validateCategoryForm = () => {
    const errors: { name?: string; description?: string } = {}
    const nameValidation = validateCategoryName(categoryForm.name.trim())
    if (!nameValidation.valid) {
      errors.name = nameValidation.error
    }
    if (!categoryForm.description.trim()) {
      errors.description = 'Description is required'
    }
    setCategoryFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddCategory = () => {
    setCategoryForm({ name: '', description: '' })
    setCategoryFormErrors({})
    setCategoryModalOpen(true)
  }

  const saveCategory = async () => {
    if (!validateCategoryForm()) {
      showToast('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      const cleanName = censorBadWords(categoryForm.name.trim())
      const cleanDescription = censorBadWords(categoryForm.description.trim())
      
      await createCategory({ name: cleanName, description: cleanDescription })
      
      setCategoryModalOpen(false)
      setCategoryForm({ name: '', description: '' })
      setCategoryFormErrors({})
      notifications.show({
        title: 'Success',
        message: 'Category created successfully',
        color: 'green',
      })
      await loadDashboardData()
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create category',
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  // Fetch KPIs + chart data for a comparison period date range
  const loadCompData = async (
    range: DatesRangeValue,
    setKpi: (v: { total: number; orders: number } | null) => void,
    setLoading: (v: boolean) => void,
    setChartData: (v: { period: string; amount: number }[]) => void
  ) => {
    if (!range[0] || !range[1]) { setKpi(null); setChartData([]); return }
    setLoading(true)
    try {
      const fmt = (d: string | Date) => (d instanceof Date ? d : new Date(d)).toISOString().split('T')[0]
      const res = await getSellerSalesOverview({ granularity: 'daily', start_date: fmt(range[0]), end_date: fmt(range[1]) })
      const total = res.data.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0)
      const orders = res.total_orders ?? 0
      setKpi({ total, orders })
      setChartData(res.data)
    } catch { setKpi(null); setChartData([]) } finally { setLoading(false) }
  }

  // Calculate chart metrics from filtered data
  const totalSales = filteredSalesData.reduce((sum, d) => sum + d.amount, 0)
  const avgSales = filteredSalesData.length > 0 ? totalSales / filteredSalesData.length : 0

  // Filtered orders for table (applying tableFilters)
  const filteredOrders = useMemo(() => {
    return recentOrders.filter(order => {
      const total = order.total
      if (total < tableFilters.priceMin || total > tableFilters.priceMax) return false
      if (tableFilters.dateRange[0] && tableFilters.dateRange[1]) {
        const orderDate = new Date(order.created_at)
        const start = new Date(tableFilters.dateRange[0])
        const end = new Date(tableFilters.dateRange[1])
        end.setHours(23, 59, 59, 999)
        if (orderDate < start || orderDate > end) return false
      }
      return true
    })
  }, [recentOrders, tableFilters])

  // TanStack Table Setup
  const columnHelper = createColumnHelper<RecentOrder>()

  const columns = useMemo(
    () => [
      columnHelper.accessor('order_number', {
        header: 'Order ID',
        cell: info => (
          <span className="font-mono text-xs">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer Name',
        cell: info => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Date',
        cell: info => (
          <span className="text-xs text-slate-600">
            {new Date(info.getValue()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Badge
            color={
              info.getValue() === 'delivered' || info.getValue() === 'confirmed'
                ? 'green'
                : info.getValue() === 'pending'
                ? 'yellow'
                : info.getValue() === 'shipped'
                ? 'blue'
                : 'red'
            }
            variant="light"
            size="sm"
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('total', {
        header: 'Total',
        cell: info => (
          <span className="font-semibold">₱{info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" disabled={downloadingId === row.original.id}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => handleViewDetails(row.original.id)}>View Details</Menu.Item>
              <Menu.Item onClick={() => handleDownloadReceipt(row.original.id)} disabled={downloadingId === row.original.id}>
                {downloadingId === row.original.id ? 'Downloading...' : 'Download Receipt'}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: filteredOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="px-6 pb-8 pt-0 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800">Seller Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your store, track sales, and grow your business</p>
          </div>
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-3 animate-pulse text-blue-400" />
              <p>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="seller-dashboard min-h-screen bg-[var(--bg)]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div className="px-6 pb-8 pt-0 max-w-[1400px] mx-auto">
        {/* Page Hero */}
        <PageTitleHero
          title="Seller Dashboard"
          description="Manage your store, track sales, and grow your business"
          breadcrumb="Seller Dashboard"
        />

        {/* Nav bar: search + download */}
        <div className="relative z-20 overflow-visible mb-6 bg-white/75 border border-slate-200 rounded-xl p-3 shadow-sm backdrop-blur-[2px]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-slate-900">Seller Analytics</h2>
              <p className="text-xs text-slate-600 italic mt-0.5">Overview of your store, sales, and order performance</p>
            </div>
            <div className="flex items-center gap-2">
              <TextInput
                placeholder="Search transactions..."
                size="xs"
                radius="md"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.currentTarget.value)}
                leftSection={<Search className="w-4 h-4 text-slate-400" />}
                className="w-56"
              />
              <div className="relative">
                <button
                  onClick={() => setReportPanelOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 border border-slate-300 bg-white transition-all duration-300 hover:border-slate-400 hover:shadow-sm active:scale-[0.98]"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(15,23,42,.06)' }}
                >
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
                <ReportPanel
                  open={reportPanelOpen}
                  onClose={() => setReportPanelOpen(false)}
                  orders={recentOrders}
                  salesCategories={salesCategories}
                  kpis={kpis}
                  salesData={salesData}
                  sellerName={user?.name ?? user?.email ?? 'Your Store'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
          <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-500/50 via-emerald-300/40 to-emerald-500/50" />
          <div className="pl-8 pr-3 py-3 space-y-4">
          {/* ROW 1: KPIs + My Categories + Profile */}
          <div className="relative pt-2 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-green-600 text-white text-[10px] font-semibold shadow-sm">1 KPI</div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 4 KPIs - Takes 6 columns */}
          <div className="lg:col-span-6 h-full">
            <div className="grid grid-cols-2 gap-3 h-full">
              {/* KPI 1: Total Products */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-900 font-bold">📦 Total Products</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{kpis?.total_products ?? 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <DynamicPercentageBadge value={kpis?.products_change ?? 0} size="xs" />
                      <span className="text-[10px] text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Package className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-700 italic mt-3 border-t border-slate-100 pt-2">Total active products listed in your store</p>
              </div>

              {/* KPI 2: Total Sales/Earnings */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-900 font-bold">💰 Total Sales/Earnings</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      ₱{(kpis?.total_earnings ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <DynamicPercentageBadge value={kpis?.earnings_change ?? 0} size="xs" />
                      <span className="text-[10px] text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-green-600 font-bold text-base leading-none">₱</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-700 italic mt-3 border-t border-slate-100 pt-2">Cumulative revenue earned from all completed orders</p>
              </div>

              {/* KPI 3: Total Orders */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-900 font-bold">🛒 Total Orders</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{kpis?.total_orders ?? 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <DynamicPercentageBadge value={kpis?.orders_change ?? 0} size="xs" />
                      <span className="text-[10px] text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-700 italic mt-3 border-t border-slate-100 pt-2">Total number of orders placed across your products</p>
              </div>

              {/* KPI 4: Average Rating */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-900 font-bold">⭐ Average Rating</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{(kpis?.average_rating ?? 0).toFixed(1)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <DynamicPercentageBadge value={kpis?.rating_change ?? 0} size="xs" />
                      <span className="text-[10px] text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-700 italic mt-3 border-t border-slate-100 pt-2">Average star rating from customer product reviews</p>
              </div>
            </div>
          </div>

          {/* My Categories - Takes 3 columns */}
          <div className="lg:col-span-3 h-full">
            <Paper shadow="sm" p="md" radius="lg" className="h-full border border-slate-300 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <Text fw={700} size="sm">My Categories</Text>
                <ActionIcon variant="subtle" color="gray">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </ActionIcon>
              </div>
              <ScrollArea h={140} className="flex-1">
                <div className="space-y-2">
                  {salesCategories.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">No categories yet</div>
                  ) : (
                    salesCategories.slice(0, 5).map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-slate-600" />
                          </div>
                          <div>
                            <Text size="xs" fw={600}>{category.category}</Text>
                            <Text size="10px" c="dimmed">{category.sold} sold ({category.percentage}%)</Text>
                          </div>
                        </div>
                        <Badge size="xs" color="green" variant="dot">Active</Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="mt-auto pt-3">
                <button
                  onClick={handleAddCategory}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    boxShadow: '0 2px 8px 0 rgba(99,102,241,0.30)',
                  }}
                >
                  <span className="text-sm font-bold leading-none">+</span>
                  Add New Category
                </button>
              </div>
            </Paper>
          </div>

          {/* Mini Profile - Takes 3 columns */}
          <div className="lg:col-span-3 h-full">
            <Paper shadow="sm" p="md" radius="lg" className="h-full border border-slate-300">
              <div className="flex flex-col items-center text-center h-full">
                <ActionIcon variant="subtle" color="gray" className="self-end -mt-2 -mr-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </ActionIcon>
                <Avatar size={120} src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`} className="mb-3" />
                <Text size="lg" fw={700} className="text-slate-800">{user?.name || 'Seller'}</Text>
                <Text size="sm" c="dimmed" className="mb-4">{user?.email || 'seller@example.com'}</Text>
                <div className="mt-auto w-full flex flex-row gap-6 justify-center items-end">
                  <div className="flex flex-col items-center">
                    <ActionIcon variant="default" size="lg" radius="xl" className="w-12 h-12" onClick={() => navigate('/profile')}>
                      <Phone className="w-5 h-5" />
                    </ActionIcon>
                    <Text size="xs" c="dimmed" className="mt-1">Contact</Text>
                  </div>
                  <div className="flex flex-col items-center">
                    <ActionIcon variant="default" size="lg" radius="xl" className="w-12 h-12" onClick={() => navigate('/profile')}>
                      <User className="w-5 h-5" />
                    </ActionIcon>
                    <Text size="xs" c="dimmed" className="mt-1">Profile</Text>
                  </div>
                  <div className="flex flex-col items-center">
                    <ActionIcon variant="default" size="lg" radius="xl" className="w-12 h-12" onClick={() => navigate('/profile')}>
                      <Info className="w-5 h-5" />
                    </ActionIcon>
                    <Text size="xs" c="dimmed" className="mt-1">Info</Text>
                  </div>
                </div>
              </div>
            </Paper>
          </div>

          </div>{/* end ROW 1 inner grid */}
          </div>{/* end ROW 1 relative */}

          {/* ROW 2: Chart + Current Reviews */}
          <div className="relative pt-4 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-green-600 text-white text-[10px] font-semibold shadow-sm">2 Chart</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-300 rounded-xl p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-base text-slate-900 mb-3">My Sales/Earnings</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg per {granularity === 'week' ? 'day' : granularity === 'month' ? 'month' : 'year'}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-2xl font-bold text-slate-900">
                      ₱{avgSales.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    <DynamicPercentageBadge value={kpis?.earnings_change ?? 0} size="xs" />
                  </div>
                </div>
                <Group gap="xs">
                  <Button 
                    variant="default" 
                    size="xs"
                    onClick={handleToggleGranularity}
                    className="text-xs font-medium min-w-[62px]"
                  >
                    {granularity === 'week' ? 'Week' : granularity === 'month' ? 'Month' : 'Year'}
                  </Button>
                  <DatePickerInput
                    type="range"
                    placeholder="Date range"
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    leftSection={<Calendar className="w-4 h-4" />}
                    size="xs"
                    clearable
                    maxDate={new Date()}
                    styles={{
                      input: {
                        border: '1px solid rgb(203 213 225)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                  <ActionIcon variant="default" onClick={() => setExpandedChart(true)}>
                    <Maximize2 className="w-4 h-4" />
                  </ActionIcon>
                </Group>
              </div>

              {salesLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <span className="text-slate-500">Loading chart...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={192}>
                  <AreaChart data={filteredSalesData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sellerSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.18} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={68} />
                    <RechTooltip
                      formatter={(val: any) => [`₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`, 'Revenue']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '6px 12px' }}
                      cursor={{ stroke: 'rgba(100,116,139,0.15)', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#sellerSalesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

          <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-xs text-slate-700 font-medium">
                    Revenue — ₱{totalSales.toLocaleString('en-PH', { maximumFractionDigits: 2 })} · {
                      dateRange[0] && dateRange[1]
                        ? `Custom range`
                        : granularity === 'week'
                        ? 'Last 7 days'
                        : granularity === 'month'
                        ? 'Monthly (this year)'
                        : 'Last 10 years'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Reviews - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-300 rounded-xl p-4">
              <div className="flex items-start justify-between mb-4">
                <p className="font-bold text-base text-slate-900">Current Reviews</p>
                <ActionIcon variant="subtle" color="gray">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </ActionIcon>
              </div>
              {recentReviews.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No reviews yet</div>
              ) : (
                <div className="space-y-3">
                  {recentReviews.map((review) => (
                    <Paper key={review.id} p="sm" radius="lg" className="border border-slate-300">
                      <div className="flex gap-3 items-start">
                        <Avatar
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(review.user_name)}`}
                          size="md"
                          radius="xl"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <Text size="sm" fw={700}>{review.user_name}</Text>
                              <Text size="xs" c="dimmed" className="truncate max-w-[120px]">{review.product_name}</Text>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-slate-200 text-slate-200'
                                }`}
                              />
                            ))}
                            <Text size="xs" c="dimmed">({review.rating}/5)</Text>
                          </div>
                          {review.comment && (
                            <Text size="xs" c="dimmed" lineClamp={2} className="mt-1 italic">"{review.comment}"</Text>
                          )}
                        </div>
                      </div>
                    </Paper>
                  ))}
                </div>
              )}
            </div>
          </div>

          </div>{/* end ROW 2 inner grid */}
          </div>{/* end ROW 2 relative */}

          {/* ROW 3: Store Details + Order Details + Sales by Category */}
          <div className="relative pt-4 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-green-600 text-white text-[10px] font-semibold shadow-sm">3 Store</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Section 1: Store Details progress bars */}
          <div className="bg-white border border-slate-300 rounded-xl p-4">
            <p className="font-bold text-base text-slate-900 mb-1">Store Details</p>
            <p className="text-xs text-slate-500 mb-4 italic">Overview of your store inventory and reputation</p>
            <div className="space-y-5">
              {/* All-over Stocks */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Available Stocks</span>
                  <span className="text-xs font-semibold text-slate-700">{storeDetails?.store.total_stock ?? 0}</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, storeDetails ? (storeDetails.store.total_stock / storeDetails.store.max_stock_reference) * 100 : 0)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">Total units available across all active products</p>
              </div>

              {/* Overall Rating */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Overall Rating</span>
                  <span className="text-xs font-semibold text-slate-700">{storeDetails?.store.overall_rating.toFixed(1) ?? '0.0'} / 5.0</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${storeDetails ? (storeDetails.store.overall_rating / 5) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">Average star rating across all your products</p>
              </div>

              {/* Total Reviews */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Total Reviews</span>
                  <span className="text-xs font-semibold text-slate-700">{storeDetails?.store.total_reviews ?? 0}</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, storeDetails ? Math.min((storeDetails.store.total_reviews / Math.max(storeDetails.store.total_reviews, 50)) * 100, 100) : 0)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">Total number of reviews received from customers</p>
              </div>
            </div>
          </div>

          {/* Section 2: Order Details progress bars */}
          <div className="bg-white border border-slate-300 rounded-xl p-4">
            <p className="font-bold text-base text-slate-900 mb-1">Order Details</p>
            <p className="text-xs text-slate-500 mb-4 italic">Summary of your all-time sales performance</p>
            <div className="space-y-5">
              {/* Total Sales */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Total Sales</span>
                  <span className="text-xs font-semibold text-slate-700">₱{(storeDetails?.orders.total_sales ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${storeDetails ? Math.min(100, (storeDetails.orders.total_sales / storeDetails.orders.max_sales_reference) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">Cumulative earnings from all completed orders</p>
              </div>

              {/* Average Sales */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Average Sales</span>
                  <span className="text-xs font-semibold text-slate-700">₱{(storeDetails?.orders.avg_sales ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${storeDetails && storeDetails.orders.max_sales_reference > 0 ? Math.min(100, (storeDetails.orders.avg_sales / (storeDetails.orders.max_sales_reference / Math.max(storeDetails.orders.avg_orders, 1))) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">Average revenue per order across all time</p>
              </div>

              {/* Total Orders */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Total Orders</span>
                  <span className="text-xs font-semibold text-slate-700">{storeDetails?.orders.avg_orders ?? 0}</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, storeDetails ? Math.min((storeDetails.orders.avg_orders / Math.max(storeDetails.orders.avg_orders, 50)) * 100, 100) : 0)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">Total number of orders across all time</p>
              </div>
            </div>
          </div>

          {/* Section 3: Sales by Category donut */}
          <div className="bg-white border border-slate-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-base text-slate-900">Sales by Category</p>
            </div>
            <p className="text-xs text-slate-500 mb-3 italic">Distribution of units sold per product category</p>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setSelectedCategoryView('all')}
                className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${selectedCategoryView === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
              >
                All
              </button>
              {salesCategories.slice(0, 5).map(cat => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategoryView(cat.category)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${selectedCategoryView === cat.category ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Straight-angle (semicircle) pie chart */}
            {(() => {
              const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
              const displayCats = selectedCategoryView === 'all'
                ? salesCategories
                : salesCategories.filter(c => c.category === selectedCategoryView)
              const totalSold = displayCats.reduce((s, c) => s + c.sold, 0)

              if (salesCategories.length === 0) {
                return <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No category data yet</div>
              }

              const pieData = displayCats.map((cat) => ({ name: cat.category, value: cat.sold, percentage: cat.percentage }))

              return (
                <div>
                  <div className="relative flex justify-center">
                    <PieChart width={220} height={120}>
                      <Pie
                        data={pieData}
                        cx={105}
                        cy={110}
                        startAngle={180}
                        endAngle={0}
                        innerRadius={52}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechTooltip
                        formatter={(val: any, name: any) => [val, name]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', padding: '4px 8px' }}
                      />
                    </PieChart>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                      <p className="text-lg font-bold text-slate-900 leading-none">{totalSold}</p>
                      <p className="text-[9px] text-slate-500">total sold</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] text-slate-700 font-medium truncate max-w-[90px]">{d.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-900">{d.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          </div>{/* end ROW 3 inner grid */}
          </div>{/* end ROW 3 relative */}

          {/* ROW 4: Recent Transaction Table */}
          <div className="relative pt-4 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-green-600 text-white text-[10px] font-semibold shadow-sm">4 Orders</div>
          <div className="bg-white border border-slate-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-base text-slate-900">Recent Transactions</p>
            <div className="flex gap-2">
              <Popover opened={filterPopoverOpened} onClose={() => setFilterPopoverOpened(false)} position="bottom-end" shadow="md" radius="md">
                <Popover.Target>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 border border-slate-300 bg-white transition-all duration-300 hover:border-slate-400 hover:shadow-sm active:scale-[0.98]"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(15,23,42,.06)' }}
                    onClick={() => setFilterPopoverOpened(!filterPopoverOpened)}
                  >
                    <Filter className="w-3.5 h-3.5" /> Filter
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="p-0 overflow-hidden" style={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,.12)' }}>
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Filter Transactions</p>
                  </div>
                  <div className="w-72 px-4 py-4 space-y-4">
                    <div>
                      <Text size="xs" fw={700} c="dimmed" className="mb-2 uppercase tracking-wide">Price Range</Text>
                      <RangeSlider
                        value={priceRange}
                        onChange={setPriceRange}
                        min={0}
                        max={100000}
                        step={1000}
                        marks={[
                          { value: 0, label: '₱0' },
                          { value: 50000, label: '₱50K' },
                          { value: 100000, label: '₱100K' }
                        ]}
                        mb="xl"
                      />
                      <div className="flex justify-between text-xs text-slate-600 mt-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                        <span>₱{priceRange[0].toLocaleString()}</span>
                        <span className="text-slate-400">—</span>
                        <span>₱{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <Text size="xs" fw={700} c="dimmed" className="mb-2 uppercase tracking-wide">Categories</Text>
                      <div className="space-y-2">
                        {salesCategories.slice(0, 4).map((cat) => (
                          <label key={cat.category} className="flex items-center gap-2 cursor-pointer group">
                            <Checkbox
                              size="xs"
                              checked={tableFilters.categories.includes(cat.category)}
                              onChange={(e) => {
                                if (e.currentTarget.checked) {
                                  setTableFilters({ ...tableFilters, categories: [...tableFilters.categories, cat.category] })
                                } else {
                                  setTableFilters({ ...tableFilters, categories: tableFilters.categories.filter(id => id !== cat.category) })
                                }
                              }}
                            />
                            <span className="text-xs text-slate-700 group-hover:text-slate-900">{cat.category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Text size="xs" fw={700} c="dimmed" className="mb-2 uppercase tracking-wide">Date Range</Text>
                      <DatePickerInput
                        type="range"
                        placeholder="Select dates"
                        value={tableFilters.dateRange}
                        onChange={(val) => setTableFilters({ ...tableFilters, dateRange: val })}
                        leftSection={<Calendar className="w-4 h-4" />}
                        size="xs"
                        styles={{ input: { border: '1px solid rgb(203 213 225)', borderRadius: '0.5rem' } }}
                      />
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100">
                      <button
                        className="flex-1 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                        onClick={() => { setTableFilters({ priceMin: 0, priceMax: 100000, categories: [], dateRange: [null, null] }); setPriceRange([0, 100000]) }}
                      >
                        Reset
                      </button>
                      <button
                        className="flex-1 py-1.5 text-xs font-semibold text-white rounded-md transition-colors"
                        style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                        onClick={() => { setTableFilters(prev => ({ ...prev, priceMin: priceRange[0], priceMax: priceRange[1] })); setFilterPopoverOpened(false) }}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </Popover.Dropdown>
              </Popover>
            </div>
          </div>

          {/* TanStack Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b-2 border-slate-300">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 border-r border-slate-200 last:border-r-0"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 border-r border-slate-200 last:border-r-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <Text size="sm" c="dimmed">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </Text>
            <Group gap="xs">
              <Button
                variant="default"
                size="xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                leftSection={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="default"
                size="xs"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                rightSection={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </Group>
          </div>
          </div>{/* end table card */}
          </div>{/* end ROW 4 relative */}
          </div>{/* end rows wrapper */}
        </div>

      {/* Category Modal */}
      <Modal
        opened={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Category"
        centered
      >
        <div className="space-y-3">
          <TextInput
            label="Name"
            placeholder="e.g., Danggit, Boneless Bangus"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            error={categoryFormErrors.name}
          />
          <Textarea
            label="Description"
            placeholder="Describe this category..."
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            error={categoryFormErrors.description}
            rows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCategory} loading={saving}>
              Save
            </Button>
          </Group>
        </div>
      </Modal>

      {/* Order View Details Modal */}
      <Modal
        opened={viewDetailsOpen}
        onClose={() => { setViewDetailsOpen(false); setViewDetailsOrder(null) }}
        title={viewDetailsOrder ? `Order #${viewDetailsOrder.order_number}` : 'Order Details'}
        size="lg"
        centered
      >
        {viewDetailsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Package className="w-8 h-8 animate-pulse text-blue-400 mr-3" />
            <span className="text-slate-500">Loading order details...</span>
          </div>
        ) : viewDetailsOrder ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-semibold text-slate-800">{viewDetailsOrder.address?.full_name || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Status</p>
                <Badge
                  color={
                    viewDetailsOrder.status === 'delivered' || viewDetailsOrder.status === 'confirmed' ? 'green'
                    : viewDetailsOrder.status === 'pending' ? 'yellow'
                    : viewDetailsOrder.status === 'shipped' ? 'blue'
                    : 'red'
                  }
                  variant="light"
                >
                  {viewDetailsOrder.status}
                </Badge>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-semibold text-slate-800">
                  {new Date(viewDetailsOrder.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Payment</p>
                <p className="font-semibold text-slate-800 capitalize">{viewDetailsOrder.payment_method || 'N/A'}</p>
              </div>
            </div>

            {viewDetailsOrder.address && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Delivery Address</p>
                <p className="text-sm text-slate-700">
                  {[viewDetailsOrder.address.address_line, viewDetailsOrder.address.city, viewDetailsOrder.address.province, viewDetailsOrder.address.postal_code].filter(Boolean).join(', ')}
                </p>
                {viewDetailsOrder.address.phone && (
                  <p className="text-xs text-slate-500 mt-1">📞 {viewDetailsOrder.address.phone}</p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Items</p>
              <div className="space-y-2">
                {viewDetailsOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">₱{(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 pt-3">
              <p className="font-semibold text-slate-700">Total</p>
              <p className="text-lg font-bold text-slate-900">₱{viewDetailsOrder.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>

            <Group justify="flex-end">
              <Button
                variant="default"
                leftSection={<Package className="w-4 h-4" />}
                loading={downloadingId === viewDetailsOrder.id}
                onClick={() => handleDownloadReceipt(viewDetailsOrder.id)}
              >
                Download Receipt
              </Button>
              <Button variant="default" onClick={() => setViewDetailsOpen(false)}>Close</Button>
            </Group>
          </div>
        ) : null}
      </Modal>

      {/* Expanded Chart Modal with Comparison */}
      <Modal
        opened={expandedChart}
        onClose={() => { setExpandedChart(false); setComparisonMode(false); setCompKpi1(null); setCompKpi2(null) }}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">Sales Overview</p>
              <p className="text-xs text-slate-500 font-normal">Detailed earnings analytics</p>
            </div>
          </div>
        }
        size={comparisonMode ? "95%" : "xl"}
        centered
        styles={{
          header: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0' },
          body: { padding: '16px 20px' },
          content: { borderRadius: '16px' },
        }}
      >
        {!comparisonMode ? (
          <div>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white border border-slate-300 rounded-xl p-3">
                <p className="text-xs text-slate-900 font-bold">💰 Total Revenue</p>
                <p className="text-lg font-bold text-slate-900 mt-1">₱{totalSales.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-slate-700 italic mt-1">Cumulative earnings for the selected period</p>
              </div>
              <div className="bg-white border border-slate-300 rounded-xl p-3">
                <p className="text-xs text-slate-900 font-bold">📊 Avg per Period</p>
                <p className="text-lg font-bold text-slate-900 mt-1">₱{avgSales.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-slate-700 italic mt-1">Average earnings per data point</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={filteredSalesData.length > 0 ? filteredSalesData : salesData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sellerSalesGradModal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.18} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={68} />
                <RechTooltip
                  formatter={(val: any) => [`₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`, 'Revenue']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '6px 12px' }}
                  cursor={{ stroke: 'rgba(100,116,139,0.15)', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#sellerSalesGradModal)" />
              </AreaChart>
            </ResponsiveContainer>
            <Button
              fullWidth
              mt="lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
              leftSection={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
              onClick={() => setComparisonMode(true)}
            >
              Compare Two Periods
            </Button>
          </div>
        ) : (
          <div>
            {/* Comparison date pickers */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-white border border-slate-300 rounded-xl p-3">
                <Text fw={700} size="sm" mb="xs" className="text-slate-900">📅 Period 1</Text>
                <DatePickerInput
                  type="range"
                  placeholder="Select date range"
                  value={dateRange1}
                  onChange={(val) => {
                    setDateRange1(val)
                    loadCompData(val, setCompKpi1, setCompKpiLoading1, setCompChartData1)
                  }}
                  leftSection={<Calendar className="w-4 h-4" />}
                  size="sm"
                  maxDate={new Date()}
                  styles={{ input: { border: '1px solid #cbd5e1', borderRadius: '0.5rem' } }}
                />
              </div>
              <div className="bg-white border border-slate-300 rounded-xl p-3">
                <Text fw={700} size="sm" mb="xs" className="text-slate-900">📅 Period 2</Text>
                <DatePickerInput
                  type="range"
                  placeholder="Select date range"
                  value={dateRange2}
                  onChange={(val) => {
                    setDateRange2(val)
                    loadCompData(val, setCompKpi2, setCompKpiLoading2, setCompChartData2)
                  }}
                  leftSection={<Calendar className="w-4 h-4" />}
                  size="sm"
                  maxDate={new Date()}
                  styles={{ input: { border: '1px solid #cbd5e1', borderRadius: '0.5rem' } }}
                />
              </div>
            </div>

            {/* Side-by-side charts */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Period 1 */}
              <div className="border border-slate-300 rounded-xl p-4 bg-white">
                <p className="text-sm font-bold text-slate-900 mb-1">Period 1</p>
                <p className="text-xs text-slate-500 mb-3">
                  {dateRange1[0] && dateRange1[1]
                    ? (() => { const toD = (d: string | Date) => d instanceof Date ? d : new Date(d); return `${toD(dateRange1[0]!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${toD(dateRange1[1]!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` })()
                    : 'No range selected'}
                </p>
                <ResponsiveContainer width="100%" height={208}>
                <AreaChart data={compChartData1.length > 0 ? compChartData1 : []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="comp1Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.75} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.18} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={65} />
                  <RechTooltip formatter={(val: any) => [`₱${Number(val).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`, 'Revenue']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', padding: '4px 8px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#comp1Grad)" />
                </AreaChart>
              </ResponsiveContainer>
                {/* Period 1 KPIs */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white border border-slate-300 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-900 font-bold">💰 Total Earnings</p>
                    {compKpiLoading1 ? (
                      <p className="text-sm font-bold text-slate-900 mt-1 animate-pulse">…</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {compKpi1 ? `₱${compKpi1.total.toLocaleString('en-PH', { maximumFractionDigits: 2 })}` : '—'}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-600 italic mt-0.5">Revenue for this period</p>
                  </div>
                  <div className="bg-white border border-slate-300 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-900 font-bold">🛒 Orders</p>
                    {compKpiLoading1 ? (
                      <p className="text-sm font-bold text-slate-900 mt-1 animate-pulse">…</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {compKpi1 ? compKpi1.orders : '—'}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-600 italic mt-0.5">Orders in this period</p>
                  </div>
                </div>
              </div>

              {/* Period 2 */}
              <div className="border border-slate-300 rounded-xl p-4 bg-white">
                <p className="text-sm font-bold text-slate-900 mb-1">Period 2</p>
                <p className="text-xs text-slate-500 mb-3">
                  {dateRange2[0] && dateRange2[1]
                    ? (() => { const toD = (d: string | Date) => d instanceof Date ? d : new Date(d); return `${toD(dateRange2[0]!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${toD(dateRange2[1]!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` })()
                    : 'No range selected'}
                </p>
              <ResponsiveContainer width="100%" height={208}>
                <AreaChart data={compChartData2.length > 0 ? compChartData2 : []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="comp2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.75} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.18} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={65} />
                  <RechTooltip formatter={(val: any) => [`₱${Number(val).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`, 'Revenue']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', padding: '4px 8px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#comp2Grad)" />
                </AreaChart>
              </ResponsiveContainer>
                {/* Period 2 KPIs */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white border border-slate-300 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-900 font-bold">💰 Total Earnings</p>
                    {compKpiLoading2 ? (
                      <p className="text-sm font-bold text-slate-900 mt-1 animate-pulse">…</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {compKpi2 ? `₱${compKpi2.total.toLocaleString('en-PH', { maximumFractionDigits: 2 })}` : '—'}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-600 italic mt-0.5">Revenue for this period</p>
                  </div>
                  <div className="bg-white border border-slate-300 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-900 font-bold">🛒 Orders</p>
                    {compKpiLoading2 ? (
                      <p className="text-sm font-bold text-slate-900 mt-1 animate-pulse">…</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {compKpi2 ? compKpi2.orders : '—'}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-600 italic mt-0.5">Orders in this period</p>
                  </div>
                </div>
              </div>
            </div>

            <Button fullWidth onClick={() => setComparisonMode(false)} variant="default" size="sm">
              ← Back to Single View
            </Button>
          </div>
        )}
      </Modal>
      </div>
    </div>
  )
}
