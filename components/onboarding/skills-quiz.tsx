"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Loader2, RefreshCw, ArrowRight } from "lucide-react"

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface SkillsQuizProps {
  interestArea: string
  username: string
  onQuizComplete: (score: number, level: string) => void
}

const quizQuestions: Record<string, QuizQuestion[]> = {
  "Business & Management": [
    {
      id: "bm1",
      question: "What is the most important factor when starting a business?",
      options: ["Having lots of money", "Understanding your customers", "Having a fancy office", "Being the smartest person"],
      correctAnswer: 1,
      explanation: "Understanding your customers helps you create products they actually want!"
    },
    {
      id: "bm2", 
      question: "What does 'profit' mean in business?",
      options: ["Money you borrow", "Money left after paying expenses", "Money you invest", "Money you save"],
      correctAnswer: 1,
      explanation: "Profit is what's left when you subtract all your costs from your income."
    },
    {
      id: "bm3",
      question: "Why is teamwork important in business?",
      options: ["It's not important", "Different people have different strengths", "It's required by law", "It makes work slower"],
      correctAnswer: 1,
      explanation: "Teams succeed because everyone brings unique skills and perspectives!"
    },
    {
      id: "bm4",
      question: "What is the best way to test a new business idea?",
      options: ["Ask friends and family", "Start with a small pilot program", "Invest all your money immediately", "Wait for perfect conditions"],
      correctAnswer: 1,
      explanation: "Starting small allows you to learn and improve without big risks!"
    }
  ],
  "Technology & Innovation": [
    {
      id: "ti1",
      question: "What is innovation?",
      options: ["Using old methods", "Creating new solutions to problems", "Copying others", "Avoiding change"],
      correctAnswer: 1,
      explanation: "Innovation is about finding creative new ways to solve problems!"
    },
    {
      id: "ti2",
      question: "How can technology help solve problems?",
      options: ["It can't help", "By making tasks faster and easier", "Only for entertainment", "It creates more problems"],
      correctAnswer: 1,
      explanation: "Technology is a powerful tool that can make our lives better and solve real challenges."
    },
    {
      id: "ti3",
      question: "What makes a successful tech startup?",
      options: ["Having the newest technology", "Solving a real problem for people", "Having famous investors", "Being in Silicon Valley"],
      correctAnswer: 1,
      explanation: "The best tech companies focus on solving real problems that people actually have!"
    }
  ],
  "Marketing & Sales": [
    {
      id: "ms1",
      question: "What is the main goal of marketing?",
      options: ["To spend money", "To help customers find what they need", "To trick people", "To make noise"],
      correctAnswer: 1,
      explanation: "Good marketing connects customers with products that truly help them!"
    },
    {
      id: "ms2",
      question: "What makes a good advertisement?",
      options: ["Being loud", "Being honest and helpful", "Being expensive", "Being confusing"],
      correctAnswer: 1,
      explanation: "The best ads are honest, clear, and show how a product can help people."
    },
    {
      id: "ms3",
      question: "How do you build trust with customers?",
      options: ["Make big promises", "Be consistent and reliable", "Offer the lowest prices", "Use fancy words"],
      correctAnswer: 1,
      explanation: "Trust comes from consistently delivering on your promises and being reliable!"
    }
  ],
  "Finance & Economics": [
    {
      id: "fe1",
      question: "What is the most important financial skill for entrepreneurs?",
      options: ["Complex math", "Understanding cash flow", "Stock market trading", "Cryptocurrency"],
      correctAnswer: 1,
      explanation: "Cash flow - knowing when money comes in and goes out - is crucial for business survival!"
    },
    {
      id: "fe2",
      question: "Why is budgeting important for a business?",
      options: ["It's required by law", "It helps plan and control spending", "It impresses investors", "It's not really important"],
      correctAnswer: 1,
      explanation: "Budgeting helps you plan ahead and make sure you don't run out of money!"
    }
  ]
}

export function SkillsQuiz({ interestArea, username, onQuizComplete }: SkillsQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showCompletionSummary, setShowCompletionSummary] = useState(false)
  const [finalQuizData, setFinalQuizData] = useState<{score: number, level: string, percentage: number} | null>(null)

  // Load questions with immediate fallback for better UX
  useEffect(() => {
    const loadQuestions = async () => {
      // Start with fallback questions immediately
      const fallbackQuestions = quizQuestions[interestArea] || quizQuestions["Business & Management"]
      setQuestions(fallbackQuestions)
      setIsLoadingQuestions(false)
      
      // Try to get AI-generated questions in background (with timeout)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch('/api/ai/personalized-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            interestArea,
            difficulty: 'high_school'
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.questions && data.questions.length > 0) {
            setQuestions(data.questions)
          }
        }
      } catch (error) {
        // Silently fail - user already has fallback questions
        console.log('AI questions not available, using fallback')
      }
    }

    loadQuestions()
  }, [interestArea])

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return

    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }

    if (!showExplanation) {
      setShowExplanation(true)
      return
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      // Quiz complete
      const finalScore = selectedAnswer === questions[currentQuestion].correctAnswer ? score + 1 : score
      const percentage = (finalScore / questions.length) * 100
      let level = "Beginner"
      if (percentage >= 80) level = "Advanced"
      else if (percentage >= 60) level = "Intermediate"
      
      // Show completion summary before calling onQuizComplete
      setShowCompletionSummary(true)
      setFinalQuizData({ score: finalScore, level, percentage })
    }
  }

  const progress = questions.length > 0 ? ((currentQuestion + (showExplanation ? 0.5 : 0)) / questions.length) * 100 : 0

  if (isLoadingQuestions) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-black" />
          <h3 className="text-lg font-medium text-black mb-2">
            Preparing Your Quiz, {username}
          </h3>
          <p className="text-sm text-gray-600">
            We're creating personalized questions just for you...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">😅</div>
          <h3 className="text-lg font-medium text-black mb-2">
            Oops! Something went wrong, {username}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We couldn't load your quiz questions. Let's try again!
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Quiz completion summary
  if (showCompletionSummary && finalQuizData) {
    const getEncouragingMessage = () => {
      if (finalQuizData.percentage >= 80) {
        return `${username}, you scored ${finalQuizData.percentage}%! Your ${finalQuizData.level.toLowerCase()} level knowledge in ${interestArea} is strong. You're well-prepared to continue learning and developing your skills.`
      } else if (finalQuizData.percentage >= 60) {
        return `${username}, you scored ${finalQuizData.percentage}%. You have a solid ${finalQuizData.level.toLowerCase()} foundation in ${interestArea}. Continue learning and practicing to build on this foundation.`
      } else {
        return `${username}, you scored ${finalQuizData.percentage}%. Starting at the ${finalQuizData.level.toLowerCase()} level is a good place to begin. Focus on learning the fundamentals and you'll see steady progress.`
      }
    }

    return (
      <Card className="border-gray-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold text-black mb-4">
            Quiz Complete, {username}!
          </h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6 border border-blue-200">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{finalQuizData.score}</div>
                <div className="text-sm text-blue-700">out of {questions.length}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900">{Math.round(finalQuizData.percentage)}%</div>
                <div className="text-sm text-purple-700">accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-900">{finalQuizData.level}</div>
                <div className="text-sm text-green-700">level</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800 leading-relaxed">
                {getEncouragingMessage()}
              </p>
            </div>
          </div>

          <Button 
            onClick={() => {
              setShowCompletionSummary(false)
              onQuizComplete(finalQuizData.score, finalQuizData.level)
            }}
            className="bg-black hover:bg-gray-800 text-white px-8 py-3"
            size="lg"
          >
            Continue My Journey! <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-base sm:text-lg text-black">
            Knowledge Check
          </CardTitle>
          <Badge variant="outline" className="text-xs px-2 py-1 border-black text-black">
            {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mt-2">
          <div 
            className="bg-black h-2 sm:h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base leading-relaxed">
            {questions[currentQuestion].question}
          </h3>
          
          {!showExplanation ? (
            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto p-3 sm:p-4 touch-manipulation active:scale-98"
                  onClick={() => handleAnswerSelect(index)}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {selectedAnswer === index ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm sm:text-base text-left">{option}</span>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg border-2 ${
                selectedAnswer === questions[currentQuestion].correctAnswer 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnswer === questions[currentQuestion].correctAnswer ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✗</span>
                    </div>
                  )}
                  <p className={`text-sm font-medium ${
                    selectedAnswer === questions[currentQuestion].correctAnswer 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {selectedAnswer === questions[currentQuestion].correctAnswer 
                      ? `Correct, ${username}!` 
                      : `Incorrect, ${username}. Here's the explanation:`
                    }
                  </p>
                </div>
                <p className={`text-sm ${
                  selectedAnswer === questions[currentQuestion].correctAnswer 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {questions[currentQuestion].explanation}
                </p>
              </div>
              
              <div className="text-sm text-gray-600">
                <strong>Correct answer:</strong> {questions[currentQuestion].options[questions[currentQuestion].correctAnswer]}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 sm:pt-4 gap-3">
          <div className="text-xs sm:text-sm text-gray-500">
            Score: {score}/{questions.length}
          </div>
          <Button 
            onClick={handleNext}
            disabled={selectedAnswer === null && !showExplanation}
            className="bg-black hover:bg-gray-800 text-white text-sm sm:text-base px-4 sm:px-6 h-10 sm:h-auto"
          >
            {showExplanation 
              ? (currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question')
              : 'Check Answer'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}