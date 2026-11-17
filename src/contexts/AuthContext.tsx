/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { authApi, profilesApi, type Profile, type UserRole } from "../lib/api"

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in (token exists)
    const checkAuth = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("auth_token")

        if (token) {
          const { user, profile } = await authApi.getCurrentUser()
          setUser(user)
          setProfile(profile)
        }
      } catch (error: any) {
        console.error("Auth check error:", error)
        // Clear invalid token
        localStorage.removeItem("auth_token")
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  async function signUp(email: string, password: string, fullName: string, role: UserRole) {
    try {
      setLoading(true)
      setError(null)

      const { user, profile } = await authApi.register(email, password, fullName, role)

      setUser(user)
      setProfile(profile)
    } catch (error: any) {
      console.error("Error signing up:", error)
      setError(error.message || "Failed to sign up")
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setLoading(true)
      setError(null)

      const { user, profile } = await authApi.login(email, password)

      setUser(user)
      setProfile(profile)
    } catch (error: any) {
      console.error("Error signing in:", error)
      setError(error.message || "Failed to sign in")
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    try {
      setLoading(true)
      setError(null)

      await authApi.logout()

      setUser(null)
      setProfile(null)
    } catch (error: any) {
      console.error("Error signing out:", error)
      setError(error.message || "Failed to sign out")
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(data: Partial<Profile>) {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        throw new Error("No user logged in")
      }

      const updatedProfile = await profilesApi.updateProfile(user.id, data)
      setProfile(updatedProfile)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message || "Failed to update profile")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
