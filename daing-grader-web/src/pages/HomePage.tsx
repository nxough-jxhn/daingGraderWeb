import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import HeroCarousel from '../components/home/HeroCarousel'
import { getHistory, type HistoryEntry } from '../services/api'
import { publications } from '../data/publications'
import { ExternalLink, Loader2 } from 'lucide-react'

const RECENT_SCANS_COUNT = 5
const FEATURED_PUBLICATIONS_COUNT = 5

export default function HomePage() {
  const [recentScans, setRecentScans] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then((entries) => setRecentScans(entries.slice(0, RECENT_SCANS_COUNT)))
      .catch(() => setRecentScans([]))
      .finally(() => setHistoryLoading(false))
  }, [])

  const featuredPubs = publications.slice(0, FEATURED_PUBLICATIONS_COUNT)

  return (
    <div className="space-y-10">
      {/* Carousel: full width, no card/borders */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <HeroCarousel />
      </div>

      {/* Recent Scans - last 5 from history */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 border-b-2 border-primary pb-2 w-fit">
          Recent Scans
        </h2>
        {historyLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        ) : recentScans.length === 0 ? (
          <p className="text-slate-500 py-8">No scans yet. Grade a dried fish image to see your recent scans here.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {recentScans.map((entry) => (
                <Link
                  key={entry.id}
                  to="/history"
                  className="group block rounded-lg border border-sidebar-subtle overflow-hidden bg-white shadow-sidebar-subtle hover:shadow-sidebar-md hover:border-slate-300 transition-all"
                >
                  <div className="aspect-square flex items-center justify-center bg-slate-200">
                    <img src={entry.url} alt={`Scan ${entry.timestamp}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-slate-600 truncate" title={new Date(entry.timestamp).toLocaleString()}>
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              <Link to="/history" className="text-primary font-medium hover:underline">
                View all history →
              </Link>
            </p>
          </>
        )}
      </section>

      {/* Featured Publications */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 border-b-2 border-primary pb-2 w-fit">
          Featured Publications
        </h2>
        <div className="space-y-0 divide-y divide-slate-200">
          {featuredPubs.map((pub) => (
            <div key={pub.id} className="py-4 first:pt-0">
              <h3 className="font-semibold text-slate-900 text-base">{pub.title}</h3>
              {pub.authors && (
                <p className="text-sm text-slate-600 mt-0.5">{pub.authors}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                {pub.publication}
                {pub.year && ` (${pub.year})`}
              </p>
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-2 hover:underline"
              >
                Read more →
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          <Link to="/publications/local" className="text-primary font-medium hover:underline">
            Local publications
          </Link>
          {' · '}
          <Link to="/publications/foreign" className="text-primary font-medium hover:underline">
            Foreign publications
          </Link>
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="card border border-sidebar-subtle shadow-sidebar-subtle hover:shadow-sidebar-md">
          <h3 className="text-lg font-semibold">About DaingGrader</h3>
          <p className="text-sm text-muted mt-2">
            DaingGrader is an AI-powered system for assessing the quality of dried fish (daing). It helps processors, traders, and researchers classify dried fish into quality grades (Export, Local, or Reject) using image-based analysis. The system detects mold, surface defects, and color uniformity to support food safety and consistent grading.
          </p>
        </div>
        <div className="card border border-sidebar-subtle shadow-sidebar-subtle hover:shadow-sidebar-md">
          <h3 className="text-lg font-semibold">Key Features</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• <strong>Image grading</strong> — Upload or capture daing images for AI analysis</li>
            <li>• <strong>History & storage</strong> — Scans saved to the cloud with timestamps</li>
            <li>• <strong>Multiple daing types</strong> — Espada, Danggit, Dalagang Bukid, Flying Fish, Bisugo</li>
            <li>• <strong>Research references</strong> — Local and foreign publications on dried fish quality</li>
          </ul>
        </div>
      </section>

      <section className="grid md:grid-cols-1 gap-6">
        <div className="card border border-sidebar-subtle shadow-sidebar-subtle hover:shadow-sidebar-md">
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-sidebar-subtle shadow-sidebar-subtle">
              Daing types<br /><strong>5</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-sidebar-subtle shadow-sidebar-subtle">
              Quality grades<br /><strong>3</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
