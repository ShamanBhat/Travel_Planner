// src/utils/weather.js
// Maps WMO weather interpretation codes (used by Open-Meteo) to a short label
// and a Lucide icon name for compact rendering.
export const WMO_CODE_MAP = {
  0: { label: 'Clear sky', icon: 'Sun' },
  1: { label: 'Mostly clear', icon: 'Sun' },
  2: { label: 'Partly cloudy', icon: 'CloudSun' },
  3: { label: 'Overcast', icon: 'Cloud' },
  45: { label: 'Fog', icon: 'CloudFog' },
  48: { label: 'Rime fog', icon: 'CloudFog' },
  51: { label: 'Light drizzle', icon: 'CloudDrizzle' },
  53: { label: 'Drizzle', icon: 'CloudDrizzle' },
  55: { label: 'Dense drizzle', icon: 'CloudDrizzle' },
  61: { label: 'Light rain', icon: 'CloudRain' },
  63: { label: 'Rain', icon: 'CloudRain' },
  65: { label: 'Heavy rain', icon: 'CloudRainWind' },
  66: { label: 'Freezing rain', icon: 'CloudRainWind' },
  67: { label: 'Freezing rain', icon: 'CloudRainWind' },
  71: { label: 'Light snow', icon: 'CloudSnow' },
  73: { label: 'Snow', icon: 'CloudSnow' },
  75: { label: 'Heavy snow', icon: 'CloudSnow' },
  77: { label: 'Snow grains', icon: 'CloudSnow' },
  80: { label: 'Rain showers', icon: 'CloudRain' },
  81: { label: 'Rain showers', icon: 'CloudRain' },
  82: { label: 'Violent showers', icon: 'CloudRainWind' },
  85: { label: 'Snow showers', icon: 'CloudSnow' },
  86: { label: 'Snow showers', icon: 'CloudSnow' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning' },
  96: { label: 'Thunderstorm + hail', icon: 'CloudLightning' },
  99: { label: 'Severe thunderstorm', icon: 'CloudLightning' },
}

export function describeWeatherCode(code) {
  return WMO_CODE_MAP[code] || { label: 'Unknown', icon: 'Cloud' }
}

export async function geocodeDestination(query) {
  if (!query || query.trim().length < 2) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=5&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding lookup failed')
  const data = await res.json()
  return (data.results || []).map((r) => ({
    id: `${r.id}`,
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }))
}

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

/**
 * Fetches a daily forecast for the given coordinates and date range.
 * Open-Meteo's free forecast endpoint covers ~16 days out; for trip dates
 * further in the future we fall back to the prior year's historical daily
 * averages from the archive API as an estimate.
 */
export async function fetchTripWeather({ latitude, longitude, startDate, endDate }) {
  if (latitude == null || longitude == null || !startDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : start
  const daysUntilStart = Math.floor((start - today) / (1000 * 60 * 60 * 24))

  const dailyVars = 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum'

  if (daysUntilStart <= 15 && daysUntilStart >= -1) {
    // Within forecast range (and allow trips that already started).
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=${dailyVars}&timezone=auto&start_date=${toISODate(start)}&end_date=${toISODate(
        new Date(Math.min(end.getTime(), today.getTime() + 15 * 86400000))
      )}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Weather forecast request failed')
    const data = await res.json()
    return { mode: 'forecast', daily: data.daily }
  }

  // Fall back to last year's historical data for the same calendar dates.
  const histStart = new Date(start)
  histStart.setFullYear(histStart.getFullYear() - 1)
  const histEnd = new Date(end)
  histEnd.setFullYear(histEnd.getFullYear() - 1)

  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}` +
    `&daily=${dailyVars}&timezone=auto&start_date=${toISODate(histStart)}&end_date=${toISODate(histEnd)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather history request failed')
  const data = await res.json()
  return { mode: 'historical-average', daily: data.daily }
}
