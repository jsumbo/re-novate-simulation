import { getSupabaseServerClient } from "./server"
import { SimulationSession, SimulationSummary, SimulationStatus } from "../types"

export interface Progress {
  id: string;
  user_id: string;
  skill_name: string;
  skill_level: number;
  total_scenarios_completed: number;
  average_score: number;
  last_practiced?: string;
  improvement_rate: number;
}

export interface Session {
  id: string;
  user_id: string;
  session_type: string;
  status: 'in_progress' | 'completed' | 'paused' | 'abandoned';
  current_round: number;
  total_rounds: number;
  total_score: number;
  scenarios_completed: number;
  time_spent: number;
  started_at: string;
  created_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  session_id: string;
  scenario_id: string;
  selected_option_id: string;
  outcome_score: number;
  time_taken: number;
  ai_feedback?: string;
  skills_gained: any;
  reflection_notes?: string;
  created_at: string;
  scenarios?: {
    title: string;
  };
}

export async function getStudentDashboardData(userId: string) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    // Return mock data for UI preview mode
    return {
      success: true,
      data: {
        progress: [],
        sessions: [],
        recentDecisions: [],
        stats: {
          totalSessions: 0,
          completedSessions: 0,
          averageScore: 0
        }
      }
    }
  }

  try {
    // Get progress data
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('skill_level', { ascending: false })

    if (progressError) {
      console.error('Error fetching progress:', progressError)
    }

    // Get simulation_sessions data (new format)
    const { data: simulationSessionsData, error: simSessionsError } = await supabase
      .from('simulation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Fallback to old sessions table if simulation_sessions doesn't exist
    let sessionsData = simulationSessionsData
    if (simSessionsError && simSessionsError.code === 'PGRST116') {
      const { data: oldSessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
      }
      sessionsData = oldSessionsData
    } else if (simSessionsError) {
      console.error('Error fetching simulation sessions:', simSessionsError)
    }

    // Get recent decisions with scenario titles
    const { data: decisionsData, error: decisionsError } = await supabase
      .from('decisions')
      .select(`
        *,
        scenarios (
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (decisionsError) {
      console.error('Error fetching decisions:', decisionsError)
    }

    // Calculate stats
    const sessions = sessionsData || []
    const decisions = decisionsData || []
    const progress = progressData || []

    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => {
      const status = s.status?.toLowerCase()
      return status === 'completed' || status === 'done' || status === 'finished'
    }).length
    const averageScore = decisions.length > 0 
      ? Math.round(decisions.reduce((sum, d) => sum + (d.outcome_score || 0), 0) / decisions.length)
      : 0

    return {
      success: true,
      data: {
        progress,
        sessions,
        recentDecisions: decisions,
        stats: {
          totalSessions,
          completedSessions,
          averageScore
        }
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        progress: [],
        sessions: [],
        recentDecisions: [],
        stats: {
          totalSessions: 0,
          completedSessions: 0,
          averageScore: 0
        }
      }
    }
  }
}

// Simulation Session Functions
export async function getUserSimulationsByStatus(userId: string, status?: SimulationStatus) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: true,
      data: []
    }
  }

  try {
    const { data, error } = await supabase
      .rpc('get_user_simulations_by_status', {
        p_user_id: userId,
        p_status: status || null
      })

    if (error) {
      console.error('Error fetching user simulations:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }

    return {
      success: true,
      data: data as SimulationSession[]
    }
  } catch (error) {
    console.error('Error fetching user simulations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

// Optimized paginated version for large datasets
export async function getUserSimulationsPaginated(
  userId: string, 
  options: {
    status?: SimulationStatus
    limit?: number
    offset?: number
    orderBy?: 'updated_at' | 'created_at' | 'progress' | 'title'
    orderDirection?: 'ASC' | 'DESC'
  } = {}
) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: true,
      data: [],
      totalCount: 0,
      hasMore: false
    }
  }

  const {
    status,
    limit = 12,
    offset = 0,
    orderBy = 'updated_at',
    orderDirection = 'DESC'
  } = options

  try {
    const { data, error } = await supabase
      .rpc('get_user_simulations_paginated', {
        p_user_id: userId,
        p_status: status || null,
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_direction: orderDirection
      })

    if (error) {
      console.error('Error fetching paginated simulations:', error)
      return {
        success: false,
        error: error.message,
        data: [],
        totalCount: 0,
        hasMore: false
      }
    }

    const simulations = data as (SimulationSession & { total_count: number })[]
    const totalCount = simulations.length > 0 ? simulations[0].total_count : 0
    const hasMore = offset + limit < totalCount

    // Remove total_count from individual records
    const cleanedData = simulations.map(({ total_count, ...sim }) => sim) as SimulationSession[]

    return {
      success: true,
      data: cleanedData,
      totalCount,
      hasMore
    }
  } catch (error) {
    console.error('Error fetching paginated simulations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      totalCount: 0,
      hasMore: false
    }
  }
}

// Get simulation counts for pagination info
export async function getUserSimulationCounts(userId: string) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: true,
      data: {
        total_count: 0,
        ongoing_count: 0,
        completed_count: 0,
        paused_count: 0
      }
    }
  }

  try {
    const { data, error } = await supabase
      .rpc('get_user_simulation_counts', {
        p_user_id: userId
      })

    if (error) {
      console.error('Error fetching simulation counts:', error)
      return {
        success: false,
        error: error.message,
        data: {
          total_count: 0,
          ongoing_count: 0,
          completed_count: 0,
          paused_count: 0
        }
      }
    }

    return {
      success: true,
      data: data[0] || {
        total_count: 0,
        ongoing_count: 0,
        completed_count: 0,
        paused_count: 0
      }
    }
  } catch (error) {
    console.error('Error fetching simulation counts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        total_count: 0,
        ongoing_count: 0,
        completed_count: 0,
        paused_count: 0
      }
    }
  }
}

export async function getUserSimulationSummary(userId: string) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: true,
      data: {
        total_simulations: 0,
        completed_simulations: 0,
        ongoing_simulations: 0,
        average_progress: 0
      }
    }
  }

  try {
    const { data, error } = await supabase
      .rpc('get_user_simulation_summary', {
        p_user_id: userId
      })

    if (error) {
      console.error('Error fetching simulation summary:', error)
      return {
        success: false,
        error: error.message,
        data: {
          total_simulations: 0,
          completed_simulations: 0,
          ongoing_simulations: 0,
          average_progress: 0
        }
      }
    }

    return {
      success: true,
      data: data[0] as SimulationSummary
    }
  } catch (error) {
    console.error('Error fetching simulation summary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        total_simulations: 0,
        completed_simulations: 0,
        ongoing_simulations: 0,
        average_progress: 0
      }
    }
  }
}

export async function createSimulationSession(sessionData: Omit<SimulationSession, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: false,
      error: "Database not available"
    }
  }

  try {
    const { data, error } = await supabase
      .from('simulation_sessions')
      .insert([sessionData])
      .select()
      .single()

    if (error) {
      console.error('Error creating simulation session:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as SimulationSession
    }
  } catch (error) {
    console.error('Error creating simulation session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function updateSimulationProgress(simulationId: string, progress: number, currentRound?: number) {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return {
      success: false,
      error: "Database not available"
    }
  }

  try {
    const { data, error } = await supabase
      .rpc('update_simulation_progress', {
        p_simulation_id: simulationId,
        p_progress: progress,
        p_current_round: currentRound || null
      })

    if (error) {
      console.error('Error updating simulation progress:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data
    }
  } catch (error) {
    console.error('Error updating simulation progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}