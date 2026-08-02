// src/hooks/useWeather.js
import { useEffect, useState } from 'react'
import { fetchTripWeather } from '../utils/weather'

export function useWeather({ latitude, longitude, startDate, endDate }) {
  const [state, setState] = useState({ loading: false, error: null, data: null })

  useEffect(() => {
    if (latitude == null || longitude == null || !startDate) {
      setState({ loading: false, error: null, data: null })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchTripWeather({ latitude, longitude, startDate, endDate })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, data })
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err.message, data: null })
      })
    return () => {
      cancelled = true
    }
  }, [latitude, longitude, startDate, endDate])

  return state
}
