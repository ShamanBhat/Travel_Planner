// src/components/logistics/FlightEditModal.jsx
import React, { useEffect, useState } from 'react'
import { Loader2, Upload, FileCheck2, X as XIcon } from 'lucide-react'
import Modal from '../common/Modal'
import { useTrip } from '../../context/TripContext'
import { uploadFile } from '../../utils/storage'

const EMPTY_ITEM = {
  type: 'flight',
  provider: '',
  flightNo: '',
  pnr: '',
  fromLabel: '',
  toLabel: '',
  terminalFrom: '',
  terminalTo: '',
  departureTime: '',
  arrivalTime: '',
  notes: '',
  passengers: [],
}

export default function FlightEditModal({ open, onClose, item, onSave, tripId }) {
  const { approvedMembers } = useTrip()
  const [form, setForm] = useState(EMPTY_ITEM)
  const [passengerMap, setPassengerMap] = useState({}) // uid -> { seatNo, boardingPassUrl, pendingFile }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const base = item ? { ...EMPTY_ITEM, ...item } : { ...EMPTY_ITEM, id: `log_${Date.now()}` }
    setForm(base)
    const map = {}
    approvedMembers.forEach((m) => {
      const existing = base.passengers?.find((p) => p.uid === m.uid)
      map[m.uid] = {
        seatNo: existing?.seatNo || '',
        boardingPassUrl: existing?.boardingPassUrl || '',
        pendingFile: null,
      }
    })
    setPassengerMap(map)
    setError('')
  }, [open, item, approvedMembers])

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updatePassenger(uid, patch) {
    setPassengerMap((m) => ({ ...m, [uid]: { ...m[uid], ...patch } }))
  }

  async function handleSave() {
    setError('')
    if (!form.provider.trim() || !form.fromLabel.trim() || !form.toLabel.trim()) {
      setError('Provider, origin, and destination are required.')
      return
    }
    setSaving(true)
    try {
      const passengers = []
      for (const m of approvedMembers) {
        const p = passengerMap[m.uid]
        if (!p) continue
        let boardingPassUrl = p.boardingPassUrl
        if (p.pendingFile) {
          const path = `trips/${tripId}/boardingPasses/${m.uid}/${form.id}-${p.pendingFile.name}`
          boardingPassUrl = await uploadFile(path, p.pendingFile)
        }
        if (p.seatNo || boardingPassUrl) {
          passengers.push({ uid: m.uid, seatNo: p.seatNo || '', boardingPassUrl: boardingPassUrl || '' })
        }
      }
      onSave({ ...form, passengers })
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
      title={item ? 'Edit logistics entry' : 'Add logistics entry'}
      size="lg"
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
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-app-danger bg-app-danger/10 border border-app-danger/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-app-muted mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            >
              <option value="flight">Flight</option>
              <option value="train">Train</option>
              <option value="stay">Stay</option>
              <option value="cab">Cab</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className="block text-xs font-medium text-app-muted mb-1">
              Airline / Provider
            </label>
            <input
              value={form.provider}
              onChange={(e) => updateField('provider', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="IndiGo"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Flight / Ref #</label>
            <input
              value={form.flightNo}
              onChange={(e) => updateField('flightNo', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="6E 204"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">From</label>
            <input
              value={form.fromLabel}
              onChange={(e) => updateField('fromLabel', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="DEL"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">To</label>
            <input
              value={form.toLabel}
              onChange={(e) => updateField('toLabel', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="KTM"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Departure terminal</label>
            <input
              value={form.terminalFrom}
              onChange={(e) => updateField('terminalFrom', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="3"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Arrival terminal</label>
            <input
              value={form.terminalTo}
              onChange={(e) => updateField('terminalTo', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Departure date & time</label>
            <input
              type="datetime-local"
              value={form.departureTime}
              onChange={(e) => updateField('departureTime', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Arrival date & time</label>
            <input
              type="datetime-local"
              value={form.arrivalTime}
              onChange={(e) => updateField('arrivalTime', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-app-muted mb-1">
              Group PNR / Booking Ref
            </label>
            <input
              value={form.pnr}
              onChange={(e) => updateField('pnr', e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
              placeholder="XZ9K2P"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            placeholder="Baggage allowance, check-in notes, etc."
          />
        </div>

        <div className="border-t border-app-border pt-3">
          <h3 className="text-sm font-semibold text-app-text mb-2">Passenger seats & boarding passes</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {approvedMembers.map((m) => {
              const p = passengerMap[m.uid] || {}
              return (
                <div
                  key={m.uid}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-app-border px-3 py-2"
                >
                  <span className="text-sm text-app-text flex-1 min-w-[100px] truncate">
                    {m.displayName}
                  </span>
                  <input
                    value={p.seatNo}
                    onChange={(e) => updatePassenger(m.uid, { seatNo: e.target.value })}
                    placeholder="Seat, e.g. 12A"
                    className="w-28 rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-xs text-app-text"
                  />
                  <label className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-app-border cursor-pointer hover:bg-app-surfaceAlt text-app-muted">
                    <Upload size={13} />
                    Upload pass
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        updatePassenger(m.uid, { pendingFile: e.target.files?.[0] || null })
                      }
                    />
                  </label>
                  {(p.pendingFile || p.boardingPassUrl) && (
                    <span className="flex items-center gap-1 text-[11px] text-app-primary">
                      <FileCheck2 size={13} />
                      {p.pendingFile ? p.pendingFile.name : 'Uploaded'}
                      {p.boardingPassUrl && !p.pendingFile && (
                        <button
                          type="button"
                          onClick={() => updatePassenger(m.uid, { boardingPassUrl: '' })}
                          className="text-app-danger"
                          title="Remove"
                        >
                          <XIcon size={12} />
                        </button>
                      )}
                    </span>
                  )}
                </div>
              )
            })}
            {approvedMembers.length === 0 && (
              <p className="text-xs text-app-muted">No approved members yet.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
