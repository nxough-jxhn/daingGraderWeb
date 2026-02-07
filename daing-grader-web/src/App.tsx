import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import DatasetPage from './pages/DatasetPage'
import DatasetImageDetailPage from './pages/DatasetImageDetailPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import AboutUsPage from './pages/AboutUsPage'
import AboutDaingTypePage from './pages/AboutDaingTypePage'
import GradePage from './pages/GradePage'
import HistoryPage from './pages/HistoryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ContactPage from './pages/ContactPage'
import PublicationsPage from './pages/PublicationsPage'
import CommunityForumPage from './pages/CommunityForumPage'
import EcommercePage from './pages/EcommercePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import { useAuth } from './contexts/AuthContext'
import { useToast } from './contexts/ToastContext'

type Role = 'user' | 'seller' | 'admin'

function RoleRoute({ allowed, children }: { allowed: Role[]; children: React.ReactElement }) {
  const { isLoggedIn, isLoading, user } = useAuth()
  const { showToast } = useToast()
  const [accessDenied, setAccessDenied] = React.useState(false)
  const role = user?.role ?? 'user'

  // Show toast when access is denied
  useEffect(() => {
    if (!isLoading && isLoggedIn && !allowed.includes(role)) {
      const requiredRole = allowed.length === 1 ? allowed[0] : allowed.join(' or ')
      showToast(`🚫 Access Denied. ${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} Only`)
      setAccessDenied(true)
    }
  }, [isLoading, isLoggedIn, role, allowed, showToast])

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (isLoading) {
    return (
      <div className="card max-w-xl text-center py-12">
        <div className="text-slate-500">Loading access…</div>
      </div>
    )
  }

  if (!allowed.includes(role)) {
    return (
      <div className="card max-w-xl text-center py-12 border border-black/10 shadow-card">
        <div className="text-6xl mb-4">🚫</div>
        <div className="text-slate-700 font-semibold mb-2 text-xl">Access Denied</div>
        <div className="text-slate-500">
          This page is restricted to <span className="font-medium capitalize">{allowed.join(' or ')}</span> users only.
        </div>
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/admin" element={<Layout><RoleRoute allowed={['admin']}><AdminDashboardPage /></RoleRoute></Layout>} />
      <Route path="/grade" element={<Layout><GradePage /></Layout>} />
      <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
      <Route path="/analytics" element={<Layout><RoleRoute allowed={['admin']}><AnalyticsPage /></RoleRoute></Layout>} />
      <Route path="/forum" element={<Layout><CommunityForumPage /></Layout>} />
      <Route path="/shop" element={<Layout><RoleRoute allowed={['seller', 'admin']}><EcommercePage /></RoleRoute></Layout>} />
      <Route path="/dataset" element={<Layout><DatasetPage /></Layout>} />
      <Route path="/dataset/:id" element={<Layout><DatasetImageDetailPage /></Layout>} />
      <Route path="/login" element={<Layout><LoginPage /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      <Route path="/about" element={<Layout><AboutUsPage /></Layout>} />
      <Route path="/about-daing" element={<Navigate to="/about-daing/espada" replace />} />
      <Route path="/about-daing/:slug" element={<Layout><AboutDaingTypePage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/publications" element={<Navigate to="/publications/local" replace />} />
      <Route path="/publications/local" element={<Layout><PublicationsPage type="local" /></Layout>} />
      <Route path="/publications/foreign" element={<Layout><PublicationsPage type="foreign" /></Layout>} />
    </Routes>
  )
}
