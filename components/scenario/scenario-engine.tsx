"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { startNewSession, getScenarioForRound, submitDecision } from "@/lib/scenario/actions"
import { Loader2, Lightbulb, TrendingUp, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { DetailedFeedbackComponent } from "../simulation/detailed-feedback"
import { TaskInput } from "../simulation/task-input"
import { StudentLayout } from "@/components/student/student-layout"

interface ScenarioEngineProps {
  user: any
  existingSession: any
}

export function ScenarioEngine({ user, existingSession }: ScenarioEngineProps) {
  const router = useRouter()
  const [session, setSession] = useState(existingSession)
  const [scenario, setScenario] = useState<any>(null)
  const [simulationData, setSimulationData] = useState<any>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [taskResponse, setTaskResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    if (existingSession) {
      loadScenario(existingSession)
    }
  }, [existingSession])

  const loadScenario = async (currentSession: any) => {
    setIsLoading(true)
    const result = await getScenarioForRound(currentSession.id, currentSession.current_round, user.career_path, user.id)

    if (result.success && result.scenario) {
      setSimulationData(result.scenario)
      // Extract the scenario and tasks from the simulation data
      if (result.scenario.scenario) {
        // AI-generated scenario structure
        const scenarioData = result.scenario.scenario
        setScenario({
          ...scenarioData,
          // Ensure we have a description field
          description: scenarioData.situation || scenarioData.description || scenarioData.context || 'Business scenario requiring strategic decision-making'
        })
        setCurrentTask(result.scenario.tasks?.[0] || null)
      } else {
        // Fallback for direct scenario format
        setScenario({
          ...result.scenario,
          description: result.scenario.description || result.scenario.situation || result.scenario.context || 'Strategic business challenge',
          options: result.scenario.options || []
        })
        setCurrentTask({
          id: 'legacy_task',
          type: 'multiple_choice',
          title: 'Strategic Decision',
          description: 'Choose your approach',
          required: true,
          options: result.scenario.options || []
        })
      }
    }
    setIsLoading(false)
  }

  const handleStartSession = async () => {
    setIsLoading(true)
    const result = await startNewSession(user.id)

    if (result.success && result.session) {
      setSession(result.session)
      await loadScenario(result.session)
    }
    setIsLoading(false)
  }

  const handleSubmitDecision = async () => {
    // Check if we have a valid response
    const hasValidResponse = taskResponse || selectedOption
    if (!hasValidResponse || !scenario || !session) return

    setIsLoading(true)
    
    // Prepare the response based on task type
    let submissionData
    if (taskResponse) {
      submissionData = taskResponse.value
    } else if (selectedOption) {
      submissionData = selectedOption
    }
    
    const result = await submitDecision(session.id, scenario?.id || simulationData?.scenario?.id, user.id, session.current_round, submissionData)

    if (result.success && result.feedback) {
      setFeedback(result.feedback)
      setShowFeedback(true)
    }
    setIsLoading(false)
  }

  const handleTaskResponse = async (response: any) => {
    console.log('ScenarioEngine handleTaskResponse called', response)
    
    setTaskResponse(response)
    if (response.type === 'option') {
      setSelectedOption(response.value)
    }
    
    // Automatically submit the response
    if (!scenario || !session) {
      console.log('Cannot submit - missing scenario or session', { scenario: !!scenario, session: !!session })
      return
    }

    setIsLoading(true)
    
    const submissionData = response.value
    console.log('Submitting to server:', { sessionId: session.id, scenarioId: scenario?.id, submissionData })
    
    const result = await submitDecision(session.id, scenario?.id || simulationData?.scenario?.id, user.id, session.current_round, submissionData)

    console.log('Submission result:', result)

    if (result.success && result.feedback) {
      setFeedback(result.feedback)
      setShowFeedback(true)
      
      // Update session progress after successful submission
      const { updateSessionProgress } = await import("@/lib/scenario/actions")
      await updateSessionProgress(session.id, session.current_round, 'in_progress')
    } else if (!result.success) {
      console.error('Submission failed:', result.error)
      // You could show an error message to the user here
    }
    setIsLoading(false)
  }

  const handleNextRound = async () => {
    setShowFeedback(false)
    setSelectedOption(null)
    setTaskResponse(null)
    setFeedback(null)

    if (session.current_round >= session.total_rounds) {
      // Session complete - update status in database
      const { updateSessionProgress } = await import("@/lib/scenario/actions")
      await updateSessionProgress(session.id, session.current_round, 'completed')
      router.push("/student/dashboard")
      return
    }

    // Move to next round
    const nextRound = session.current_round + 1
    const updatedSession = { ...session, current_round: nextRound }
    
    // Update session progress in database
    const { updateSessionProgress } = await import("@/lib/scenario/actions")
    const updateResult = await updateSessionProgress(session.id, nextRound, 'in_progress')
    
    if (updateResult.success) {
      setSession(updatedSession)
      await loadScenario(updatedSession)
    } else {
      console.error("Failed to update session progress:", updateResult.error)
      // Continue anyway with local state
      setSession(updatedSession)
      await loadScenario(updatedSession)
    }
  }

  if (!session) {
    return (
      <StudentLayout user={user}>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border-emerald-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-emerald-900">Ready to Start?</CardTitle>
              <CardDescription className="text-lg">
                Begin a new simulation session with 5 real-world business scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
                <h3 className="font-semibold text-teal-900 mb-3">What to Expect:</h3>
                <ul className="space-y-2 text-teal-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>5 business scenarios tailored to your {user.career_path} role</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Make strategic decisions based on Liberian market conditions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Receive AI-powered feedback on each decision</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Earn skill points and track your entrepreneurial growth</span>
                  </li>
                </ul>
              </div>

              <Button onClick={handleStartSession} className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start New Session
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (isLoading && !scenario) {
    return (
      <StudentLayout user={user}>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        </div>
      </StudentLayout>
    )
  }

  if (showFeedback && feedback) {
    return (
      <StudentLayout user={user}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 max-w-4xl mx-auto">
          <Progress value={(session.current_round / session.total_rounds) * 100} className="h-2" />
          <p className="text-sm text-gray-600 mt-2 text-center">
            Round {session.current_round} of {session.total_rounds}
          </p>
        </div>

        {/* Check if feedback has detailed structure */}
        {feedback.ai_feedback && typeof feedback.ai_feedback === 'object' && feedback.ai_feedback.overall_assessment ? (
          <DetailedFeedbackComponent
            feedback={feedback.ai_feedback}
            performanceScore={feedback.outcome_score}
            skillsGained={feedback.skills_gained || {}}
            onContinue={handleNextRound}
          />
        ) : (
          /* Fallback for simple feedback */
          <div className="max-w-3xl mx-auto">
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <CardTitle className="text-2xl text-emerald-900">Decision Recorded</CardTitle>
                </div>
                <CardDescription>Here's your personalized feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-emerald-700" />
                    <h3 className="font-semibold text-emerald-900">Outcome Score</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-emerald-700">{feedback.outcome_score}</span>
                    <span className="text-gray-600">/ 100</span>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-teal-700" />
                    <h3 className="font-semibold text-teal-900">AI Feedback</h3>
                  </div>
                  <p className="text-teal-800 leading-relaxed">
                    {typeof feedback.ai_feedback === 'string' ? feedback.ai_feedback : 'Great decision! Your choice demonstrates strong entrepreneurial thinking.'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Skills Gained</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(feedback.skills_gained || {}).map(([skill, points]: [string, any]) => (
                      <Badge key={skill} variant="secondary" className="bg-cyan-100 text-cyan-800">
                        {skill.replace(/_/g, " ")}: +{points}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={handleNextRound} className="w-full" size="lg">
                  {session.current_round >= session.total_rounds ? "Complete Session" : "Next Scenario"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </StudentLayout>
    )
  }

  if (!scenario) {
    return (
      <StudentLayout user={user}>
        <div className="container mx-auto px-4 py-16">
          <Alert>
            <AlertDescription>No scenario available. Please try again.</AlertDescription>
          </Alert>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Progress value={(session.current_round / session.total_rounds) * 100} className="h-2" />
          <p className="text-sm text-gray-600 mt-2 text-center">
            Round {session.current_round} of {session.total_rounds}
          </p>
        </div>

        <Card className="border-emerald-200 shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl text-emerald-900">{scenario?.title || 'Loading...'}</CardTitle>
              <Badge variant="outline" className="border-teal-300 text-teal-700">
                Level {scenario?.difficulty_level || 1}
              </Badge>
            </div>
            <CardDescription className="text-base">{scenario?.description || 'Loading scenario...'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Context:</span> {scenario?.context || 'Loading context...'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Task Input Component */}
        {currentTask ? (
          <TaskInput
            task={currentTask}
            onSubmit={handleTaskResponse}
            isLoading={isLoading}
          />
        ) : (
          /* Fallback for legacy format */
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">What will you do?</h3>
            {scenario?.options && scenario.options.length > 0 ? (
              scenario.options.map((option: any) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOption === option.id
                      ? "border-emerald-500 border-2 bg-emerald-50"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          selectedOption === option.id ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {option.id}
                      </div>
                      <p className="text-gray-800 flex-1">{option.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
                  <p className="text-gray-600">Loading scenario options...</p>
                </div>
              </div>
            )}
            
            <Button onClick={handleSubmitDecision} disabled={!selectedOption || isLoading} className="w-full" size="lg">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Decision
            </Button>
          </div>
        )}
        </div>
      </div>
    </StudentLayout>
  )
}
