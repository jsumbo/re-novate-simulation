"use client"

import { EnhancedOnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface School {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  participant_id: string
  schools?: School
  career_path?: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the school and student ID from localStorage (set during login)
    const selectedSchoolData = localStorage.getItem('selectedSchool')
    const generatedStudentId = localStorage.getItem('generatedStudentId')

    if (!selectedSchoolData || !generatedStudentId) {
      // If no login data, redirect back to login
      router.push('/login')
      return
    }

    try {
      const school = JSON.parse(selectedSchoolData)
      
      // Create user object with school information
      const userData: User = {
        id: generatedStudentId,
        participant_id: generatedStudentId,
        schools: school,
        career_path: null
      }

      setUser(userData)
    } catch (error) {
      console.error('Error parsing school data:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return <EnhancedOnboardingFlow user={user} />
}
