import React from 'react'
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
import ContactPage from './pages/ContactPage'
import PublicationsPage from './pages/PublicationsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/grade" element={<Layout><GradePage /></Layout>} />
      <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
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
