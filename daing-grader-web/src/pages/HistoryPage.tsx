/**
 * History page: saved scan images from Cloudinary, grouped by date. Same data as mobile.
 * Click an image to open a full-size modal.
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageTitleHero from '../components/layout/PageTitleHero'
import { getHistory, type HistoryEntry } from '../services/api'
import { History, X, Loader2, ImageOff } from 'lucide-react'

/** Group entries by date (YYYY-MM-DD). */
function groupByDate(entries: HistoryEntry[]): { date: string; label: string; items: HistoryEntry[] }[] {
  const map = new Map<string, HistoryEntry[]>()
  for (const e of entries) {
    const date = e.timestamp.slice(0, 10)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(e)
  }
  const sorted = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  return sorted.map(([date, items]) => ({
    date,
    label: formatDateLabel(date),
    items,
  }))
}

function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalEntry, setModalEntry] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    // AbortController prevents "red canceled" requests in React Strict Mode (dev double-mount)
    const controller = new AbortController()

    getHistory(controller.signal)
      .then((data) => {
        setEntries(data)
        setError(null)
      })
      .catch((err) => {
        // Ignore cancelled requests (e.g. React Strict Mode double-mount or component unmount)
        if ((err as { code?: string }).code === 'ERR_CANCELED') return
        setError('Could not load history. Is the backend running?')
      })
      .finally(() => setLoading(false))

    // Cleanup: cancel the request if component unmounts before response arrives
    return () => controller.abort()
  }, [])

  const groups = groupByDate(entries)

  return (
    <div className="space-y-8">
      <PageTitleHero
        title="Scan History"
        subtitle="Your saved analysis images from the cloud, organized by date."
        backgroundImage="/assets/page-hero/history.jpg"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="card max-w-xl">
          <div className="text-red-600 flex items-center gap-2">
            <ImageOff className="w-5 h-5" />
            {error}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="card max-w-xl text-center py-12">
          <History className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">No scans yet</h2>
          <p className="text-slate-600 mb-4">Analyze a dried fish image on the Grade page to see your history here.</p>
          <Link
            to="/grade"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Go to Grade
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(({ date, label, items }) => (
            <section key={date}>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">{label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setModalEntry(entry)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sidebar-subtle hover:shadow-sidebar-md hover:border-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <img
                      src={entry.url}
                      alt={`Scan ${formatTime(entry.timestamp)}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {formatTime(entry.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Full-size image modal */}
      {modalEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalEntry(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View image"
        >
          <button
            type="button"
            onClick={() => setModalEntry(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalEntry.url}
              alt={`Scan ${formatTime(modalEntry.timestamp)}`}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <p className="text-white/90 text-sm mt-2 text-center">{formatDateLabel(modalEntry.timestamp)} at {formatTime(modalEntry.timestamp)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
