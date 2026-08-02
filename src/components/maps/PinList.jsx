// src/components/maps/PinList.jsx
import React from 'react'
import { Tent, Droplets, Flag, Eye, TriangleAlert, MapPinned, Pencil, Trash2, ExternalLink } from 'lucide-react'

const CATEGORY_ICON = {
  Campsite: Tent,
  'Water Source': Droplets,
  Trailhead: Flag,
  Viewpoint: Eye,
  Hazard: TriangleAlert,
  Other: MapPinned,
}

export default function PinList({ pins, editable, onEdit, onDelete }) {
  if (pins.length === 0) {
    return <p className="text-xs text-app-muted italic">No GPS pins logged yet.</p>
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {pins.map((pin) => {
        const Icon = CATEGORY_ICON[pin.category] || MapPinned
        return (
          <li key={pin.id} className="rounded-xl border border-app-border bg-app-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-app-primary/10 text-app-primary shrink-0">
                  <Icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app-text truncate">{pin.name}</p>
                  <p className="text-[11px] text-app-muted">{pin.category}</p>
                </div>
              </div>
              {editable && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(pin)}
                    className="p-1.5 rounded-full text-app-muted hover:bg-app-surfaceAlt hover:text-app-text"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(pin)}
                    className="p-1.5 rounded-full text-app-danger hover:bg-app-danger/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
            {pin.notes && <p className="text-xs text-app-muted mt-2">{pin.notes}</p>}
            <a
              href={`https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-app-primary hover:underline"
            >
              <ExternalLink size={11} /> {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
