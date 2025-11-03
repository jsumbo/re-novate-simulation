import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { EnhancedSimulationEngine } from "@/components/simulation/simulation-engine"

export default async function StudentSimulationPage() {
  const user = await getSession()

  if (!user || user.role !== "student") {
    redirect("/login")
  }

  if (!user.career_path) {
    redirect("/onboarding")
  }

  return (
    <div className="min-h-screen bg-white">
  <EnhancedSimulationEngine user={user} />
    </div>
  )
}