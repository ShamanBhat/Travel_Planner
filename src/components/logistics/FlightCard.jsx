// src/components/logistics/FlightCard.jsx
import React, { useState } from 'react'
import { Plane, Train, Building2, Car, Pencil, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { useTrip } from '../../context/TripContext'
import { isEditor } from '../../utils/rbac'

const TYPE_ICON = {
  flight: Plane,
  train: Train,
  stay: Building2,
  cab: Car,
}

function fmt(dt) {
  if (!dt) return '—'
  try {
    return format(new Date(dt), 'EEE, MMM d · HH:mm')
  } catch {
    return dt
  }
}

export default function FlightCard({ item, onEdit, onDelete }) {
  const { role, approvedMembers } = useTrip()
  const editable = isEditor(role)
  const [expanded, setExpanded] = useState(false)
  const Icon = TYPE_ICON[item.type] || Plane

  const memberName = (uid) => approvedMembers.find((m) => m.uid === uid)?.displayName || 'Unknown'

  return (
    <div className="rounded-2xl border border-app-border bg-app-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-app-primary/10 text-app-primary shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-app-text truncate">
              {item.provider || 'Untitled'} {item.flightNo && `· ${item.flightNo}`}
            </p>
            <p className="text-xs text-app-muted truncate">
              {item.fromLabel} {item.terminalFrom && `(T${item.terminalFrom})`}
              {' → '}
              {item.toLabel} {item.terminalTo && `(T${item.terminalTo})`}
            </p>
            {item.pnr && <p className="text-[11px] text-app-muted mt-0.5">PNR/Booking Ref: {item.pnr}</p>}
          </div>
        </div>
        {editable && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-full text-app-muted hover:bg-app-surfaceAlt hover:text-app-text"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-full text-app-danger hover:bg-app-danger/10"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
        <div>
          <p className="text-app-muted">Departure</p>
          <p className="text-app-text font-medium">{fmt(item.departureTime)}</p>
        </div>
        <div>
          <p className="text-app-muted">Arrival</p>
          <p className="text-app-text font-medium">{fmt(item.arrivalTime)}</p>
        </div>
      </div>

      {item.notes && <p className="text-xs text-app-muted mt-2 italic">{item.notes}</p>}

      {item.passengers?.length > 0 && (
        <div className="mt-3 border-t border-app-border pt-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-app-muted hover:text-app-text"
          >
            <Users size={13} /> {item.passengers.length} passenger
            {item.passengers.length !== 1 ? 's' : ''} assigned
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {item.passengers.map((p) => (
                <li key={p.uid} className="flex items-center justify-between text-xs text-app-text">
                  <span>{memberName(p.uid)}</span>
                  <span className="font-mono px-1.5 py-0.5 rounded bg-app-surfaceAlt">
                    {p.seatNo || '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
