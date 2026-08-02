import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Droplets } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { LoadingSpinner } from './ui/ReadOnlyField';

const WEATHER_CODES = {
  0: { label: 'Clear', icon: Sun },
  1: { label: 'Mainly Clear', icon: Sun },
  2: { label: 'Partly Cloudy', icon: Cloud },
  3: { label: 'Overcast', icon: Cloud },
  45: { label: 'Fog', icon: Cloud },
  48: { label: 'Fog', icon: Cloud },
  51: { label: 'Drizzle', icon: CloudRain },
  53: { label: 'Drizzle', icon: CloudRain },
  55: { label: 'Drizzle', icon: CloudRain },
  61: { label: 'Rain', icon: CloudRain },
  63: { label: 'Rain', icon: CloudRain },
  65: { label: 'Heavy Rain', icon: CloudRain },
  71: { label: 'Snow', icon: Snowflake },
  73: { label: 'Snow', icon: Snowflake },
  75: { label: 'Heavy Snow', icon: Snowflake },
  80: { label: 'Showers', icon: CloudRain },
  81: { label: 'Showers', icon: CloudRain },
  82: { label: 'Heavy Showers', icon: CloudRain },
  95: { label: 'Thunderstorm', icon: CloudRain },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: 'Unknown', icon: Cloud };
}

export default function WeatherWidget() {
  const { trip } = useTrip();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const coords = trip?.destCoords;

  useEffect(() => {
    if (!coords?.lat || !coords?.lng) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const isPast = trip?.endDate && new Date(trip.endDate) < new Date();
        const url = isPast
          ? `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lng}&start_date=${trip.startDate}&end_date=${trip.endDate}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`
          : `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max&forecast_days=14&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather data unavailable');
        const data = await res.json();
        setForecast(data.daily);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [coords?.lat, coords?.lng, trip?.startDate, trip?.endDate]);

  if (!coords?.lat) {
    return (
      <div className="card text-center opacity-60">
        <Cloud size={32} className="mx-auto mb-2" />
        <p className="text-sm">Set destination coordinates to see weather</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="card text-center text-red-500">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!forecast) return null;

  const days = forecast.time?.slice(0, 14) || [];

  return (
    <div className="card">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Cloud size={18} />
        Weather — {trip?.destination}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {days.map((date, idx) => {
          const code = forecast.weathercode?.[idx];
          const { label, icon: Icon } = getWeatherInfo(code);
          const maxTemp = forecast.temperature_2m_max?.[idx];
          const minTemp = forecast.temperature_2m_min?.[idx];
          const precip = forecast.precipitation_sum?.[idx];
          const wind = forecast.windspeed_10m_max?.[idx];

          return (
            <div
              key={date}
              className="flex shrink-0 flex-col items-center rounded-lg border border-inherit px-3 py-2 text-center min-w-[80px]"
            >
              <p className="text-xs opacity-60">
                {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <Icon size={24} className="my-1" />
              <p className="text-xs opacity-70">{label}</p>
              <div className="mt-1 flex items-center gap-1 text-sm font-medium">
                <Thermometer size={12} className="opacity-50" />
                {Math.round(maxTemp)}° / {Math.round(minTemp)}°
              </div>
              {precip > 0 && (
                <div className="mt-0.5 flex items-center gap-0.5 text-xs opacity-50">
                  <Droplets size={10} />
                  {precip}mm
                </div>
              )}
              {wind && (
                <div className="flex items-center gap-0.5 text-xs opacity-50">
                  <Wind size={10} />
                  {Math.round(wind)}km/h
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
