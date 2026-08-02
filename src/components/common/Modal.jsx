// src/components/common/Modal.jsx
import React, { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Generic modal dialog shell used for all "explicit edit trigger" flows
 * (Flight edit, Add expense, Add pin, etc). Renders nothing when closed.
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${sizes[size]} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-app-surface border border-app-border shadow-xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border sticky top-0 bg-app-surface z-10">
          <h2 className="text-base font-semibold text-app-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-app-muted hover:bg-app-surfaceAlt hover:text-app-text transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-app-border flex justify-end gap-2 sticky bottom-0 bg-app-surface">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
