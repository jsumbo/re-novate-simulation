import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn helper', () => {
  it('merges class names and removes duplicates', () => {
    const out = cn('btn', 'btn-primary', 'text-center', 'btn')
    expect(out).toContain('btn')
    expect(out).toContain('btn-primary')
    expect(out).toContain('text-center')
  })

  it('handles falsy values gracefully', () => {
    const out = cn('a', undefined as any, false as any, 'b')
    expect(out).toContain('a')
    expect(out).toContain('b')
  })
})
