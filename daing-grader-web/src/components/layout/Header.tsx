import React from 'react'
import { NavLink } from 'react-router-dom'
import { LogIn, User } from 'lucide-react'

/**
 * Top bar only – main nav lives in Sidebar.
 * Shows Sign in / Profile and optional search.
 */
export default function Header() {
  return (
    <header className="bg-surface border-b border-slate-200/80 sticky top-0 z-20 shadow-soft">
      <div className="flex items-center justify-between h-14 pl-14 pr-4 lg:pl-6">
        {/* Brand on mobile only (sidebar has logo on desktop) */}
        <div className="lg:hidden font-semibold text-slate-800 truncate">DaingGrader</div>
        <div className="hidden lg:block flex-1 min-w-0" />

        <div className="flex-1 min-w-0 lg:flex-none" />

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
