/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { onboardingApi, filesApi, type EducationLevel, type Onboarding } from "../../lib/api"

interface ResumeData {
  skills: string[]
  experience: { title: string; duration: string }[]
}

const IntervieweeOnboarding = () => {
  const { user, profile, updateProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [onboardingData, setOnboardingData] = useState<Onboarding | null>(null)

  // Step 1 data
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [education, setEducation] = useState<EducationLevel>("bachelors")

  // Step 2 data
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Step 3 data
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [experience, setExperience] = useState<Array<{ title: string; duration: string }>>([])
  const [newExpTitle, setNewExpTitle] = useState("")
  const [newExpDuration, setNewExpDuration] = useState("")

  const navigate = useNavigate()

  // Fetch onboarding data
  useEffect(() => {
    const fetchOnboardingData = async () => {
      if (!user) return

      try {
        setLoading(true)

        const data = await onboardingApi.getOnboarding(user.id)

        if (data) {
          setOnboardingData(data)
          setStep(data.step || 1)

          // Populate form data from saved state
          if (data.education) setEducation(data.education)
          if (data.resume_url) setResumeUrl(data.resume_url)
          if (data.skills) setSkills(data.skills)
          if (data.experience) setExperience(data.experience as any)
        }

        // Populate name and phone from profile
        if (profile) {
          setFullName(profile.full_name)
          if (profile.phone) setPhone(profile.phone)
        }
      } catch (error) {
        console.error("Error fetching onboarding data:", error)
        toast.error("Failed to load your onboarding data")
      } finally {
        setLoading(false)
      }
    }

    fetchOnboardingData()
  }, [user, profile])

  const saveOnboardingData = async (newStep: number) => {
    if (!user) return

    try {
      setLoading(true)

      // Update profile data
      if (step === 1) {
        await updateProfile({
          full_name: fullName,
          phone,
        })
      }

      // Prepare onboarding data
      const onboardingUpdateData: any = {
        step: newStep,
      }

      if (step === 1) {
        onboardingUpdateData.education = education
      } else if (step === 2) {
        onboardingUpdateData.resume_url = resumeUrl
      } else if (step === 3) {
        onboardingUpdateData.skills = skills
        onboardingUpdateData.experience = experience
      }

      // Update onboarding record
      await onboardingApi.updateOnboarding(user.id, onboardingUpdateData)

      // If completing the final step, mark onboarding as complete
      if (newStep > 3) {
        await onboardingApi.completeOnboarding(user.id)
        navigate("/interviewee")
        toast.success("Onboarding completed successfully!")
      } else {
        setStep(newStep)
      }
    } catch (error: any) {
      console.error("Error saving onboarding data:", error)
      toast.error(error.message || "Failed to save your information")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setResumeFile(file)
      setLoading(true)
      setUploadProgress(10) // Start progress

      // Upload file to server
      const response = await filesApi.uploadResume(user.id, file)

      setResumeUrl(response.resume_url)
      setUploadProgress(100)

      // Try to parse resume data (mock implementation)
      parseResumeData(file)

      toast.success("Resume uploaded successfully")
    } catch (error: any) {
      console.error("Error uploading resume:", error)
      toast.error(error.message || "Failed to upload resume")
    } finally {
      setLoading(false)
      setTimeout(() => setUploadProgress(0), 1000) // Reset progress after a delay
    }
  }

  const parseResumeData = async (file: File) => {
    // This would normally use PDF.js or another library to extract text
    // For this example, we'll just mock some data

    // Mock delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockData: ResumeData = {
      skills: ["JavaScript", "React", "TypeScript", "Node.js"],
      experience: [
        { title: "Frontend Developer", duration: "2 years" },
        { title: "Web Developer Intern", duration: "6 months" },
      ],
    }

    // Pre-populate the form with extracted data
    setSkills(mockData.skills)
    setExperience(mockData.experience)
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const addExperience = () => {
    if (newExpTitle.trim() && newExpDuration.trim()) {
      setExperience([
        ...experience,
        {
          title: newExpTitle.trim(),
          duration: newExpDuration.trim(),
        },
      ])
      setNewExpTitle("")
      setNewExpDuration("")
    }
  }

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index))
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Primary Details</h2>

            <div>
              <label htmlFor="fullName" className="label">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="education" className="label">
                Education
              </label>
              <select
                id="education"
                className="input"
                value={education}
                onChange={(e) => setEducation(e.target.value as EducationLevel)}
                required
              >
                <option value="high_school">High School</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Resume Upload</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {resumeUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-green-500">
                    <Check className="h-8 w-8 mr-2" />
                    <span className="text-lg font-medium">Resume Uploaded</span>
                  </div>
                  <p className="text-sm text-gray-500">Your resume has been uploaded and processed.</p>
                  <button type="button" className="btn btn-outline" onClick={() => setResumeUrl(null)}>
                    Replace Resume
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-gray-400">
                    <Upload className="h-8 w-8 mr-2" />
                    <span className="text-lg font-medium">Upload Resume</span>
                  </div>
                  <p className="text-sm text-gray-500">PDF or Word document (max 5MB)</p>
                  <input
                    type="file"
                    id="resume"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="resume" className="btn btn-outline inline-block cursor-pointer">
                    Select File
                  </label>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500">
              We'll automatically extract information from your resume to help you complete the next step.
            </p>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Skills & Experience</h2>

            <div>
              <label className="label">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {skill}
                    <button
                      type="button"
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                      onClick={() => removeSkill(skill)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="input rounded-r-none"
                  placeholder="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                />
                <button type="button" className="btn btn-primary rounded-l-none" onClick={addSkill}>
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="label">Experience</label>
              <div className="space-y-4 mb-4">
                {experience.map((exp, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{exp.title}</h3>
                      <p className="text-sm text-gray-500">{exp.duration}</p>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => removeExperience(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  className="input"
                  placeholder="Job Title"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Duration (e.g., 2 years)"
                  value={newExpDuration}
                  onChange={(e) => setNewExpDuration(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-outline mt-2" onClick={addExperience}>
                Add Experience
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return fullName.trim() !== "" && phone.trim() !== "" && education !== undefined
      case 2:
        return true // Resume is optional
      case 3:
        return skills.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">Complete Your Profile</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's set up your profile to help you get the most out of our platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`flex flex-col items-center ${
                    stepNumber < step ? "text-indigo-600" : stepNumber === step ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      stepNumber < step
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : stepNumber === step
                          ? "border-indigo-600 text-indigo-600"
                          : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {stepNumber < step ? <Check className="w-5 h-5" /> : stepNumber}
                  </div>
                  <div className="text-xs mt-1">
                    {stepNumber === 1 ? "Details" : stepNumber === 2 ? "Resume" : "Skills"}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between">
              <div className="h-1 w-full bg-indigo-600"></div>
              <div className={`h-1 w-full ${step >= 2 ? "bg-indigo-600" : "bg-gray-300"}`}></div>
              <div className={`h-1 w-full ${step >= 3 ? "bg-indigo-600" : "bg-gray-300"}`}></div>
            </div>
          </div>

          {/* Step content */}
          <form onSubmit={(e) => e.preventDefault()}>
            {renderStep()}

            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  className="btn btn-outline flex items-center"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                className="btn btn-primary flex items-center"
                onClick={() => saveOnboardingData(step + 1)}
                disabled={loading || !isStepValid()}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  </span>
                ) : (
                  <>
                    {step === 3 ? "Complete" : "Next"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default IntervieweeOnboarding
