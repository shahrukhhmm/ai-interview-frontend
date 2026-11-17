export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: "interviewee" | "interviewer" | "admin"
          created_at: string
          updated_at: string
          phone: string | null
          onboarding_completed: boolean
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: "interviewee" | "interviewer" | "admin"
          created_at?: string
          updated_at?: string
          phone?: string | null
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: "interviewee" | "interviewer" | "admin"
          created_at?: string
          updated_at?: string
          phone?: string | null
          onboarding_completed?: boolean
        }
      }
      onboarding: {
        Row: {
          id: string
          user_id: string
          step: number
          education: "high_school" | "bachelors" | "masters" | "phd" | "other" | null
          resume_url: string | null
          skills: string[] | null
          experience: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          step?: number
          education?: "high_school" | "bachelors" | "masters" | "phd" | "other" | null
          resume_url?: string | null
          skills?: string[] | null
          experience?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          step?: number
          education?: "high_school" | "bachelors" | "masters" | "phd" | "other" | null
          resume_url?: string | null
          skills?: string[] | null
          experience?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          interviewer_id: string
          interviewee_id: string
          scheduled_at: string
          status: string
          room_id: string | null
          transcript: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          interviewer_id: string
          interviewee_id: string
          scheduled_at: string
          status?: string
          room_id?: string | null
          transcript?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          interviewer_id?: string
          interviewee_id?: string
          scheduled_at?: string
          status?: string
          room_id?: string | null
          transcript?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          interview_id: string
          technical_score: number | null
          soft_skills_score: number | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          technical_score?: number | null
          soft_skills_score?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          technical_score?: number | null
          soft_skills_score?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
