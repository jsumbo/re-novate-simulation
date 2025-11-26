"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Target, Play, Users, LogOut, MessageSquare } from "lucide-react"
import { logout } from "@/lib/auth/actions"

interface StudentSidebarProps {
  user: {
    username?: string
    participant_id?: string
  }
}

export function StudentSidebar({ user }: StudentSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex w-64 bg-black text-white p-6 flex-col h-screen fixed left-0 top-0">
      <div className="mb-8">
        <h2 className="text-xl font-bold">RE-Novate</h2>
        <p className="text-gray-400 text-sm">{user.username || user.participant_id}</p>
      </div>

      <nav className="flex-1 space-y-2">
        <Link
          href="/student/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded ${
            pathname === '/student/dashboard'
              ? 'bg-white text-black font-medium'
              : 'hover:bg-gray-800 text-gray-300 hover:text-white'
          }`}
        >
          <Target className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/student/simulations"
          className={`flex items-center gap-3 px-3 py-2 rounded ${
            pathname === '/student/simulations' || pathname === '/student/simulation' || pathname === '/student/scenario'
              ? 'bg-white text-black font-medium'
              : 'hover:bg-gray-800 text-gray-300 hover:text-white'
          }`}
        >
          <Play className="h-4 w-4" />
          Simulations
        </Link>
        <Link
          href="/student/profile"
          className={`flex items-center gap-3 px-3 py-2 rounded ${
            pathname === '/student/profile'
              ? 'bg-white text-black font-medium'
              : 'hover:bg-gray-800 text-gray-300 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/student/community"
          className={`flex items-center gap-3 px-3 py-2 rounded ${
            pathname === '/student/community'
              ? 'bg-white text-black font-medium'
              : 'hover:bg-gray-800 text-gray-300 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Community
        </Link>
        <Link
          href="/student/mentor"
          className={`flex items-center gap-3 px-3 py-2 rounded ${
            pathname === '/student/mentor'
              ? 'bg-white text-black font-medium'
              : 'hover:bg-gray-800 text-gray-300 hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Noni
        </Link>
      </nav>

      <form action={logout} className="mt-auto">
        <button className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white w-full text-left">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </form>
    </div>
  )
}

