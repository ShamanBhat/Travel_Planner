// src/components/expenses/AddExpenseModal.jsx
import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../common/Modal'

export default function AddExpenseModal({ open, onClose, onSave, approvedMembers, currentUid, allowShared }) {
  const [type, setType] = useState('personal')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paidByUid, setPaidByUid] = useState(currentUid)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setType(allowShared ? 'shared' : 'personal')
    setAmount('')
    setDescription('')
    setDate(new Date().toISOString().slice(0, 10))
    setPaidByUid(currentUid)
    setError('')
  }, [open, allowShared, currentUid])

  async function handleSave() {
    setError('')
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0 || !description.trim()) {
      setError('Enter a valid amount and description.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        type,
        amount: numAmount,
        description: description.trim(),
        date,
        paidByUid: type === 'shared' ? paidByUid : currentUid,
        visibilityUid: type === 'personal' ? currentUid : null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add expense"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-app-border text-app-text hover:bg-app-surfaceAlt transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-app-primary text-app-primaryText hover:brightness-110 transition disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="text-sm text-app-danger bg-app-danger/10 border border-app-danger/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {allowShared && (
          <div className="flex rounded-lg border border-app-border overflow-hidden text-sm">
            <button
              onClick={() => setType('personal')}
              className={`flex-1 py-1.5 ${type === 'personal' ? 'bg-app-primary text-app-primaryText' : 'text-app-muted'}`}
            >
              Personal
            </button>
            <button
              onClick={() => setType('shared')}
              className={`flex-1 py-1.5 ${type === 'shared' ? 'bg-app-primary text-app-primaryText' : 'text-app-muted'}`}
            >
              Group (shared)
            </button>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            placeholder="Groceries, permits, taxi..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
        </div>
        {type === 'shared' && (
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Paid by</label>
            <select
              value={paidByUid}
              onChange={(e) => setPaidByUid(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            >
              {approvedMembers.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.displayName}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-app-muted mt-1">
              Split equally across all {approvedMembers.length} approved members.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
