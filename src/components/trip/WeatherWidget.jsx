// src/components/trip/WeatherWidget.jsx
import React from 'react'
import * as Icons from 'lucide-react'
import { useWeather } from '../../hooks/useWeather'
import { describeWeatherCode } from '../../utils/weather'

export default function WeatherWidget({ destCoords, startDate, endDate }) {
  const { loading, error, data } = useWeather({
    latitude: destCoords?.lat,
    longitude: destCoords?.lng,
    startDate,
    endDate,
  })

  if (!destCoords) {
    return (
      <p className="text-xs text-app-muted">
        Set trip coordinates (via destination search) to see a weather forecast.
      </p>
    )
  }
  if (loading) return <p className="text-xs text-app-muted">Loading weather...</p>
  if (error) return <p className="text-xs text-app-danger">Weather unavailable: {error}</p>
  if (!data?.daily?.time?.length) return <p className="text-xs text-app-muted">No weather data.</p>

  const { time, weathercode, temperature_2m_max, temperature_2m_min } = data.daily

  return (
    <div>
      {data.mode === 'historical-average' && (
        <p className="text-[11px] text-app-muted mb-2">
          Trip dates are beyond the 16-day forecast window &mdash; showing last year's averages as
          an estimate.
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {time.map((date, i) => {
          const { label, icon } = describeWeatherCode(weathercode[i])
          const Icon = Icons[icon] || Icons.Cloud
          return (
            <div
              key={date}
              className="flex flex-col items-center gap-1 shrink-0 w-20 rounded-xl border border-app-border bg-app-surface px-2 py-3"
            >
              <span className="text-[10px] text-app-muted">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </span>
              <Icon size={20} className="text-app-accent" />
              <span className="text-xs font-semibold text-app-text">
                {Math.round(temperature_2m_max[i])}&deg;
              </span>
              <span className="text-[11px] text-app-muted">{Math.round(temperature_2m_min[i])}&deg;</span>
              <span className="text-[9px] text-app-muted text-center leading-tight">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
