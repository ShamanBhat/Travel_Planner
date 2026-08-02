// src/hooks/useCountdown.js
import { useEffect, useState } from 'react'

function diff(target) {
  const now = new Date()
  const ms = target.getTime() - now.getTime()
  const clamped = Math.max(ms, 0)
  return {
    ms,
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
  }
}

/**
 * Live countdown to a trip's start date, transitioning to 'in-progress' once
 * started and 'completed' once the end date has passed.
 */
export function useCountdown(startDate, endDate) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(id)
  }, [])

  if (!startDate) {
    return { status: 'unknown', days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : start

  if (now >= start && now <= end) {
    return { status: 'in-progress', days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  if (now > end) {
    return { status: 'completed', days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const d = diff(start)
  return { status: 'upcoming', days: d.days, hours: d.hours, minutes: d.minutes, seconds: d.seconds }
}
