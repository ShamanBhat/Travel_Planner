// src/components/expenses/ExpenseList.jsx
import React from 'react'
import { Trash2 } from 'lucide-react'

export default function ExpenseList({ expenses, memberName, canDelete, onDelete, emptyLabel }) {
  if (expenses.length === 0) {
    return <p className="text-xs text-app-muted italic">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-1.5">
      {expenses.map((exp) => (
        <li
          key={exp.id}
          className="flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg border border-app-border"
        >
          <div className="min-w-0">
            <p className="text-app-text font-medium truncate">{exp.description}</p>
            <p className="text-xs text-app-muted">
              {exp.date} {exp.paidByUid && `· Paid by ${memberName(exp.paidByUid)}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-app-text">${Number(exp.amount).toFixed(2)}</span>
            {(canDelete === true || (typeof canDelete === 'function' && canDelete(exp))) && (
              <button
                onClick={() => onDelete(exp)}
                className="p-1 rounded-full text-app-danger hover:bg-app-danger/10"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
