"use client"

import { StudentSidebar } from "./student-sidebar"

interface StudentLayoutProps {
  children: React.ReactNode
  user: {
    username?: string
    participant_id?: string
  }
}

export function StudentLayout({ children, user }: StudentLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar user={user} />
      <div className="flex-1 w-full lg:ml-64">
        {children}
      </div>
    </div>
  )
}

