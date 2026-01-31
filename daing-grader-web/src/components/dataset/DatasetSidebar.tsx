import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Upload,
  PenTool,
  Database,
  GitBranch,
  BarChart3,
  Tag,
  Zap,
  Boxes,
  Eye,
  Rocket,
  ArrowLeft,
} from 'lucide-react'

const dataNavItems = [
  { to: '/dataset/upload', label: 'Upload Data', icon: Upload },
  { to: '/dataset/annotate', label: 'Annotate', icon: PenTool },
  { to: '/dataset', label: 'Dataset', icon: Database, badge: '174' },
  { to: '/dataset/versions', label: 'Versions', icon: GitBranch },
  { to: '/dataset/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dataset/classes', label: 'Classes & Tags', icon: Tag },
]

const modelsNavItems = [
  { to: '/dataset/train', label: 'Train', icon: Zap },
  { to: '/dataset/models', label: 'Models', icon: Boxes },
  { to: '/dataset/visualize', label: 'Visualize', icon: Eye },
]

const deployNavItems = [
  { to: '/dataset/deploy', label: 'Deployments', icon: Rocket },
]

export default function DatasetSidebar() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path || (path === '/dataset' && location.pathname.startsWith('/dataset') && !location.pathname.includes('/upload') && !location.pathname.includes('/annotate'))

  return (
    <aside className="w-64 bg-surface border-r border-slate-200 flex flex-col min-h-screen">
      {/* Back to main nav */}
      <div className="p-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold text-sm">DAINGGRADER</span>
        </Link>
      </div>

      {/* Project context card */}
      <div className="p-4 border-b border-slate-200">
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-card">
          <div className="relative w-full aspect-square bg-slate-100 rounded overflow-hidden mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Database className="w-8 h-8 text-primary" />
              </div>
            </div>
            {/* Orange annotation overlay (mock) */}
            <div className="absolute inset-2 border-2 border-orange-500 rounded" />
          </div>
          <button className="w-full bg-slate-900 text-white text-xs font-medium py-2 rounded-md hover:bg-slate-800 transition-colors mb-2">
            View on Universe
          </button>
          <div className="text-sm font-semibold text-slate-900">DaingGrader</div>
          <div className="text-xs text-slate-500 mt-0.5">Object Detection</div>
          <button className="mt-2 text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* DATA section */}
        <div className="px-3 mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            DATA
          </div>
          <div className="space-y-0.5">
            {dataNavItems.map(({ to, label, icon: Icon, badge }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(to)
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive(to) ? 'text-white' : 'text-slate-500'}`} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive(to) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* MODELS section */}
        <div className="px-3 mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            MODELS
          </div>
          <div className="space-y-0.5">
            {modelsNavItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(to)
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive(to) ? 'text-white' : 'text-slate-500'}`} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* DEPLOY section */}
        <div className="px-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            DEPLOY
          </div>
          <div className="space-y-0.5">
            {deployNavItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(to)
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive(to) ? 'text-white' : 'text-slate-500'}`} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}
