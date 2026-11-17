
import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

const AuthLayout = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // If user is already logged in, redirect to appropriate dashboard
  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-indigo-600">Interview Platform</h1>
          <p className="mt-2 text-sm text-gray-600">Your AI-powered interview assistant</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
