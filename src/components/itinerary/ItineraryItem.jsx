// src/components/itinerary/ItineraryItem.jsx
import React, { useState } from 'react'
import { Clock, MapPin, Pencil, Trash2, Check, X } from 'lucide-react'

export default function ItineraryItem({ item, editable, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)

  function startEdit() {
    setDraft(item)
    setEditing(true)
  }

  function save() {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-app-primary/40 bg-app-surface p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <input
            type="time"
            value={draft.time || ''}
            onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
            className="col-span-1 rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
          />
          <input
            value={draft.title || ''}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Title"
            className="col-span-2 rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
          />
        </div>
        <input
          value={draft.location || ''}
          onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
          placeholder="Location"
          className="w-full rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
        />
        <textarea
          value={draft.description || ''}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Description"
          rows={2}
          className="w-full rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-app-border text-xs text-app-text hover:bg-app-surfaceAlt"
          >
            <X size={13} /> Cancel
          </button>
          <button
            onClick={save}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-app-primary text-app-primaryText text-xs hover:brightness-110"
          >
            <Check size={13} /> Save
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3 rounded-xl border border-app-border bg-app-surface p-3 group">
      <div className="w-14 shrink-0 text-xs font-semibold text-app-primary flex items-center gap-1 pt-0.5">
        <Clock size={12} /> {item.time || '—'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-app-text">{item.title}</p>
        {item.location && (
          <p className="text-xs text-app-muted flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {item.location}
          </p>
        )}
        {item.description && <p className="text-xs text-app-muted mt-1">{item.description}</p>}
      </div>
      {editable && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition shrink-0">
          <button
            onClick={startEdit}
            className="p-1.5 rounded-full text-app-muted hover:bg-app-surfaceAlt hover:text-app-text"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 rounded-full text-app-danger hover:bg-app-danger/10"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </li>
  )
}
