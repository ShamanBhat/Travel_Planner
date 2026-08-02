// src/components/trip/CountdownTimer.jsx
import React from 'react'
import { useCountdown } from '../../hooks/useCountdown'

export default function CountdownTimer({ startDate, endDate }) {
  const { status, days, hours, minutes } = useCountdown(startDate, endDate)

  if (status === 'in-progress') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-primary text-app-primaryText font-medium text-sm">
        <span className="w-2 h-2 rounded-full bg-app-primaryText animate-pulse" />
        Trip in progress
      </div>
    )
  }
  if (status === 'completed') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-surfaceAlt text-app-muted font-medium text-sm">
        Trip completed
      </div>
    )
  }

  const units = [
    { label: 'Days', value: days },
    { label: 'Hrs', value: hours },
    { label: 'Min', value: minutes },
  ]

  return (
    <div className="flex items-center gap-3">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-app-surface border border-app-border"
        >
          <span className="text-xl font-bold text-app-text leading-none">{u.value}</span>
          <span className="text-[10px] uppercase tracking-wide text-app-muted mt-1">{u.label}</span>
        </div>
      ))}
    </div>
  )
}
