import React, { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Home,
  Users,
  BookOpen,
  Mail,
  ChevronDown,
  Menu,
  X,
  FileText,
  ScanLine,
  History,
  BarChart2,
  User,
  LogIn,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const SIDEBAR_LOGO_SRC = '/assets/logos/dainggrader-logo.png'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/grade', label: 'Grade', icon: ScanLine },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  // Dataset hidden for now: { to: '/dataset', label: 'Dataset', icon: Database },
  { to: '/about', label: 'About Us', icon: Users },
  { to: '/contact', label: 'Contact Us', icon: Mail },
  { to: '/profile', label: 'Profile', icon: User },
]

const aboutDaingItems = [
  { to: '/about-daing/espada', label: 'Espada' },
  { to: '/about-daing/danggit', label: 'Danggit' },
  { to: '/about-daing/dalagang-bukid', label: 'Dalagang Bukid' },
  { to: '/about-daing/flying-fish', label: 'Flying Fish' },
  { to: '/about-daing/bisugo', label: 'Bisugo' },
]

const publicationItems = [
  { to: '/publications/local', label: 'Local' },
  { to: '/publications/foreign', label: 'Foreign' },
]

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const [aboutDaingOpen, setAboutDaingOpen] = useState(false)
  const [publicationsOpen, setPublicationsOpen] = useState(false)

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation()
    logout()
    onOpenChange(false)
    navigate('/')
  }

  const handleSidebarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open) onOpenChange(true)
  }

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Sidebar: fixed so it doesn't scroll; click anywhere to open when closed */}
      <aside
        onClick={handleSidebarClick}
        className={`
          fixed top-0 left-0 z-50 flex h-screen cursor-pointer lg:cursor-default
          bg-sidebar text-white
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0 w-64 lg:w-64' : '-translate-x-full lg:translate-x-0 lg:w-16'}
        `}
      >
        <div className="flex flex-col min-h-screen flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between p-4 border-b border-white/10 lg:border-0 shrink-0">
            {open ? (
              <Link to="/" className="flex items-center gap-3 min-w-0" onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}>
                <img src={SIDEBAR_LOGO_SRC} alt="DaingGrader" className="h-10 w-10 object-contain shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">DaingGrader</div>
                  <div className="text-xs text-white/70 truncate">Dried Fish Quality Grader</div>
                </div>
              </Link>
            ) : (
              /* Logo always visible when sidebar is closed - click to open */
              <Link
                to="/"
                className="mx-auto flex items-center justify-center w-full py-3 rounded-lg transition-all duration-200 hover:bg-white/10 hover:shadow-md"
                onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}
                title="DaingGrader - click to open menu"
              >
                <img src={SIDEBAR_LOGO_SRC} alt="DaingGrader" className="h-10 w-10 object-contain" />
              </Link>
            )}
            <button
              className="p-2 rounded-lg hover:bg-sidebar-hover transition-colors lg:hidden shrink-0"
              onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* When open: full nav with labels and dropdowns */}
          {open && (
            <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-3 space-y-0.5">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => onOpenChange(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive ? 'bg-sidebar-active-bg text-white border-l-2 border-sidebar-active' : 'text-white/90 hover:bg-sidebar-hover hover:text-white'}`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0 opacity-90" />
                    <span>{label}</span>
                  </NavLink>
                ))}

                {/* About Daing dropdown */}
                <div className="pt-2">
                  <button
                    onClick={() => setAboutDaingOpen(!aboutDaingOpen)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-white/90 hover:bg-sidebar-hover hover:text-white"
                  >
                    <BookOpen className="w-5 h-5 shrink-0 opacity-90" />
                    <span className="flex-1 text-left">About Daing</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${aboutDaingOpen ? '' : '-rotate-90'}`} />
                  </button>
                  {aboutDaingOpen && (
                    <div className="mt-1 ml-4 space-y-0.5 border-l border-white/20 pl-3">
                      {aboutDaingItems.map(({ to, label }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={() => onOpenChange(false)}
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

                {/* Publications dropdown */}
                <div className="pt-2">
                  <button
                    onClick={() => setPublicationsOpen(!publicationsOpen)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-white/90 hover:bg-sidebar-hover hover:text-white"
                  >
                    <FileText className="w-5 h-5 shrink-0 opacity-90" />
                    <span className="flex-1 text-left">Publications</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${publicationsOpen ? '' : '-rotate-90'}`} />
                  </button>
                  {publicationsOpen && (
                    <div className="mt-1 ml-4 space-y-0.5 border-l border-white/20 pl-3">
                      {publicationItems.map(({ to, label }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={() => onOpenChange(false)}
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
            </nav>
          )}

          {/* When closed (lg only): icon-only buttons that only open sidebar (no nav yet) */}
          {!open && (
            <nav className="hidden lg:flex flex-1 flex-col items-center py-4 gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 text-white/90 hover:bg-sidebar-hover hover:text-white hover:scale-110"
                  title={label}
                >
                  <Icon className="w-5 h-5 shrink-0 opacity-90" />
                </Link>
              ))}
              <Link
                to="/about-daing/espada"
                onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 text-white/90 hover:bg-sidebar-hover hover:text-white hover:scale-110"
                title="About Daing"
              >
                <BookOpen className="w-5 h-5 shrink-0 opacity-90" />
              </Link>
              <Link
                to="/publications/local"
                onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 text-white/90 hover:bg-sidebar-hover hover:text-white hover:scale-110"
                title="Publications"
              >
                <FileText className="w-5 h-5 shrink-0 opacity-90" />
              </Link>
            </nav>
          )}

          {/* Bottom: Login or Logout depending on auth status */}
          <div className="border-t border-white/10 pt-3 mt-auto shrink-0" onClick={(e) => e.stopPropagation()}>
            {open ? (
              isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-sidebar-hover hover:text-white transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 shrink-0 opacity-90" />
                  <span>Logout</span>
                </button>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => onOpenChange(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive ? 'bg-sidebar-active-bg text-white' : 'text-white/90 hover:bg-sidebar-hover hover:text-white'}`
                  }
                >
                  <LogIn className="w-5 h-5 shrink-0 opacity-90" />
                  <span>Login</span>
                </NavLink>
              )
            ) : (
              isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white/90 hover:bg-sidebar-hover hover:text-white transition-all duration-200 mx-auto"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 shrink-0 opacity-90" />
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white/90 hover:bg-sidebar-hover hover:text-white transition-all duration-200 mx-auto"
                  title="Login"
                >
                  <LogIn className="w-5 h-5 shrink-0 opacity-90" />
                </Link>
              )
            )}
          </div>
        </div>
      </aside>

      {/* Mobile menu button (hamburger) */}
      <button
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-sidebar text-white shadow-soft lg:hidden"
        onClick={() => onOpenChange(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  )
}
