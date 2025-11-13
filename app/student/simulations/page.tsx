import { getSession } from "@/lib/auth/session"
import { getUserSimulationsByStatus } from "@/lib/supabase/server-database"
import { redirect } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SimulationsPageClient } from "./client"
import { StudentLayout } from "@/components/student/student-layout"

export default async function SimulationsPage() {
  // Get current user session
  const user = await getSession()
  
  if (!user || user.role !== "student") {
    redirect("/login")
  }

  if (!user.career_path) {
    redirect("/onboarding")
  }

  // Fetch user's simulation sessions
  const { getUserSessions } = await import("@/lib/scenario/actions")
  const simulationsResult = await getUserSessions(user.id)
  
  // Handle error state
  if (!simulationsResult.success) {
    return (
      <StudentLayout user={user}>
        <div className="min-h-screen simulation-bg-primary">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 sm:mb-8 md:mb-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold simulation-text-primary mb-3 sm:mb-4">
                  My Simulations
                </h1>
                <p className="text-sm sm:text-base md:text-lg simulation-text-secondary leading-relaxed">
                  Track your progress and continue your learning journey
                </p>
              </div>
              
              <Alert variant="destructive" className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <AlertDescription className="text-sm sm:text-base font-medium">
                  {simulationsResult.error || "Failed to load simulations"}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </StudentLayout>
    )
  }

  const simulations = simulationsResult.data || []

  return (
    <StudentLayout user={user}>
      <div className="min-h-screen simulation-bg-primary">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8 md:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold simulation-text-primary mb-3 sm:mb-4 leading-tight">
                My Simulations
              </h1>
              <p className="text-sm sm:text-base md:text-lg simulation-text-secondary leading-relaxed max-w-2xl">
                Track your progress and continue your learning journey through interactive business simulations
              </p>
            </div>

            {/* Client Component for Interactions */}
            <SimulationsPageClient simulations={simulations} />
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}