import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogIn, User, UserPlus, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

/**
 * Website title arrangement (left side): TUP-T Logo | DaingGrader Logo | DaingGrader
 * Where to put logo image files:
 *   - TUP-T logo:  public/assets/logos/tup-t-logo.png   → use src="/assets/logos/tup-t-logo.png"
 *   - DaingGrader logo:  public/assets/logos/dainggrader-logo.png   → use src="/assets/logos/dainggrader-logo.png"
 */

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    showToast('Logging out...')
    logout()
    navigate('/')
  }

  return (
    <header className="bg-surface border-b border-slate-200/80 sticky top-0 z-20 shadow-soft">
      <div className="flex items-end justify-between h-14 pl-14 pr-4 lg:pl-6 pb-1">
        <Link to="/" className="flex items-end gap-4 shrink-0 group">
          <img src="/assets/logos/tup-t-logo.png" alt="TUP-T" className="h-10 w-auto transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg" />
          <img src="/assets/logos/dainggrader-logo.png" alt="DaingGrader" className="h-10 w-auto transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg" />
          <div className="hidden sm:block border-l border-slate-300 pl-4">
            <div className="text-lg font-semibold text-slate-800">DaingGrader</div>
            <div className="text-xs text-slate-500">Dried Fish Quality Grader</div>
          </div>
        </Link>

        <div className="flex-1 min-w-0" />

        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${isActive ? 'text-primary bg-primary/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5'}`
                }
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${isActive ? 'text-primary bg-primary/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5'}`
                }
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Up</span>
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
              ${isActive ? 'text-primary bg-primary/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5'}`
            }
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </NavLink>

          <div
            className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm border border-primary/30 overflow-hidden flex-shrink-0"
            title="User avatar"
          >
            {isLoggedIn && user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{isLoggedIn ? (user?.name?.charAt(0)?.toUpperCase() || 'U') : '?'}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
