// src/components/trip/TripLayout.jsx
import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Loader2, Clock3, ShieldAlert, ArrowLeft } from 'lucide-react'
import { TripProvider, useTrip } from '../../context/TripContext'
import NavBar from '../layout/NavBar'
import TripTabs from '../layout/TripTabs'

function TripLayoutInner() {
  const { trip, loading, error, isMember, isPendingApproval } = useTrip()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg">
        <NavBar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-app-primary" size={26} />
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-app-bg">
        <NavBar />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <ShieldAlert className="mx-auto text-app-danger mb-3" size={28} />
          <p className="text-app-text font-medium">{error || 'Trip not found.'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-app-primary hover:underline"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-app-bg">
        <NavBar />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <ShieldAlert className="mx-auto text-app-warn mb-3" size={28} />
          <p className="text-app-text font-medium">You are not a member of this trip.</p>
          <p className="text-sm text-app-muted mt-1">
            Ask the trip admin for the trip code, or request access from the dashboard.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-app-primary hover:underline"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-app-bg">
        <NavBar />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <Clock3 className="mx-auto text-app-warn mb-3" size={28} />
          <p className="text-app-text font-medium">Your request to join "{trip.tripName}" is pending.</p>
          <p className="text-sm text-app-muted mt-1">
            An admin needs to approve your request before you can view this trip.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-app-primary hover:underline"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-bg pb-2">
      <NavBar />
      <TripTabs />
      <main className="max-w-6xl mx-auto px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
}

export default function TripLayout() {
  return (
    <TripProvider>
      <TripLayoutInner />
    </TripProvider>
  )
}
