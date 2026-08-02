// src/components/common/EmptyState.jsx
import React from 'react'

export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-app-border bg-app-surface/50">
      {Icon && (
        <div className="mb-3 p-3 rounded-full bg-app-surfaceAlt text-app-muted">
          <Icon size={22} />
        </div>
      )}
      <p className="text-sm font-medium text-app-text">{title}</p>
      {subtitle && <p className="text-xs text-app-muted mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
