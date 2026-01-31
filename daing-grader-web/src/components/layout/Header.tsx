import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LogIn, User } from 'lucide-react'

/**
 * Website title arrangement (left side): TUP-T Logo | DaingGrader Logo | DaingGrader
 * Where to put logo image files:
 *   - TUP-T logo:  public/assets/logos/tup-t-logo.png   → use src="/assets/logos/tup-t-logo.png"
 *   - DaingGrader logo:  public/assets/logos/dainggrader-logo.png   → use src="/assets/logos/dainggrader-logo.png"
 */
const TUP_T_LOGO_SRC = '/assets/logos/tup-t-logo.png'
const DAINGGRADER_LOGO_SRC = '/assets/logos/dainggrader-logo.png'

export default function Header() {
  return (
    <header className="bg-surface border-b border-slate-200/80 sticky top-0 z-20 shadow-soft">
      <div className="flex items-center justify-between h-14 pl-14 pr-4 lg:pl-6">
        {/* Left: TUP-T Logo | DaingGrader Logo | DaingGrader (coconut-page style) */}
        <Link to="/" className="flex items-center gap-4 shrink-0">
          {/* TUP-T Logo - replace with <img src={TUP_T_LOGO_SRC} alt="TUP-T" /> when file is in public/assets/logos/tup-t-logo.png */}
          <img src="/assets/logos/tup-t-logo.png" alt="TUP-T" className="h-10 w-auto" />
          {/* DaingGrader Logo - replace with <img src={DAINGGRADER_LOGO_SRC} alt="DaingGrader" /> when file is in public/assets/logos/dainggrader-logo.png */}
          <img src="/assets/logos/dainggrader-logo.png" alt="DaingGrader" className="h-10 w-auto" />
          <div className="hidden sm:block border-l border-slate-300 pl-4">
            <div className="text-lg font-semibold text-slate-800">DaingGrader</div>
            <div className="text-xs text-slate-500">Dried Fish Quality Grader</div>
          </div>
        </Link>

        <div className="flex-1 min-w-0" />

        <div className="flex items-center gap-2">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive ? 'text-primary bg-primary/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
            }
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign in</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive ? 'text-primary bg-primary/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
            }
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </NavLink>
          <div
            className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm border border-primary/30"
            title="User avatar"
          >
            U
          </div>
        </div>
      </div>
    </header>
  )
}
