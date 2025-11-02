import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, vi, expect } from 'vitest'
import { HeroSection } from '@/components/landing/HeroSection'

describe('HeroSection', () => {
  it('renders title, subtitle and invokes callbacks on CTA clicks', async () => {
    const onStudent = vi.fn()
    const onFac = vi.fn()

    render(
      <HeroSection
        backgroundImage="/referrals-landing.jpg"
        title="Test Title"
        subtitle="Test subtitle"
        features={[]}
        onStudentClick={onStudent}
        onFacilitatorClick={onFac}
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test subtitle')).toBeInTheDocument()

    // The buttons use aria-labels for accessibility; match those exact accessible names.
    const studentBtn = screen.getByRole('button', { name: /Get started as a student user/i })
    await userEvent.click(studentBtn)
    expect(onStudent).toHaveBeenCalled()

    const facBtn = screen.getByRole('button', { name: /Access facilitator dashboard/i })
    await userEvent.click(facBtn)
    expect(onFac).toHaveBeenCalled()
  })
})
