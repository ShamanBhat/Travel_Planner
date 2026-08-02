// src/components/itinerary/DayCard.jsx
import React, { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import ItineraryItem from './ItineraryItem'

export default function DayCard({ day, dayNumber, editable, onAddItem, onUpdateItem, onDeleteItem, onDeleteDay }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ time: '', title: '', location: '', description: '' })

  const items = [...(day.items || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  function submitAdd() {
    if (!draft.title.trim()) return
    onAddItem(day.id, draft)
    setDraft({ time: '', title: '', location: '', description: '' })
    setAdding(false)
  }

  let dateLabel = day.id
  try {
    dateLabel = format(new Date(day.id), 'EEEE, MMM d, yyyy')
  } catch {
    // keep raw id
  }

  return (
    <div className="rounded-2xl border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-app-primary uppercase tracking-wide">
            Day {dayNumber}
          </p>
          <h3 className="text-sm font-semibold text-app-text">{dateLabel}</h3>
        </div>
        {editable && (
          <button
            onClick={() => onDeleteDay(day.id)}
            className="p-1.5 rounded-full text-app-danger hover:bg-app-danger/10"
            title="Delete day"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <ItineraryItem
            key={item.id}
            item={item}
            editable={editable}
            onSave={(patch) => onUpdateItem(day.id, patch)}
            onDelete={() => onDeleteItem(day.id, item)}
          />
        ))}
        {items.length === 0 && !adding && (
          <p className="text-xs text-app-muted italic">No activities added for this day yet.</p>
        )}
      </ul>

      {editable && (
        <div className="mt-2">
          {adding ? (
            <div className="rounded-xl border border-app-primary/40 p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="time"
                  value={draft.time}
                  onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                  className="col-span-1 rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
                />
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Title"
                  className="col-span-2 rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
                />
              </div>
              <input
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="Location"
                className="w-full rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
              />
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Description"
                rows={2}
                className="w-full rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="px-2.5 py-1.5 rounded-lg border border-app-border text-xs text-app-text hover:bg-app-surfaceAlt"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAdd}
                  className="px-2.5 py-1.5 rounded-lg bg-app-primary text-app-primaryText text-xs hover:brightness-110"
                >
                  Add item
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-app-primary hover:underline"
            >
              <Plus size={13} /> Add activity
            </button>
          )}
        </div>
      )}
    </div>
  )
}
