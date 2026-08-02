// src/components/layout/TripTabs.jsx
import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { LayoutDashboard, Plane, CalendarDays, ListChecks, Wallet, Map, Users } from 'lucide-react'

const TABS = [
  { to: 'overview', label: 'Overview', icon: LayoutDashboard },
  { to: 'logistics', label: 'Logistics', icon: Plane },
  { to: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { to: 'packing', label: 'Packing', icon: ListChecks },
  { to: 'expenses', label: 'Expenses', icon: Wallet },
  { to: 'maps', label: 'Trail Map', icon: Map },
  { to: 'members', label: 'Members', icon: Users },
]

export default function TripTabs() {
  const { tripId } = useParams()

  return (
    <>
      {/* Desktop / tablet: horizontal tab bar */}
      <nav className="no-print hidden sm:flex gap-1 border-b border-app-border px-4 max-w-6xl mx-auto overflow-x-auto">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={`/trip/${tripId}/${to}`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-app-primary text-app-primary'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile: fixed bottom nav */}
      <nav className="no-print sm:hidden fixed bottom-0 inset-x-0 z-30 bg-app-surface border-t border-app-border flex overflow-x-auto">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={`/trip/${tripId}/${to}`}
            className={({ isActive }) =>
              `flex-1 min-w-[64px] flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${
                isActive ? 'text-app-primary' : 'text-app-muted'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      {/* Spacer so content isn't hidden behind fixed mobile nav */}
      <div className="sm:hidden h-14" />
    </>
  )
}
