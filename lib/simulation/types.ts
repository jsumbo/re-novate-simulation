export interface SimulationContext {
  industry: string
  location: string
  businessStage: 'startup' | 'growth' | 'established'
  resources: {
    budget: number
    team_size: number
    time_constraint: string
  }
  market_conditions: string
  user_background: {
    career_path: string
    skill_level: number
    previous_decisions: string[]
  }
}

export interface SimulationScenario {
  id: string
  title: string
  context: string
  situation: string
  challenge: string
  stakeholders: string[]
  constraints: string[]
  success_metrics: string[]
  difficulty_level: number
  estimated_time: number
}

export interface SimulationOption {
  id: string
  text: string
  reasoning: string
  why_this_matters?: string
  immediate_consequences: string[]
  long_term_effects: string[]
  skill_development: Record<string, number>
  risk_level: 'low' | 'medium' | 'high'
  resource_impact: {
    budget_change: number
    time_required: string
    team_involvement: string[]
  }
}

export interface SimulationTask {
  id: string
  type: 'multiple_choice' | 'essay' | 'short_answer' | 'file_upload' | 'budget_allocation' | 'priority_ranking' | 'timeline_planning'
  title: string
  description: string
  required: boolean
  options?: SimulationOption[]
  constraints?: {
    max_length?: number
    min_length?: number
    word_limit?: number
    file_types?: string[]
    budget_limit?: number
    max_items?: number
  }
  prompt?: string // For essay and short answer questions
  evaluation_criteria?: string[] // What the AI should look for in essays
}

export interface SimulationResponse {
  scenario: SimulationScenario
  tasks: SimulationTask[]
  ai_context: string
  learning_objectives: string[]
  total_points: number
}

export interface SimulationResult {
  selected_option: SimulationOption
  outcome_description: string
  consequences: {
    immediate: string[]
    short_term: string[]
    long_term: string[]
  }
  skill_gains: Record<string, number>
  performance_score: number
  ai_feedback: DetailedFeedback
  next_scenario_context: string
}

export interface DetailedFeedback {
  overall_assessment: string
  decision_analysis: {
    strengths: string[]
    areas_for_improvement: string[]
    alternative_approaches: string[]
  }
  skill_development: {
    skills_demonstrated: Array<{
      skill: string
      level: 'beginner' | 'intermediate' | 'advanced'
      evidence: string
    }>
    skills_to_develop: Array<{
      skill: string
      why_important: string
      how_to_improve: string
    }>
  }
  real_world_examples: Array<{
    company: string
    situation: string
    outcome: string
    lesson: string
  }>
  learning_resources: {
    books: Array<{
      title: string
      author: string
      relevance: string
      key_chapters?: string[]
    }>
    articles: Array<{
      title: string
      url: string
      source: string
      summary: string
    }>
    videos: Array<{
      title: string
      url: string
      channel: string
      duration: string
      key_topics: string[]
    }>
    courses: Array<{
      title: string
      provider: string
      url: string
      level: 'beginner' | 'intermediate' | 'advanced'
      estimated_time: string
    }>
  }
  action_items: Array<{
    task: string
    priority: 'high' | 'medium' | 'low'
    timeline: string
    resources_needed: string[]
  }>
  reflection_questions: string[]
}