// src/components/logistics/MyBoardingPassModal.jsx
import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Plane, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

function fmt(dt) {
  if (!dt) return '—'
  try {
    return format(new Date(dt), 'EEE, MMM d · HH:mm')
  } catch {
    return dt
  }
}

/**
 * Full-screen, high-contrast "Quick-Scan" overlay showing the current
 * traveler's seat + boarding pass for each logistics item they're assigned to.
 * Designed for a single tap to open at the airport gate.
 */
export default function MyBoardingPassModal({ open, onClose, passes }) {
  const [index, setIndex] = useState(0)

  if (!open) return null

  if (!passes || passes.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center text-white p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10">
          <X size={22} />
        </button>
        <Plane size={32} className="mb-3 opacity-70" />
        <p className="text-lg font-medium">No boarding pass assigned yet</p>
        <p className="text-sm text-white/60 mt-1">
          Ask your trip admin to assign your seat and upload your boarding pass.
        </p>
      </div>
    )
  }

  const pass = passes[Math.min(index, passes.length - 1)]
  const qrValue = JSON.stringify({
    pnr: pass.pnr,
    flightNo: pass.flightNo,
    seat: pass.seatNo,
    from: pass.fromLabel,
    to: pass.toLabel,
  })

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm font-semibold uppercase tracking-wide text-white/70">
          My Boarding Pass
        </span>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 overflow-y-auto pb-10">
        <div className="text-center">
          <p className="text-2xl font-bold">
            {pass.fromLabel} <span className="text-white/40 mx-1">&rarr;</span> {pass.toLabel}
          </p>
          <p className="text-white/60 text-sm mt-1">
            {pass.provider} {pass.flightNo && `· ${pass.flightNo}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-[11px] text-white/50 uppercase">Seat</p>
            <p className="text-xl font-bold">{pass.seatNo || '—'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-[11px] text-white/50 uppercase">PNR</p>
            <p className="text-xl font-bold">{pass.pnr || '—'}</p>
          </div>
        </div>

        <p className="text-xs text-white/50">
          Departs {fmt(pass.departureTime)}
        </p>

        {pass.boardingPassUrl ? (
          <img
            src={pass.boardingPassUrl}
            alt="Boarding pass"
            className="max-h-[45vh] rounded-xl bg-white p-2 object-contain"
          />
        ) : (
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={qrValue} size={200} />
          </div>
        )}

        {passes.length > 1 && (
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setIndex((i) => (i - 1 + passes.length) % passes.length)}
              className="p-2 rounded-full bg-white/10"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-white/60">
              {index + 1} / {passes.length}
            </span>
            <button
              onClick={() => setIndex((i) => (i + 1) % passes.length)}
              className="p-2 rounded-full bg-white/10"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
