// src/components/trip/TripOverview.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Pencil, Printer, ScanLine, Users2 } from 'lucide-react'
import { useTrip } from '../../context/TripContext'
import { isAdmin } from '../../utils/rbac'
import CountdownTimer from './CountdownTimer'
import WeatherWidget from './WeatherWidget'
import TripEditModal from './TripEditModal'

export default function TripOverview() {
  const { tripId, trip, role, approvedMembers } = useTrip()
  // Trip shell details (name/destination/dates/cover) are Admin-only; Editors
  // manage module data (logistics, itinerary, packing, expenses, map pins).
  const editable = isAdmin(role)
  const [editOpen, setEditOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="space-y-5 print-page">
      <div className="rounded-2xl overflow-hidden border border-app-border bg-app-surface">
        <div className="h-40 sm:h-56 bg-app-surfaceAlt relative">
          {trip.coverPhotoUrl ? (
            <img src={trip.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-app-muted">
              <MapPin size={32} />
            </div>
          )}
          {editable && (
            <button
              onClick={() => setEditOpen(true)}
              className="no-print absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/60 transition"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        <div className="p-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-app-text">{trip.tripName}</h1>
            <p className="text-sm text-app-muted flex items-center gap-1.5 mt-1">
              <MapPin size={14} /> {trip.destination}
            </p>
            <p className="text-sm text-app-muted flex items-center gap-1.5 mt-1">
              <Calendar size={14} /> {trip.startDate} &rarr; {trip.endDate}
            </p>
            <p className="text-xs text-app-muted flex items-center gap-1.5 mt-1">
              <Users2 size={12} /> {approvedMembers.length} member
              {approvedMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <CountdownTimer startDate={trip.startDate} endDate={trip.endDate} />
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <button
          onClick={() => navigate(`/trip/${tripId}/logistics?pass=1`)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-app-primary text-app-primaryText text-sm font-semibold hover:brightness-110 transition"
        >
          <ScanLine size={16} /> View My Boarding Pass
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-app-border text-sm font-medium text-app-text hover:bg-app-surfaceAlt transition"
        >
          <Printer size={16} /> Export / Print
        </button>
      </div>

      <div className="rounded-2xl border border-app-border bg-app-surface p-4">
        <h2 className="text-sm font-semibold text-app-text mb-3">Weather forecast</h2>
        <WeatherWidget
          destCoords={trip.destCoords}
          startDate={trip.startDate}
          endDate={trip.endDate}
        />
      </div>

      <TripEditModal open={editOpen} onClose={() => setEditOpen(false)} tripId={tripId} trip={trip} />
    </div>
  )
}
