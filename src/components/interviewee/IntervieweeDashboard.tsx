"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { Calendar, Clock, Edit, CheckCircle, ArrowRight } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { interviewsApi, feedbackApi, profilesApi, type Feedback, type Interview } from "../../lib/api"

const IntervieweeDashboard = () => {
  const { user, profile } = useAuth()
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [pastFeedback, setPastFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setEmail(profile.email)
      setPhone(profile.phone || "")
    }
  }, [profile])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch upcoming interviews
        const interviews = await interviewsApi.getInterviews({
          intervieweeId: user.id,
          status: "scheduled",
          upcoming: true,
        })
        setUpcomingInterviews(interviews)

        // Fetch past feedback
        const feedback = await feedbackApi.getFeedbackByUser(user.id)
        setPastFeedback(feedback)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      setUpdating(true)

      await profilesApi.updateProfile(user.id, {
        full_name: fullName,
        phone,
      })

      setEditMode(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setUpdating(false)
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
            {upcomingInterviews.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {upcomingInterviews.length} scheduled
              </span>
            )}
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming interviews</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                You don't have any interviews scheduled. Check back later or contact an interviewer to schedule one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <Calendar className="h-4 w-4 mr-1.5 text-indigo-500" />
                        <span className="font-medium text-gray-900">{formatDate(interview.scheduled_at)}</span>
                        <span className="mx-2">•</span>
                        <Clock className="h-4 w-4 mr-1.5 text-indigo-500" />
                        <span>{formatTime(interview.scheduled_at)}</span>
                      </div>
                      <h3 className="font-medium text-lg text-gray-900 mb-1">
                        Interview with {interview.interviewer?.full_name}
                      </h3>
                      <p className="text-gray-500 text-sm">{interview.interviewer?.email}</p>
                    </div>
                    <Link
                      to={`/interview/${interview.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Join Interview
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Interview Results</h2>
          </div>

          {pastFeedback.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No interview results yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Once you complete interviews, your feedback and results will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Interviewer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Technical Score
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Soft Skills Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pastFeedback.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {feedback.interview && formatDate(feedback.interview.scheduled_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {feedback.interview?.interviewer?.full_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {feedback.interview?.interviewer?.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-3">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{ width: `${(feedback.technical_score || 0) * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{feedback.technical_score}/10</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-3">
                            <div
                              className="bg-emerald-500 h-2.5 rounded-full"
                              style={{ width: `${(feedback.soft_skills_score || 0) * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{feedback.soft_skills_score}/10</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            {!editMode && (
              <button
                type="button"
                className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setEditMode(true)}
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {fullName.charAt(0)}
              </div>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
                    value={email}
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleUpdateProfile}
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      setEditMode(false)
                      if (profile) {
                        setFullName(profile.full_name)
                        setEmail(profile.email)
                        setPhone(profile.phone || "")
                      }
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Full Name</h3>
                  <p className="text-gray-900 font-medium">{fullName}</p>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</h3>
                  <p className="text-gray-900">{email}</p>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</h3>
                  <p className="text-gray-900">{phone || "Not provided"}</p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                    {profile?.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntervieweeDashboard
