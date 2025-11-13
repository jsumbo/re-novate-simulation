"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, Target, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { DetailedFeedback, SimulationContext, SimulationOption, SimulationResponse, SimulationTask } from "@/lib/simulation/types"

interface EnhancedSimulationEngineProps {
  user: {
    id?: string
    career_path?: string
  }
}

type FeedbackPayload = {
  ai_feedback: DetailedFeedback
  outcome_score: number
  skills_gained: Record<string, number>
}

const MAX_ROUNDS = 5

export function EnhancedSimulationEngine({ user }: EnhancedSimulationEngineProps) {
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null)
  const [simulationContext, setSimulationContext] = useState<SimulationContext | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [aiResults, setAiResults] = useState<FeedbackPayload | null>(null)
  const [usedScenarios, setUsedScenarios] = useState<Array<{ id: string; title: string }>>([])

  const decisionTask: SimulationTask | null = useMemo(() => {
    return simulation?.tasks?.find((task) => (task.options?.length ?? 0) > 0) ?? null
  }, [simulation])

  const decisionOptions: SimulationOption[] = decisionTask?.options ?? []

  const selectedOptionDetails = useMemo(() => {
    return decisionOptions.find((opt) => opt.id === selectedOption) ?? null
  }, [decisionOptions, selectedOption])

  const otherTasks = useMemo(() => {
    if (!simulation?.tasks) return []
    return simulation.tasks.filter((task) => task.id !== decisionTask?.id)
  }, [simulation, decisionTask])

  useEffect(() => {
    loadSimulation(1, [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const loadSimulation = async (
    roundToLoad: number,
    historyOverride?: Array<{ id: string; title: string }>,
  ) => {
    const history = historyOverride ?? usedScenarios
    setIsLoading(true)
    setSelectedOption(null)
    setShowResults(false)
    setAiResults(null)

    try {
      const response = await fetch('/api/simulation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          careerPath: user?.career_path,
          round: roundToLoad,
          excludeScenarioIds: history.map((h) => h.id),
          excludeScenarioTitles: history.map((h) => h.title),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate simulation')
      }

      const data = await response.json()

      if (data?.success && data.simulation) {
        setSimulation(data.simulation as SimulationResponse)
        setSimulationContext(data.context as SimulationContext)
        setUsedScenarios((prev) => {
          const exists = prev.some((item) => item.id === data.simulation.scenario.id)
          if (exists) {
            return prev
          }
          return [
            ...prev,
            {
              id: data.simulation.scenario.id,
              title: data.simulation.scenario.title,
            },
          ]
        })
      } else {
        setSimulation(null)
      }
    } catch (error) {
      console.error('Error loading simulation:', error)
      setSimulation(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (id: string) => {
    setSelectedOption((prev) => (prev === id ? null : id))
  }

  const handleSubmitDecision = async () => {
    if (!simulation || !selectedOptionDetails) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/simulation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          scenario: simulation.scenario,
          option: selectedOptionDetails,
          context: simulationContext,
          round: currentRound,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Submit decision failed, server response:', text)
        setAiResults(null)
        setShowResults(true)
        return
      }

      const result = await response.json()
      if (result?.success && result.feedback) {
        setAiResults(result.feedback as FeedbackPayload)
      } else {
        setAiResults(null)
      }
      setShowResults(true)
    } catch (error) {
      console.error('submit error', error)
      setAiResults(null)
      setShowResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextRound = () => {
    if (currentRound >= MAX_ROUNDS) {
      setShowResults(false)
      return
    }
    const nextRound = currentRound + 1
    setCurrentRound(nextRound)
    setShowResults(false)
    loadSimulation(nextRound)
  }

  if (isLoading && !simulation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Generating simulation...</p>
        </div>
      </div>
    )
  }

  if (!simulation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load simulation</p>
          <Button onClick={() => loadSimulation(currentRound)}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/student/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Business Simulation</h1>
            <p className="text-gray-600">Round {currentRound} of {MAX_ROUNDS}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>~{simulation.scenario.estimated_time} minutes</span>
          </div>
        </div>

        <div className="mb-6">
          <Progress value={(currentRound / MAX_ROUNDS) * 100} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl mb-2">{simulation.scenario.title}</CardTitle>
                <Badge variant="outline" className="mb-2">
                  Difficulty: {simulation.scenario.difficulty_level}/5
                </Badge>
              </div>
              <Badge className="bg-gray-100 text-gray-800">
                {user?.career_path || 'Student'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <section>
              <h3 className="font-semibold mb-2">Context</h3>
              <p className="text-gray-700 leading-relaxed">{simulation.scenario.context}</p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Current Situation</h3>
              <p className="text-gray-700 leading-relaxed">{simulation.scenario.situation}</p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Primary Challenge</h3>
              <p className="text-gray-700 leading-relaxed">{simulation.scenario.challenge}</p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">Key Stakeholders</h4>
                <div className="flex flex-wrap gap-2">
                  {simulation.scenario.stakeholders.map((stakeholder) => (
                    <Badge key={stakeholder} variant="outline" className="border-gray-300 text-gray-700">
                      {stakeholder.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">Constraints</h4>
                <div className="flex flex-wrap gap-2">
                  {simulation.scenario.constraints.map((constraint) => (
                    <Badge key={constraint} variant="outline" className="border-gray-300 text-gray-700">
                      {constraint.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {decisionOptions.length > 0 ? (
          <div className="grid gap-4 mb-6">
            {decisionOptions.map((option) => (
              <Card
                key={option.id}
                className={`transition-all border-2 ${
                  selectedOption === option.id
                    ? 'border-black shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getRiskColor(option.risk_level)} capitalize`}>{option.risk_level} risk</Badge>
                      <span className="text-sm text-gray-500">{option.resource_impact.time_required}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {option.text}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {option.reasoning}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-800 mb-1 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-black" />
                          Immediate Impact
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          {option.immediate_consequences.map((impact) => (
                            <li key={impact}>{impact}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-800 mb-1 flex items-center gap-2">
                          <Target className="h-4 w-4 text-black" />
                          Long-Term Outlook
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          {option.long_term_effects.map((effect) => (
                            <li key={effect}>{effect}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertTriangle className="h-4 w-4 text-black" />
                      Budget impact: {option.resource_impact.budget_change >= 0 ? '+' : ''}
                      {option.resource_impact.budget_change.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(option.skill_development || {}).map(([skill, points]) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          +{points} {skill.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-6 border-dashed border-gray-300">
            <CardContent className="p-6 text-center text-gray-600">
              <p>No selectable options are available for this round. Review the scenario details and complete the required tasks.</p>
            </CardContent>
          </Card>
        )}

        {otherTasks.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Additional Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {otherTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{task.title}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">AI Mentor Guidance</h3>
                <p className="text-blue-800 text-sm leading-relaxed">{simulation.ai_context}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {showResults && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">Decision Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="space-y-2">
                <h3 className="font-semibold text-green-900">Your Choice</h3>
                <p className="text-green-800 leading-relaxed">
                  {selectedOptionDetails?.text || 'No option selected'}
                </p>
              </section>

              {aiResults && (
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-green-600 text-white">Score: {aiResults.outcome_score}/100</Badge>
                    {Object.entries(aiResults.skills_gained || {}).map(([skill, points]) => (
                      <Badge key={skill} variant="outline" className="border-green-600 text-green-700">
                        +{points} {skill.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">Overall Assessment</h4>
                    <p className="text-green-800 leading-relaxed">{aiResults.ai_feedback.overall_assessment}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-green-900 mb-2">Strengths</h5>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                        {aiResults.ai_feedback.decision_analysis.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-green-900 mb-2">Areas for Improvement</h5>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                        {aiResults.ai_feedback.decision_analysis.areas_for_improvement.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {aiResults.ai_feedback.reflection_questions.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-green-900 mb-2">Reflection Questions</h5>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                        {aiResults.ai_feedback.reflection_questions.slice(0, 3).map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-green-200">
                <div className="text-sm text-green-700">
                  {currentRound >= MAX_ROUNDS
                    ? 'You have completed all rounds for this simulation.'
                    : `Prepare for round ${currentRound + 1} to continue your learning journey.`}
                </div>
                <Button
                  onClick={handleNextRound}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={currentRound >= MAX_ROUNDS}
                >
                  {currentRound >= MAX_ROUNDS ? 'Simulation Complete' : 'Next Round'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!showResults && (
          <div className="flex justify-center">
            <Button
              onClick={handleSubmitDecision}
              disabled={!selectedOptionDetails || isLoading}
              size="lg"
              className="bg-black hover:bg-gray-800 text-white px-8"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Submit Decision'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}