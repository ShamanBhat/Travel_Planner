// src/components/packing/PersonalPackingList.jsx
import React, { useState } from 'react'
import { Plus, Trash2, Import } from 'lucide-react'

export default function PersonalPackingList({ items, onAdd, onToggle, onDelete, selectedSharedCount, onImport }) {
  const [draft, setDraft] = useState('')
  const packedCount = items.filter((i) => i.isPacked).length

  function submitAdd(e) {
    e.preventDefault()
    if (!draft.trim()) return
    onAdd(draft.trim())
    setDraft('')
  }

  return (
    <div className="rounded-2xl border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-app-text">My Personal Packing List</h2>
        <span className="text-xs text-app-muted">
          {packedCount}/{items.length} packed
        </span>
      </div>

      {selectedSharedCount > 0 && (
        <button
          onClick={onImport}
          className="w-full mb-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-app-primary/40 bg-app-primary/10 text-app-primary text-sm font-medium hover:bg-app-primary/20 transition"
        >
          <Import size={15} /> Import {selectedSharedCount} selected item
          {selectedSharedCount !== 1 ? 's' : ''} from Shared
        </button>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-app-muted italic">
          Your personal checklist is empty. Add your own items or import from the shared list.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 text-sm px-2.5 py-1.5 rounded-lg hover:bg-app-surfaceAlt"
            >
              <label className="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={!!it.isPacked}
                  onChange={() => onToggle(it)}
                  className="accent-current text-app-primary"
                />
                <span className={`truncate ${it.isPacked ? 'line-through text-app-muted' : 'text-app-text'}`}>
                  {it.item}
                </span>
                {it.importedFromShared && (
                  <span className="text-[10px] text-app-accent bg-app-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
                    shared
                  </span>
                )}
              </label>
              <button
                onClick={() => onDelete(it)}
                className="p-1 rounded-full text-app-danger hover:bg-app-danger/10 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submitAdd} className="mt-4 pt-3 border-t border-app-border flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a personal item"
          className="flex-1 rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-sm text-app-text"
        />
        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-app-primary text-app-primaryText text-sm hover:brightness-110"
        >
          <Plus size={14} />
        </button>
      </form>
    </div>
  )
}
