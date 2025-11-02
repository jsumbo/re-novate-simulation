import '@testing-library/jest-dom'
import { expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

// Extend expect with accessibility matcher
expect.extend({ toHaveNoViolations })

// Provide a minimal global Image for jsdom if not available
if (typeof (globalThis as any).Image === 'undefined') {
  // @ts-ignore
  globalThis.Image = class {
    src = ''
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set srcset(_v: string) {
      // no-op
    }
  }
}
