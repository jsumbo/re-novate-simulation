"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SimulationTask, SimulationOption } from "@/lib/simulation/types"
import { 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb,
  Target,
  Users,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskInputProps {
  task: SimulationTask
  onSubmit: (response: any) => void
  isLoading?: boolean
  className?: string
}

export function TaskInput({ task, onSubmit, isLoading = false, className }: TaskInputProps) {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null)
  const [textResponse, setTextResponse] = React.useState("")
  const [isValid, setIsValid] = React.useState(false)

  // Update validation for text inputs
  React.useEffect(() => {
    if (task.type === 'essay' || task.type === 'short_answer') {
      // Only check for minimum content (non-empty response)
      const hasContent = textResponse.trim().length > 0
      const maxLength = task.constraints?.max_length || 10000
      const withinLengthLimit = textResponse.length <= maxLength
      
      setIsValid(hasContent && withinLengthLimit)
    } else if (task.type === 'multiple_choice') {
      setIsValid(selectedOption !== null)
    }
  }, [textResponse, selectedOption, task])

  const handleSubmit = () => {
    if (!isValid) return

    let response
    if (task.type === 'multiple_choice') {
      response = { type: 'option', value: selectedOption }
    } else {
      const wordCount = textResponse.trim().split(/\s+/).filter(word => word.length > 0).length
      response = { type: 'text', value: textResponse, word_count: wordCount }
    }

    onSubmit(response)
  }

  const getTaskIcon = () => {
    switch (task.type) {
      case 'essay':
        return <FileText className="h-5 w-5" />
      case 'short_answer':
        return <BookOpen className="h-5 w-5" />
      case 'multiple_choice':
        return <Target className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getTaskTypeLabel = () => {
    switch (task.type) {
      case 'essay':
        return 'Essay Response'
      case 'short_answer':
        return 'Short Answer'
      case 'multiple_choice':
        return 'Multiple Choice'
      default:
        return 'Response'
    }
  }

  const getWordLimitInfo = () => {
    if (!task.constraints?.word_limit) return null
    
    const minWords = Math.floor(task.constraints.word_limit * 0.5)
    const maxWords = task.constraints.word_limit
    
    return { min: minWords, max: maxWords }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Task Header */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                {getTaskIcon()}
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">{task.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-blue-600 text-blue-700">
                    {getTaskTypeLabel()}
                  </Badge>
                  {task.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {(task.type === 'essay' || task.type === 'short_answer') && task.constraints?.max_length && (
              <div className="text-right">
                <div className="text-sm text-blue-700 font-medium">
                  {textResponse.length} / {task.constraints.max_length} characters
                </div>
                <Progress 
                  value={(textResponse.length / task.constraints.max_length) * 100} 
                  className="w-24 h-2 mt-1"
                />
              </div>
            )}
          </div>
          <CardDescription className="text-blue-800 mt-3">
            {task.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Task Content */}
      {task.type === 'multiple_choice' && task.options && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">Choose your approach:</h3>
          {task.options.map((option, index) => (
            <Card
              key={option.id}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-lg border-2 group",
                selectedOption === option.id
                  ? "border-emerald-500 bg-emerald-50 shadow-md"
                  : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
              )}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300",
                      selectedOption === option.id 
                        ? "bg-emerald-600 text-white shadow-lg" 
                        : "bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                    )}
                  >
                    {String.fromCharCode(65 + index)} {/* A, B, C, etc. */}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-gray-800 font-medium leading-relaxed">{option.text}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Risk Level:</span>
                        <Badge 
                          variant={option.risk_level === 'high' ? 'destructive' : 
                                 option.risk_level === 'medium' ? 'default' : 'secondary'}
                          className="font-medium"
                        >
                          {option.risk_level.toUpperCase()}
                        </Badge>
                      </div>
                      {option.resource_impact && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-600">Impact:</span>
                          <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            option.resource_impact.budget_change > 0 
                              ? "bg-red-100 text-red-700" 
                              : option.resource_impact.budget_change < 0
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          )}>
                            {option.resource_impact.budget_change > 0 ? '+' : ''}
                            {option.resource_impact.budget_change.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(task.type === 'essay' || task.type === 'short_answer') && (
        <div className="space-y-4">
          {/* Prompt */}
          {task.prompt && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                  <Lightbulb className="h-5 w-5" />
                  Task Prompt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-amber-800">
                  {(() => {
                    // Parse markdown formatting
                    const parseMarkdown = (text: string) => {
                      const parts: React.ReactNode[] = []
                      let lastIndex = 0
                      const boldRegex = /\*\*(.+?)\*\*/g
                      let match
                      
                      while ((match = boldRegex.exec(text)) !== null) {
                        // Add text before the match
                        if (match.index > lastIndex) {
                          parts.push(text.substring(lastIndex, match.index))
                        }
                        // Add bold text
                        parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>)
                        lastIndex = match.index + match[0].length
                      }
                      // Add remaining text
                      if (lastIndex < text.length) {
                        parts.push(text.substring(lastIndex))
                      }
                      
                      return parts.length > 0 ? parts : text
                    }
                    
                    const lines = task.prompt.split('\n')
                    const elements: React.ReactNode[] = []
                    let currentList: React.ReactNode[] = []
                    let listType: 'ul' | 'ol' | null = null
                    
                    // Helper to close current list
                    const closeCurrentList = () => {
                      if (currentList.length > 0 && listType) {
                        if (listType === 'ul') {
                          elements.push(
                            <ul key={`list-${elements.length}`} className="mb-3 ml-4 list-disc space-y-1">
                              {currentList}
                            </ul>
                          )
                        } else {
                          elements.push(
                            <ol key={`list-${elements.length}`} className="mb-3 ml-4 list-decimal space-y-1">
                              {currentList}
                            </ol>
                          )
                        }
                        currentList = []
                        listType = null
                      }
                    }
                    
                    lines.forEach((line, index) => {
                      const trimmed = line.trim()
                      const isEmpty = trimmed.length === 0
                      
                      // Handle list items
                      if (trimmed.startsWith('- ')) {
                        if (listType !== 'ul') {
                          closeCurrentList()
                          listType = 'ul'
                        }
                        currentList.push(
                          <li key={index}>{parseMarkdown(trimmed.substring(2))}</li>
                        )
                        return
                      }
                      
                      // Handle numbered list items
                      const numberedMatch = trimmed.match(/^\d+\.\s(.+)$/)
                      if (numberedMatch) {
                        if (listType !== 'ol') {
                          closeCurrentList()
                          listType = 'ol'
                        }
                        currentList.push(
                          <li key={index}>{parseMarkdown(numberedMatch[1])}</li>
                        )
                        return
                      }
                      
                      // Close current list if any
                      closeCurrentList()
                      
                      // Handle empty lines
                      if (isEmpty) {
                        elements.push(<div key={index} className="mb-2" />)
                        return
                      }
                      
                      // Regular paragraph
                      elements.push(
                        <p key={index} className="mb-3 last:mb-0">
                          {parseMarkdown(line)}
                        </p>
                      )
                    })
                    
                    // Close any remaining list
                    closeCurrentList()
                    
                    return elements
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evaluation Criteria */}
          {task.evaluation_criteria && task.evaluation_criteria.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                  <CheckCircle2 className="h-5 w-5" />
                  Evaluation Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800 mb-3">Your response will be evaluated based on:</p>
                <ul className="space-y-2">
                  {task.evaluation_criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2 text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Text Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Your Response
              </label>
              {task.constraints?.max_length && (
                <div className="text-sm text-gray-500">
                  Maximum: {task.constraints.max_length} characters
                </div>
              )}
            </div>
            <Textarea
              value={textResponse}
              onChange={(e) => {
                const newValue = e.target.value
                const maxLength = task.constraints?.max_length || 10000
                
                // Only enforce character limit
                if (newValue.length <= maxLength) {
                  setTextResponse(newValue)
                }
              }}
              placeholder={
                task.type === 'essay' 
                  ? "Enter your response..."
                  : "Enter your answer..."
              }
              className={cn(
                "min-h-[200px] resize-y",
                task.type === 'essay' && "min-h-[400px]"
              )}
              maxLength={task.constraints?.max_length || 10000}
            />
            
            {/* Character count and validation feedback */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {task.constraints?.max_length && (
                  <span className={cn(
                    "text-xs",
                    textResponse.length <= task.constraints.max_length 
                      ? "text-green-600" 
                      : "text-red-600"
                  )}>
                    {textResponse.length}/{task.constraints.max_length} characters
                  </span>
                )}
              </div>
              
              {!isValid && textResponse.length > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">
                    {textResponse.length > (task.constraints?.max_length || 10000)
                      ? "Response exceeds maximum length"
                      : "Please enter a response"
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid || isLoading} 
          size="lg"
          className={cn(
            "px-12 py-3 text-lg font-bold rounded-lg transition-all duration-300 shadow-lg",
            isValid 
              ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl hover:scale-105 text-white" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          {isLoading && <Clock className="mr-3 h-5 w-5 animate-spin" />}
          {isLoading ? "Submitting Response..." : "Submit Response"}
        </Button>
      </div>
      
      {/* Validation Alert */}
      {!isValid && (selectedOption !== null || textResponse.length > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {task.type === 'multiple_choice' 
              ? "Please select an option to continue."
              : task.constraints?.max_length
              ? `Please enter a response (maximum ${task.constraints.max_length} characters).`
              : "Please enter a response."
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}