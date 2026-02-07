/**
 * Admin Dashboard - exclusive landing page for admin users.
 * Clean design with thin borders inspired by monday.com.
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Users, ScanLine, Database, MessageCircle, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStat {
  label: string
  value: string
  icon: React.ElementType
  change?: string
  link?: string
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStat[]>([
    { label: 'Total Users', value: '—', icon: Users, change: '+12%', link: '/analytics' },
    { label: 'Scans Today', value: '—', icon: ScanLine, change: '+8%', link: '/history' },
    { label: 'Dataset Images', value: '—', icon: Database, link: '/dataset' },
    { label: 'Active Sellers', value: '—', icon: ShoppingBag, link: '/shop' },
  ])

  // Placeholder - in real app, fetch from backend
  useEffect(() => {
    setTimeout(() => {
      setStats([
        { label: 'Total Users', value: '247', icon: Users, change: '+12%', link: '/analytics' },
        { label: 'Scans Today', value: '89', icon: ScanLine, change: '+8%', link: '/history' },
        { label: 'Dataset Images', value: '1,542', icon: Database, link: '/dataset' },
        { label: 'Active Sellers', value: '12', icon: ShoppingBag, link: '/shop' },
      ])
    }, 500)
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 border border-black/10 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">👑</span>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>
        <p className="text-slate-600">
          Welcome back, <span className="font-semibold text-slate-800">{user?.name || 'Admin'}</span>. 
          Here's what's happening with DaingGrader today.
        </p>
      </div>

      {/* Stats grid - 4 columns with clean borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const content = (
            <div className="bg-white rounded-xl p-6 border border-black/10 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          )

          return stat.link ? (
            <Link key={stat.label} to={stat.link} className="block cursor-pointer">
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          )
        })}
      </div>

      {/* Quick actions grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/analytics"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <BarChart2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">View Analytics</div>
              <div className="text-sm text-slate-600">System usage & trends</div>
            </div>
          </Link>

          <Link
            to="/history"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <ScanLine className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Scan History</div>
              <div className="text-sm text-slate-600">All user scans</div>
            </div>
          </Link>

          <Link
            to="/dataset"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Manage Dataset</div>
              <div className="text-sm text-slate-600">Training images</div>
            </div>
          </Link>

          <Link
            to="/forum"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Community Forum</div>
              <div className="text-sm text-slate-600">Moderate discussions</div>
            </div>
          </Link>

          <Link
            to="/shop"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
              <ShoppingBag className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">E-commerce</div>
              <div className="text-sm text-slate-600">Seller management</div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/10 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">User Management</div>
              <div className="text-sm text-slate-600">Roles & permissions</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent activity placeholder - clean table design */}
      <div className="bg-white rounded-xl p-6 border border-black/10 shadow-card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
        <div className="flex items-center gap-3 py-8 text-slate-500 justify-center">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Activity tracking will be available soon</span>
        </div>
      </div>
    </div>
  )
}
