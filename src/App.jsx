// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import Dashboard from './components/dashboard/Dashboard'
import TripLayout from './components/trip/TripLayout'
import TripOverview from './components/trip/TripOverview'
import LogisticsHub from './components/logistics/LogisticsHub'
import Itinerary from './components/itinerary/Itinerary'
import PackingLists from './components/packing/PackingLists'
import ExpenseTracker from './components/expenses/ExpenseTracker'
import TrailMaps from './components/maps/TrailMaps'
import MembersPanel from './components/trip/MembersPanel'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trip/:tripId"
        element={
          <ProtectedRoute>
            <TripLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<TripOverview />} />
        <Route path="logistics" element={<LogisticsHub />} />
        <Route path="itinerary" element={<Itinerary />} />
        <Route path="packing" element={<PackingLists />} />
        <Route path="expenses" element={<ExpenseTracker />} />
        <Route path="maps" element={<TrailMaps />} />
        <Route path="members" element={<MembersPanel />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
