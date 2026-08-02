// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  TREK: 'trek',
}

const STORAGE_KEY = 'trailplan.theme'
const ThemeContext = createContext(null)

function getInitialTheme() {
  if (typeof window === 'undefined') return THEMES.LIGHT
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved && Object.values(THEMES).includes(saved)) return saved
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? THEMES.DARK : THEMES.LIGHT
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === THEMES.DARK)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function cycleTheme() {
    setTheme((t) => {
      if (t === THEMES.LIGHT) return THEMES.DARK
      if (t === THEMES.DARK) return THEMES.TREK
      return THEMES.LIGHT
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
