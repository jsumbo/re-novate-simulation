import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateDetailedFeedback } from '@/lib/simulation/ai-feedback-generator'
import type { SimulationContext, SimulationOption, SimulationScenario } from '@/lib/simulation/types'

export async function POST(request: NextRequest) {
  try {
    const {
      option,
      task,
      scenario,
      context,
      userId,
      round = 1,
    }: {
      option?: SimulationOption
      task?: {
        id: string
        type: 'essay' | 'short_answer'
        response: string
        word_count?: number
        evaluation_criteria?: string[]
      }
      scenario: SimulationScenario
      context?: SimulationContext
      userId?: string
      round?: number
    } = await request.json()

    if (!scenario) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scenario data is required',
        },
        { status: 400 },
      )
    }

    if (!option && !task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either option or task response is required',
        },
        { status: 400 },
      )
    }

    const supabase = await getSupabaseServerClient()

    const finalContext: SimulationContext = context || {
      industry: 'Technology',
      location: 'Monrovia, Liberia',
      businessStage: 'startup',
      resources: {
        budget: 5000,
        team_size: 5,
        time_constraint: '2-3 months',
      },
      market_conditions: 'emerging market with growth potential',
      user_background: {
        career_path: 'CEO',
        skill_level: round * 20,
        previous_decisions: [],
      },
    }

    // Handle text-based task submissions (essay/short_answer)
    if (task && !option) {
      const aiFeedback = await generateDetailedFeedbackForTask(
        scenario,
        task,
        finalContext,
      )
      const outcomeScore = calculateTaskScore(task)
      const skillsGained = {
        'critical_thinking': 3,
        'communication': 2,
        'problem_solving': 2,
      }

      if (!supabase) {
        return NextResponse.json({
          success: true,
          feedback: {
            ai_feedback: aiFeedback,
            outcome_score: outcomeScore,
            skills_gained: skillsGained,
          },
        })
      }

      // Save task submission to database
      const { error: decisionError } = await supabase.from('decisions').insert({
        user_id: userId,
        scenario_id: scenario.id,
        selected_option: null,
        task_response: JSON.stringify({
          task_id: task.id,
          task_type: task.type,
          response: task.response,
          word_count: task.word_count,
        }),
        round_number: round,
        ai_feedback: JSON.stringify(aiFeedback),
        outcome_score: outcomeScore,
        skills_gained: skillsGained,
        created_at: new Date().toISOString(),
      })

      if (decisionError) {
        console.error('Error saving task decision:', decisionError)
      }

      if (userId) {
        await updateUserProgress(userId, skillsGained, outcomeScore, supabase)
      }

      return NextResponse.json({
        success: true,
        feedback: {
          ai_feedback: aiFeedback,
          outcome_score: outcomeScore,
          skills_gained: skillsGained,
        },
      })
    }

    // Handle option-based submissions (multiple choice)
    if (!option) {
      return NextResponse.json(
        {
          success: false,
          error: 'Option data is required for option-based submissions',
        },
        { status: 400 },
      )
    }

    if (!supabase) {
      const aiFeedback = await generateDetailedFeedback(
        scenario,
        option,
        finalContext,
      )
      const outcomeScore = calculateOutcomeScore(option, round)
      const skillsGained = option.skill_development || {}

      return NextResponse.json({
        success: true,
        feedback: {
          ai_feedback: aiFeedback,
          outcome_score: outcomeScore,
          skills_gained: skillsGained,
        },
      })
    }

    const aiFeedback = await generateDetailedFeedback(
      scenario,
      option,
      finalContext,
    )
    const outcomeScore = calculateOutcomeScore(option, round)
    const skillsGained = option.skill_development || {}

    const { error: decisionError } = await supabase.from('decisions').insert({
      user_id: userId,
      scenario_id: scenario.id,
      selected_option: option.id,
      round_number: round,
      ai_feedback: JSON.stringify(aiFeedback),
      outcome_score: outcomeScore,
      skills_gained: skillsGained,
      created_at: new Date().toISOString(),
    })

    if (decisionError) {
      console.error('Error saving decision:', decisionError)
    }

    if (userId) {
      await updateUserProgress(userId, skillsGained, outcomeScore, supabase)
    }

    return NextResponse.json({
      success: true,
      feedback: {
        ai_feedback: aiFeedback,
        outcome_score: outcomeScore,
        skills_gained: skillsGained,
      },
    })

  } catch (error) {
    console.error('Error processing simulation submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}

function calculateOutcomeScore(option: SimulationOption, round: number): number {
  const riskAdjustment = option.risk_level === 'high' ? -5 : option.risk_level === 'low' ? 5 : 0
  const base = 70 + riskAdjustment
  const roundBonus = Math.min(round * 3, 12)
  const variance = Math.floor(Math.random() * 10) - 3
  const score = base + roundBonus + variance
  return Math.max(55, Math.min(100, score))
}

function calculateTaskScore(task: { word_count?: number; response: string }): number {
  const wordCount = task.word_count || task.response.split(/\s+/).filter(w => w.length > 0).length
  const lengthScore = Math.min(100, Math.max(50, (wordCount / 10) * 10)) // Base score on word count
  const qualityBonus = Math.floor(Math.random() * 15) + 5 // Random quality bonus
  return Math.max(60, Math.min(100, lengthScore + qualityBonus))
}

async function generateDetailedFeedbackForTask(
  scenario: SimulationScenario,
  task: { type: string; response: string; evaluation_criteria?: string[] },
  context: SimulationContext
) {
  // Import the feedback generator
  const { generateDetailedFeedback } = await import('@/lib/simulation/ai-feedback-generator')
  
  // Create a mock option for the feedback generator
  // The feedback will be based on the text response
  const mockOption: SimulationOption = {
    id: `task_${task.type}`,
    text: task.response.substring(0, 200) + (task.response.length > 200 ? '...' : ''),
    reasoning: 'Text-based response',
    immediate_consequences: [],
    long_term_effects: [],
    skill_development: {
      'critical_thinking': 3,
      'communication': 2,
      'problem_solving': 2,
    },
    risk_level: 'medium',
    resource_impact: {
      budget_change: 0,
      time_required: 'Varies',
      team_involvement: [],
    },
  }

  return generateDetailedFeedback(scenario, mockOption, context)
}

async function updateUserProgress(userId: string, skillsGained: Record<string, number>, score: number, supabase: any) {
  for (const [skill, points] of Object.entries(skillsGained)) {
    const { data: existing } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_name', skill)
      .single()

    if (existing) {
      const newLevel = existing.skill_level + points
      const newTotal = existing.total_scenarios_completed + 1
      const newAverage = (existing.average_score * existing.total_scenarios_completed + score) / newTotal

      await supabase
        .from('progress')
        .update({
          skill_level: newLevel,
          total_scenarios_completed: newTotal,
          average_score: newAverage,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('progress').insert({
        user_id: userId,
        skill_name: skill,
        skill_level: points,
        total_scenarios_completed: 1,
        average_score: score
      })
    }
  }
}