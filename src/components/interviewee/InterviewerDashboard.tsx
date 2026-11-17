"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { Calendar, Clock, Search, User } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { interviewsApi, profilesApi, type Interview, type Profile } from "../../lib/api"

const InterviewerDashboard = () => {
  const { user } = useAuth()
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [interviewees, setInterviewees] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [schedulingInterview, setSchedulingInterview] = useState(false)

  // Form state
  const [selectedInterviewee, setSelectedInterviewee] = useState("")
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewTime, setInterviewTime] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredInterviewees, setFilteredInterviewees] = useState<Profile[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch upcoming interviews using our API service
        const interviews = await interviewsApi.getInterviews({
          interviewerId: user.id,
          status: "scheduled",
          upcoming: true,
        })
        setUpcomingInterviews(interviews)

        // Fetch all interviewees using our API service
        const intervieweeProfiles = await profilesApi.getAllProfiles("interviewee")
        // Filter only completed onboarding profiles
        const completedOnboarding = intervieweeProfiles.filter((profile) => profile.onboarding_completed)
        setInterviewees(completedOnboarding)
        setFilteredInterviewees(completedOnboarding)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInterviewees(interviewees)
    } else {
      const filtered = interviewees.filter(
        (interviewee) =>
          interviewee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          interviewee.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredInterviewees(filtered)
    }
  }, [searchQuery, interviewees])

  const handleScheduleInterview = async () => {
    if (!user || !selectedInterviewee || !interviewDate || !interviewTime) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setSchedulingInterview(true)

      // Combine date and time
      const scheduledAt = new Date(`${interviewDate}T${interviewTime}`)

      // Check if date is in the past
      if (scheduledAt < new Date()) {
        toast.error("Cannot schedule interviews in the past")
        return
      }

      // Create interview using our API service
      await interviewsApi.createInterview({
        interviewer_id: user.id,
        interviewee_id: selectedInterviewee,
        scheduled_at: scheduledAt.toISOString(),
      })

      toast.success("Interview scheduled successfully")

      // Reset form
      setSelectedInterviewee("")
      setInterviewDate("")
      setInterviewTime("")

      // Refresh interviews
      const interviews = await interviewsApi.getInterviews({
        interviewerId: user.id,
        status: "scheduled",
        upcoming: true,
      })
      setUpcomingInterviews(interviews)
    } catch (error) {
      console.error("Error scheduling interview:", error)
      toast.error("Failed to schedule interview")
    } finally {
      setSchedulingInterview(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get tomorrow's date in YYYY-MM-DD format for min date in date picker
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Upcoming Interviews */}
      <div className="md:col-span-2">
        <div className="card">
          <h2 className="card-title">Upcoming Interviews</h2>

          {upcomingInterviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p>No upcoming interviews scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(interview.scheduled_at)}
                      <Clock className="h-4 w-4 ml-3 mr-1" />
                      {formatTime(interview.scheduled_at)}
                    </div>
                    <div className="font-medium">Interview with {interview.interviewee?.full_name}</div>
                    <div className="text-sm text-gray-500">{interview.interviewee?.email}</div>
                  </div>
                  <Link to={`/interview/${interview.id}`} className="btn btn-primary">
                    Join
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview */}
      <div className="md:col-span-1">
        <div className="card">
          <h2 className="card-title">Schedule Interview</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="interviewee" className="label">
                Interviewee
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search interviewees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                {filteredInterviewees.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">No interviewees found</div>
                ) : (
                  filteredInterviewees.map((interviewee) => (
                    <div
                      key={interviewee.id}
                      className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 ${
                        selectedInterviewee === interviewee.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => setSelectedInterviewee(interviewee.id)}
                    >
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium">{interviewee.full_name}</div>
                        <div className="text-xs text-gray-500">{interviewee.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label htmlFor="date" className="label">
                Date
              </label>
              <input
                id="date"
                type="date"
                className="input"
                min={getTomorrowDate()}
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="time" className="label">
                Time
              </label>
              <input
                id="time"
                type="time"
                className="input"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleScheduleInterview}
              disabled={schedulingInterview || !selectedInterviewee || !interviewDate || !interviewTime}
            >
              {schedulingInterview ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewerDashboard
