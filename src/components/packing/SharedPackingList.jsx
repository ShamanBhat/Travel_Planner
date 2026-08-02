// src/components/packing/SharedPackingList.jsx
import React, { useState } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'

const CATEGORY_OPTIONS = ['Clothing', 'Toiletries', 'Electronics', 'Documents', 'Essentials', 'Outdoor', 'Health', 'Other']

function groupByCategory(items) {
  const groups = {}
  items.forEach((item) => {
    const cat = item.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  })
  return groups
}

export default function SharedPackingList({ items, editable, selected, onToggleSelect, onAdd, onDelete }) {
  const [draftItem, setDraftItem] = useState('')
  const [draftCategory, setDraftCategory] = useState('Clothing')
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)

  function submitAdd(e) {
    e.preventDefault()
    if (!draftItem.trim()) return

    const category = showCustomCategory
      ? customCategory.trim() || 'Other'
      : draftCategory || 'Other'

    const entries = draftItem
      .split(/[,\n]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)

    entries.forEach((entry) => onAdd({ item: entry, category }))
    setDraftItem('')
  }

  const groups = groupByCategory(items)

  return (
    <div className="rounded-2xl border border-app-border bg-app-surface p-4">
      <h2 className="text-sm font-semibold text-app-text mb-3">Shared Packing List</h2>

      {items.length === 0 ? (
        <p className="text-xs text-app-muted italic">
          No shared items yet. {editable && 'Add items below to build the group checklist.'}
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([cat, catItems]) => (
            <div key={cat}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted flex items-center gap-1 mb-1.5">
                <Tag size={11} /> {cat}
              </p>
              <ul className="space-y-1.5">
                {catItems.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-2 text-sm text-app-text px-2.5 py-1.5 rounded-lg hover:bg-app-surfaceAlt"
                  >
                    <label className="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selected.has(it.id)}
                        onChange={() => onToggleSelect(it.id)}
                        className="accent-current text-app-primary"
                      />
                      <span className="truncate">{it.item}</span>
                    </label>
                    {editable && (
                      <button
                        onClick={() => onDelete(it)}
                        className="p-1 rounded-full text-app-danger hover:bg-app-danger/10 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editable && (
        <form onSubmit={submitAdd} className="mt-4 pt-3 border-t border-app-border flex flex-col gap-2">
          <input
            value={draftItem}
            onChange={(e) => setDraftItem(e.target.value)}
            placeholder="Item name"
            className="w-full rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-sm text-app-text"
          />
          <div className="flex gap-2">
            <select
              value={showCustomCategory ? 'Other' : draftCategory}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'Other') {
                  setShowCustomCategory(true)
                  setDraftCategory('Other')
                } else {
                  setShowCustomCategory(false)
                  setDraftCategory(value)
                  setCustomCategory('')
                }
              }}
              className="w-36 rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-sm text-app-text"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {showCustomCategory && (
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Custom category"
                className="flex-1 rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-sm text-app-text"
              />
            )}
            <button
              type="submit"
              className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-app-primary text-app-primaryText text-sm hover:brightness-110"
            >
              <Plus size={14} />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
