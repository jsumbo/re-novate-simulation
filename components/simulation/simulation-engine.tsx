"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, Target, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { SimulationResponse } from "@/lib/simulation/types"

interface EnhancedSimulationEngineProps {
  user: any
}

export function EnhancedSimulationEngine({ user }: EnhancedSimulationEngineProps) {
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [aiResults, setAiResults] = useState<any>(null)

  useEffect(() => {
    loadSimulation()
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

  const loadSimulation = async () => {
    setIsLoading(true)
    try {
      const mockSimulation: SimulationResponse = {
        scenario: {
          id: "complex_sim_001",
          title: "Multi-Crisis Startup Challenge",
          context: `Your fintech startup in Monrovia faces multiple simultaneous challenges: funding is running low (2 months runway), your lead developer just quit, a competitor launched a similar product, and the Central Bank of Liberia is considering new regulations.`,
          situation: "You're in a board meeting with investors, and they want a comprehensive response plan within 48 hours.",
          challenge: "Navigate this multi-faceted crisis by making strategic decisions across funding, team management, competitive positioning, and regulatory compliance.",
          stakeholders: ["investors", "remaining_employees", "customers", "co-founders", "regulatory_bodies", "competitors"],
          constraints: ["48_hour_deadline", "limited_cash_flow", "team_uncertainty", "regulatory_ambiguity", "competitive_pressure"],
          success_metrics: ["runway_extension", "team_stability", "market_position", "regulatory_compliance", "investor_confidence"],
          difficulty_level: 4,
          estimated_time: 25
        },
        tasks: [],
        options: [
          {
            id: 'option_1',
            text: 'Focus on aggressive fundraising while maintaining current operations',
            reasoning: 'Leverage existing investor relationships and market traction to secure bridge funding',
            immediate_consequences: ['High time investment in fundraising', 'Continued burn rate', 'Team uncertainty'],
            long_term_effects: ['Potential significant funding', 'Diluted equity', 'Investor oversight'],
            skill_development: { networking: 3, presentation: 2, strategic_thinking: 2 },
            risk_level: 'high',
            resource_impact: { budget_change: -15000, time_required: '3-4 weeks' }
          },
          {
            id: 'option_2',
            text: 'Pivot to a leaner, profitable model immediately',
            reasoning: 'Cut costs dramatically and focus on revenue generation to achieve profitability',
            immediate_consequences: ['Significant cost reductions', 'Product simplification', 'Possible layoffs'],
            long_term_effects: ['Sustainable operations', 'Maintained control', 'Slower growth potential'],
            skill_development: { financial_management: 3, operations: 3, adaptability: 2 },
            risk_level: 'medium',
            resource_impact: { budget_change: 5000, time_required: '2-3 weeks' }
          }
        ],
        ai_context: "As your AI mentor, I'll analyze your comprehensive response across all tasks.",
        learning_objectives: [],
        total_points: 100
      }

      setSimulation(mockSimulation)
    } catch (error) {
      console.error("Error loading simulation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (id: string) => {
    setSelectedOption(prev => (prev === id ? null : id))
  }

  const handleSubmitDecision = async () => {
    if (!simulation || !selectedOption) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/simulation/submit-complex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          scenarioId: simulation.scenario.id,
          selectedOption,
          round: currentRound
        })
      })

      const result = await response.json()
      if (result.success) {
        setAiResults(result.analysis)
        setShowResults(true)
      } else {
        setAiResults(null)
        setShowResults(true)
      }
    } catch (error) {
      console.error('submit error', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized business simulation...</p>
        </div>
      </div>
    )
  }

  if (!simulation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load simulation</p>
          <Button onClick={loadSimulation}>Try Again</Button>
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
            <p className="text-gray-600">Round {currentRound} of 5</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>~{simulation.scenario.estimated_time} minutes</span>
          </div>
        </div>

        <div className="mb-6">
          <Progress value={(currentRound / 5) * 100} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl mb-2">{simulation.scenario.title}</CardTitle>
                <Badge variant="outline" className="mb-2">
                  Difficulty: {simulation.scenario.difficulty_level}/5
                </Badge>
              </div>
              <Badge className={`bg-gray-100 text-gray-800`}>
                {user?.career_path}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Context</h3>
              <p className="text-gray-700">{simulation.scenario.context}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Situation</h3>
              <p className="text-gray-700">{simulation.scenario.situation}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Challenge</h3>
              <p className="text-gray-700 font-medium">{simulation.scenario.challenge}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Stakeholders</h4>
                <div className="flex flex-wrap gap-1">
                  {simulation.scenario.stakeholders.map((stakeholder) => (
                    <Badge key={stakeholder} variant="secondary" className="text-xs">
                      {stakeholder}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Constraints</h4>
                <div className="flex flex-wrap gap-1">
                  {simulation.scenario.constraints.map((constraint) => (
                    <Badge key={constraint} variant="outline" className="text-xs">
                      {constraint.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Success Metrics</h4>
                <div className="flex flex-wrap gap-1">
                  {simulation.scenario.success_metrics.map((metric) => (
                    <Badge key={metric} variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {metric.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold">Your Options</h2>
          {(simulation as any).options?.map((option: any, index: number) => (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedOption === option.id 
                  ? 'border-black bg-black text-white shadow-lg transform scale-[1.02]' 
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
              }`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                    selectedOption === option.id 
                      ? 'bg-white text-black' 
                      : 'bg-black text-white'
                  }`}>
                    {selectedOption === option.id ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${selectedOption === option.id ? 'text-white' : 'text-gray-900'}`}>
                      {option.text}
                    </h3>
                    <p className={`text-sm mb-3 ${selectedOption === option.id ? 'text-gray-200' : 'text-gray-600'}`}>
                      {option.reasoning}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className={`font-medium mb-1 flex items-center gap-1 ${selectedOption === option.id ? 'text-white' : 'text-gray-900'}`}>
                          <TrendingUp className="h-3 w-3" />
                          Immediate Effects
                        </h4>
                        <ul className={`space-y-1 ${selectedOption === option.id ? 'text-gray-200' : 'text-gray-600'}`}>
                          {option.immediate_consequences?.map((consequence: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-gray-400">•</span>
                              {consequence}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className={`font-medium mb-1 flex items-center gap-1 ${selectedOption === option.id ? 'text-white' : 'text-gray-900'}`}>
                          <Target className="h-3 w-3" />
                          Long-term Impact
                        </h4>
                        <ul className={`space-y-1 ${selectedOption === option.id ? 'text-gray-200' : 'text-gray-600'}`}>
                          {option.long_term_effects?.map((effect: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-gray-400">•</span>
                              {effect}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-4">
                        <Badge className={getRiskColor(option.risk_level)}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {option.risk_level} risk
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {option.resource_impact?.time_required}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        {Object.entries(option.skill_development || {}).map(([skill, points]) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            +{points} {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">AI Mentor Guidance</h3>
                <p className="text-blue-800 text-sm">{simulation.ai_context}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {showResults && selectedOption && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">Decision Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Your Choice:</h3>
                  <p className="text-green-800">
                    {(simulation as any).options.find((opt: any) => opt.id === selectedOption)?.text}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-green-900 mb-2">AI Feedback:</h3>
                  <p className="text-green-800">
                    {aiResults?.summary || 'Excellent decision! Your choice demonstrates strong entrepreneurial thinking and understanding of the Liberian business context.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-green-200">
                  <div className="flex gap-2">
                    <Badge className="bg-green-600 text-white">Score: {aiResults?.score || 85}/100</Badge>
                    <Badge variant="outline" className="border-green-600 text-green-700">+3 Leadership</Badge>
                    <Badge variant="outline" className="border-green-600 text-green-700">+2 Strategy</Badge>
                  </div>

                  <Button 
                    onClick={() => {
                      setCurrentRound(prev => prev + 1)
                      setSelectedOption(null)
                      setShowResults(false)
                      loadSimulation()
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Next Round
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!showResults && (
          <div className="flex justify-center">
            <Button 
              onClick={handleSubmitDecision}
              disabled={!selectedOption || isLoading}
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