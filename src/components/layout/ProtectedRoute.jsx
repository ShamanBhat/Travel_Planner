// src/components/layout/ProtectedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-app-bg">
        <Loader2 className="animate-spin text-app-primary" size={28} />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}
