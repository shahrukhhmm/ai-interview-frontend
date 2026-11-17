"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { Mic, MicOff, Send, User, X } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { interviewsApi, feedbackApi, type Interview, type Profile } from "../../lib/api"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
}

interface FeedbackForm {
  technicalScore: number
  softSkillsScore: number
  comments: string
}

const LiveInterviewRoom = () => {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [interviewer, setInterviewer] = useState<Profile | null>(null)
  const [interviewee, setInterviewee] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [transcript, setTranscript] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackForm>({
    technicalScore: 5,
    softSkillsScore: 5,
    comments: "",
  })
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch interview data
  useEffect(() => {
    const fetchInterview = async () => {
      if (!id || !user) return

      try {
        setLoading(true)

        // Fetch interview data using our API service
        const interviewData = await interviewsApi.getInterview(id)
        setInterview(interviewData)

        // Set interviewer and interviewee from the fetched data
        setInterviewer(interviewData.interviewer || null)
        setInterviewee(interviewData.interviewee || null)

        // Check if user is part of this interview
        if (user.id !== interviewData.interviewer_id && user.id !== interviewData.interviewee_id) {
          toast.error("You are not authorized to join this interview")
          // Redirect would happen here in a real app
        }

        // Load transcript if available
        if (interviewData.transcript) {
          setTranscript(interviewData.transcript)
        }
      } catch (error) {
        console.error("Error fetching interview:", error)
        toast.error("Failed to load interview data")
      } finally {
        setLoading(false)
      }
    }

    fetchInterview()
  }, [id, user])

  // Connect to WebSocket
  useEffect(() => {
    if (!interview || !user) return

    // In a real app, this would connect to a real WebSocket server
    // For this demo, we'll simulate WebSocket behavior
    const connectWebSocket = () => {
      // Simulate WebSocket connection
      setTimeout(() => {
        setConnected(true)
        toast.success("Connected to interview room")

        // Add system message
        const systemMessage: Message = {
          id: Date.now().toString(),
          sender: "system",
          content: "Welcome to the interview room. You are now connected.",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, systemMessage])

        // Simulate AI asking first question after 2 seconds
        setTimeout(() => {
          const aiMessage: Message = {
            id: Date.now().toString(),
            sender: "ai",
            content:
              "Hello! Let's start the interview. Could you please introduce yourself and tell me about your background?",
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, aiMessage])

          // Update transcript
          setTranscript(
            (prev) =>
              prev +
              `AI: Hello! Let's start the interview. Could you please introduce yourself and tell me about your background?\n\n`,
          )
        }, 2000)
      }, 1500)
    }

    connectWebSocket()

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [interview, user])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return

    // Create new message
    const message: Message = {
      id: Date.now().toString(),
      sender: user.id,
      content: newMessage,
      timestamp: new Date(),
    }

    // Add to messages
    setMessages((prev) => [...prev, message])

    // Update transcript
    setTranscript(
      (prev) => prev + `${profile?.role === "interviewer" ? "Interviewer" : "Interviewee"}: ${newMessage}\n\n`,
    )

    // Clear input
    setNewMessage("")

    // Simulate AI response after 1-3 seconds
    if (profile?.role === "interviewee") {
      setTimeout(
        () => {
          const aiResponses = [
            "That's interesting! Can you tell me about a challenging project you've worked on?",
            "Great answer. How do you handle tight deadlines and pressure?",
            "Could you explain your approach to problem-solving?",
            "What technologies are you most comfortable with?",
            "How do you stay updated with the latest industry trends?",
          ]

          const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]

          const aiMessage: Message = {
            id: Date.now().toString(),
            sender: "ai",
            content: randomResponse,
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, aiMessage])

          // Update transcript
          setTranscript((prev) => prev + `AI: ${randomResponse}\n\n`)
        },
        1000 + Math.random() * 2000,
      )
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)

    if (!isRecording) {
      toast.info("Voice recording started")
      // In a real app, this would start recording
    } else {
      toast.info("Voice recording stopped")
      // In a real app, this would stop recording
    }
  }

  const saveTranscript = async () => {
    if (!interview || !user) return

    try {
      // Update transcript using our API service
      await interviewsApi.updateTranscript(interview.id, transcript)
      toast.success("Transcript saved successfully")
    } catch (error) {
      console.error("Error saving transcript:", error)
      toast.error("Failed to save transcript")
    }
  }

  const handleSubmitFeedback = async () => {
    if (!interview || !user || user.id !== interview.interviewer_id) return

    try {
      setSubmittingFeedback(true)

      // Save transcript first
      await saveTranscript()

      // Submit feedback using our API service
      await feedbackApi.createFeedback({
        interview_id: interview.id,
        technical_score: feedback.technicalScore,
        soft_skills_score: feedback.softSkillsScore,
        comments: feedback.comments,
      })

      // Update interview status
      await interviewsApi.updateInterview(interview.id, {
        status: "completed",
      })

      toast.success("Feedback submitted successfully")
      setShowFeedbackForm(false)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setSubmittingFeedback(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!interview || !interviewer || !interviewee) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-xl">Interview not found</div>
        <p className="text-gray-500 mt-2">The interview you're looking for doesn't exist or you don't have access.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Interview Room</h1>
            <p className="text-sm text-gray-500">{new Date(interview.scheduled_at).toLocaleString()}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {profile?.role === "interviewer" ? interviewee.full_name : interviewer.full_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile?.role === "interviewer" ? "Interviewee" : "Interviewer"}
                </p>
              </div>
            </div>

            {profile?.role === "interviewer" && (
              <button type="button" className="btn btn-primary" onClick={() => setShowFeedbackForm(true)}>
                Submit Feedback
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col md:flex-row">
          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-white border-r">
            <div className="flex-1 p-4 overflow-y-auto">
              {!connected ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                  <p className="text-gray-500">Connecting to interview room...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "system"
                          ? "justify-center"
                          : message.sender === user?.id
                            ? "justify-end"
                            : "justify-start"
                      }`}
                    >
                      {message.sender === "system" ? (
                        <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500 max-w-md">
                          {message.content}
                        </div>
                      ) : message.sender === "ai" ? (
                        <div className="flex">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2 mt-1">
                            <span className="text-emerald-600 text-xs font-medium">AI</span>
                          </div>
                          <div className="bg-emerald-50 rounded-lg px-4 py-2 text-sm max-w-md">{message.content}</div>
                        </div>
                      ) : message.sender === user?.id ? (
                        <div className="bg-indigo-100 rounded-lg px-4 py-2 text-sm max-w-md">{message.content}</div>
                      ) : (
                        <div className="flex">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-1">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm max-w-md">{message.content}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <div className="flex items-center">
                <button
                  type="button"
                  className={`p-2 rounded-full mr-2 ${
                    isRecording ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={!connected}
                />
                <button
                  type="button"
                  className="btn btn-primary ml-2"
                  onClick={handleSendMessage}
                  disabled={!connected || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Transcript area */}
          <div className="w-full md:w-96 bg-white border-l">
            <div className="p-4 border-b">
              <h2 className="font-medium">Live Transcript</h2>
            </div>
            <div className="p-4 h-[calc(100%-60px)] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {transcript || "Transcript will appear here as the interview progresses..."}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Submit Feedback</h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowFeedbackForm(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Technical Skills (1-10)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      className="w-full"
                      value={feedback.technicalScore}
                      onChange={(e) => setFeedback({ ...feedback, technicalScore: Number.parseInt(e.target.value) })}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1</span>
                      <span>{feedback.technicalScore}</span>
                      <span>10</span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Soft Skills (1-10)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      className="w-full"
                      value={feedback.softSkillsScore}
                      onChange={(e) => setFeedback({ ...feedback, softSkillsScore: Number.parseInt(e.target.value) })}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1</span>
                      <span>{feedback.softSkillsScore}</span>
                      <span>10</span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Comments</label>
                    <textarea
                      className="input h-32"
                      placeholder="Provide detailed feedback..."
                      value={feedback.comments}
                      onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-primary ml-3"
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowFeedbackForm(false)}
                  disabled={submittingFeedback}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveInterviewRoom
