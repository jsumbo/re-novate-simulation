"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { OfflineBanner } from "@/components/ui/offline-banner"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { AvatarBuilder } from "./avatar-builder"
import { SkillsQuiz } from "./skills-quiz"
import { GoalsSelector } from "./goals-selector"
import { AIFeedback } from "./ai-feedback"
import { Celebration } from "./celebration"

import { createStudentProfile } from "@/lib/onboarding/actions"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  Lightbulb,
  Megaphone,
  Scale,
  DollarSign,
  Heart,
  GraduationCap,
  Palette,
  Leaf,
  Building,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Users,
  Target,
  Zap,
  Trophy,
  ArrowRight,
  ArrowLeft
} from "lucide-react"

type OnboardingStep =
  | "welcome"
  | "username"
  | "personal-info"
  | "interest"
  | "avatar"
  | "quiz"
  | "goals"
  | "motivation"
  | "aspirations"
  | "preferences"
  | "walkthrough"
  | "connections"

type InterestArea =
  | "Business & Management"
  | "Technology & Innovation"
  | "Marketing & Sales"
  | "Law & Ethics"
  | "Finance & Economics"
  | "Health & Well-Being"
  | "Education & Training"
  | "Creative Arts & Media"
  | "Agriculture & Sustainability"
  | "Public Service & Policy"

interface Avatar {
  id: string
  name: string
  image: string
  gender: 'male' | 'female'
  description: string
}

interface OnboardingData {
  username: string
  fullName: string
  gender: string
  dateOfBirth: string
  studentClass: string
  interestArea: InterestArea | null
  avatar: Avatar
  quizScore: number
  skillLevel: string
  goals: Array<{ id: string; text: string; category: string }>
  motivation: string
  aspirations: string
  learningPreference: string
  participantId?: string
}

const interestOptions: {
  area: InterestArea
  icon: React.ReactNode
  title: string
  description: string
  skills: string[]
}[] = [
    {
      area: "Business & Management",
      icon: <Briefcase className="h-8 w-8" />,
      title: "Business & Management",
      description: "Explore leadership, entrepreneurship, and how to make smart decisions in organizations.",
      skills: ["Leadership", "Strategic Thinking", "Decision Making", "Entrepreneurship"],
    },
    {
      area: "Technology & Innovation",
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Technology & Innovation",
      description: "Learn how creativity and tech tools can solve real-world problems and spark new ideas.",
      skills: ["Innovation", "Problem Solving", "Technical Strategy", "Creative Thinking"],
    },
    {
      area: "Marketing & Sales",
      icon: <Megaphone className="h-8 w-8" />,
      title: "Marketing & Sales",
      description: "Build communication, creativity, and strategy skills through customer and product challenges.",
      skills: ["Communication", "Creativity", "Strategy", "Customer Relations"],
    },
    {
      area: "Law & Ethics",
      icon: <Scale className="h-8 w-8" />,
      title: "Law & Ethics",
      description: "Understand fairness, justice, and how ethical decisions shape teams and communities.",
      skills: ["Critical Thinking", "Ethics", "Justice", "Decision Making"],
    },
    {
      area: "Finance & Economics",
      icon: <DollarSign className="h-8 w-8" />,
      title: "Finance & Economics",
      description: "Discover how money, budgeting, and investment decisions affect success and impact.",
      skills: ["Financial Literacy", "Analysis", "Planning", "Investment Strategy"],
    },
    {
      area: "Health & Well-Being",
      icon: <Heart className="h-8 w-8" />,
      title: "Health & Well-Being",
      description: "Strengthen empathy, teamwork, and crisis management through health-related scenarios.",
      skills: ["Empathy", "Teamwork", "Crisis Management", "Care"],
    },
    {
      area: "Education & Training",
      icon: <GraduationCap className="h-8 w-8" />,
      title: "Education & Training",
      description: "Develop leadership and mentoring skills to guide others and improve learning.",
      skills: ["Leadership", "Mentoring", "Communication", "Development"],
    },
    {
      area: "Creative Arts & Media",
      icon: <Palette className="h-8 w-8" />,
      title: "Creative Arts & Media",
      description: "Express ideas through storytelling, design, and creativity that inspire and inform.",
      skills: ["Creativity", "Storytelling", "Design", "Communication"],
    },
    {
      area: "Agriculture & Sustainability",
      icon: <Leaf className="h-8 w-8" />,
      title: "Agriculture & Sustainability",
      description: "Learn about agribusiness, food systems, and protecting the environment through innovation.",
      skills: ["Sustainability", "Innovation", "Environmental Awareness", "Systems Thinking"],
    },
    {
      area: "Public Service & Policy",
      icon: <Building className="h-8 w-8" />,
      title: "Public Service & Policy",
      description: "Experience leadership and decision-making that helps communities grow and thrive.",
      skills: ["Leadership", "Policy Making", "Community Building", "Public Service"],
    },
  ]

const motivationOptions = [
  { id: "career", text: "I want to prepare for my future career", icon: "💼" },
  { id: "skills", text: "I want to develop new skills", icon: "🚀" },
  { id: "curiosity", text: "I'm curious about this field", icon: "🤔" },
  { id: "impact", text: "I want to make a positive impact", icon: "🌟" },
  { id: "challenge", text: "I enjoy challenging myself", icon: "💪" },
  { id: "fun", text: "It sounds fun and interesting", icon: "😄" }
]

const aspirationOptions = [
  { id: "entrepreneur", text: "Start my own business", icon: "🚀" },
  { id: "corporate", text: "Work for a big company", icon: "🏢" },
  { id: "nonprofit", text: "Help communities and causes", icon: "❤️" },
  { id: "government", text: "Work in government or policy", icon: "🏛️" },
  { id: "education", text: "Become a teacher or trainer", icon: "📚" },
  { id: "freelance", text: "Work independently as a freelancer", icon: "💻" },
  { id: "research", text: "Do research and innovation", icon: "🔬" },
  { id: "unsure", text: "I'm still exploring my options", icon: "🤷‍♀️" }
]

interface EnhancedOnboardingFlowProps {
  user: any
}

export function EnhancedOnboardingFlow({ user }: EnhancedOnboardingFlowProps) {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAIFeedback, setShowAIFeedback] = useState(false)
  const [aiFeedbackStep, setAIFeedbackStep] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<"interest" | "avatar" | "quiz" | "goals" | "complete">("complete")


  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    username: "",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    studentClass: "",
    interestArea: null,
    avatar: {
      id: 'male-1',
      name: 'The Strategist',
      image: '👨🏽‍💼',
      gender: 'male',
      description: 'Master of Business'
    },
    quizScore: 0,
    skillLevel: "Beginner",
    goals: [],
    motivation: "",
    aspirations: "",
    learningPreference: ""
  })

  const steps: OnboardingStep[] = ["welcome", "username", "personal-info", "interest", "avatar", "quiz", "goals", "motivation", "aspirations", "preferences", "walkthrough", "connections"]
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      // Trigger AI feedback for certain steps
      if (currentStep === "interest" && onboardingData.interestArea) {
        setAIFeedbackStep("interest_selected")
        setShowAIFeedback(true)
        setTimeout(() => setShowAIFeedback(false), 3000)
      }
      
      if (currentStep === "goals" && onboardingData.goals.length > 0) {
        setAIFeedbackStep("goals_set")
        setShowAIFeedback(true)
        setTimeout(() => setShowAIFeedback(false), 3000)
      }
      
      setCurrentStep(steps[nextIndex])
      setError("")
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
      setError("")
    }
  }

  const handleComplete = async () => {
    if (!onboardingData.interestArea) {
      setError("Please complete all steps before finishing.")
      return
    }

    if (!isOnline) {
      setError("You're currently offline. Please check your internet connection and try again.")
      return
    }

    setError("")
    setIsLoading(true)

    try {

      // Get school data from localStorage
      const selectedSchoolData = localStorage.getItem('selectedSchool')
      const school = selectedSchoolData ? JSON.parse(selectedSchoolData) : null

      if (!school) {
        throw new Error("School information not found. Please log in again.")
      }

      // Create complete student profile
      const result = await createStudentProfile({
        participantId: user.participant_id,
        schoolCode: school.code,
        username: onboardingData.username,
        fullName: onboardingData.fullName,
        gender: onboardingData.gender,
        dateOfBirth: onboardingData.dateOfBirth,
        studentClass: onboardingData.studentClass,
        careerPath: onboardingData.interestArea as any,
        avatarConfig: onboardingData.avatar,
        skillsAssessment: {
          score: onboardingData.quizScore,
          level: onboardingData.skillLevel
        },
        goals: onboardingData.goals,
        motivation: onboardingData.motivation,
        aspirations: onboardingData.aspirations,
        learningPreference: onboardingData.learningPreference
      })

      if (result.success) {
        // Store the created user data
        localStorage.setItem('currentUser', JSON.stringify(result.user))
        
        // Update onboarding data with the actual participant ID from database
        setOnboardingData(prev => ({ 
          ...prev, 
          participantId: result.user.participant_id 
        }))
        
        // Show celebration with AI mentor introduction
        setCelebrationType("complete")
        setShowCelebration(true)
      } else {
        throw new Error(result.error || "Failed to save your profile. Please try again.")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCelebrationComplete = () => {
    setShowCelebration(false)
    router.push("/student/dashboard")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <Card className="border-gray-200 shadow-lg max-w-2xl mx-auto bg-white">
            <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-black leading-tight">Welcome to RE-Novate!</CardTitle>
              <CardDescription className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">
                Let's set up your personalized learning journey at <strong>{user.schools?.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-200">
                <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-black flex-shrink-0" />
                  Your Adventure Awaits!
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm lg:text-base text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-black text-sm sm:text-base flex-shrink-0">✨</span>
                    <span>Create your unique avatar and profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black text-sm sm:text-base flex-shrink-0">🧠</span>
                    <span>Take a fun quiz to discover your starting level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black text-sm sm:text-base flex-shrink-0">🎯</span>
                    <span>Set exciting goals for your learning journey</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black text-sm sm:text-base flex-shrink-0">🚀</span>
                    <span>Explore real-world scenarios and challenges</span>
                  </li>
                </ul>
              </div>



              <Button
                onClick={handleNext}
                className="w-full bg-black hover:bg-gray-800 text-white text-sm sm:text-base h-12 sm:h-auto"
                size="lg"
                disabled={!isOnline}
              >
                Let's Get Started! <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )

      case "username":
        return (
          <Card className="border-gray-200 shadow-lg max-w-md mx-auto bg-white">
            <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎮</div>
              <CardTitle className="text-xl sm:text-2xl text-black leading-tight">Choose Your User Name</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
                Pick a cool username that represents you!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-black">Your Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="(e.g., Jay, Keema, Queen V, Big Dave)"
                  value={onboardingData.username}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, username: e.target.value }))}
                  className="h-12 text-base"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500">
                  This will be your identity in RE-Novate. Make it unique! 🌟
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="font-semibold text-black mb-2 text-sm">💡 Username Tips:</h3>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Keep it fun and positive</li>
                  <li>• No personal information (real name, phone, etc.)</li>
                  <li>• 3-20 characters long</li>
                  <li>• Be creative and express yourself!</li>
                </ul>
              </div>

              <Button 
                onClick={handleNext} 
                className="w-full bg-black hover:bg-gray-800 text-white text-sm sm:text-base h-12" 
                size="lg"
                disabled={!isOnline || !onboardingData.username.trim() || onboardingData.username.length < 3}
              >
                Continue as <strong>{onboardingData.username || "Player"}</strong> <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )

      case "personal-info":
        return (
          <Card className="border-gray-200 shadow-lg max-w-md mx-auto bg-white">
            <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">👤</div>
              <CardTitle className="text-xl sm:text-2xl text-black leading-tight">Tell Us About Yourself!</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
                Help us personalize your experience, <strong>{onboardingData.username}</strong>!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-black">Your Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={onboardingData.fullName}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <Button
                      key={gender}
                      variant={onboardingData.gender === gender ? "default" : "outline"}
                      className={`h-12 text-sm ${
                        onboardingData.gender === gender 
                          ? "bg-black text-white" 
                          : "bg-white text-black border-gray-200"
                      }`}
                      onClick={() => setOnboardingData(prev => ({ ...prev, gender }))}
                    >
                      {gender === "Male" ? "👨" : gender === "Female" ? "👩" : "🧑"} {gender}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-black">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={onboardingData.dateOfBirth}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Class/Grade</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['10', '11', '12'].map((grade) => (
                    <Button
                      key={grade}
                      variant={onboardingData.studentClass === grade ? "default" : "outline"}
                      className={`h-12 text-sm ${
                        onboardingData.studentClass === grade 
                          ? "bg-black text-white" 
                          : "bg-white text-black border-gray-200"
                      }`}
                      onClick={() => setOnboardingData(prev => ({ ...prev, studentClass: grade }))}
                    >
                      Grade {grade}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="font-semibold text-black mb-2 text-sm">🔒 Privacy First:</h3>
                <p className="text-xs text-gray-700">
                  Your personal information is secure and only used to personalize your learning experience. We never share it with anyone! 🛡️
                </p>
              </div>

              <Button 
                onClick={handleNext} 
                className="w-full bg-black hover:bg-gray-800 text-white text-sm sm:text-base h-12" 
                size="lg"
                disabled={!isOnline || !onboardingData.fullName.trim() || !onboardingData.gender || !onboardingData.dateOfBirth || !onboardingData.studentClass}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )

      case "interest":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center px-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2">Choose Your Adventure! 🌟</h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Pick the area that excites you most. Don't worry - you can always explore others later!
              </p>
            </div>

            {/* AI Feedback */}
            {showAIFeedback && aiFeedbackStep === "interest_selected" && (
              <div className="mb-4">
                <AIFeedback
                  step="interest_selected"
                  onboardingData={onboardingData}
                  userId={user.id}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 px-1 sm:px-0">
              {interestOptions.map((option) => (
                <Card
                  key={option.area}
                  className={`cursor-pointer transition-all active:scale-95 touch-manipulation ${onboardingData.interestArea === option.area
                    ? "border-black border-2 bg-black text-white shadow-lg transform scale-105"
                    : "border-gray-200 hover:border-gray-400 active:border-black bg-white"
                    }`}
                  onClick={() => setOnboardingData(prev => ({ ...prev, interestArea: option.area }))}
                >
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex items-start gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div
                        className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${onboardingData.interestArea === option.area ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        <div className="scale-75 sm:scale-100">
                          {option.icon}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className={`text-sm sm:text-base lg:text-lg leading-tight ${onboardingData.interestArea === option.area ? "text-white" : "text-black"}`}>{option.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className={`text-xs sm:text-sm leading-relaxed pl-0 sm:pl-1 ${onboardingData.interestArea === option.area ? "text-gray-200" : "text-gray-600"}`}>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className={`text-xs sm:text-sm font-semibold ${onboardingData.interestArea === option.area ? "text-gray-200" : "text-gray-700"}`}>You'll develop:</p>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {option.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs px-1.5 py-0.5">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "avatar":
        return (
          <div className="max-w-md mx-auto px-2">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Create Your Avatar! ✨</h2>
            </div>
            <AvatarBuilder
              selectedAvatar={onboardingData.avatar}
              onAvatarSelect={(avatar) => setOnboardingData(prev => ({ ...prev, avatar }))}
            />
          </div>
        )

      case "quiz":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">Quick Knowledge Check! 🧠</h2>
              <p className="text-gray-600">
                Let's see what you already know about {onboardingData.interestArea}. No pressure - this helps us personalize your experience!
              </p>
            </div>
            <SkillsQuiz
              interestArea={onboardingData.interestArea || "Business & Management"}
              username={onboardingData.username}
              onQuizComplete={(score, level) => {
                setOnboardingData(prev => ({ ...prev, quizScore: score, skillLevel: level }))
                
                // Show AI feedback for quiz completion
                setAIFeedbackStep("quiz_completed")
                setShowAIFeedback(true)
                setTimeout(() => {
                  setShowAIFeedback(false)
                  handleNext()
                }, 3000) // Show feedback for 3 seconds then advance
              }}
            />
            
            {/* AI Feedback for Quiz */}
            {showAIFeedback && aiFeedbackStep === "quiz_completed" && (
              <div className="mt-4">
                <AIFeedback
                  step="quiz_completed"
                  onboardingData={onboardingData}
                  userId={user.id}
                />
              </div>
            )}
          </div>
        )

      case "goals":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">Set Your Goals! 🎯</h2>
              <p className="text-gray-600">
                What do you want to achieve? Setting goals helps you stay motivated and track your progress!
              </p>
            </div>
            
            {/* AI Feedback */}
            {showAIFeedback && aiFeedbackStep === "goals_set" && (
              <div className="mb-4">
                <AIFeedback
                  step="goals_set"
                  onboardingData={onboardingData}
                  userId={user.id}
                />
              </div>
            )}
            
            <GoalsSelector
              interestArea={onboardingData.interestArea || "Business & Management"}
              onGoalsSelect={(goals) => setOnboardingData(prev => ({ ...prev, goals }))}
            />
          </div>
        )

      case "motivation":
        return (
          <Card className="max-w-2xl mx-auto border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-black flex items-center justify-center gap-2">
                <Zap className="h-6 w-6 text-black" />
                What Motivates You? 💫
              </CardTitle>
              <CardDescription>
                Understanding your motivation helps us create the perfect learning experience for you!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {motivationOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={onboardingData.motivation === option.id ? "default" : "outline"}
                    className={`text-left justify-start h-auto p-4 transition-all ${
                      onboardingData.motivation === option.id 
                        ? "bg-black text-white border-black shadow-lg transform scale-105" 
                        : "bg-white text-black border-gray-200 hover:border-gray-400"
                    }`}
                    onClick={() => setOnboardingData(prev => ({ ...prev, motivation: option.id }))}
                  >
                    <span className="text-2xl mr-3">{option.icon}</span>
                    <span>{option.text}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "aspirations":
        return (
          <Card className="max-w-2xl mx-auto border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-black flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-black" />
                Dream Big! 🌟
              </CardTitle>
              <CardDescription>
                What do you hope to do after school? Your dreams guide your learning journey!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {aspirationOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={onboardingData.aspirations === option.id ? "default" : "outline"}
                    className={`text-left justify-start h-auto p-4 transition-all ${
                      onboardingData.aspirations === option.id 
                        ? "bg-black text-white border-black shadow-lg transform scale-105" 
                        : "bg-white text-black border-gray-200 hover:border-gray-400"
                    }`}
                    onClick={() => setOnboardingData(prev => ({ ...prev, aspirations: option.id }))}
                  >
                    <span className="text-2xl mr-3">{option.icon}</span>
                    <span>{option.text}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "preferences":
        return (
          <Card className="max-w-2xl mx-auto border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-black">How Do You Like to Learn? 🤝</CardTitle>
              <CardDescription>
                Everyone learns differently. Let us know your preference so we can tailor your experience!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button
                  variant={onboardingData.learningPreference === "individual" ? "default" : "outline"}
                  className="text-left justify-start h-auto p-6"
                  onClick={() => setOnboardingData(prev => ({ ...prev, learningPreference: "individual" }))}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">🧘‍♀️</span>
                      <span className="font-semibold">I prefer working alone</span>
                    </div>
                    <p className="text-sm text-gray-600">I like to think things through by myself and work at my own pace</p>
                  </div>
                </Button>

                <Button
                  variant={onboardingData.learningPreference === "collaborative" ? "default" : "outline"}
                  className="text-left justify-start h-auto p-6"
                  onClick={() => setOnboardingData(prev => ({ ...prev, learningPreference: "collaborative" }))}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">👥</span>
                      <span className="font-semibold">I love working with others</span>
                    </div>
                    <p className="text-sm text-gray-600">I enjoy discussing ideas, sharing thoughts, and learning from teammates</p>
                  </div>
                </Button>

                <Button
                  variant={onboardingData.learningPreference === "mixed" ? "default" : "outline"}
                  className="text-left justify-start h-auto p-6"
                  onClick={() => setOnboardingData(prev => ({ ...prev, learningPreference: "mixed" }))}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">⚖️</span>
                      <span className="font-semibold">I like a mix of both</span>
                    </div>
                    <p className="text-sm text-gray-600">Sometimes I want to work alone, sometimes with others - it depends!</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )



      case "walkthrough":
        return (
          <Card className="max-w-3xl mx-auto border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-black">What to expect! </CardTitle>
              <CardDescription>
                Here's a quick tour of what you'll see and how everything works!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Scenarios & Challenges
                    </h3>
                    <p className="text-sm text-gray-700">
                      You'll face real-world situations where you make decisions and see the outcomes. Each choice teaches you something new!
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      AI Mentor
                    </h3>
                    <p className="text-sm text-gray-700">
                      Your AI mentor gives you personalized feedback, hints, and encouragement. It's like having a smart friend who's always there to help!
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Progress Tracking
                    </h3>
                    <p className="text-sm text-gray-700">
                      Watch your skills grow with visual progress bars, achievements, and milestone celebrations. You'll see how far you've come!
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      School Community
                    </h3>
                    <p className="text-sm text-gray-700">
                      Connect with classmates, share achievements, and learn together. Your school community is here to support you!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg border border-gray-300">
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-black" />
                  Pro Tips for Success! 🚀
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">✓</span>
                    <span>Don't be afraid to make mistakes - they're how you learn!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">✓</span>
                    <span>Read the AI feedback carefully - it's personalized just for you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">✓</span>
                    <span>Check your progress regularly to stay motivated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">✓</span>
                    <span>Connect with classmates and share your journey</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )

      case "connections":
        return (
          <Card className="max-w-2xl mx-auto border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-black flex items-center justify-center gap-2">
                <Users className="h-6 w-6 text-black" />
                Your School Community 🏫
              </CardTitle>
              <CardDescription>
                You're part of an amazing learning community at <strong>{user.schools?.name}</strong>!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-black mb-3">🌟 You're Ready to Begin!</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>✨ <strong>Name:</strong> {onboardingData.fullName}</p>
                  <p>🎯 <strong>Interest Area:</strong> {onboardingData.interestArea}</p>
                  <p>🧠 <strong>Skill Level:</strong> {onboardingData.skillLevel}</p>
                  <p>🎯 <strong>Goals Set:</strong> {onboardingData.goals.length}/3</p>
                  <p>🤝 <strong>Learning Style:</strong> {onboardingData.learningPreference === 'individual' ? 'Independent Learner' : onboardingData.learningPreference === 'collaborative' ? 'Team Player' : 'Flexible Learner'}</p>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg border border-gray-300">
                <h3 className="font-semibold text-black mb-3">🚀 What Happens Next?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">2.</span>
                    <span>Explore your personalized dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">3.</span>
                    <span>Start with scenarios matched to your level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">4.</span>
                    <span>Get AI feedback on every decision</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">5.</span>
                    <span>Track progress toward your goals</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <Button
                  onClick={handleComplete}
                  disabled={isLoading || !isOnline}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg"
                  size="lg"
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {!isLoading && <Trophy className="mr-2 h-5 w-5" />}
                  {isLoading ? "Setting up your profile..." : "Launch My Journey! 🚀"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white p-2 sm:p-4">
      {!isOnline && <OfflineBanner />}

      {/* Mobile-Optimized Progress Bar */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 px-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-black">Your Progress</span>
          <span className="text-xs sm:text-sm text-gray-600">{currentStepIndex + 1} of {steps.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 sm:h-2">
          <div 
            className="bg-black h-3 sm:h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center mt-2 space-y-1">
          <Badge variant="outline" className="text-xs px-2 py-1 border-black text-black">
            {Math.round(progress)}% Complete
          </Badge>
          {/* Optional milestone UI for 25-50% progress can be added here */}
          {progress >= 50 && progress < 75 && (
            <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3 text-black" />
            </div>
          )}
          {progress >= 75 && progress < 100 && (
            <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
              <Target className="h-3 w-3 text-black" />
              <span>Almost done! Final stretch! 💪</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {renderStepContent()}
      </div>

      {/* Mobile-Optimized Navigation */}
      {currentStep !== "welcome" && currentStep !== "username" && currentStep !== "connections" && (
        <div className="max-w-4xl mx-auto mt-6 sm:mt-8 px-2 sm:px-0">
          <div className="flex justify-between gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="flex items-center gap-2 h-12 sm:h-auto px-4 sm:px-6 text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">Back</span>
            </Button>

            {currentStep !== "quiz" && (
              <Button
                onClick={handleNext}
                disabled={
                  isLoading ||
                  !isOnline ||
                  (currentStep === ("username" as OnboardingStep) && (!onboardingData.username.trim() || onboardingData.username.length < 3)) ||
                  (currentStep === "personal-info" && (!onboardingData.fullName.trim() || !onboardingData.gender || !onboardingData.dateOfBirth || !onboardingData.studentClass)) ||
                  (currentStep === "interest" && !onboardingData.interestArea) ||
                  (currentStep === "goals" && onboardingData.goals.length === 0) ||
                  (currentStep === "motivation" && !onboardingData.motivation) ||
                  (currentStep === "aspirations" && !onboardingData.aspirations) ||
                  (currentStep === "preferences" && !onboardingData.learningPreference)
                }
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white h-12 sm:h-auto px-6 sm:px-8 text-sm sm:text-base flex-1 sm:flex-none max-w-[200px] sm:max-w-none"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span>{isLoading ? "Processing..." : "Next"}</span>
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto mt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <Celebration
          type={celebrationType}
          message="Welcome to your learning community!"
          username={onboardingData.username}
          participantId={onboardingData.participantId}
          onComplete={handleCelebrationComplete}
        />
      )}

    </div>
  )
}
