import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SimulationContext, SimulationScenario, SimulationOption } from '@/lib/simulation/types'

// Mock the OpenAI module
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}))

// Mock the feedback generator
vi.mock('@/lib/simulation/ai-feedback-generator', () => ({
  generateDetailedFeedback: vi.fn(),
}))

describe('AI Generator - Utility Functions', () => {
  const mockContext: SimulationContext = {
    industry: 'Technology',
    location: 'Monrovia, Liberia',
    businessStage: 'startup',
    resources: {
      budget: 10000,
      team_size: 4,
      time_constraint: '6 months',
    },
    market_conditions: 'competitive',
    user_background: {
      career_path: 'Technology & Innovation',
      skill_level: 50,
      previous_decisions: [],
    },
  }

  const mockScenario: SimulationScenario = {
    id: 'test-scenario-1',
    title: 'Tech Startup Challenge',
    context: 'A technology startup faces market competition',
    situation: 'Your startup needs to differentiate',
    challenge: 'How to stand out in a crowded market',
    stakeholders: ['investors', 'customers', 'team'],
    constraints: ['limited_budget', 'time_pressure'],
    success_metrics: ['user_acquisition', 'revenue'],
    difficulty_level: 3,
    estimated_time: 15,
  }

  const mockOption: SimulationOption = {
    id: 'option_1',
    text: 'Develop a creative solution leveraging new technology',
    reasoning: 'Innovation can differentiate your product',
    why_this_matters: 'This approach demonstrates strategic thinking',
    immediate_consequences: ['High resource consumption', 'Rapid team mobilization'],
    long_term_effects: ['Potential high returns', 'Market leadership position'],
    skill_development: {
      creativity: 3,
      problem_solving: 2,
    },
    risk_level: 'high',
    resource_impact: {
      budget_change: -2000,
      time_required: '3-4 months',
      team_involvement: ['development', 'marketing'],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Scenario Generation Logic', () => {
    it('should handle missing API key gracefully', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY

      // Import after deleting API key to test fallback
      const { generateSimulation } = await import('@/lib/simulation/ai-generator')
      
      const result = await generateSimulation(mockContext, [])
      
      expect(result).toBeDefined()
      expect(result.scenario).toBeDefined()
      expect(result.scenario.title).toBeDefined()
      expect(result.tasks).toBeDefined()
      expect(Array.isArray(result.tasks)).toBe(true)

      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey
      }
    })

    it('should generate simulation with valid context', async () => {
      const { generateSimulation } = await import('@/lib/simulation/ai-generator')
      
      const result = await generateSimulation(mockContext, [])
      
      expect(result).toHaveProperty('scenario')
      expect(result).toHaveProperty('tasks')
      expect(result).toHaveProperty('ai_context')
      expect(result).toHaveProperty('learning_objectives')
      expect(result).toHaveProperty('total_points')
      
      expect(result.scenario).toHaveProperty('title')
      expect(result.scenario).toHaveProperty('context')
      expect(result.scenario).toHaveProperty('challenge')
      expect(result.scenario.difficulty_level).toBeGreaterThanOrEqual(1)
      expect(result.scenario.difficulty_level).toBeLessThanOrEqual(5)
    })

    it('should avoid repeating scenarios from history', async () => {
      const { generateSimulation } = await import('@/lib/simulation/ai-generator')
      
      const history = [
        { scenarioType: 'Tech Startup Challenge', id: 'test-1' },
        { scenarioType: 'Funding Crisis', id: 'test-2' },
      ]
      
      const result = await generateSimulation(mockContext, history)
      
      // The generated scenario should not match history titles (case-insensitive)
      const historyTitles = history.map(h => h.scenarioType.toLowerCase())
      expect(historyTitles).not.toContain(result.scenario.title.toLowerCase())
    })

    it('should generate tasks with correct structure', async () => {
      const { generateSimulation } = await import('@/lib/simulation/ai-generator')
      
      const result = await generateSimulation(mockContext, [])
      
      expect(result.tasks.length).toBeGreaterThan(0)
      
      result.tasks.forEach(task => {
        expect(task).toHaveProperty('id')
        expect(task).toHaveProperty('type')
        expect(task).toHaveProperty('title')
        expect(task).toHaveProperty('description')
        expect(task).toHaveProperty('required')
        expect(typeof task.required).toBe('boolean')
      })
    })

    it('should calculate total points correctly', async () => {
      const { generateSimulation } = await import('@/lib/simulation/ai-generator')
      
      const result = await generateSimulation(mockContext, [])
      
      const expectedPoints = result.tasks.reduce(
        (sum, task) => sum + (task.required ? 20 : 10),
        0
      )
      
      expect(result.total_points).toBe(expectedPoints)
    })
  })

  describe('Performance Score Calculation', () => {
    it('should calculate score within valid range (0-100)', async () => {
      const { generateSimulationResult } = await import('@/lib/simulation/ai-generator')
      
      // Mock the feedback generator
      const { generateDetailedFeedback } = await import('@/lib/simulation/ai-feedback-generator')
      vi.mocked(generateDetailedFeedback).mockResolvedValue({
        overall_assessment: 'Good decision',
        decision_analysis: {
          strengths: [],
          areas_for_improvement: [],
          alternative_approaches: [],
        },
        skill_development: {
          skills_demonstrated: [],
          skills_to_develop: [],
        },
        real_world_examples: [],
        learning_resources: {
          books: [],
          articles: [],
          videos: [],
          courses: [],
        },
        action_items: [],
        reflection_questions: [],
      })

      const result = await generateSimulationResult(
        mockScenario,
        mockOption,
        mockContext,
        []
      )

      expect(result.performance_score).toBeGreaterThanOrEqual(0)
      expect(result.performance_score).toBeLessThanOrEqual(100)
    })

    it('should include all required result properties', async () => {
      const { generateSimulationResult } = await import('@/lib/simulation/ai-generator')
      
      const { generateDetailedFeedback } = await import('@/lib/simulation/ai-feedback-generator')
      vi.mocked(generateDetailedFeedback).mockResolvedValue({
        overall_assessment: 'Test feedback',
        decision_analysis: {
          strengths: [],
          areas_for_improvement: [],
          alternative_approaches: [],
        },
        skill_development: {
          skills_demonstrated: [],
          skills_to_develop: [],
        },
        real_world_examples: [],
        learning_resources: {
          books: [],
          articles: [],
          videos: [],
          courses: [],
        },
        action_items: [],
        reflection_questions: [],
      })

      const result = await generateSimulationResult(
        mockScenario,
        mockOption,
        mockContext,
        []
      )

      expect(result).toHaveProperty('selected_option')
      expect(result).toHaveProperty('outcome_description')
      expect(result).toHaveProperty('consequences')
      expect(result).toHaveProperty('skill_gains')
      expect(result).toHaveProperty('performance_score')
      expect(result).toHaveProperty('ai_feedback')
      expect(result).toHaveProperty('next_scenario_context')
      
      expect(result.consequences).toHaveProperty('immediate')
      expect(result.consequences).toHaveProperty('short_term')
      expect(result.consequences).toHaveProperty('long_term')
    })
  })

  describe('User Performance Calculation', () => {
    it('should return zeros for empty history', async () => {
      const { calculateUserPerformance } = await import('@/lib/simulation/ai-generator')
      
      const result = await calculateUserPerformance([])
      
      expect(result.averageScore).toBe(0)
      expect(result.strongSkills).toEqual([])
      expect(result.weakSkills).toEqual([])
    })

    it('should calculate average score correctly', async () => {
      const { calculateUserPerformance } = await import('@/lib/simulation/ai-generator')
      
      const history = [
        { feedback: { outcome_score: 80, skills_gained: { creativity: 2, problem_solving: 1 } } },
        { feedback: { outcome_score: 60, skills_gained: { creativity: 3, leadership: 4 } } },
        { feedback: { outcome_score: 70, skills_gained: { problem_solving: 2, leadership: 1 } } },
      ]
      
      const result = await calculateUserPerformance(history)
      
      // Average of 80, 60, 70 = 70
      expect(result.averageScore).toBe(70)
      expect(Array.isArray(result.strongSkills)).toBe(true)
      expect(Array.isArray(result.weakSkills)).toBe(true)
    })

    it('should identify strong and weak skills', async () => {
      const { calculateUserPerformance } = await import('@/lib/simulation/ai-generator')
      
      const history = [
        { feedback: { outcome_score: 80, skills_gained: { creativity: 5, problem_solving: 1 } } },
        { feedback: { outcome_score: 70, skills_gained: { creativity: 4, leadership: 2 } } },
        { feedback: { outcome_score: 60, skills_gained: { problem_solving: 1, leadership: 1 } } },
      ]
      
      const result = await calculateUserPerformance(history)
      
      // Creativity should be a strong skill (avg 4.5)
      expect(result.strongSkills.length).toBeGreaterThan(0)
      expect(result.weakSkills.length).toBeGreaterThan(0)
    })
  })

  describe('Difficulty Calculation', () => {
    it('should return a number between 1 and 5', async () => {
      const { calculateDifficulty } = await import('@/lib/simulation/ai-generator')
      
      const difficulty = await calculateDifficulty(mockContext, { averageScore: 0 })
      
      expect(typeof difficulty).toBe('number')
      expect(difficulty).toBeGreaterThanOrEqual(1)
      expect(difficulty).toBeLessThanOrEqual(5)
    })

    it('should increase difficulty for higher performance', async () => {
      const { calculateDifficulty } = await import('@/lib/simulation/ai-generator')
      
      const lowPerf = await calculateDifficulty(mockContext, { averageScore: 30 })
      const highPerf = await calculateDifficulty(mockContext, { averageScore: 90 })
      
      expect(highPerf).toBeGreaterThanOrEqual(lowPerf)
    })

    it('should adjust difficulty based on business stage', async () => {
      const { calculateDifficulty } = await import('@/lib/simulation/ai-generator')
      
      const startupContext = { ...mockContext, businessStage: 'startup' as const }
      const establishedContext = { ...mockContext, businessStage: 'established' as const }
      
      const startupDiff = await calculateDifficulty(startupContext, { averageScore: 50 })
      const establishedDiff = await calculateDifficulty(establishedContext, { averageScore: 50 })
      
      expect(typeof startupDiff).toBe('number')
      expect(typeof establishedDiff).toBe('number')
      // Established businesses typically have higher difficulty
      expect(establishedDiff).toBeGreaterThanOrEqual(startupDiff)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid context gracefully', async () => {
      const { generateSimulation } = await import('@/lib/simulation/ai-generator')
      
      const invalidContext = {
        ...mockContext,
        resources: {
          budget: -1000, // Invalid budget
          team_size: 0,
          time_constraint: '',
        },
      }
      
      // Should still generate something (fallback to templates)
      const result = await generateSimulation(invalidContext, [])
      expect(result).toBeDefined()
      expect(result.scenario).toBeDefined()
    })

    it('should handle empty user history', async () => {
      const { generateSimulation } = await import('@/lib/simulation/ai-generator')
      
      const result = await generateSimulation(mockContext, [])
      
      expect(result).toBeDefined()
      expect(result.scenario).toBeDefined()
      expect(result.tasks.length).toBeGreaterThan(0)
    })
  })
})


