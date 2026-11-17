"use client"

import { useEffect } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import AdminDashboard from "./components/admin/AdminDashboard"
import AdminUserManagement from "./components/admin/AdminUserManagement"
import IntervieweeOnboarding from "./components/interviewee/IntervieweeOnboarding"
import IntervieweeDashboard from "./components/interviewee/IntervieweeDashboard"
import InterviewerDashboard from "./components/interviewee/InterviewerDashboard"
import LiveInterviewRoom from "./components/interview/LiveInterviewRoom"
import AuthLayout from "./components/layouts/AuthLayout"
import DashboardLayout from "./components/layouts/DashboardLayout"
import LoginForm from "./components/auth/LoginForm"
import SignupForm from "./components/auth/SignupForm"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { useAuth } from "./contexts/AuthContext"

function App() {
  const { user, profile, loading, error } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Redirect to onboarding if user is interviewee and hasn't completed onboarding
  useEffect(() => {
    if (!loading && user && profile && profile.role === "interviewee" && !profile.onboarding_completed) {
      navigate("/onboarding")
    }
  }, [loading, user, profile, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
      </Route>

      {/* Onboarding Routes */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <IntervieweeOnboarding />
          </ProtectedRoute>
        }
      />

      {/* Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        {/* Interviewee Routes */}
        <Route
          path="/interviewee"
          element={
            <ProtectedRoute requiredRole="interviewee">
              <IntervieweeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Interviewer Routes */}
        <Route
          path="/interviewer"
          element={
            <ProtectedRoute requiredRole="interviewer">
              <InterviewerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUserManagement />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Interview Room */}
      <Route
        path="/interview/:id"
        element={
          <ProtectedRoute>
            <LiveInterviewRoom />
          </ProtectedRoute>
        }
      />

      {/* Redirect based on role */}
      <Route
        path="/"
        element={
          user ? (
            profile?.role === "interviewee" ? (
              <Navigate to="/interviewee" replace />
            ) : profile?.role === "interviewer" ? (
              <Navigate to="/interviewer" replace />
            ) : profile?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
