"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Target, LogOut, Search, Trophy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logout } from "@/lib/auth/actions"
import Link from "next/link"
import { StudentLayout } from "./student-layout"

export interface CommunityStudent {
  id: string
  username: string
  career_path: string
  school_name: string
  total_skill_points: number
  level: number
  top_skill: string
  simulations_completed: number
  joined_date: string
  last_active: string
}

interface CommunityPageProps {
  user: any
  initialData?: {
    students: CommunityStudent[]
    leaderboard: CommunityStudent[]
  }
}

export function CommunityPage({ user, initialData }: CommunityPageProps) {
  const [students] = useState<CommunityStudent[]>(initialData?.students || [])
  const [leaderboard] = useState<CommunityStudent[]>(initialData?.leaderboard || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading] = useState(!initialData)

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.career_path.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLeaderboard = leaderboard.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.career_path.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <StudentLayout user={user}>
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold">Community</h1>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students by name or career path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students List
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            {/* Students List Tab */}
            <TabsContent value="students" className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-black text-white">
                              {student.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{student.username}</h3>
                            <p className="text-gray-600">{student.school_name}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-2">
                              {student.career_path}
                            </Badge>
                            <p className="text-sm text-gray-500">
                              Joined {new Date(student.joined_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredStudents.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      {searchTerm ? (
                        <div>
                          <p className="text-gray-500 mb-2">No students found matching "{searchTerm}"</p>
                          <p className="text-gray-400 text-sm">Try searching with different keywords</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 mb-2">No students in your community yet</p>
                          <p className="text-gray-400 text-sm">Students will appear here as they join your school</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading leaderboard...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeaderboard.map((student, index) => (
                    <Card key={student.id} className="border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              'bg-black text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-gray-100">
                                {student.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{student.username}</h3>
                            <p className="text-gray-600">{student.school_name}</p>
                            <Badge variant="outline" className="mt-1">
                              {student.career_path}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-black">
                              {student.simulations_completed}
                            </div>
                            <p className="text-sm text-gray-500">
                              Scenarios Completed
                            </p>
                            {student.simulations_completed === 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Getting started
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredLeaderboard.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      {searchTerm ? (
                        <div>
                          <p className="text-gray-500 mb-2">No students found matching "{searchTerm}"</p>
                          <p className="text-gray-400 text-sm">Try searching with different keywords</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 mb-2">No leaderboard data available yet</p>
                          <p className="text-gray-400 text-sm">Complete some scenarios to see rankings!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StudentLayout>
  )
}