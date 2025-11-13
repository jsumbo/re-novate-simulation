"use server"

import { getUserSimulationsByStatus, getUserSimulationSummary, createSimulationSession, updateSimulationProgress } from "../supabase/server-database"
import { getCurrentUser } from "../auth/session"
import { SimulationSession, SimulationSummary, SimulationStatus } from "../types"

/**
 * Fetches user simulations filtered by status
 * @param status - Optional status filter ('ongoing', 'completed', 'paused')
 * @returns Promise with simulation sessions array
 */
export async function getUserSimulations(status?: SimulationStatus) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
        data: []
      }
    }

    const result = await getUserSimulationsByStatus(user.id, status)
    return result
  } catch (error) {
    console.error('Error fetching user simulations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

/**
 * Fetches simulation summary statistics for the current user
 * @returns Promise with simulation summary data
 */
export async function getSimulationSummary() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
        data: {
          total_simulations: 0,
          completed_simulations: 0,
          ongoing_simulations: 0,
          average_progress: 0
        }
      }
    }

    const result = await getUserSimulationSummary(user.id)
    return result
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

/**
 * Creates a new simulation session
 * @param sessionData - Simulation session data without id and timestamps
 * @returns Promise with created simulation session
 */
export async function createNewSimulationSession(
  sessionData: Omit<SimulationSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      }
    }

    const result = await createSimulationSession({
      ...sessionData,
      user_id: user.id
    })
    return result
  } catch (error) {
    console.error('Error creating simulation session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Updates simulation progress and automatically determines completion status
 * @param simulationId - ID of the simulation to update
 * @param progress - Progress percentage (0-100)
 * @param currentRound - Optional current round number
 * @returns Promise with update result
 */
export async function updateSimulationSessionProgress(
  simulationId: string,
  progress: number,
  currentRound?: number
) {
  try {
    // Validate progress is within bounds
    if (progress < 0 || progress > 100) {
      return {
        success: false,
        error: "Progress must be between 0 and 100"
      }
    }

    const result = await updateSimulationProgress(simulationId, progress, currentRound)
    return result
  } catch (error) {
    console.error('Error updating simulation progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculates progress percentage based on current round and total rounds
 * @param currentRound - Current round number
 * @param totalRounds - Total number of rounds
 * @returns Progress percentage (0-100)
 */
export function calculateSimulationProgress(currentRound: number, totalRounds: number): number {
  if (totalRounds <= 0) return 0
  if (currentRound <= 0) return 0
  if (currentRound >= totalRounds) return 100
  
  return Math.round((currentRound / totalRounds) * 100)
}

/**
 * Determines if a simulation is completed based on progress
 * @param progress - Progress percentage (0-100)
 * @returns Boolean indicating completion status
 */
export function isSimulationCompleted(progress: number): boolean {
  return progress >= 100
}

/**
 * Gets simulations organized by status for display
 * @returns Promise with organized simulation data
 */
export async function getOrganizedSimulations() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
        data: {
          completed: [],
          ongoing: [],
          summary: {
            total_simulations: 0,
            completed_simulations: 0,
            ongoing_simulations: 0,
            average_progress: 0
          }
        }
      }
    }

    // Fetch all simulations and summary in parallel
    const [allSimulationsResult, summaryResult] = await Promise.all([
      getUserSimulationsByStatus(user.id),
      getUserSimulationSummary(user.id)
    ])

    if (!allSimulationsResult.success) {
      return {
        success: false,
        error: allSimulationsResult.error,
        data: {
          completed: [],
          ongoing: [],
          summary: {
            total_simulations: 0,
            completed_simulations: 0,
            ongoing_simulations: 0,
            average_progress: 0
          }
        }
      }
    }

    const simulations = allSimulationsResult.data || []
    
    // Organize simulations by status
    const completed = simulations.filter(sim => sim.status === 'completed')
    const ongoing = simulations.filter(sim => sim.status === 'ongoing' || sim.status === 'paused')

    return {
      success: true,
      data: {
        completed,
        ongoing,
        summary: summaryResult.success ? summaryResult.data : {
          total_simulations: simulations.length,
          completed_simulations: completed.length,
          ongoing_simulations: ongoing.length,
          average_progress: simulations.length > 0 
            ? Math.round(simulations.reduce((sum, sim) => sum + sim.progress, 0) / simulations.length)
            : 0
        }
      }
    }
  } catch (error) {
    console.error('Error fetching organized simulations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        completed: [],
        ongoing: [],
        summary: {
          total_simulations: 0,
          completed_simulations: 0,
          ongoing_simulations: 0,
          average_progress: 0
        }
      }
    }
  }
}
/**
 * Pro
gress tracking and session management functions
 */

/**
 * Updates simulation session with progress and round information
 * @param simulationId - ID of the simulation session
 * @param updates - Partial updates to apply
 * @returns Promise with update result
 */
export async function updateSimulationSession(
  simulationId: string,
  updates: Partial<Pick<SimulationSession, 'progress' | 'current_round' | 'status' | 'session_data'>>
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      }
    }

    // Use the client-side database service for updates
    const { db } = await import("../supabase/database")
    const result = await db.updateSimulationSession(simulationId, updates)
    
    return result
  } catch (error) {
    console.error('Error updating simulation session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Records a simulation decision and updates progress
 * @param simulationId - ID of the simulation session
 * @param decisionData - Decision data to record
 * @returns Promise with result
 */
export async function recordSimulationDecision(
  simulationId: string,
  decisionData: {
    scenario_id?: string
    selected_option: string
    outcome_score: number
    ai_feedback?: string
    skills_gained: Record<string, number>
    time_taken: number
    reflection_notes?: string
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      }
    }

    // Get current simulation session to calculate new progress
    const { db } = await import("../supabase/database")
    const simulationResult = await db.getUserSimulationsByStatus(user.id)
    
    if (!simulationResult.success) {
      return {
        success: false,
        error: "Failed to fetch simulation data"
      }
    }

    const simulation = simulationResult.simulations?.find(sim => sim.id === simulationId)
    if (!simulation) {
      return {
        success: false,
        error: "Simulation not found"
      }
    }

    // Calculate new progress based on current round completion
    const newRound = simulation.current_round + 1
    const newProgress = calculateSimulationProgress(newRound, simulation.total_rounds)
    const newStatus = newProgress >= 100 ? 'completed' : 'ongoing'

    // Update simulation progress
    const progressResult = await updateSimulationSessionProgress(
      simulationId,
      newProgress,
      newRound
    )

    if (!progressResult.success) {
      return progressResult
    }

    const updatedSessionData = {
      ...simulation.session_data,
      decisions: [
        ...(simulation.session_data.decisions || []),
        {
          ...decisionData,
          round: simulation.current_round,
          timestamp: new Date().toISOString()
        }
      ]
    }

    // Update session data with the new decision
    const sessionUpdateResult = await updateSimulationSession(simulationId, {
      session_data: updatedSessionData,
      status: newStatus as SimulationStatus
    })

    return {
      success: true,
      data: {
        newProgress,
        newRound,
        newStatus,
        sessionUpdate: sessionUpdateResult
      }
    }
  } catch (error) {
    console.error('Error recording simulation decision:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Gets detailed simulation session with progress history
 * @param simulationId - ID of the simulation session
 * @returns Promise with detailed simulation data
 */
export async function getSimulationDetails(simulationId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
        data: null
      }
    }

    const { db } = await import("../supabase/database")
    const result = await db.getUserSimulationsByStatus(user.id)
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        data: null
      }
    }

    const simulation = result.simulations?.find(sim => sim.id === simulationId)
    if (!simulation) {
      return {
        success: false,
        error: "Simulation not found",
        data: null
      }
    }

    // Calculate additional progress metrics
    const progressPercentage = simulation.progress
    const roundsCompleted = simulation.current_round - 1
    const roundsRemaining = simulation.total_rounds - simulation.current_round + 1
    const isCompleted = simulation.status === 'completed'
    
    // Extract decision history from session data
    const decisions = simulation.session_data.decisions || []
    const averageScore = decisions.length > 0 
      ? decisions.reduce((sum: number, decision: any) => sum + decision.outcome_score, 0) / decisions.length
      : 0

    return {
      success: true,
      data: {
        ...simulation,
        metrics: {
          progressPercentage,
          roundsCompleted,
          roundsRemaining,
          isCompleted,
          averageScore: Math.round(averageScore),
          totalDecisions: decisions.length,
          timeSpent: decisions.reduce((sum: number, decision: any) => sum + (decision.time_taken || 0), 0)
        },
        decisions
      }
    }
  } catch (error) {
    console.error('Error fetching simulation details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Pauses a simulation session
 * @param simulationId - ID of the simulation to pause
 * @returns Promise with result
 */
export async function pauseSimulation(simulationId: string) {
  try {
    const result = await updateSimulationSession(simulationId, {
      status: 'paused'
    })
    
    return result
  } catch (error) {
    console.error('Error pausing simulation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Resumes a paused simulation session
 * @param simulationId - ID of the simulation to resume
 * @returns Promise with result
 */
export async function resumeSimulation(simulationId: string) {
  try {
    const result = await updateSimulationSession(simulationId, {
      status: 'ongoing'
    })
    
    return result
  } catch (error) {
    console.error('Error resuming simulation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Completes a simulation session
 * @param simulationId - ID of the simulation to complete
 * @param finalScore - Optional final score
 * @returns Promise with result
 */
export async function completeSimulation(simulationId: string, finalScore?: number) {
  try {
    const updates: Partial<SimulationSession> = {
      status: 'completed',
      progress: 100
    }

    // Add final score to session data if provided
    if (finalScore !== undefined) {
      const detailsResult = await getSimulationDetails(simulationId)
      if (detailsResult.success && detailsResult.data) {
        updates.session_data = {
          ...detailsResult.data.session_data,
          finalScore,
          completedAt: new Date().toISOString()
        }
      }
    }

    const result = await updateSimulationSession(simulationId, updates)
    return result
  } catch (error) {
    console.error('Error completing simulation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Gets simulation progress analytics for a user
 * @returns Promise with analytics data
 */
export async function getSimulationAnalytics() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
        data: null
      }
    }

    const [simulationsResult, summaryResult] = await Promise.all([
      getUserSimulations(),
      getSimulationSummary()
    ])

    if (!simulationsResult.success || !summaryResult.success) {
      return {
        success: false,
        error: "Failed to fetch analytics data",
        data: null
      }
    }

    const simulations = simulationsResult.data
    const summary = summaryResult.data

    // Calculate additional analytics
    const recentSimulations = simulations
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)

    const progressTrend = simulations.map(sim => ({
      date: sim.updated_at,
      progress: sim.progress,
      title: sim.title
    }))

    const skillsGained = simulations.reduce((acc, sim) => {
      const decisions = sim.session_data.decisions || []
      decisions.forEach((decision: any) => {
        if (decision.skills_gained) {
          Object.entries(decision.skills_gained).forEach(([skill, points]) => {
            acc[skill] = (acc[skill] || 0) + (points as number)
          })
        }
      })
      return acc
    }, {} as Record<string, number>)

    return {
      success: true,
      data: {
        summary,
        recentSimulations,
        progressTrend,
        skillsGained,
        totalTimeSpent: simulations.reduce((sum, sim) => {
          const decisions = sim.session_data.decisions || []
          return sum + decisions.reduce((decSum: number, dec: any) => decSum + (dec.time_taken || 0), 0)
        }, 0)
      }
    }
  } catch (error) {
    console.error('Error fetching simulation analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}