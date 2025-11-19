import { ScenarioEngine } from "@/components/scenario/scenario-engine"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

interface ScenarioPageProps {
  searchParams: Promise<{ session?: string }>
}

export default async function ScenarioPage({ searchParams }: ScenarioPageProps) {
  const user = await getSession()

  if (!user || user.role !== "student") {
    redirect("/login")
  }

  if (!user.career_path) {
    redirect("/onboarding")
  }

  let existingSession = null
  const params = await searchParams

  // If session ID is provided in URL, fetch that specific session
  if (params.session) {
    const supabase = await getSupabaseServerClient()
    if (supabase) {
      const { data: session } = await supabase
        .from("simulation_sessions")
        .select("*")
        .eq("id", params.session)
        .eq("user_id", user.id)
        .single()
      
      existingSession = session
    }
  } else {
    // Otherwise, look for any active session
    const supabase = await getSupabaseServerClient()
    if (supabase) {
      const { data: session } = await supabase
        .from("simulation_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ongoing")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      
      existingSession = session
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <ScenarioEngine user={user} existingSession={existingSession} />
    </div>
  )
}
