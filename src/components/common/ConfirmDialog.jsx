// src/components/common/ConfirmDialog.jsx
import React from 'react'
import Modal from './Modal'

export default function ConfirmDialog({ open, title = 'Are you sure?', message, onConfirm, onCancel, danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-app-border text-app-text hover:bg-app-surfaceAlt transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
              danger ? 'bg-app-danger hover:brightness-110' : 'bg-app-primary hover:brightness-110'
            }`}
          >
            Confirm
          </button>
        </>
      }
    >
      <p className="text-sm text-app-muted">{message}</p>
    </Modal>
  )
}
