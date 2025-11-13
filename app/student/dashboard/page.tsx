import { StudentDashboard } from "@/components/student/student-dashboard"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { getStudentDashboardData } from "@/lib/supabase/server-database"

export default async function StudentDashboardPage() {
  const user = await getSession()

  if (!user || user.role !== "student") {
    redirect("/login")
  }

  if (!user.career_path) {
    redirect("/onboarding")
  }

  // Fetch real dashboard data from database
  const dashboardResult = await getStudentDashboardData(user.id)
  
  if (!dashboardResult.success) {
    console.error('Failed to fetch dashboard data:', dashboardResult.error)
  }

  const { progress, sessions, recentDecisions, stats } = dashboardResult.data

  return (
    <StudentDashboard
      user={user}
      progress={progress}
      sessions={sessions}
      recentDecisions={recentDecisions}
      stats={stats}
    />
  )
}
