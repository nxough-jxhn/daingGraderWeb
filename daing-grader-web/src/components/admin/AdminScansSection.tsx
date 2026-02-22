/**
 * AdminScansSection — Full analytics section for the Scans tab.
 *
 * 7 Analytical Frameworks:
 *  1. Fish Type Classification   (Donut + Stacked Trend)
 *  2. Mold Comparison by Type    (Grouped Bar)
 *  3. Mold Spatial Analysis      (Region Heatmap)
 *  4. Color Consistency           (Distribution Bars + Trend)
 *  5. Defect Analytics            (Category Bar + Severity Trend)
 *  6. Quality Grade               (Donut + Stacked Trend)
 *  7. Price Estimate              (Line Trend + Bar by Type)
 *
 * Design:
 *  - Row 1: 4 KPI cards
 *  - Row 2: Scan volume trend (full-width area chart)
 *  - Row 3: Tabbed breakdown — 4 tabs, each with 2 side-by-side graphs
 *  - Row 4: Unified scan records table (paginated, searchable)
 */
import React, { useState, useMemo } from 'react'
import {
  ScanLine, Activity, TrendingUp, TrendingDown,
  Search, ChevronLeft, ChevronRight, Maximize2,
  Calendar, Fish, AlertTriangle, DollarSign,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, RadialBarChart, RadialBar,
} from 'recharts'
import { Badge, TextInput, ActionIcon, Group, Button, Modal, Tooltip } from '@mantine/core'
import { KpiCard } from '../ui/KpiCard'
import { DynamicPercentageBadge } from '../ui/DynamicPercentageBadge'

// ────────────────────────── Types ──────────────────────────
interface ScanRecord {
  id: string
  date: string
  scanner: string
  fishType: string
  moldPct: number
  defectPct: number
  topDefect: string
  moldHotspot: string
  colorScore: string
  qualityGrade: string
  priceEstimate: number
  status: string
}

type AnalyticsTab = 'fish-mold' | 'spatial-defect' | 'quality-price' | 'color'

// ────────────────────────── Color Palette ──────────────────────────
const FISH_COLORS: Record<string, string> = {
  Galunggong: '#f59e0b',
  Bangus: '#3b82f6',
  Tilapia: '#10b981',
  Dilis: '#ef4444',
  Tuyo: '#8b5cf6',
}

const QUALITY_COLORS: Record<string, string> = {
  Import: '#22c55e',
  Export: '#3b82f6',
  Reject: '#ef4444',
}

const DEFECT_COLORS: Record<string, string> = {
  Tears: '#ef4444',
  Bruising: '#f59e0b',
  Dehydration: '#06b6d4',
  Contamination: '#8b5cf6',
  Discoloration: '#ec4899',
}

const REGION_NAMES = ['Head', 'Gills', 'Dorsal', 'Belly', 'Tail', 'Fins'] as const

// ────────────────────────── Sample Data ──────────────────────────

// 1️⃣ Fish type classification
const FISH_TYPE_DISTRIBUTION = [
  { name: 'Galunggong', value: 35, color: FISH_COLORS.Galunggong },
  { name: 'Bangus', value: 25, color: FISH_COLORS.Bangus },
  { name: 'Tilapia', value: 20, color: FISH_COLORS.Tilapia },
  { name: 'Dilis', value: 12, color: FISH_COLORS.Dilis },
  { name: 'Tuyo', value: 8, color: FISH_COLORS.Tuyo },
]

const FISH_TYPE_TREND = [
  { period: 'Jan', Galunggong: 120, Bangus: 85, Tilapia: 70, Dilis: 40, Tuyo: 28 },
  { period: 'Feb', Galunggong: 135, Bangus: 90, Tilapia: 78, Dilis: 45, Tuyo: 32 },
  { period: 'Mar', Galunggong: 145, Bangus: 100, Tilapia: 85, Dilis: 50, Tuyo: 30 },
  { period: 'Apr', Galunggong: 128, Bangus: 95, Tilapia: 72, Dilis: 42, Tuyo: 35 },
  { period: 'May', Galunggong: 155, Bangus: 110, Tilapia: 90, Dilis: 55, Tuyo: 38 },
  { period: 'Jun', Galunggong: 160, Bangus: 120, Tilapia: 95, Dilis: 58, Tuyo: 34 },
  { period: 'Jul', Galunggong: 140, Bangus: 105, Tilapia: 82, Dilis: 48, Tuyo: 28 },
  { period: 'Aug', Galunggong: 148, Bangus: 115, Tilapia: 88, Dilis: 52, Tuyo: 36 },
  { period: 'Sep', Galunggong: 130, Bangus: 92, Tilapia: 75, Dilis: 44, Tuyo: 30 },
  { period: 'Oct', Galunggong: 142, Bangus: 98, Tilapia: 80, Dilis: 50, Tuyo: 32 },
  { period: 'Nov', Galunggong: 158, Bangus: 118, Tilapia: 92, Dilis: 56, Tuyo: 40 },
  { period: 'Dec', Galunggong: 170, Bangus: 125, Tilapia: 98, Dilis: 60, Tuyo: 42 },
]

// 2️⃣ Mold comparison by type
const MOLD_BY_TYPE = [
  { type: 'Galunggong', avgMold: 32, minMold: 12, maxMold: 58 },
  { type: 'Bangus', avgMold: 28, minMold: 8, maxMold: 52 },
  { type: 'Tilapia', avgMold: 22, minMold: 5, maxMold: 45 },
  { type: 'Dilis', avgMold: 38, minMold: 18, maxMold: 65 },
  { type: 'Tuyo', avgMold: 45, minMold: 22, maxMold: 72 },
]

// 3️⃣ Mold spatial (region intensity 0–100)
const MOLD_SPATIAL: Record<string, number> = {
  Head: 35, Gills: 62, Dorsal: 28, Belly: 55, Tail: 18, Fins: 40,
}

const MOLD_SPATIAL_BY_TYPE = [
  { region: 'Head', Galunggong: 30, Bangus: 25, Tilapia: 35, Dilis: 42, Tuyo: 48 },
  { region: 'Gills', Galunggong: 58, Bangus: 52, Tilapia: 48, Dilis: 70, Tuyo: 75 },
  { region: 'Dorsal', Galunggong: 22, Bangus: 20, Tilapia: 25, Dilis: 30, Tuyo: 38 },
  { region: 'Belly', Galunggong: 50, Bangus: 45, Tilapia: 42, Dilis: 60, Tuyo: 68 },
  { region: 'Tail', Galunggong: 15, Bangus: 12, Tilapia: 18, Dilis: 22, Tuyo: 28 },
  { region: 'Fins', Galunggong: 35, Bangus: 30, Tilapia: 32, Dilis: 45, Tuyo: 52 },
]

// 4️⃣ Color consistency
const COLOR_DISTRIBUTION = [
  { band: 'Excellent', count: 1850, color: '#22c55e' },
  { band: 'Good', count: 2480, color: '#3b82f6' },
  { band: 'Fair', count: 980, color: '#f59e0b' },
  { band: 'Poor', count: 290, color: '#ef4444' },
]

const COLOR_TREND = [
  { period: 'Jan', score: 78 }, { period: 'Feb', score: 80 }, { period: 'Mar', score: 82 },
  { period: 'Apr', score: 79 }, { period: 'May', score: 83 }, { period: 'Jun', score: 85 },
  { period: 'Jul', score: 81 }, { period: 'Aug', score: 84 }, { period: 'Sep', score: 80 },
  { period: 'Oct', score: 82 }, { period: 'Nov', score: 86 }, { period: 'Dec', score: 88 },
]

// 5️⃣ Defect analytics (separate from mold)
const DEFECT_CATEGORIES = [
  { category: 'Tears', count: 420, color: DEFECT_COLORS.Tears },
  { category: 'Bruising', count: 380, color: DEFECT_COLORS.Bruising },
  { category: 'Dehydration', count: 310, color: DEFECT_COLORS.Dehydration },
  { category: 'Contamination', count: 180, color: DEFECT_COLORS.Contamination },
  { category: 'Discoloration', count: 145, color: DEFECT_COLORS.Discoloration },
]

const DEFECT_TREND = [
  { period: 'Jan', severity: 18 }, { period: 'Feb', severity: 20 }, { period: 'Mar', severity: 17 },
  { period: 'Apr', severity: 22 }, { period: 'May', severity: 19 }, { period: 'Jun', severity: 16 },
  { period: 'Jul', severity: 21 }, { period: 'Aug', severity: 18 }, { period: 'Sep', severity: 23 },
  { period: 'Oct', severity: 20 }, { period: 'Nov', severity: 17 }, { period: 'Dec', severity: 15 },
]

// 6️⃣ Quality grade
const QUALITY_DISTRIBUTION = [
  { name: 'Import', value: 45, color: QUALITY_COLORS.Import },
  { name: 'Export', value: 38, color: QUALITY_COLORS.Export },
  { name: 'Reject', value: 17, color: QUALITY_COLORS.Reject },
]

const QUALITY_TREND = [
  { period: 'Jan', Import: 42, Export: 40, Reject: 18 },
  { period: 'Feb', Import: 44, Export: 38, Reject: 18 },
  { period: 'Mar', Import: 46, Export: 37, Reject: 17 },
  { period: 'Apr', Import: 43, Export: 39, Reject: 18 },
  { period: 'May', Import: 47, Export: 36, Reject: 17 },
  { period: 'Jun', Import: 48, Export: 35, Reject: 17 },
  { period: 'Jul', Import: 44, Export: 38, Reject: 18 },
  { period: 'Aug', Import: 46, Export: 37, Reject: 17 },
  { period: 'Sep', Import: 42, Export: 40, Reject: 18 },
  { period: 'Oct', Import: 45, Export: 38, Reject: 17 },
  { period: 'Nov', Import: 48, Export: 36, Reject: 16 },
  { period: 'Dec', Import: 50, Export: 35, Reject: 15 },
]

// 7️⃣ Price estimate
const PRICE_TREND = [
  { period: 'Jan', price: 142 }, { period: 'Feb', price: 148 }, { period: 'Mar', price: 155 },
  { period: 'Apr', price: 150 }, { period: 'May', price: 158 }, { period: 'Jun', price: 162 },
  { period: 'Jul', price: 155 }, { period: 'Aug', price: 160 }, { period: 'Sep', price: 152 },
  { period: 'Oct', price: 158 }, { period: 'Nov', price: 165 }, { period: 'Dec', price: 172 },
]

const PRICE_BY_TYPE = [
  { type: 'Galunggong', price: 145 },
  { type: 'Bangus', price: 185 },
  { type: 'Tilapia', price: 160 },
  { type: 'Dilis', price: 120 },
  { type: 'Tuyo', price: 95 },
]

// Main trend (Row 2)
const SCAN_VOLUME_TREND = [
  { period: 'Jan', Scans: 3200, 'Mold %': 32, 'Defect %': 18 },
  { period: 'Feb', Scans: 3650, 'Mold %': 30, 'Defect %': 20 },
  { period: 'Mar', Scans: 4100, 'Mold %': 28, 'Defect %': 17 },
  { period: 'Apr', Scans: 3800, 'Mold %': 31, 'Defect %': 22 },
  { period: 'May', Scans: 4300, 'Mold %': 27, 'Defect %': 19 },
  { period: 'Jun', Scans: 4700, 'Mold %': 25, 'Defect %': 16 },
  { period: 'Jul', Scans: 3900, 'Mold %': 29, 'Defect %': 21 },
  { period: 'Aug', Scans: 4200, 'Mold %': 26, 'Defect %': 18 },
  { period: 'Sep', Scans: 3500, 'Mold %': 30, 'Defect %': 23 },
  { period: 'Oct', Scans: 3800, 'Mold %': 28, 'Defect %': 20 },
  { period: 'Nov', Scans: 4400, 'Mold %': 24, 'Defect %': 17 },
  { period: 'Dec', Scans: 4832, 'Mold %': 22, 'Defect %': 15 },
]

// Table records
const SCAN_RECORDS: ScanRecord[] = [
  { id: 'SCN-4832', date: 'Feb 18, 2026', scanner: 'Juan dela Cruz', fishType: 'Galunggong', moldPct: 28, defectPct: 12, topDefect: 'Tears', moldHotspot: 'Gills', colorScore: 'Good', qualityGrade: 'Import', priceEstimate: 155, status: 'Completed' },
  { id: 'SCN-4831', date: 'Feb 18, 2026', scanner: 'Maria Santos', fishType: 'Bangus', moldPct: 15, defectPct: 8, topDefect: 'Bruising', moldHotspot: 'Belly', colorScore: 'Excellent', qualityGrade: 'Import', priceEstimate: 195, status: 'Completed' },
  { id: 'SCN-4830', date: 'Feb 17, 2026', scanner: 'Pedro Reyes', fishType: 'Tilapia', moldPct: 35, defectPct: 22, topDefect: 'Dehydration', moldHotspot: 'Gills', colorScore: 'Fair', qualityGrade: 'Export', priceEstimate: 140, status: 'Completed' },
  { id: 'SCN-4829', date: 'Feb 17, 2026', scanner: 'Ana Garcia', fishType: 'Dilis', moldPct: 52, defectPct: 30, topDefect: 'Contamination', moldHotspot: 'Belly', colorScore: 'Poor', qualityGrade: 'Reject', priceEstimate: 85, status: 'Completed' },
  { id: 'SCN-4828', date: 'Feb 17, 2026', scanner: 'Jose Rizal', fishType: 'Tuyo', moldPct: 60, defectPct: 35, topDefect: 'Tears', moldHotspot: 'Gills', colorScore: 'Poor', qualityGrade: 'Reject', priceEstimate: 65, status: 'Completed' },
  { id: 'SCN-4827', date: 'Feb 16, 2026', scanner: 'Luis Bautista', fishType: 'Galunggong', moldPct: 18, defectPct: 6, topDefect: 'Discoloration', moldHotspot: 'Head', colorScore: 'Good', qualityGrade: 'Import', priceEstimate: 168, status: 'Completed' },
  { id: 'SCN-4826', date: 'Feb 16, 2026', scanner: 'Carmen Reyes', fishType: 'Bangus', moldPct: 22, defectPct: 10, topDefect: 'Bruising', moldHotspot: 'Dorsal', colorScore: 'Good', qualityGrade: 'Export', priceEstimate: 175, status: 'Completed' },
  { id: 'SCN-4825', date: 'Feb 16, 2026', scanner: 'Miguel Torres', fishType: 'Tilapia', moldPct: 10, defectPct: 4, topDefect: 'None', moldHotspot: 'N/A', colorScore: 'Excellent', qualityGrade: 'Import', priceEstimate: 180, status: 'Completed' },
  { id: 'SCN-4824', date: 'Feb 15, 2026', scanner: 'Rosa Cruz', fishType: 'Galunggong', moldPct: 42, defectPct: 20, topDefect: 'Tears', moldHotspot: 'Gills', colorScore: 'Fair', qualityGrade: 'Export', priceEstimate: 130, status: 'Completed' },
  { id: 'SCN-4823', date: 'Feb 15, 2026', scanner: 'Juan dela Cruz', fishType: 'Dilis', moldPct: 48, defectPct: 28, topDefect: 'Contamination', moldHotspot: 'Belly', colorScore: 'Fair', qualityGrade: 'Reject', priceEstimate: 90, status: 'Completed' },
  { id: 'SCN-4822', date: 'Feb 15, 2026', scanner: 'Maria Santos', fishType: 'Bangus', moldPct: 12, defectPct: 5, topDefect: 'Discoloration', moldHotspot: 'Tail', colorScore: 'Good', qualityGrade: 'Import', priceEstimate: 190, status: 'Completed' },
  { id: 'SCN-4821', date: 'Feb 14, 2026', scanner: 'Pedro Reyes', fishType: 'Tuyo', moldPct: 55, defectPct: 32, topDefect: 'Dehydration', moldHotspot: 'Belly', colorScore: 'Poor', qualityGrade: 'Reject', priceEstimate: 72, status: 'Completed' },
  { id: 'SCN-4820', date: 'Feb 14, 2026', scanner: 'Ana Garcia', fishType: 'Galunggong', moldPct: 20, defectPct: 9, topDefect: 'Bruising', moldHotspot: 'Head', colorScore: 'Good', qualityGrade: 'Import', priceEstimate: 162, status: 'Completed' },
  { id: 'SCN-4819', date: 'Feb 14, 2026', scanner: 'Luis Bautista', fishType: 'Tilapia', moldPct: 25, defectPct: 14, topDefect: 'Tears', moldHotspot: 'Gills', colorScore: 'Good', qualityGrade: 'Export', priceEstimate: 152, status: 'Completed' },
  { id: 'SCN-4818', date: 'Feb 13, 2026', scanner: 'Carmen Reyes', fishType: 'Dilis', moldPct: 40, defectPct: 25, topDefect: 'Contamination', moldHotspot: 'Gills', colorScore: 'Fair', qualityGrade: 'Export', priceEstimate: 105, status: 'Completed' },
  { id: 'SCN-4817', date: 'Feb 13, 2026', scanner: 'Miguel Torres', fishType: 'Bangus', moldPct: 8, defectPct: 3, topDefect: 'None', moldHotspot: 'N/A', colorScore: 'Excellent', qualityGrade: 'Import', priceEstimate: 200, status: 'Completed' },
  { id: 'SCN-4816', date: 'Feb 13, 2026', scanner: 'Rosa Cruz', fishType: 'Galunggong', moldPct: 32, defectPct: 16, topDefect: 'Dehydration', moldHotspot: 'Dorsal', colorScore: 'Fair', qualityGrade: 'Export', priceEstimate: 138, status: 'Completed' },
  { id: 'SCN-4815', date: 'Feb 12, 2026', scanner: 'Jose Rizal', fishType: 'Tuyo', moldPct: 65, defectPct: 38, topDefect: 'Tears', moldHotspot: 'Gills', colorScore: 'Poor', qualityGrade: 'Reject', priceEstimate: 58, status: 'Completed' },
  { id: 'SCN-4814', date: 'Feb 12, 2026', scanner: 'Juan dela Cruz', fishType: 'Tilapia', moldPct: 14, defectPct: 7, topDefect: 'Bruising', moldHotspot: 'Belly', colorScore: 'Good', qualityGrade: 'Import', priceEstimate: 175, status: 'Completed' },
  { id: 'SCN-4813', date: 'Feb 12, 2026', scanner: 'Maria Santos', fishType: 'Galunggong', moldPct: 26, defectPct: 11, topDefect: 'Discoloration', moldHotspot: 'Fins', colorScore: 'Good', qualityGrade: 'Export', priceEstimate: 148, status: 'Completed' },
]

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

  // ─── Filtered table rows ───
  const filteredRecords = useMemo(() => {
    if (!searchValue.trim()) return SCAN_RECORDS
    const q = searchValue.toLowerCase()
    return SCAN_RECORDS.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.scanner.toLowerCase().includes(q) ||
      r.fishType.toLowerCase().includes(q) ||
      r.qualityGrade.toLowerCase().includes(q) ||
      r.topDefect.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  }, [searchValue])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const paginatedRecords = filteredRecords.slice((tablePage - 1) * pageSize, tablePage * pageSize)

  // Summarize KPIs from records
  const kpis = useMemo(() => {
    const total = SCAN_RECORDS.length
    const avgMold = (SCAN_RECORDS.reduce((s, r) => s + r.moldPct, 0) / total).toFixed(1)
    const avgDefect = (SCAN_RECORDS.reduce((s, r) => s + r.defectPct, 0) / total).toFixed(1)
    const rejectCount = SCAN_RECORDS.filter(r => r.qualityGrade === 'Reject').length
    const rejectRate = ((rejectCount / total) * 100).toFixed(1)
    return { total, avgMold, avgDefect, rejectRate }
  }, [])

  const TABS: { key: AnalyticsTab; label: string; icon: React.ElementType }[] = [
    { key: 'fish-mold', label: 'Fish & Mold', icon: Fish },
    { key: 'spatial-defect', label: 'Spatial & Defect', icon: AlertTriangle },
    { key: 'quality-price', label: 'Quality & Price', icon: DollarSign },
    { key: 'color', label: 'Color Consistency', icon: Activity },
  ]

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
      {/* Amber accent line */}
      <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-amber-500/50 via-yellow-300/40 to-amber-500/50" />

      <div className="pl-8 pr-3 py-3 space-y-4">

        {/* ═══════════════ ROW 1: KPI CARDS ═══════════════ */}
        <div className="relative">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold shadow-sm">1 KPI</div>
          <div className="bg-white/80 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={<ScanLine className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-100" emoji="🔬" title="Total Scans"
              value={kpis.total.toLocaleString()} badge={<DynamicPercentageBadge value={22.3} size="xs" />}
              badgeLabel="vs last period" description="All-time fish scans processed by the AI system" />
            <KpiCard icon={<Activity className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100" emoji="🦠" title="Avg Mold %"
              value={`${kpis.avgMold}%`} badge={<DynamicPercentageBadge value={-3.2} size="xs" />}
              badgeLabel="vs last period" description="Average mold detection percentage across all scans" />
            <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} iconBg="bg-red-100" emoji="⚠️" title="Avg Defect %"
              value={`${kpis.avgDefect}%`} badge={<DynamicPercentageBadge value={-1.8} size="xs" />}
              badgeLabel="vs last period" description="Average non-mold defect rate (tears, bruising, etc.)" />
            <KpiCard icon={<TrendingDown className="w-5 h-5 text-rose-600" />} iconBg="bg-rose-100" emoji="🚫" title="Reject Rate"
              value={`${kpis.rejectRate}%`} badge={<DynamicPercentageBadge value={-5.1} size="xs" />}
              badgeLabel="vs last period" description="Percentage of scans graded as Reject quality" />
          </div>
        </div>

        {/* ═══════════════ ROW 2: MAIN TREND CHART ═══════════════ */}
        <div className="relative pt-2 border-t border-slate-200/70">
          <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold shadow-sm">2 Trend</div>
          <div className="bg-white border border-slate-300 rounded-xl p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-900 font-bold">📈 Scan Volume & Quality Trend</p>
                <p className="text-xs text-slate-500 mt-1">Monthly scan count with average mold and defect percentages</p>
              </div>
              <Group gap="xs">
                <Badge variant="light" color="amber" size="sm">Last 12 months</Badge>
                <ActionIcon variant="default" onClick={() => setExpandedChart(true)}><Maximize2 className="w-4 h-4" /></ActionIcon>
              </Group>
            </div>
            <ScanAreaChart data={SCAN_VOLUME_TREND} xKey="period"
              areas={[
                { key: 'Scans', color: '#f59e0b' },
                { key: 'Mold %', color: '#ef4444' },
                { key: 'Defect %', color: '#8b5cf6' },
              ]}
              height={256} />
          </div>
        </div>

        {/* Expanded chart modal */}
        <Modal opened={expandedChart} onClose={() => setExpandedChart(false)} size="90%" title={<span className="font-bold text-lg">Scan Volume & Quality — Expanded</span>} centered>
          <div className="p-4">
            <ScanAreaChart data={SCAN_VOLUME_TREND} xKey="period"
              areas={[
                { key: 'Scans', color: '#f59e0b' },
                { key: 'Mold %', color: '#ef4444' },
                { key: 'Defect %', color: '#8b5cf6' },
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
                    <ScanDonut slices={FISH_TYPE_DISTRIBUTION} height={160} />
                    <div className="mt-3 space-y-1.5">
                      {FISH_TYPE_DISTRIBUTION.map((f, i) => (
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
                      data={MOLD_BY_TYPE}
                      bars={[
                        { key: 'avgMold', color: '#f59e0b' },
                        { key: 'minMold', color: '#86efac' },
                        { key: 'maxMold', color: '#ef4444' },
                      ]}
                      xKey="type"
                      height={240}
                      valueFormatter={(v) => `${v}%`}
                    />
                    <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Avg Mold %</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-300 inline-block" /> Min Mold %</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Max Mold %</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ───── Tab B: Spatial & Defect ───── */}
              {activeTab === 'spatial-defect' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Mold Spatial Heatmap */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">📍 Mold Spatial Analysis</p>
                    <p className="text-[10px] text-slate-500 mb-4 italic">Where mold appears on the fish — standardised body region intensity</p>

                    {/* Region heatmap bars */}
                    <div className="space-y-3">
                      {REGION_NAMES.map(region => {
                        const intensity = MOLD_SPATIAL[region]
                        const bgColor = intensity > 60 ? 'bg-red-500'
                          : intensity > 40 ? 'bg-orange-400'
                          : intensity > 20 ? 'bg-amber-400'
                          : 'bg-yellow-300'
                        const trackColor = intensity > 60 ? 'bg-red-100'
                          : intensity > 40 ? 'bg-orange-100'
                          : intensity > 20 ? 'bg-amber-100'
                          : 'bg-yellow-100'
                        return (
                          <div key={region}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900">{region}</span>
                              <span className="text-xs font-semibold text-slate-700">{intensity}%</span>
                            </div>
                            <div className={`w-full h-3 ${trackColor} rounded-full overflow-hidden`}>
                              <div className={`h-full ${bgColor} rounded-full transition-all duration-700`} style={{ width: `${intensity}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300 inline-block" /> Low (&lt;20%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Moderate</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> High</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical (&gt;60%)</span>
                    </div>

                    {/* Region breakdown by fish type (stacked horizontal bars) */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-700 font-bold mb-2 uppercase tracking-wide">By Fish Type</p>
                      <ScanBarChart
                        data={MOLD_SPATIAL_BY_TYPE}
                        bars={Object.entries(FISH_COLORS).map(([key, color]) => ({ key, color }))}
                        xKey="region"
                        height={180}
                        layout="horizontal"
                        stacked
                        valueFormatter={(v) => `${v}%`}
                      />
                    </div>
                  </div>

                  {/* Defect Analytics */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">⚠️ Defect Analytics</p>
                    <p className="text-[10px] text-slate-500 mb-3 italic">Non-mold quality issues — category distribution and severity trend</p>

                    {/* Defect category bar */}
                    <ScanBarChart
                      data={DEFECT_CATEGORIES.map(d => ({ ...d, category: d.category }))}
                      bars={[{ key: 'count', color: '#ef4444' }]}
                      xKey="category"
                      height={180}
                      valueFormatter={(v) => v.toLocaleString()}
                    />

                    {/* Category legend with counts */}
                    <div className="mt-3 space-y-1.5">
                      {DEFECT_CATEGORIES.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-xs text-slate-700 flex-1">{d.category}</span>
                          <span className="text-xs font-semibold text-slate-900">{d.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Defect severity trend */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-700 font-bold mb-2 uppercase tracking-wide">Defect Severity Trend</p>
                      <ScanAreaChart
                        data={DEFECT_TREND}
                        areas={[{ key: 'severity', color: '#ef4444' }]}
                        xKey="period"
                        height={140}
                        showLegend={false}
                        valueFormatter={(v) => `${v}%`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ───── Tab C: Quality & Price ───── */}
              {activeTab === 'quality-price' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Quality Grade Distribution */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">📊 Quality Grade Distribution</p>
                    <p className="text-[10px] text-slate-500 mb-2 italic">Import / Export / Reject classification outcome</p>
                    <ScanDonut slices={QUALITY_DISTRIBUTION} height={160} />
                    <div className="mt-3 space-y-1.5">
                      {QUALITY_DISTRIBUTION.map((q, i) => (
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
                        data={QUALITY_TREND}
                        bars={[
                          { key: 'Import', color: QUALITY_COLORS.Import },
                          { key: 'Export', color: QUALITY_COLORS.Export },
                          { key: 'Reject', color: QUALITY_COLORS.Reject },
                        ]}
                        xKey="period"
                        height={160}
                        stacked
                        valueFormatter={(v) => `${v}%`}
                      />
                    </div>
                  </div>

                  {/* Price Estimate Analytics */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">💰 AI Price Estimate Analytics</p>
                    <p className="text-[10px] text-slate-500 mb-3 italic">AI-predicted market price trends and comparison by fish type</p>

                    {/* Price trend line */}
                    <ScanAreaChart
                      data={PRICE_TREND}
                      areas={[{ key: 'price', color: '#6366f1' }]}
                      xKey="period"
                      height={180}
                      showLegend={false}
                      valueFormatter={(v) => `₱${v}`}
                    />

                    {/* Price by fish type */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-700 font-bold mb-2 uppercase tracking-wide">Avg Price by Fish Type</p>
                      <ScanBarChart
                        data={PRICE_BY_TYPE}
                        bars={[{ key: 'price', color: '#6366f1' }]}
                        xKey="type"
                        height={160}
                        valueFormatter={(v) => `₱${v}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ───── Tab D: Color Consistency ───── */}
              {activeTab === 'color' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Color Score Distribution */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-900 font-bold">🎨 Color Consistency — Score Distribution</p>
                    <p className="text-[10px] text-slate-500 mb-4 italic">Distribution of scans across color quality bands</p>

                    <div className="space-y-3">
                      {COLOR_DISTRIBUTION.map((band, i) => {
                        const maxCount = Math.max(...COLOR_DISTRIBUTION.map(d => d.count))
                        const pct = ((band.count / SCAN_RECORDS.length) * 100).toFixed(1)
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
                        <p className="text-lg font-bold text-slate-900">{COLOR_DISTRIBUTION.reduce((s, d) => s + d.count, 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">Total Assessed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {(((COLOR_DISTRIBUTION[0].count + COLOR_DISTRIBUTION[1].count) / COLOR_DISTRIBUTION.reduce((s, d) => s + d.count, 0)) * 100).toFixed(1)}%
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
                      data={COLOR_TREND}
                      areas={[{ key: 'score', color: '#10b981' }]}
                      xKey="period"
                      height={220}
                      showLegend={false}
                      valueFormatter={(v) => `${v}/100`}
                    />

                    {/* Current score highlight */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">88</p>
                        <p className="text-[10px] text-slate-500">Current Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-700">82.3</p>
                        <p className="text-[10px] text-slate-500">12-Month Avg</p>
                      </div>
                      <div className="text-center">
                        <DynamicPercentageBadge value={7.7} size="lg" />
                        <p className="text-[10px] text-slate-500 mt-1">Year-over-Year</p>
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
                    {['Scan ID', 'Date', 'Scanner', 'Fish Type', 'Mold %', 'Defect %', 'Top Defect', 'Hotspot', 'Color', 'Grade', 'Price Est.', 'Status'].map((h, i) => (
                      <th key={i} className="text-left px-3 py-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length === 0 ? (
                    <tr><td colSpan={12} className="text-center py-8 text-slate-400 text-sm">No scan records found</td></tr>
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
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs font-semibold" style={{ color: row.defectPct > 25 ? '#ef4444' : row.defectPct > 15 ? '#f59e0b' : '#22c55e' }}>
                        {row.defectPct}%
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs text-slate-600">{row.topDefect}</td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs text-slate-600">{row.moldHotspot}</td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <Badge size="sm" variant="light"
                          color={row.colorScore === 'Excellent' ? 'green' : row.colorScore === 'Good' ? 'blue' : row.colorScore === 'Fair' ? 'yellow' : 'red'}>
                          {row.colorScore}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <Badge size="sm" variant="light"
                          color={row.qualityGrade === 'Import' ? 'green' : row.qualityGrade === 'Export' ? 'blue' : 'red'}>
                          {row.qualityGrade}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-xs font-semibold text-indigo-600">
                        ₱{row.priceEstimate}
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
