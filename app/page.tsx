'use client'

import { useRouter } from "next/navigation"
import { HeroSection } from "@/components/landing/HeroSection"
import { landingPageConfig } from "@/lib/landing-config"

export default function HomePage() {
  const router = useRouter()

  const handleStudentClick = () => {
    try {
      router.push(landingPageConfig.actions.studentButton.href)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to window.location if router fails
      window.location.href = landingPageConfig.actions.studentButton.href
    }
  }

  const handleFacilitatorClick = () => {
    try {
      router.push(landingPageConfig.actions.facilitatorButton.href)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to window.location if router fails
      window.location.href = landingPageConfig.actions.facilitatorButton.href
    }
  }

  return (
    <div className="min-h-screen bg-black">
        <HeroSection
          backgroundImage={landingPageConfig.hero.backgroundImage}
          title={landingPageConfig.hero.title}
          subtitle={landingPageConfig.hero.subtitle}
          features={landingPageConfig.features}
          onStudentClick={handleStudentClick}
          onFacilitatorClick={handleFacilitatorClick}
        />
    </div>
  )
}
