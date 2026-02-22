/**
 * AdminReportPanel — Per‑page analytics report with Recharts LineChart,
 * Mantine Accordion filters, SVG→PNG capture for embedded PDF charts.
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Paper, Text, Button, Group, Badge, Accordion, Checkbox, ActionIcon,
  Loader, Switch, NumberInput, MultiSelect, RangeSlider, Collapse,
  SegmentedControl, Portal,
} from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  X, FileText, Eye, Download, Filter, BarChart2,
  Trash2, RotateCcw,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  getAdminUserChart,
  getAdminMarketChart,
  getCommunityChart,
  getActivitiesChart,
} from '../../services/api'

// ════════════════════════════════════════ Types ════
interface KpiItem { label: string; value: string; change: number; subtitle: string }
interface ChartPoint { period: string; value: number }
interface ProgressItem { label: string; value: number; max: number; description: string }
interface DonutSlice { label: string; value: number; color: string }
interface TableRow { id: string; cols: string[] }

interface SectionData {
  kpis: KpiItem[]
  chartTitle: string
  chartData: ChartPoint[]
  chartColor: string
  progressA: { title: string; subtitle: string; items: ProgressItem[] }
  progressB: { title: string; subtitle: string; items: ProgressItem[] }
  donut: { title: string; slices: DonutSlice[] }
  table: { headers: string[]; rows: TableRow[] }
}

interface AdminReportMetrics { kpiSummary: boolean; chartData: boolean; tableData: boolean }

interface AdminReportPanelProps {
  open: boolean
  onClose: () => void
  section: string
  sectionLabel: string
  data: SectionData
  anchorRef?: React.RefObject<HTMLElement | null>
}

type MultiSeriesPoint = Record<string, string | number>

interface ReportFilters {
  dateRange: DatesRangeValue
  datePreset: string | null
  // Users
  roles: string[]
  accountStatus: string[]
  verified: boolean | null
  // Market
  orderStatus: string[]
  priceRange: [number, number]
  categories: string[]
  dateType: string
  // Community
  postCategories: string[]
  postStatus: string[]
  hasFlagged: boolean | null
  // Activities
  actionTypes: string[]
  modules: string[]
  performedBy: string[]
  logLevel: string[]
  // Scans
  detectionType: string[]
  gradeResult: string[]
  confidenceRange: [number, number]
  scanStatus: string[]
}

// ════════════════════════════════════ Constants ════
const DEFAULT_FILTERS: ReportFilters = {
  dateRange: [null, null], datePreset: null,
  roles: [], accountStatus: [], verified: null,
  orderStatus: [], priceRange: [0, 100000], categories: [], dateType: 'order',
  postCategories: [], postStatus: [], hasFlagged: null,
  actionTypes: [], modules: [], performedBy: [], logLevel: [],
  detectionType: [], gradeResult: [], confidenceRange: [0, 100], scanStatus: [],
}

const DEFAULT_METRICS: AdminReportMetrics = { kpiSummary: true, chartData: true, tableData: true }

const DATE_PRESETS: { label: string; key: string; getDates: () => DatesRangeValue }[] = [
  { label: 'Today', key: 'today', getDates: () => { const d = new Date(); d.setHours(0, 0, 0, 0); return [d, new Date()] } },
  { label: 'Yesterday', key: 'yesterday', getDates: () => { const s = new Date(); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0); const e = new Date(s); e.setHours(23, 59, 59, 999); return [s, e] } },
  { label: '7 Days', key: '7d', getDates: () => { const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return [d, new Date()] } },
  { label: '30 Days', key: '30d', getDates: () => { const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return [d, new Date()] } },
  { label: 'This Month', key: 'month', getDates: () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return [d, new Date()] } },
]

const CHART_SERIES: Record<string, { keys: string[]; colors: string[] }> = {
  users: { keys: ['New Users', 'New Sellers', 'New Admins'], colors: ['#3b82f6', '#22c55e', '#ef4444'] },
  market: { keys: ['Orders', 'Revenue'], colors: ['#22c55e', '#3b82f6'] },
  community: { keys: ['Posts', 'Comments'], colors: ['#f43f5e', '#fb923c'] },
  activities: { keys: ['Events', 'Errors'], colors: ['#06b6d4', '#ef4444'] },
  scans: { keys: ['value'], colors: ['#10b981'] },
}

const SECTION_ACCENT: Record<string, { primary: string; light: string; mantine: string; gradient: string }> = {
  users: { primary: '#3b82f6', light: '#dbeafe', mantine: 'blue', gradient: 'from-blue-600 to-indigo-600' },
  market: { primary: '#059669', light: '#d1fae5', mantine: 'teal', gradient: 'from-emerald-600 to-teal-600' },
  community: { primary: '#e11d48', light: '#ffe4e6', mantine: 'pink', gradient: 'from-rose-600 to-pink-600' },
  activities: { primary: '#0891b2', light: '#cffafe', mantine: 'cyan', gradient: 'from-cyan-600 to-sky-600' },
  scans: { primary: '#10b981', light: '#d1fae5', mantine: 'green', gradient: 'from-emerald-600 to-green-600' },
}

const SECTION_PDF_COLORS: Record<string, { primary: number[]; secondary: number[]; light: number[] }> = {
  Users:      { primary: [37, 99, 235],  secondary: [99, 102, 241], light: [219, 234, 254] },
  Market:     { primary: [5, 150, 105],  secondary: [16, 185, 129], light: [209, 250, 229] },
  Community:  { primary: [225, 29, 72],  secondary: [244, 63, 94],  light: [255, 228, 230] },
  Activities: { primary: [8, 145, 178],  secondary: [6, 182, 212],  light: [207, 250, 254] },
  Scans:      { primary: [16, 185, 129], secondary: [20, 184, 166], light: [209, 250, 229] },
}

const FILTER_OPTIONS: Record<string, Record<string, string[]>> = {
  users: {
    roles: ['Regular User', 'Seller', 'Admin'],
    accountStatus: ['Active', 'Suspended', 'Disabled'],
  },
  market: {
    orderStatus: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    categories: ['Tilapia', 'Bangus', 'Galunggong', 'Salmon', 'Tuna', 'Shrimp', 'Squid', 'Crab', 'Other'],
  },
  community: {
    postCategories: ['General', 'Question', 'Discussion', 'Guide', 'Announcement'],
    postStatus: ['Active', 'Disabled', 'Deleted'],
  },
  activities: {
    actionTypes: ['Login', 'Logout', 'Create', 'Update', 'Delete', 'View', 'Export'],
    modules: ['Auth', 'Community', 'Market', 'Scanner', 'Dashboard', 'Settings'],
    performedBy: ['User', 'Seller', 'Admin', 'System'],
    logLevel: ['Success', 'Warning', 'Error', 'Info'],
  },
  scans: {
    detectionType: ['Fresh', 'Moderately Fresh', 'Not Fresh'],
    gradeResult: ['Grade A', 'Grade B', 'Grade C', 'Failed'],
    scanStatus: ['Completed', 'Failed', 'Processing'],
  },
}

// ════════════════════════════════════ Utilities ════
function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtDateParam(d: Date | string): string { return new Date(d).toISOString().slice(0, 10) }
function toDate(d: Date | string | null | undefined): Date | null { if (!d) return null; return d instanceof Date ? d : new Date(d) }

/**
 * Draw chart data directly to an HTML Canvas — no Recharts/DOM involvement.
 * This is 100% reliable for PDF export because Recharts off-screen rendering
 * can fail silently (paths never computed for elements outside the viewport).
 */
function drawChartToCanvas(
  chartData: { period: string; [key: string]: any }[],
  keys: string[],
  colors: string[],
): string | null {
  if (!chartData.length || !keys.length) return null
  const W = 780, H = 300
  const ML = 66, MR = 16, MT = 24, MB = 48
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

  // Value range
  const allValues = chartData.flatMap(d => keys.map(k => Number(d[k] ?? 0)))
  const maxVal = Math.max(...allValues, 1)
  const gridCount = 5

  ctx.font = '11px Arial, sans-serif'

  // Grid lines + Y-axis labels
  for (let i = 0; i <= gridCount; i++) {
    const y = MT + (H - MT - MB) * (1 - i / gridCount)
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - MR, y); ctx.stroke()
    const val = maxVal * i / gridCount
    const label = val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M`
      : val >= 1_000 ? `${(val / 1_000).toFixed(1)}k`
      : Math.round(val).toString()
    ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right'
    ctx.fillText(label, ML - 6, y + 4)
  }

  // X-axis labels
  const n = chartData.length
  const xStep = (W - ML - MR) / Math.max(n - 1, 1)
  const skipEvery = Math.ceil(n / 10)
  ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'
  chartData.forEach((d, i) => {
    if (i % skipEvery === 0 || i === n - 1)
      ctx.fillText(d.period, ML + i * xStep, H - MB + 18)
  })

  // Lines + dots per series
  keys.forEach((key, ki) => {
    const color = colors[ki] || '#3b82f6'
    const pts = chartData.map((d, i) => ({
      x: ML + i * xStep,
      y: MT + (H - MT - MB) * (1 - Number(d[key] ?? 0) / maxVal),
    }))

    // Line stroke
    ctx.strokeStyle = color; ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.stroke()

    // Dots (only if few enough points)
    if (n <= 40) {
      pts.forEach(p => {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill()
      })
    }
  })

  // Legend
  const legendY = H - 10
  let legendX = ML
  keys.forEach((key, ki) => {
    const color = colors[ki] || '#3b82f6'
    ctx.fillStyle = color; ctx.fillRect(legendX, legendY - 5, 18, 2.5)
    ctx.beginPath(); ctx.arc(legendX + 9, legendY - 3.75, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#374151'; ctx.textAlign = 'left'
    ctx.fillText(key, legendX + 24, legendY)
    legendX += 24 + ctx.measureText(key).width + 18
  })

  return canvas.toDataURL('image/png')
}

/** Simple text‑matching filter for table rows. */
function filterTableRows(rows: TableRow[], filters: ReportFilters, section: string): TableRow[] {
  const textGroups: string[][] = []
  if (section === 'users') {
    if (filters.roles.length) textGroups.push(filters.roles)
    if (filters.accountStatus.length) textGroups.push(filters.accountStatus)
  } else if (section === 'market') {
    if (filters.orderStatus.length) textGroups.push(filters.orderStatus)
    if (filters.categories.length) textGroups.push(filters.categories)
  } else if (section === 'community') {
    if (filters.postCategories.length) textGroups.push(filters.postCategories)
    if (filters.postStatus.length) textGroups.push(filters.postStatus)
  } else if (section === 'activities') {
    if (filters.actionTypes.length) textGroups.push(filters.actionTypes)
    if (filters.modules.length) textGroups.push(filters.modules)
    if (filters.performedBy.length) textGroups.push(filters.performedBy)
    if (filters.logLevel.length) textGroups.push(filters.logLevel)
  } else if (section === 'scans') {
    if (filters.detectionType.length) textGroups.push(filters.detectionType)
    if (filters.gradeResult.length) textGroups.push(filters.gradeResult)
    if (filters.scanStatus.length) textGroups.push(filters.scanStatus)
  }
  if (textGroups.length === 0) return rows
  return rows.filter(row =>
    textGroups.every(group =>
      group.some(val => row.cols.some(col => col.toLowerCase().includes(val.toLowerCase())))
    )
  )
}

/** Build human‑readable applied‑filter lines for the PDF. */
function buildFilterSummary(filters: ReportFilters, section: string): string[] {
  const lines: string[] = []
  if (filters.dateRange[0] && filters.dateRange[1])
    lines.push(`Date Range: ${fmtDate(filters.dateRange[0])} \u2014 ${fmtDate(filters.dateRange[1])}`)
  if (section === 'users') {
    if (filters.roles.length) lines.push(`Roles: ${filters.roles.join(', ')}`)
    if (filters.accountStatus.length) lines.push(`Account Status: ${filters.accountStatus.join(', ')}`)
    if (filters.verified !== null) lines.push(`Verified Only: ${filters.verified ? 'Yes' : 'No'}`)
  } else if (section === 'market') {
    if (filters.orderStatus.length) lines.push(`Order Status: ${filters.orderStatus.join(', ')}`)
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000)
      lines.push(`Price: \u20B1${filters.priceRange[0].toLocaleString()} \u2014 \u20B1${filters.priceRange[1].toLocaleString()}`)
    if (filters.categories.length) lines.push(`Categories: ${filters.categories.join(', ')}`)
  } else if (section === 'community') {
    if (filters.postCategories.length) lines.push(`Categories: ${filters.postCategories.join(', ')}`)
    if (filters.postStatus.length) lines.push(`Post Status: ${filters.postStatus.join(', ')}`)
    if (filters.hasFlagged !== null) lines.push(`Flagged Only: ${filters.hasFlagged ? 'Yes' : 'No'}`)
  } else if (section === 'activities') {
    if (filters.actionTypes.length) lines.push(`Action Types: ${filters.actionTypes.join(', ')}`)
    if (filters.modules.length) lines.push(`Modules: ${filters.modules.join(', ')}`)
    if (filters.performedBy.length) lines.push(`Performed By: ${filters.performedBy.join(', ')}`)
    if (filters.logLevel.length) lines.push(`Log Level: ${filters.logLevel.join(', ')}`)
  } else if (section === 'scans') {
    if (filters.detectionType.length) lines.push(`Detection: ${filters.detectionType.join(', ')}`)
    if (filters.gradeResult.length) lines.push(`Grade: ${filters.gradeResult.join(', ')}`)
    if (filters.confidenceRange[0] > 0 || filters.confidenceRange[1] < 100)
      lines.push(`Confidence: ${filters.confidenceRange[0]}% \u2014 ${filters.confidenceRange[1]}%`)
    if (filters.scanStatus.length) lines.push(`Status: ${filters.scanStatus.join(', ')}`)
  }
  return lines
}

// ════════════════════════════════ PDF Generator ════
function generatePDF(
  data: SectionData,
  sectionLabel: string,
  filters: ReportFilters,
  metrics: AdminReportMetrics,
  chartImage: string | null,
  filteredRows: TableRow[],
  section: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  let y = margin

  const rangeLabel =
    filters.dateRange[0] && filters.dateRange[1]
      ? `${fmtDate(filters.dateRange[0])} \u2013 ${fmtDate(filters.dateRange[1])}`
      : 'All time'

  const colors = SECTION_PDF_COLORS[sectionLabel] || SECTION_PDF_COLORS.Users

  // helpers
  const checkPage = (need: number) => { if (y + need > pageH - 20) { doc.addPage(); y = 20; return true } return false }
  const drawDivider = () => { doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3); doc.line(margin, y, pageW - margin, y); y += 4 }
  const drawHeading = (title: string, desc: string) => {
    checkPage(18)
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.roundedRect(margin, y, 4, 4, 1, 1, 'F')
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30)
    doc.text(title, margin + 7, y + 3.5); y += 7
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 120, 120)
    doc.text(desc, margin, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30)
  }

  // ── Header ─────────────────────────────────
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
  doc.rect(0, 28, pageW, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text('Admin Analytics Report', margin, 12)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`${sectionLabel} Section \u2014 Daing Grader Platform`, margin, 19)
  doc.setFontSize(8)
  doc.text(`Period: ${rangeLabel}`, margin, 25)
  const genDate = `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  doc.text(genDate, pageW - margin - doc.getTextWidth(genDate), 25)
  y = 40

  // ── Executive summary ─────────────────────
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2])
  doc.roundedRect(margin, y, contentW, 14, 2, 2, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
  doc.text('EXECUTIVE SUMMARY', margin + 4, y + 5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(60, 60, 60)
  const sumTxt = `Comprehensive ${sectionLabel.toLowerCase()} analytics overview including KPIs, trend analysis, category breakdowns, and detailed records for data-driven decisions.`
  doc.text(doc.splitTextToSize(sumTxt, contentW - 8), margin + 4, y + 9)
  y += 18; doc.setTextColor(30, 30, 30)

  // ── Applied filters ───────────────────────
  const filterLines = buildFilterSummary(filters, section)
  if (filterLines.length > 0) {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
    doc.text('Applied Filters:', margin, y + 2); y += 4
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    filterLines.forEach(l => { doc.text(`\u2022 ${l}`, margin + 2, y); y += 3 })
    y += 3
  }

  // ── KPIs ──────────────────────────────────
  if (metrics.kpiSummary) {
    drawHeading('KEY PERFORMANCE INDICATORS', 'Critical metrics — changes vs previous period.')
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value', 'Change', 'Description']],
      body: data.kpis.map(k => [k.label, k.value, `${k.change >= 0 ? '+' : ''}${k.change}%`, k.subtitle]),
      theme: 'grid',
      headStyles: { fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 1: { halign: 'right', cellWidth: 30 }, 2: { halign: 'right', cellWidth: 20 } },
      margin: { left: margin, right: margin },
      didParseCell: (h: any) => {
        if (h.section === 'body' && h.column.index === 2) {
          const v = parseFloat(h.cell.raw)
          h.cell.styles.textColor = v >= 0 ? [22, 163, 74] : [220, 38, 38]
          h.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Chart image ───────────────────────────
  if (metrics.chartData && chartImage) {
    const chartH = contentW * (300 / 780)
    checkPage(chartH + 20)
    drawHeading(
      `${data.chartTitle.toUpperCase()} \u2014 TREND ANALYSIS`,
      `Line chart showing the ${data.chartTitle.toLowerCase()} trend over the selected period.`,
    )
    // background frame
    doc.setFillColor(250, 250, 250)
    doc.roundedRect(margin, y - 1, contentW, chartH + 2, 2, 2, 'F')
    doc.setDrawColor(230, 230, 230)
    doc.roundedRect(margin, y - 1, contentW, chartH + 2, 2, 2, 'S')
    doc.addImage(chartImage, 'PNG', margin + 1, y, contentW - 2, chartH)
    y += chartH + 6
  }

  // ── Progress A ────────────────────────────
  if (metrics.kpiSummary && data.progressA.items.length > 0) {
    checkPage(50)
    drawHeading(data.progressA.title.toUpperCase(), `${data.progressA.subtitle}. Bars show relative proportion.`)
    data.progressA.items.forEach((it) => {
      checkPage(12)
      const pct = it.max > 0 ? it.value / it.max : 0
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
      doc.text(it.label, margin, y + 2)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
      const vt = `${it.value.toLocaleString()} / ${it.max.toLocaleString()} (${(pct * 100).toFixed(1)}%)`
      doc.text(vt, pageW - margin - doc.getTextWidth(vt), y + 2); y += 4
      doc.setFillColor(235, 235, 235); doc.roundedRect(margin, y, contentW, 4, 1.5, 1.5, 'F')
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.roundedRect(margin, y, Math.max(pct * contentW, 1), 4, 1.5, 1.5, 'F'); y += 7
    })
    y += 2
    autoTable(doc, {
      startY: y,
      head: [['Item', 'Value', 'Max', '%']],
      body: data.progressA.items.map(it => [it.label, it.value.toLocaleString(), it.max.toLocaleString(), `${((it.value / (it.max || 1)) * 100).toFixed(1)}%`]),
      theme: 'striped', headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 }, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: margin, right: margin },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Progress B ────────────────────────────
  if (metrics.kpiSummary && data.progressB.items.length > 0) {
    checkPage(50)
    drawHeading(data.progressB.title.toUpperCase(), `${data.progressB.subtitle}. Distribution across categories.`)
    data.progressB.items.forEach((it) => {
      checkPage(12)
      const pct = it.max > 0 ? it.value / it.max : 0
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
      doc.text(it.label, margin, y + 2)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
      const vt = `${it.value.toLocaleString()} (${(pct * 100).toFixed(1)}%)`
      doc.text(vt, pageW - margin - doc.getTextWidth(vt), y + 2); y += 4
      doc.setFillColor(235, 235, 235); doc.roundedRect(margin, y, contentW, 4, 1.5, 1.5, 'F')
      doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
      doc.roundedRect(margin, y, Math.max(pct * contentW, 1), 4, 1.5, 1.5, 'F'); y += 7
    })
    y += 2
    autoTable(doc, {
      startY: y,
      head: [['Item', 'Value', 'Max', '%']],
      body: data.progressB.items.map(it => [it.label, it.value.toLocaleString(), it.max.toLocaleString(), `${((it.value / (it.max || 1)) * 100).toFixed(1)}%`]),
      theme: 'striped', headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 }, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: margin, right: margin },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Donut distribution ────────────────────
  if (metrics.kpiSummary && data.donut.slices.length > 0) {
    checkPage(50)
    drawHeading(data.donut.title.toUpperCase(), 'Proportional share of each category.')
    const stackH = 8
    const total = data.donut.slices.reduce((s, sl) => s + sl.value, 0) || 1
    doc.setFillColor(235, 235, 235); doc.roundedRect(margin, y, contentW, stackH, 2, 2, 'F')
    let sx = margin
    data.donut.slices.forEach((sl) => {
      const sw = (sl.value / total) * contentW
      if (sw > 0.5) {
        const hex = sl.color.replace('#', '')
        doc.setFillColor(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16))
        if (sx === margin) doc.roundedRect(sx, y, sw, stackH, 2, 2, 'F')
        else doc.rect(sx, y, sw, stackH, 'F')
        sx += sw
      }
    })
    doc.setDrawColor(230, 230, 230); doc.roundedRect(margin, y, contentW, stackH, 2, 2, 'S')
    y += stackH + 4
    data.donut.slices.forEach((sl) => {
      checkPage(6)
      const hex = sl.color.replace('#', '')
      doc.setFillColor(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16))
      doc.roundedRect(margin, y, 3, 3, 0.5, 0.5, 'F')
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50)
      doc.text(`${sl.label}: ${sl.value}%`, margin + 5, y + 2.5); y += 5
    })
    y += 3
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Share (%)']],
      body: data.donut.slices.map(s => [s.label, `${s.value}%`]),
      theme: 'grid',
      headStyles: { fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 }, columnStyles: { 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Data table ────────────────────────────
  if (metrics.tableData && filteredRows.length > 0) {
    checkPage(30)
    drawHeading(
      `${sectionLabel.toUpperCase()} DATA TABLE`,
      `${filteredRows.length} filtered record${filteredRows.length !== 1 ? 's' : ''} from the ${sectionLabel.toLowerCase()} section.`,
    )
    autoTable(doc, {
      startY: y,
      head: [data.table.headers],
      body: filteredRows.map(r => r.cols),
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      margin: { left: margin, right: margin },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didDrawPage: () => {
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
        doc.rect(0, 0, pageW, 8, 'F')
        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
        doc.text(`Admin Report \u2014 ${sectionLabel}`, margin, 5.5)
        doc.setTextColor(30, 30, 30)
      },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Notes ─────────────────────────────────
  checkPage(20); drawDivider()
  doc.setFillColor(250, 250, 250); doc.roundedRect(margin, y, contentW, 16, 2, 2, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100)
  doc.text('REPORT NOTES', margin + 4, y + 4)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  const notes = [
    `\u2022 Auto-generated from Daing Grader admin dashboard on ${new Date().toLocaleDateString()}.`,
    `\u2022 Data reflects ${rangeLabel === 'All time' ? 'complete historical data' : `period ${rangeLabel}`}.`,
    `\u2022 Percentage changes are calculated vs the preceding equivalent period.`,
    `\u2022 Chart rendered with Recharts LineChart captured at 2\u00D7 resolution.`,
  ]
  notes.forEach((n, i) => doc.text(n, margin + 4, y + 7.5 + i * 2.5))

  // ── Footer on every page ──────────────────
  const pages = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3)
    doc.line(margin, pageH - 8, pageW - margin, pageH - 8)
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150)
    doc.text(`Page ${i} of ${pages}`, margin, pageH - 4)
    doc.text(`Daing Grader \u2014 ${sectionLabel} Analytics Report`, pageW / 2, pageH - 4, { align: 'center' })
    doc.text(new Date().toLocaleDateString(), pageW - margin, pageH - 4, { align: 'right' })
  }

  const slug = sectionLabel.toLowerCase().replace(/\s+/g, '-')
  doc.save(`admin-report-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ════════════════════════════════ Report Preview ════
function ReportPreview({
  data, sectionLabel, filters, metrics,
  chartData, chartKeys, chartColors, chartLoading,
  filteredRows, accent,
}: {
  data: SectionData; sectionLabel: string; filters: ReportFilters; metrics: AdminReportMetrics
  chartData: MultiSeriesPoint[]; chartKeys: string[]; chartColors: string[]
  chartLoading: boolean; filteredRows: TableRow[]
  accent: { primary: string; light: string; mantine: string; gradient: string }
}) {
  const rangeLabel =
    filters.dateRange[0] && filters.dateRange[1]
      ? `${fmtDate(filters.dateRange[0])} \u2013 ${fmtDate(filters.dateRange[1])}`
      : 'All time'

  return (
    <div className="border border-slate-200 rounded-xl bg-white text-slate-800 text-xs overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${accent.gradient} text-white px-5 py-4`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-base">Admin Analytics Report</p>
            <p className="text-white/70 text-[11px] mt-0.5">{sectionLabel} Section</p>
          </div>
          <div className="text-right text-[10px] text-white/70">
            <p>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Period: {rangeLabel}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Exec summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Executive Summary</p>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Comprehensive {sectionLabel.toLowerCase()} analytics report with KPIs, trend analysis, breakdowns and filtered records.
          </p>
        </div>

        {/* KPIs */}
        {metrics.kpiSummary && (
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Key Performance Indicators</p>
            <div className="grid grid-cols-4 gap-2">
              {data.kpis.map((kpi, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase truncate">{kpi.label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{kpi.value}</p>
                  <p className={`text-[9px] mt-0.5 font-semibold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        {metrics.chartData && (
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {data.chartTitle} — Trend Analysis
            </p>
            {chartLoading ? (
              <div className="flex items-center justify-center h-[180px] bg-slate-50 rounded-lg border border-slate-200">
                <Loader size="sm" color={accent.mantine} />
              </div>
            ) : chartData.length > 0 ? (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-2">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 8, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    {chartKeys.map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={chartColors[i]} strokeWidth={1.5} dot={{ r: 2 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg border border-slate-200">
                No chart data for the selected range
              </div>
            )}
          </div>
        )}

        {/* Progress & donut */}
        {metrics.kpiSummary && (
          <div className="grid grid-cols-2 gap-3">
            {data.progressA.items.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 mb-1">{data.progressA.title}</p>
                {data.progressA.items.slice(0, 3).map((it, i) => (
                  <div key={i} className="mb-1.5">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-slate-600">{it.label}</span>
                      <span className="text-[9px] font-semibold text-slate-700">{((it.value / (it.max || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (it.value / (it.max || 1)) * 100)}%`, backgroundColor: accent.primary }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.donut.slices.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 mb-1">{data.donut.title}</p>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden flex mb-2">
                  {data.donut.slices.map((s, i) => (
                    <div key={i} className="h-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                  ))}
                </div>
                {data.donut.slices.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 mb-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[9px] text-slate-600">{s.label}: {s.value}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        {metrics.tableData && filteredRows.length > 0 && (
          <div>
            <p className="font-semibold text-slate-700 mb-1 text-[11px] uppercase tracking-wide">
              {sectionLabel} Data ({filteredRows.length} records)
            </p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{data.table.headers.map((h, i) => <th key={i} className="text-left px-2 py-2 font-semibold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredRows.slice(0, 5).map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      {row.cols.map((c, ci) => <td key={ci} className="px-2 py-1.5 truncate max-w-[80px]">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length > 5 && (
                <div className="text-center text-[10px] text-slate-400 py-1.5 border-t border-slate-100 bg-slate-50">
                  + {filteredRows.length - 5} more rows in PDF
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <p className="text-[9px] text-slate-400">
            PDF includes: Recharts line chart, progress bar graphics, distribution visualization, and filtered data table.
          </p>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════ Main Component ════
export default function AdminReportPanel({
  open, onClose, section, sectionLabel, data, anchorRef,
}: AdminReportPanelProps) {
  // ── state ──
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const [metrics, setMetrics] = useState<AdminReportMetrics>(DEFAULT_METRICS)
  const [chartData, setChartData] = useState<MultiSeriesPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 120, left: 16 })

  const chartRef = useRef<HTMLDivElement>(null) // kept for layout stability (not used for capture)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── derived ──
  const chartConfig = CHART_SERIES[section] || CHART_SERIES.scans
  const accent = SECTION_ACCENT[section] || SECTION_ACCENT.users
  const opts = FILTER_OPTIONS[section] || {}

  const effectiveChartData = useMemo<MultiSeriesPoint[]>(() => {
    if (chartData.length > 0) return chartData
    return data.chartData.map(d => ({ period: d.period, value: d.value }))
  }, [chartData, data.chartData])

  const effectiveKeys = chartData.length > 0 ? chartConfig.keys : ['value']
  const effectiveColors = chartData.length > 0 ? chartConfig.colors : [accent.primary]

  const filteredRows = useMemo(
    () => filterTableRows(data.table.rows, filters, section),
    [data.table.rows, filters, section],
  )

  const activeFilterCount = useMemo(() => {
    let c = 0
    if (filters.dateRange[0] || filters.dateRange[1]) c++
    if (section === 'users') { if (filters.roles.length) c++; if (filters.accountStatus.length) c++; if (filters.verified !== null) c++ }
    else if (section === 'market') { if (filters.orderStatus.length) c++; if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) c++; if (filters.categories.length) c++ }
    else if (section === 'community') { if (filters.postCategories.length) c++; if (filters.postStatus.length) c++; if (filters.hasFlagged !== null) c++ }
    else if (section === 'activities') { if (filters.actionTypes.length) c++; if (filters.modules.length) c++; if (filters.performedBy.length) c++; if (filters.logLevel.length) c++ }
    else if (section === 'scans') { if (filters.detectionType.length) c++; if (filters.gradeResult.length) c++; if (filters.confidenceRange[0] > 0 || filters.confidenceRange[1] < 100) c++; if (filters.scanStatus.length) c++ }
    return c
  }, [filters, section])

  const dateStart = toDate(filters.dateRange[0])?.getTime() ?? null
  const dateEnd = toDate(filters.dateRange[1])?.getTime() ?? null

  // ── Reset filters when section changes ──
  useEffect(() => { setFilters(DEFAULT_FILTERS); setChartData([]) }, [section])

  // ── Fetch chart data when section / date changes ──
  useEffect(() => {
    if (!open) return
    if (section === 'scans') { setChartLoading(false); return }
    let cancelled = false
    const load = async () => {
      setChartLoading(true)
      try {
        const params: Record<string, string> = {}
        if (filters.dateRange[0]) params.start_date = fmtDateParam(filters.dateRange[0] as Date | string)
        if (filters.dateRange[1]) params.end_date = fmtDateParam(filters.dateRange[1] as Date | string)
        let result: MultiSeriesPoint[] = []
        if (section === 'users') result = (await getAdminUserChart(params)).data as unknown as MultiSeriesPoint[]
        else if (section === 'market') result = (await getAdminMarketChart(params)).data as unknown as MultiSeriesPoint[]
        else if (section === 'community') result = (await getCommunityChart(params)).data as unknown as MultiSeriesPoint[]
        else if (section === 'activities') result = (await getActivitiesChart(params)).data as unknown as MultiSeriesPoint[]
        if (!cancelled) setChartData(result)
      } catch (e) { console.error('Chart fetch error:', e) }
      finally { if (!cancelled) setChartLoading(false) }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, dateStart, dateEnd, open])

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const panelWidth = 480
      const edgePadding = 12
      if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect()
        const nextLeft = Math.min(
          Math.max(edgePadding, rect.right - panelWidth),
          window.innerWidth - panelWidth - edgePadding,
        )
        setPanelPosition({ top: rect.bottom + 8, left: nextLeft })
        return
      }
      setPanelPosition({ top: 108, left: Math.max(edgePadding, window.innerWidth - panelWidth - 24) })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick as unknown as EventListener)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick as unknown as EventListener)
    }
  }, [open, onClose, anchorRef])

  // ── handlers ──
  const handlePresetClick = useCallback((key: string) => {
    const preset = DATE_PRESETS.find(p => p.key === key)
    if (!preset) return
    setFilters(f => ({ ...f, dateRange: preset.getDates(), datePreset: key }))
  }, [])

  const handleFilterReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS); setChartData([])
  }, [])

  const handleDownload = useCallback(async () => {
    if (!metrics.kpiSummary && !metrics.chartData && !metrics.tableData) {
      notifications.show({ title: 'No sections selected', message: 'Enable at least one report section.', color: 'orange' })
      return
    }
    setDownloading(true)
    try {
      const chartImage = metrics.chartData
        ? drawChartToCanvas(effectiveChartData, effectiveKeys, effectiveColors)
        : null
      generatePDF(data, sectionLabel, filters, metrics, chartImage, filteredRows, section)
      notifications.show({ title: 'PDF downloaded', message: `${sectionLabel} analytics report saved.`, color: 'green' })
    } catch (err) {
      console.error('PDF error:', err)
      notifications.show({ title: 'Error', message: 'Failed to generate PDF.', color: 'red' })
    } finally { setDownloading(false) }
  }, [data, sectionLabel, filters, metrics, filteredRows, section, effectiveChartData, effectiveKeys, effectiveColors])

  if (!open) return null

  // ══════════════════════════════════ Render ════
  return (
    <>
      {/* ref kept for DOM stability; no longer used for chart capture */}
      <div ref={chartRef} style={{ display: 'none' }} />

      {/* Floating panel */}
      <Portal>
      <div
        ref={panelRef}
        className="fixed z-[1200] w-[480px] overflow-y-auto"
        style={{
          top: panelPosition.top,
          left: panelPosition.left,
          maxHeight: `calc(100vh - ${Math.max(16, panelPosition.top + 16)}px)`,
          filter: 'drop-shadow(0 12px 30px rgba(15,23,42,0.20))',
        }}
      >
        <Paper shadow="lg" radius="lg" p={0} className="border border-slate-300 overflow-hidden bg-white">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" style={{ color: accent.primary }} />
              <Text fw={700} size="sm" c="dark">Download Report — {sectionLabel}</Text>
            </div>
            <ActionIcon variant="subtle" color="gray" onClick={onClose} size="sm"><X className="w-4 h-4" /></ActionIcon>
          </div>

          <div className="p-4 space-y-3">
            {/* ─── Mantine Accordion ──────────────────── */}
            <Accordion
              variant="separated"
              radius="sm"
              multiple
              defaultValue={['filters', 'sections']}
              styles={{
                item: { border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, backgroundColor: '#ffffff' },
                control: { paddingBlock: 9, paddingInline: 12, backgroundColor: '#ffffff' },
                panel: { paddingInline: 12, paddingBottom: 12, backgroundColor: '#ffffff' },
              }}
            >
              {/* ══ Section 1 — Filters ═══════════════════ */}
              <Accordion.Item value="filters">
                <Accordion.Control icon={<Filter className="w-4 h-4" style={{ color: accent.primary }} />}>
                  <Group gap="xs">
                    <Text fw={600} size="sm">Report Filters</Text>
                    <Badge size="xs" variant="light" color={accent.mantine}>
                      {activeFilterCount > 0 ? `${activeFilterCount} active` : 'none'}
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className="space-y-4 pt-1">

                    {/* Date presets + picker — all pages */}
                    <div>
                      <Text size="xs" fw={600} c="dimmed" mb={6} className="uppercase tracking-wide">Date Range</Text>
                      <Group gap={4} mb={8}>
                        {DATE_PRESETS.map(p => (
                          <Button
                            key={p.key}
                            size="xs"
                            variant={filters.datePreset === p.key ? 'filled' : 'light'}
                            color={accent.mantine}
                            radius="sm"
                            onClick={() => handlePresetClick(p.key)}
                            style={{ fontSize: 11, height: 26, paddingInline: 10 }}
                          >
                            {p.label}
                          </Button>
                        ))}
                      </Group>
                      <DatePickerInput
                        type="range"
                        placeholder="Custom range…"
                        value={filters.dateRange}
                        onChange={(val) => setFilters(f => ({ ...f, dateRange: val, datePreset: null }))}
                        clearable
                        size="xs"
                        radius="md"
                      />
                    </div>

                    {/* ── Users filters ── */}
                    {section === 'users' && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <Checkbox.Group label="Role" value={filters.roles} onChange={(v) => setFilters(f => ({ ...f, roles: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.roles ?? []).map(r => <Checkbox key={r} value={r} label={r} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <Checkbox.Group label="Account Status" value={filters.accountStatus} onChange={(v) => setFilters(f => ({ ...f, accountStatus: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.accountStatus ?? []).map(s => <Checkbox key={s} value={s} label={s} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <Switch
                          label="Verified Only"
                          size="sm"
                          color={accent.mantine}
                          checked={filters.verified === true}
                          onChange={(e) => setFilters(f => ({ ...f, verified: e.currentTarget.checked ? true : null }))}
                        />
                      </div>
                    )}

                    {/* ── Market filters ── */}
                    {section === 'market' && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <div>
                          <Text size="xs" fw={600} c="dimmed" mb={4}>Date Type</Text>
                          <SegmentedControl
                            size="xs"
                            fullWidth
                            data={[{ label: 'Order Date', value: 'order' }, { label: 'Date Created', value: 'product' }]}
                            value={filters.dateType}
                            onChange={(v) => setFilters(f => ({ ...f, dateType: v }))}
                            color={accent.mantine}
                          />
                        </div>
                        <Checkbox.Group label="Order Status" value={filters.orderStatus} onChange={(v) => setFilters(f => ({ ...f, orderStatus: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.orderStatus ?? []).map(s => <Checkbox key={s} value={s} label={s} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Text size="xs" fw={600} c="dimmed">Price Range</Text>
                            <Text size="xs" c="dimmed">₱{filters.priceRange[0].toLocaleString()} — ₱{filters.priceRange[1].toLocaleString()}</Text>
                          </div>
                          <RangeSlider
                            min={0} max={100000} step={500}
                            value={filters.priceRange}
                            onChange={(val) => setFilters(f => ({ ...f, priceRange: val as [number, number] }))}
                            color={accent.mantine} size="sm" label={null}
                          />
                          <Group gap="xs" mt={8}>
                            <NumberInput size="xs" label="Min" value={filters.priceRange[0]}
                              onChange={(val) => setFilters(f => ({ ...f, priceRange: [Number(val) || 0, f.priceRange[1]] }))}
                              min={0} max={filters.priceRange[1]} prefix="₱" thousandSeparator="," style={{ flex: 1 }}
                            />
                            <NumberInput size="xs" label="Max" value={filters.priceRange[1]}
                              onChange={(val) => setFilters(f => ({ ...f, priceRange: [f.priceRange[0], Number(val) || 100000] }))}
                              min={filters.priceRange[0]} max={100000} prefix="₱" thousandSeparator="," style={{ flex: 1 }}
                            />
                          </Group>
                        </div>
                        <MultiSelect
                          label="Product Category" data={opts.categories ?? []}
                          value={filters.categories} onChange={(v) => setFilters(f => ({ ...f, categories: v }))}
                          placeholder="All categories" clearable searchable size="xs"
                        />
                      </div>
                    )}

                    {/* ── Community filters ── */}
                    {section === 'community' && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <Checkbox.Group label="Category" value={filters.postCategories} onChange={(v) => setFilters(f => ({ ...f, postCategories: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.postCategories ?? []).map(c => <Checkbox key={c} value={c} label={c} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <Checkbox.Group label="Post Status" value={filters.postStatus} onChange={(v) => setFilters(f => ({ ...f, postStatus: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.postStatus ?? []).map(s => <Checkbox key={s} value={s} label={s} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <Switch
                          label="Flagged / Has Reports Only"
                          size="sm"
                          color={accent.mantine}
                          checked={filters.hasFlagged === true}
                          onChange={(e) => setFilters(f => ({ ...f, hasFlagged: e.currentTarget.checked ? true : null }))}
                        />
                      </div>
                    )}

                    {/* ── Activities filters ── */}
                    {section === 'activities' && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <MultiSelect
                          label="Action Type" data={opts.actionTypes ?? []}
                          value={filters.actionTypes} onChange={(v) => setFilters(f => ({ ...f, actionTypes: v }))}
                          placeholder="All action types" clearable searchable size="xs"
                        />
                        <MultiSelect
                          label="Module / Page" data={opts.modules ?? []}
                          value={filters.modules} onChange={(v) => setFilters(f => ({ ...f, modules: v }))}
                          placeholder="All modules" clearable searchable size="xs"
                        />
                        <Checkbox.Group label="Performed By" value={filters.performedBy} onChange={(v) => setFilters(f => ({ ...f, performedBy: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.performedBy ?? []).map(p => <Checkbox key={p} value={p} label={p} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <Checkbox.Group label="Log Level" value={filters.logLevel} onChange={(v) => setFilters(f => ({ ...f, logLevel: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.logLevel ?? []).map(l => <Checkbox key={l} value={l} label={l} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                      </div>
                    )}

                    {/* ── Scans filters ── */}
                    {section === 'scans' && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <Checkbox.Group label="Detection Type" value={filters.detectionType} onChange={(v) => setFilters(f => ({ ...f, detectionType: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.detectionType ?? []).map(d => <Checkbox key={d} value={d} label={d} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <Checkbox.Group label="Grade Result" value={filters.gradeResult} onChange={(v) => setFilters(f => ({ ...f, gradeResult: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.gradeResult ?? []).map(g => <Checkbox key={g} value={g} label={g} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Text size="xs" fw={600} c="dimmed">Confidence Score</Text>
                            <Text size="xs" c="dimmed">{filters.confidenceRange[0]}% — {filters.confidenceRange[1]}%</Text>
                          </div>
                          <RangeSlider
                            min={0} max={100} step={1}
                            value={filters.confidenceRange}
                            onChange={(val) => setFilters(f => ({ ...f, confidenceRange: val as [number, number] }))}
                            color={accent.mantine} size="sm" label={(v) => `${v}%`}
                          />
                          <Group gap="xs" mt={8}>
                            <NumberInput size="xs" label="Min %" value={filters.confidenceRange[0]}
                              onChange={(val) => setFilters(f => ({ ...f, confidenceRange: [Number(val) || 0, f.confidenceRange[1]] }))}
                              min={0} max={filters.confidenceRange[1]} suffix="%" style={{ flex: 1 }}
                            />
                            <NumberInput size="xs" label="Max %" value={filters.confidenceRange[1]}
                              onChange={(val) => setFilters(f => ({ ...f, confidenceRange: [f.confidenceRange[0], Number(val) || 100] }))}
                              min={filters.confidenceRange[0]} max={100} suffix="%" style={{ flex: 1 }}
                            />
                          </Group>
                        </div>
                        <Checkbox.Group label="Scan Status" value={filters.scanStatus} onChange={(v) => setFilters(f => ({ ...f, scanStatus: v }))}>
                          <Group gap="xs" mt={6}>
                            {(opts.scanStatus ?? []).map(s => <Checkbox key={s} value={s} label={s} size="xs" color={accent.mantine} />)}
                          </Group>
                        </Checkbox.Group>
                      </div>
                    )}

                    {/* Reset button */}
                    <div className="pt-2 border-t border-slate-100">
                      <Button
                        variant="subtle" color="gray" size="xs" radius="md" fullWidth
                        leftSection={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={handleFilterReset}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>

              {/* ══ Section 2 — Report Sections ═══════════ */}
              <Accordion.Item value="sections">
                <Accordion.Control icon={<BarChart2 className="w-4 h-4" style={{ color: accent.primary }} />}>
                  <Text fw={600} size="sm">Report Sections</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className="space-y-2 pt-1">
                    <Text size="xs" c="dimmed" mb={8}>Choose what to include in the PDF:</Text>

                    <div
                      onClick={() => setMetrics(m => ({ ...m, kpiSummary: !m.kpiSummary }))}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        metrics.kpiSummary ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Checkbox checked={metrics.kpiSummary} onChange={() => {}} color="green" size="sm" onClick={e => e.stopPropagation()} />
                      <div>
                        <Text size="sm" fw={600}>KPI Summary & Breakdowns</Text>
                        <Text size="xs" c="dimmed">Key metrics, progress bars, and distribution data</Text>
                      </div>
                      {metrics.kpiSummary && <Badge ml="auto" size="xs" color="green">Included</Badge>}
                    </div>

                    <div
                      onClick={() => setMetrics(m => ({ ...m, chartData: !m.chartData }))}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        metrics.chartData ? `border-${accent.mantine}-300 bg-${accent.mantine}-50` : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      style={metrics.chartData ? { borderColor: accent.primary + '60', backgroundColor: accent.light } : undefined}
                    >
                      <Checkbox checked={metrics.chartData} onChange={() => {}} color={accent.mantine} size="sm" onClick={e => e.stopPropagation()} />
                      <div>
                        <Text size="sm" fw={600}>Chart — Line Trend</Text>
                        <Text size="xs" c="dimmed">Recharts line chart embedded as high-res image</Text>
                      </div>
                      {metrics.chartData && <Badge ml="auto" size="xs" color={accent.mantine}>Included</Badge>}
                    </div>

                    <div
                      onClick={() => setMetrics(m => ({ ...m, tableData: !m.tableData }))}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        metrics.tableData ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Checkbox checked={metrics.tableData} onChange={() => {}} color="violet" size="sm" onClick={e => e.stopPropagation()} />
                      <div>
                        <Text size="sm" fw={600}>Full Data Table</Text>
                        <Text size="xs" c="dimmed">Filtered records from the {sectionLabel.toLowerCase()} section</Text>
                      </div>
                      {metrics.tableData && <Badge ml="auto" size="xs" color="violet">Included</Badge>}
                    </div>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            {/* ══ Section 3 — Actions ═════════════════════ */}
            <div className="border border-slate-200 rounded-lg px-4 py-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <Text size="xs" fw={600} c="dimmed" className="uppercase tracking-wide">Actions</Text>
                <Text size="xs" c="dimmed">
                  {filteredRows.length} record{filteredRows.length !== 1 ? 's' : ''}{' '}
                  {filteredRows.length !== data.table.rows.length && (
                    <span className="text-slate-400">(of {data.table.rows.length})</span>
                  )}
                </Text>
              </div>

              {/* Preview collapse */}
              <Collapse in={showPreview}>
                <div className="mb-3">
                  <ReportPreview
                    data={data}
                    sectionLabel={sectionLabel}
                    filters={filters}
                    metrics={metrics}
                    chartData={effectiveChartData}
                    chartKeys={effectiveKeys}
                    chartColors={effectiveColors}
                    chartLoading={chartLoading}
                    filteredRows={filteredRows}
                    accent={accent}
                  />
                </div>
              </Collapse>

              <Group grow gap="xs">
                <Button variant="subtle" color="gray" size="xs" radius="md"
                  leftSection={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => { setFilters(DEFAULT_FILTERS); setMetrics(DEFAULT_METRICS); setShowPreview(false); setChartData([]) }}
                >Clear</Button>

                <Button
                  variant={showPreview ? 'filled' : 'light'}
                  color={accent.mantine}
                  size="xs" radius="md"
                  leftSection={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setShowPreview(v => !v)}
                >{showPreview ? 'Hide Preview' : 'Preview'}</Button>

                <Button
                  variant="filled" color="indigo" size="xs" radius="md"
                  leftSection={downloading ? <Loader size={12} color="white" /> : <Download className="w-3.5 h-3.5" />}
                  onClick={handleDownload} disabled={downloading}
                >Download PDF</Button>
              </Group>
            </div>
          </div>
        </Paper>
      </div>
      </Portal>
    </>
  )
}
