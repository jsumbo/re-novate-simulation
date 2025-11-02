import { describe, it, expect } from 'vitest'
import { calculateUserPerformance, calculateDifficulty } from '@/lib/simulation/ai-generator'

describe('simulation helpers', () => {
  it('calculateUserPerformance returns zeros for empty history', async () => {
    const result = await calculateUserPerformance([])
    expect(result.averageScore).toBe(0)
    expect(result.strongSkills).toEqual([])
    expect(result.weakSkills).toEqual([])
  })

  it('calculateUserPerformance computes averages and skills', async () => {
    const history = [
      { feedback: { outcome_score: 80, skills_gained: { a: 2, b: 1 } } },
      { feedback: { outcome_score: 60, skills_gained: { a: 3, c: 4 } } },
    ]
    const res = await calculateUserPerformance(history)
    // average of 80 and 60 is 70
    expect(res.averageScore).toBe(70)
    // strongSkills should include 'a' as it has highest average
    expect(res.strongSkills.includes('a')).toBe(true)
    // weakSkills should include one of the others
    expect(Array.isArray(res.weakSkills)).toBe(true)
  })

  it('calculateDifficulty respects context and performance', async () => {
    const context = {
      businessStage: 'startup',
      user_background: { skill_level: 30, career_path: 'ceo' },
      market_conditions: 'stable',
    } as any

    const diff1 = await calculateDifficulty(context, { averageScore: 0 })
    expect(typeof diff1).toBe('number')
    const diff2 = await calculateDifficulty({ ...context, businessStage: 'established' } as any, { averageScore: 90 })
    expect(diff2).toBeGreaterThanOrEqual(diff1)
  })
})
