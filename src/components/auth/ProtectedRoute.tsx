"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import type { UserRole } from "../../lib/api"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // Role check
  if (requiredRole && profile?.role !== requiredRole && profile?.role !== "admin") {
    // Redirect based on actual role
    if (profile?.role === "interviewee") {
      return <Navigate to="/interviewee" replace />
    } else if (profile?.role === "interviewer") {
      return <Navigate to="/interviewer" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  // Onboarding check for interviewees
  if (profile?.role === "interviewee" && !profile.onboarding_completed && window.location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
