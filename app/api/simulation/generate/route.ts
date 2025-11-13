import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateSimulation } from '@/lib/simulation/ai-generator'
import type { SimulationContext } from '@/lib/simulation/types'

function mapSkillLevel(level?: string | null): number {
  if (!level) return 40
  const normalized = level.toLowerCase()
  if (normalized.includes('advanced')) return 80
  if (normalized.includes('intermediate')) return 60
  return 30
}

function buildDefaultContext(careerPath: string, round: number): SimulationContext {
  return {
    industry: 'Technology',
    location: 'Monrovia, Liberia',
    businessStage: round <= 2 ? 'startup' : round <= 4 ? 'growth' : 'established',
    resources: {
      budget: 5000 + round * 2000,
      team_size: Math.min(2 + round, 10),
      time_constraint: '2-3 months',
    },
    market_conditions: 'emerging market with growth potential',
    user_background: {
      career_path: careerPath,
      skill_level: round * 20,
      previous_decisions: [],
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      careerPath: rawCareerPath,
      round = 1,
      excludeScenarioIds = [],
      excludeScenarioTitles = [],
    } = await request.json()

    const careerPath = rawCareerPath || 'CEO'

    const supabase = await getSupabaseServerClient()

    let context: SimulationContext = buildDefaultContext(careerPath, round)
    let userHistory: Array<{
      scenarioType: string
      selectedOption?: string
      feedback?: { outcome_score?: number; skills_gained?: Record<string, number> }
    }> = []

    if (supabase && userId) {
      const { data: userProfile } = await supabase
        .from('student_profiles')
        .select('skill_level, preferences')
        .eq('user_id', userId)
        .single()

      const { data: user } = await supabase
        .from('users')
        .select('career_path, industry, location')
        .eq('id', userId)
        .single()

      const skillLevel = mapSkillLevel(userProfile?.skill_level)
      const industry = (userProfile?.preferences as any)?.industry || user?.industry || 'Technology'
      const location = user?.location || 'Monrovia, Liberia'
      const businessStage = round <= 2 ? 'startup' : round <= 4 ? 'growth' : 'established'

      const { data: decisions } = await supabase
        .from('decisions')
        .select('scenario_id, selected_option, outcome_score, skills_gained')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      const scenarioIds = (decisions || [])
        .map((d) => d.scenario_id)
        .filter((id): id is string => Boolean(id))

      const scenarioTitleMap: Record<string, string> = {}

      if (scenarioIds.length > 0) {
        const { data: storedGenerated } = await supabase
          .from('generated_scenarios')
          .select('id, scenario_data')
          .in('id', scenarioIds)

        storedGenerated?.forEach((item) => {
          const title =
            (item.scenario_data as any)?.scenario?.title ||
            (item.scenario_data as any)?.title
          if (title) {
            scenarioTitleMap[item.id] = title
          }
        })

        const { data: storedScenarios } = await supabase
          .from('scenarios')
          .select('id, title')
          .in('id', scenarioIds)

        storedScenarios?.forEach((item) => {
          if (item.title) {
            scenarioTitleMap[item.id] = item.title
          }
        })
      }

      userHistory = (decisions || []).map((decision) => ({
        scenarioType: scenarioTitleMap[decision.scenario_id as string] || decision.scenario_id || 'unknown',
        selectedOption: decision.selected_option || undefined,
        feedback: {
          outcome_score: decision.outcome_score || undefined,
          skills_gained: (decision.skills_gained as Record<string, number>) || undefined,
        },
      }))

      context = {
        industry,
        location,
        businessStage,
        resources: {
          budget: 5000 + round * 2000,
          team_size: Math.min(2 + round, 10),
          time_constraint: '2-3 months',
        },
        market_conditions:
          (userProfile?.preferences as any)?.market_conditions || 'emerging market with growth potential',
        user_background: {
          career_path: user?.career_path || careerPath,
          skill_level: skillLevel,
          previous_decisions: (decisions || [])
            .map((decision) => decision.selected_option || '')
            .filter(Boolean),
        },
      }
    }

    let simulation = await generateSimulation(context, userHistory)

    const usedTitles = new Set([
      ...excludeScenarioTitles,
      ...userHistory.map((history) => history.scenarioType),
    ])

    let attempts = 0
    while (usedTitles.has(simulation.scenario.title) && attempts < 3) {
      simulation = await generateSimulation(context, userHistory)
      attempts += 1
    }

    if (excludeScenarioIds.includes(simulation.scenario.id)) {
      simulation.scenario.id = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }

    return NextResponse.json({
      success: true,
      simulation,
      context,
    })
  } catch (error) {
    console.error('Error generating simulation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate simulation scenario',
      },
      { status: 500 },
    )
  }
}
