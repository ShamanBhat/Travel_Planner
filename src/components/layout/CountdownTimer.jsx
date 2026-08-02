import { useState, useEffect } from 'react';
import { getCountdown, getTripStatus, formatDate } from '../../utils/dates';

export default function CountdownTimer({ startDate, endDate }) {
  const [countdown, setCountdown] = useState(getCountdown(startDate));
  const status = getTripStatus(startDate, endDate);

  useEffect(() => {
    if (status !== 'upcoming') return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(startDate));
    }, 60000);
    return () => clearInterval(interval);
  }, [startDate, status]);

  if (status === 'completed') {
    return (
      <div className="rounded-lg bg-slate-500/10 px-4 py-2 text-center text-sm font-medium">
        Trip Completed
      </div>
    );
  }

  if (status === 'in-progress') {
    return (
      <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        In Progress
      </div>
    );
  }

  if (!countdown) return null;

  return (
    <div className="flex items-center justify-center gap-4 text-center">
      {[
        { value: countdown.days, label: 'Days' },
        { value: countdown.hours, label: 'Hours' },
        { value: countdown.minutes, label: 'Min' },
      ].map(({ value, label }) => (
        <div key={label}>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs uppercase opacity-60">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function TripHeader({ trip, onPrint }) {
  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{trip.tripName}</h1>
          <p className="opacity-70">{trip.destination}</p>
          {trip.startDate && trip.endDate && (
            <p className="mt-1 text-sm opacity-60">
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            </p>
          )}
        </div>
        <button onClick={onPrint} className="btn-secondary no-print text-sm">
          Export / Print
        </button>
      </div>
      <CountdownTimer startDate={trip.startDate} endDate={trip.endDate} />
    </div>
  );
}
