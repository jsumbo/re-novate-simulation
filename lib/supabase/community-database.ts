import { getSupabaseServerClient } from "./server"

export interface CommunityStudent {
  id: string
  username: string
  career_path: string
  school_name: string
  total_skill_points: number
  level: number
  top_skill: string
  simulations_completed: number
  joined_date: string
  last_active: string
}

export interface CommunityStats {
  total_students: number
  total_schools: number
  total_simulations_completed: number
  most_popular_career_path: string
}

// Get all students for community page (privacy-safe data only)
export async function getCommunityStudents(currentUserId?: string) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: true,
      data: []
    }
  }

  try {
    // Query students with their school information and progress
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        participant_id,
        username,
        career_path,
        created_at,
        schools!inner(name),
        progress(skill_name, skill_level),
        sessions(status)
      `)
      .eq('role', 'student')
      .not('id', 'eq', currentUserId || '') // Exclude current user
      .not('participant_id', 'is', null) // Only users with participant IDs
      .order('created_at', { ascending: false })
      .limit(50) // Limit for performance

    if (error) {
      console.error('Error fetching community students:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }

    // Transform data to safe community format
    const communityStudents: CommunityStudent[] = (data || []).map(student => {
      const skillPoints = student.progress?.reduce((sum: number, p: any) => sum + p.skill_level, 0) || 0
      const level = Math.max(1, Math.floor(skillPoints / 50) + 1)
      const topSkill = student.progress?.length > 0 
        ? student.progress.reduce((max: any, p: any) => p.skill_level > max.skill_level ? p : max).skill_name
        : 'Getting Started'
      const completedSessions = student.sessions?.filter((s: any) => s.status === 'completed').length || 0

      // Handle schools relation shape (array vs object)
      const schoolName = Array.isArray(student.schools)
        ? (student.schools[0]?.name || 'Unknown School')
        : (student.schools?.name || 'Unknown School')

      return {
        id: student.id,
        username: student.username || student.participant_id, // Use actual username or fallback to participant ID
        career_path: student.career_path || 'Exploring',
        school_name: schoolName,
        total_skill_points: skillPoints,
        level: level,
        top_skill: topSkill.replace(/_/g, ' '),
        simulations_completed: completedSessions,
        joined_date: student.created_at,
        last_active: student.created_at // Use created_at as fallback
      }
    })

    return {
      success: true,
      data: communityStudents
    }
  } catch (error) {
    console.error('Error fetching community students:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

// Get community statistics
export async function getCommunityStats() {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: true,
      data: {
        total_students: 0,
        total_schools: 0,
        total_simulations_completed: 0,
        most_popular_career_path: 'Business & Management'
      }
    }
  }

  try {
    // Get total students
    const { count: studentCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')

    // Get total schools
    const { count: schoolCount } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })

    // Get total completed simulations
    const { count: simulationCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Get most popular career path
    const { data: careerData } = await supabase
      .from('users')
      .select('career_path')
      .eq('role', 'student')
      .not('career_path', 'is', null)

    const careerCounts = careerData?.reduce((acc: any, user) => {
      acc[user.career_path] = (acc[user.career_path] || 0) + 1
      return acc
    }, {}) || {}

    const mostPopularCareer = Object.keys(careerCounts).length > 0
      ? Object.keys(careerCounts).reduce((a, b) => 
          careerCounts[a] > careerCounts[b] ? a : b
        )
      : 'Business & Management'

    return {
      success: true,
      data: {
        total_students: studentCount || 0,
        total_schools: schoolCount || 0,
        total_simulations_completed: simulationCount || 0,
        most_popular_career_path: mostPopularCareer
      }
    }
  } catch (error) {
    console.error('Error fetching community stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        total_students: 0,
        total_schools: 0,
        total_simulations_completed: 0,
        most_popular_career_path: 'Business & Management'
      }
    }
  }
}

// Get leaderboard data (top performers)
export async function getCommunityLeaderboard(limit: number = 10) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: true,
      data: []
    }
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        participant_id,
        username,
        career_path,
        created_at,
        schools!inner(name),
        progress(skill_name, skill_level, total_scenarios_completed, average_score)
      `)
      .eq('role', 'student')
      .not('participant_id', 'is', null) // Only users with participant IDs
      .order('created_at', { ascending: false })
      .limit(50) // Get more students to sort

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }

    console.log('Leaderboard raw data:', data?.length, 'students found')
    
    // Calculate leaderboard metrics from progress table and sort
    const leaderboardData = (data || [])
      .map(student => {
        const skillPoints = student.progress?.reduce((sum: number, p: any) => sum + (p.skill_level || 0), 0) || 0
        const simulationsCompleted = student.progress?.reduce((sum: number, p: any) => sum + (p.total_scenarios_completed || 0), 0) || 0
        const averageScore = (() => {
          if (!student.progress || student.progress.length === 0) return 0
          const scores = student.progress.map((p: any) => Number(p.average_score || 0))
          const total = scores.reduce((s: number, v: number) => s + v, 0)
          return Math.round(total / scores.length)
        })()

        console.log(`Student ${student.participant_id}: ${simulationsCompleted} scenarios from progress, avg score ${averageScore}`)

        const topSkill = student.progress?.length > 0
          ? student.progress.reduce((max: any, p: any) => p.skill_level > max.skill_level ? p : max).skill_name
          : 'Getting Started'

        // Handle schools relation shape (array vs object)
        const schoolName = Array.isArray(student.schools)
          ? (student.schools[0]?.name || 'Unknown School')
          : (student.schools?.name || 'Unknown School')

        return {
          id: student.id,
          username: student.username || student.participant_id,
          career_path: student.career_path || 'Exploring',
          school_name: schoolName,
          total_skill_points: skillPoints,
          level: Math.max(1, Math.floor(skillPoints / 50) + 1),
          top_skill: topSkill.replace(/_/g, ' '),
          simulations_completed: simulationsCompleted,
          total_sessions: simulationsCompleted,
          performance_score: skillPoints + (simulationsCompleted * 10) + Math.round(averageScore / 10),
          joined_date: student.created_at,
          last_active: student.created_at
        }
      })
      // Sort by: 1) simulations completed, 2) performance score, 3) skill points
      .sort((a, b) => {
        if (b.simulations_completed !== a.simulations_completed) return b.simulations_completed - a.simulations_completed
        if (b.performance_score !== a.performance_score) return b.performance_score - a.performance_score
        return b.total_skill_points - a.total_skill_points
      })
      .slice(0, limit)

    return {
      success: true,
      data: leaderboardData
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}