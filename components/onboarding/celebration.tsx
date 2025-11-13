"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Trophy, Target, Zap } from "lucide-react"

interface CelebrationProps {
  type: "interest" | "avatar" | "quiz" | "goals" | "complete"
  message: string
  username?: string
  participantId?: string
  onComplete?: () => void
}

const celebrationConfig = {
  interest: {
    icon: Star,
    emoji: "🌟",
    color: "text-black",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  },
  avatar: {
    icon: Target,
    emoji: "✨",
    color: "text-black",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  },
  quiz: {
    icon: Zap,
    emoji: "🧠",
    color: "text-black",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  },
  goals: {
    icon: Trophy,
    emoji: "🎯",
    color: "text-black",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  },
  complete: {
    icon: Trophy,
    emoji: "🚀",
    color: "text-black",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  }
}

export function Celebration({ type, message, username, participantId, onComplete }: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const config = celebrationConfig[type]
  const Icon = config.icon

  useEffect(() => {
    // Only auto-close for non-complete celebrations
    if (type !== "complete") {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [onComplete, type])

  if (!isVisible) return null

  // Special content for completion screen with AI Mentor introduction
  if (type === "complete") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg max-w-md w-full`}>
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold text-black mb-3">Meet Your AI Mentor!</h3>
            <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
              <p className="text-gray-800 text-sm leading-relaxed">
                "Hi <strong>{username || 'there'}</strong>, I'm <strong>Noni</strong>, your AI mentor. I'll guide you through your entrepreneurship journey."
              </p>
            </div>
            {participantId && (
              <div className="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Your Student ID</h4>
                <div className="text-2xl font-mono font-bold text-green-800 tracking-widest mb-2">
                  {participantId}
                </div>
                <p className="text-xs text-green-700">
                  Save this ID! You'll need it to log back in.
                </p>
              </div>
            )}
            <Badge className="bg-black text-white mb-4">
              Welcome to the Community
            </Badge>
            <button
              onClick={() => {
                setIsVisible(false)
                onComplete?.()
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium"
            >
              Start My Journey
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg animate-bounce`}>
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-4 animate-pulse">
            {config.emoji}
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon className={`h-6 w-6 ${config.color}`} />
            <h3 className="text-xl font-bold text-black">Awesome!</h3>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <p className="text-gray-700 mb-4">{message}</p>
          <Badge className="bg-black text-white">
            Achievement Unlocked! 🏆
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}