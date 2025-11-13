"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"

interface Avatar {
  id: string
  name: string
  image: string
  gender: 'male' | 'female'
  description: string
}

interface AvatarSelectorProps {
  onAvatarSelect: (avatar: Avatar) => void
  selectedAvatar: Avatar
}

const avatarOptions: Avatar[] = [
  {
    id: 'male-1',
    name: 'The Strategist',
    image: '👨🏽',
    gender: 'male',
    description: 'Master of Business'
  },
  {
    id: 'male-2', 
    name: 'The Innovator',
    image: '👨🏾‍🎓',
    gender: 'male',
    description: 'Tech Pioneer'
  },
  {
    id: 'male-3',
    name: 'The Creator',
    image: '👨🏿‍💻',
    gender: 'male',
    description: 'Digital Architect'
  },
  {
    id: 'female-1',
    name: 'The Visionary',
    image: '👩🏽‍💼',
    gender: 'female',
    description: 'Future Builder'
  },
  {
    id: 'female-2',
    name: 'The Explorer',
    image: '👩🏾‍🎓',
    gender: 'female',
    description: 'Knowledge Seeker'
  },
  {
    id: 'female-3',
    name: 'The Catalyst',
    image: '👩🏿‍💻',
    gender: 'female',
    description: 'Change Maker'
  }
]

export function AvatarBuilder({ onAvatarSelect, selectedAvatar }: AvatarSelectorProps) {
  const handleAvatarSelect = (avatar: Avatar) => {
    onAvatarSelect(avatar)
  }

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg text-black">Choose Your Avatar</CardTitle>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Select the avatar that represents you best
        </p>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        {/* Selected Avatar Display */}
        {selectedAvatar && (
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-4xl sm:text-6xl mb-2 p-3 sm:p-4 bg-gray-50 rounded-lg inline-block border-2 border-black">
              {selectedAvatar.image}
            </div>
            <div className="text-sm sm:text-base font-medium text-black">
              {selectedAvatar.name}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {selectedAvatar.description}
            </div>
          </div>
        )}

        {/* Avatar Grid */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 text-center">
              Choose Your Avatar:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {avatarOptions.map((avatar) => (
                <div
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar)}
                  className={`relative cursor-pointer transition-all duration-200 touch-manipulation active:scale-95 ${
                    selectedAvatar?.id === avatar.id
                      ? 'transform scale-105'
                      : 'hover:scale-105'
                  }`}
                >
                  <Card className={`border-2 transition-all ${
                    selectedAvatar?.id === avatar.id
                      ? 'border-black bg-gray-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-3xl sm:text-4xl mb-2">
                        {avatar.image}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-black mb-1">
                        {avatar.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {avatar.description}
                      </div>
                      
                      {/* Selection Indicator */}
                      <div className="absolute top-2 right-2">
                        {selectedAvatar?.id === avatar.id ? (
                          <CheckCircle2 className="h-4 w-4 text-black" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center pt-3 sm:pt-4">
        </div>
      </CardContent>
    </Card>
  )
}