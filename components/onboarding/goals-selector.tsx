"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target, Plus, X } from "lucide-react"

interface Goal {
  id: string
  text: string
  category: string
}

interface GoalsSelectorProps {
  interestArea: string
  onGoalsSelect: (goals: Goal[]) => void
}

const suggestedGoals: Record<string, string[]> = {
  "Business & Management": [
    "Learn how to create a business plan",
    "Understand how to manage money in business",
    "Develop leadership skills",
    "Learn about customer service",
    "Understand marketing basics",
    "Learn about teamwork and delegation"
  ],
  "Technology & Innovation": [
    "Learn basic programming concepts",
    "Understand how apps are built",
    "Learn about digital problem-solving",
    "Understand cybersecurity basics",
    "Learn about emerging technologies",
    "Develop creative thinking skills"
  ],
  "Marketing & Sales": [
    "Learn how to communicate effectively",
    "Understand customer psychology",
    "Learn about social media marketing",
    "Develop presentation skills",
    "Learn about brand building",
    "Understand sales techniques"
  ]
}

export function GoalsSelector({ interestArea, onGoalsSelect }: GoalsSelectorProps) {
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([])
  const [customGoal, setCustomGoal] = useState("")
  const suggestions = suggestedGoals[interestArea] || suggestedGoals["Business & Management"]

  const addSuggestedGoal = (goalText: string) => {
    if (selectedGoals.length >= 3) return
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: goalText,
      category: "suggested"
    }
    
    const updatedGoals = [...selectedGoals, newGoal]
    setSelectedGoals(updatedGoals)
    onGoalsSelect(updatedGoals)
  }

  const addCustomGoal = () => {
    if (!customGoal.trim() || selectedGoals.length >= 3) return
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: customGoal.trim(),
      category: "custom"
    }
    
    const updatedGoals = [...selectedGoals, newGoal]
    setSelectedGoals(updatedGoals)
    setCustomGoal("")
    onGoalsSelect(updatedGoals)
  }

  const removeGoal = (goalId: string) => {
    const updatedGoals = selectedGoals.filter(goal => goal.id !== goalId)
    setSelectedGoals(updatedGoals)
    onGoalsSelect(updatedGoals)
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-black flex items-center gap-2">
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose up to 3 goals you want to achieve. These will guide your learning journey!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Goals */}
        {selectedGoals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Your Goals:</h4>
            <div className="space-y-2">
              {selectedGoals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Target className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-800 flex-1">{goal.text}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeGoal(goal.id)}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal Counter */}
        <div className="flex justify-center">
          <Badge variant={selectedGoals.length === 3 ? "default" : "outline"} className="text-xs">
            {selectedGoals.length}/3 goals selected
          </Badge>
        </div>

        {/* Suggested Goals */}
        {selectedGoals.length < 3 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Suggested Goals:</h4>
            <div className="grid gap-2">
              {suggestions
                .filter(suggestion => !selectedGoals.some(goal => goal.text === suggestion))
                .slice(0, 6)
                .map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addSuggestedGoal(suggestion)}
                  className="text-left justify-start h-auto p-3 text-sm"
                  disabled={selectedGoals.length >= 3}
                >
                  <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Goal Input */}
        {selectedGoals.length < 3 && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <Label htmlFor="custom-goal" className="text-sm font-medium text-gray-700">
              Or create your own goal:
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-goal"
                placeholder="What do you want to learn?"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={addCustomGoal}
                disabled={!customGoal.trim() || selectedGoals.length >= 3}
                className="bg-black hover:bg-gray-800 text-white px-3"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {selectedGoals.length === 3 && (
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Perfect! You've set 3 goals. Let's get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}