import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  Home,
  Database,
  Users,
  BookOpen,
  Mail,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileText,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/dataset', label: 'Dataset', icon: Database },
  { to: '/about', label: 'About Us', icon: Users },
  { to: '/about-daing', label: 'About Daing', icon: BookOpen },
  { to: '/contact', label: 'Contact Us', icon: Mail },
]

const publicationItems = [
  { to: '/publications/local', label: 'Local' },
  { to: '/publications/foreign', label: 'Foreign' },
]

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [publicationsOpen, setPublicationsOpen] = useState(false)

  const toggleCollapse = () => {
    setSidebarCollapsed((c) => !c)
  }

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200"
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'auto' : 'none' }}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar - collapsible with arrow on the edge */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 flex
          bg-sidebar text-white
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-64 lg:w-64'}
        `}
      >
        <div className="flex flex-col min-h-screen flex-1 min-w-0">
          <div className="flex items-center justify-between p-4 border-b border-white/10 lg:border-0 shrink-0">
            {!sidebarCollapsed && (
              <Link to="/" className="flex items-center gap-3 min-w-0" onClick={() => setSidebarOpen(false)}>
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-soft shrink-0">
                  DG
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">DaingGrader</div>
                  <div className="text-xs text-white/70 truncate">Educational Fish Grading</div>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/" className="mx-auto" onClick={() => setSidebarOpen(false)}>
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-soft">
                  DG
                </div>
              </Link>
            )}
            <button
              className="p-2 rounded-lg hover:bg-sidebar-hover transition-colors lg:hidden shrink-0"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
            <div className="px-3 space-y-0.5">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center px-2' : ''}
                    ${isActive ? 'bg-sidebar-active-bg text-white border-l-2 border-sidebar-active' : 'text-white/90 hover:bg-sidebar-hover hover:text-white'}`
                  }
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0 opacity-90" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </NavLink>
              ))}

              {/* Publications dropdown */}
              <div className="pt-2">
                <button
                  onClick={() => setPublicationsOpen(!publicationsOpen)}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center px-2' : ''}
                    text-white/90 hover:bg-sidebar-hover hover:text-white
                  `}
                  title={sidebarCollapsed ? 'Publications' : undefined}
                >
                  <FileText className="w-5 h-5 shrink-0 opacity-90" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">Publications</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${publicationsOpen ? '' : '-rotate-90'}`} />
                    </>
                  )}
                </button>
                {publicationsOpen && !sidebarCollapsed && (
                  <div className="mt-1 ml-4 space-y-0.5 border-l border-white/20 pl-3">
                    {publicationItems.map(({ to, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all duration-200
                          ${isActive ? 'bg-sidebar-active-bg text-white' : 'text-white/85 hover:bg-sidebar-hover'}`
                        }
                      >
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!sidebarCollapsed && (
              <div className="mt-6 px-3">
                <button
                  className="flex items-center gap-2 w-full text-left text-xs font-semibold text-white/60 uppercase tracking-wider py-2 hover:text-white/80 transition-colors"
                  onClick={() => setWorkspaceOpen(!workspaceOpen)}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${workspaceOpen ? '' : '-rotate-90'}`} />
                  Workspace
                </button>
                {workspaceOpen && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/"
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                        ${isActive ? 'bg-sidebar-active-bg text-white ring-1 ring-sidebar-active/50' : 'text-white/85 hover:bg-sidebar-hover'}`
                      }
                    >
                      <span className="w-6 h-6 rounded bg-primary/80 flex items-center justify-center text-xs font-bold">D</span>
                      DaingGrader
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Collapse/expand arrow - middle of sidebar edge */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-sidebar border border-white/20 rounded-r-lg flex items-center justify-center text-white/80 hover:bg-sidebar-hover hover:text-white transition-colors shadow-md"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile menu button (hamburger) */}
      <button
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-sidebar text-white shadow-soft lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  )
}
