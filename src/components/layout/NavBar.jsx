// src/components/layout/NavBar.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mountain, Sun, Moon, Trees, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme, THEMES } from '../../context/ThemeContext'

const THEME_ICONS = {
  [THEMES.LIGHT]: Sun,
  [THEMES.DARK]: Moon,
  [THEMES.TREK]: Trees,
}

export default function NavBar() {
  const { currentUser, logout } = useAuth()
  const { theme, cycleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const ThemeIcon = THEME_ICONS[theme] || Sun

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-app-surface/95 backdrop-blur no-print">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-app-text">
          <Mountain size={20} className="text-app-primary" />
          <span>TrailPlan</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-full text-app-muted hover:bg-app-surfaceAlt hover:text-app-text transition"
            title={`Theme: ${theme}`}
            aria-label="Toggle theme"
          >
            <ThemeIcon size={18} />
          </button>

          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-app-surfaceAlt transition"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-app-primary text-app-primaryText flex items-center justify-center text-xs font-semibold">
                    {(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <ChevronDown size={14} className="text-app-muted" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-app-border bg-app-surface shadow-lg z-20 overflow-hidden">
                    <div className="px-3 py-2 border-b border-app-border">
                      <p className="text-sm font-medium text-app-text truncate">
                        {currentUser.displayName || 'Traveler'}
                      </p>
                      <p className="text-xs text-app-muted truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-app-danger hover:bg-app-surfaceAlt transition"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
