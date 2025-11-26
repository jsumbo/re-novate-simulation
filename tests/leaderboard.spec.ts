import { describe, it, expect } from 'vitest'
import { computeLeaderboardFromProgress } from '@/lib/supabase/community-database'

// Minimal mock rows similar to Supabase payload
const makeUser = (overrides: any = {}) => ({
  id: overrides.id || 'user-1',
  participant_id: overrides.participant_id || 'P-001',
  username: overrides.username,
  career_path: overrides.career_path || 'Business',
  created_at: overrides.created_at || '2025-11-01T00:00:00Z',
  schools: overrides.schools ?? [{ name: 'Test High' }],
  progress: overrides.progress ?? [
    { skill_name: 'decision_making', skill_level: 3, total_scenarios_completed: 5, average_score: '66.00' },
    { skill_name: 'teamwork', skill_level: 2, total_scenarios_completed: 4, average_score: '72.00' }
  ],
})

describe('computeLeaderboardFromProgress', () => {
  it('aggregates totals and picks top skill', () => {
    const users = [makeUser({ id: 'u1', participant_id: 'P1' })]
    const [entry] = computeLeaderboardFromProgress(users)
    expect(entry.id).toBe('u1')
    expect(entry.username).toBe('P1') // falls back to participant_id if username missing
    expect(entry.school_name).toBe('Test High')
    expect(entry.total_skill_points).toBe(5) // 3 + 2
    expect(entry.simulations_completed).toBe(9) // 5 + 4
    expect(entry.top_skill).toBe('decision making') // underscores replaced
    expect(entry.level).toBeGreaterThanOrEqual(1)
    expect(typeof entry.performance_score).toBe('number')
  })

  it('handles empty progress gracefully', () => {
    const users = [makeUser({ id: 'u2', progress: [] })]
    const [entry] = computeLeaderboardFromProgress(users)
    expect(entry.total_skill_points).toBe(0)
    expect(entry.simulations_completed).toBe(0)
    expect(entry.top_skill).toBe('Getting Started')
  })

  it('supports schools as object or array', () => {
    const arrayStyle = makeUser({ id: 'ua', schools: [{ name: 'Array School' }] })
    const objectStyle = makeUser({ id: 'uo', schools: { name: 'Object School' } })
    const entries = computeLeaderboardFromProgress([arrayStyle, objectStyle])
    const s1 = entries.find(e => e.id === 'ua')
    const s2 = entries.find(e => e.id === 'uo')
    expect(s1?.school_name).toBe('Array School')
    expect(s2?.school_name).toBe('Object School')
  })

  it('sorts primarily by simulations completed, then performance score, then skill points', () => {
    const uLow = makeUser({ id: 'low', progress: [{ skill_name: 'x', skill_level: 1, total_scenarios_completed: 1, average_score: '50.00' }] })
    const uHigh = makeUser({ id: 'high', progress: [{ skill_name: 'y', skill_level: 1, total_scenarios_completed: 10, average_score: '50.00' }] })
    const result = computeLeaderboardFromProgress([uLow, uHigh])
    expect(result[0].id).toBe('high')
    expect(result[1].id).toBe('low')
  })
})
