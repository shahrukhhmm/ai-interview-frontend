/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify"

// Base API URL - replace with your actual API URL when deployed
const API_BASE_URL = "http://localhost:5000/api"

// Types
export type UserRole = "interviewee" | "interviewer" | "admin"
export type EducationLevel = "high_school" | "bachelors" | "masters" | "phd" | "other"

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
  phone?: string
  onboarding_completed: boolean
}

export interface Onboarding {
  id: string
  user_id: string
  step: number
  education?: EducationLevel
  resume_url?: string
  skills?: string[]
  experience?: Array<{ title: string; duration: string }>
  created_at: string
  updated_at: string
}

export interface Interview {
  id: string
  interviewer_id: string
  interviewee_id: string
  scheduled_at: string
  status: "scheduled" | "completed" | "cancelled"
  room_id?: string
  transcript?: string
  created_at: string
  updated_at: string
  interviewer?: Profile
  interviewee?: Profile
}

export interface Feedback {
  id: string
  interview_id: string
  technical_score?: number
  soft_skills_score?: number
  comments?: string
  created_at: string
  updated_at: string
  interview?: Interview
}

export interface AuthResponse {
  user: {
    id: string
    email: string
  }
  token: string
  profile: Profile
}

// Helper function to get the auth token
const getToken = (): string | null => {
  return localStorage.getItem("auth_token")
}

// Helper function to handle API errors
const handleApiError = (error: any): never => {
  const message = error.message || "An unexpected error occurred"
  toast.error(message)
  throw error
}

// Generic API request function with authentication
async function apiRequest<T>(endpoint: string, method = "GET", data?: any, requiresAuth = true): Promise<T> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (requiresAuth) {
      const token = getToken()
      if (!token) {
        throw new Error("Authentication required")
      }
      headers["Authorization"] = `Bearer ${token}`
    }

    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.message || "API request failed")
    }

    return responseData
  } catch (error: any) {
    return handleApiError(error)
  }
}

// Auth API functions
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await apiRequest<AuthResponse>("/auth/login", "POST", { email, password }, false)
    localStorage.setItem("auth_token", data.token)
    return data
  },

  register: async (email: string, password: string, fullName: string, role: UserRole): Promise<AuthResponse> => {
    const data = await apiRequest<AuthResponse>("/auth/register", "POST", { email, password, fullName, role }, false)
    localStorage.setItem("auth_token", data.token)
    return data
  },

  logout: async (): Promise<void> => {
    await apiRequest<void>("/auth/logout", "POST")
    localStorage.removeItem("auth_token")
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/me", "GET")
  },
}

// Profiles API functions
export const profilesApi = {
  getProfile: async (userId: string): Promise<Profile> => {
    return apiRequest<Profile>(`/profiles/${userId}`, "GET")
  },

  updateProfile: async (userId: string, profileData: Partial<Profile>): Promise<Profile> => {
    return apiRequest<Profile>(`/profiles/${userId}`, "PUT", profileData)
  },

  getAllProfiles: async (role?: UserRole): Promise<Profile[]> => {
    const endpoint = role ? `/profiles?role=${role}` : "/profiles"
    return apiRequest<Profile[]>(endpoint, "GET")
  },
}

// Onboarding API functions
export const onboardingApi = {
  getOnboarding: async (userId: string): Promise<Onboarding> => {
    return apiRequest<Onboarding>(`/onboarding/${userId}`, "GET")
  },

  updateOnboarding: async (userId: string, data: Partial<Onboarding>): Promise<Onboarding> => {
    return apiRequest<Onboarding>(`/onboarding/${userId}`, "PUT", data)
  },

  completeOnboarding: async (userId: string): Promise<Profile> => {
    return apiRequest<Profile>(`/onboarding/${userId}/complete`, "POST")
  },
}

// Interviews API functions
export const interviewsApi = {
  getInterviews: async (params?: {
    interviewerId?: string
    intervieweeId?: string
    status?: string
    upcoming?: boolean
  }): Promise<Interview[]> => {
    let endpoint = "/interviews"
    const queryParams = new URLSearchParams()

    if (params) {
      if (params.interviewerId) queryParams.append("interviewerId", params.interviewerId)
      if (params.intervieweeId) queryParams.append("intervieweeId", params.intervieweeId)
      if (params.status) queryParams.append("status", params.status)
      if (params.upcoming) queryParams.append("upcoming", "true")
    }

    const queryString = queryParams.toString()
    if (queryString) {
      endpoint += `?${queryString}`
    }

    return apiRequest<Interview[]>(endpoint, "GET")
  },

  getInterview: async (id: string): Promise<Interview> => {
    return apiRequest<Interview>(`/interviews/${id}`, "GET")
  },

  createInterview: async (data: {
    interviewer_id: string
    interviewee_id: string
    scheduled_at: string
  }): Promise<Interview> => {
    return apiRequest<Interview>("/interviews", "POST", data)
  },

  updateInterview: async (id: string, data: Partial<Interview>): Promise<Interview> => {
    return apiRequest<Interview>(`/interviews/${id}`, "PUT", data)
  },

  updateTranscript: async (id: string, transcript: string): Promise<Interview> => {
    return apiRequest<Interview>(`/interviews/${id}/transcript`, "PUT", { transcript })
  },
}

// Feedback API functions
export const feedbackApi = {
  getFeedback: async (interviewId: string): Promise<Feedback> => {
    return apiRequest<Feedback>(`/feedback/${interviewId}`, "GET")
  },

  getFeedbackByUser: async (userId: string): Promise<Feedback[]> => {
    return apiRequest<Feedback[]>(`/feedback/user/${userId}`, "GET")
  },

  createFeedback: async (data: {
    interview_id: string
    technical_score?: number
    soft_skills_score?: number
    comments?: string
  }): Promise<Feedback> => {
    return apiRequest<Feedback>("/feedback", "POST", data)
  },
}

// File upload API functions
export const filesApi = {
  uploadResume: async (userId: string, file: File): Promise<{ resume_url: string }> => {
    const formData = new FormData()
    formData.append("resume", file)

    try {
      const headers: HeadersInit = {}
      const token = getToken()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/files/resume/${userId}`, {
        method: "POST",
        headers,
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload resume")
      }

      return data
    } catch (error: any) {
      return handleApiError(error)
    }
  },
}

// Admin API functions
export const adminApi = {
  getDashboardStats: async (): Promise<{
    totalUsers: number
    totalInterviews: number
    completedInterviews: number
    pendingInterviews: number
    userRoleDistribution: { name: string; value: number }[]
    averageRatings: { name: string; score: number }[]
  }> => {
    return apiRequest<any>("/admin/stats", "GET")
  },

  createUser: async (userData: {
    email: string
    password: string
    fullName: string
    role: UserRole
  }): Promise<Profile> => {
    return apiRequest<Profile>("/admin/users", "POST", userData)
  },

  updateUser: async (userId: string, userData: Partial<Profile>): Promise<Profile> => {
    return apiRequest<Profile>(`/admin/users/${userId}`, "PUT", userData)
  },

  deleteUser: async (userId: string): Promise<void> => {
    return apiRequest<void>(`/admin/users/${userId}`, "DELETE")
  },
}
