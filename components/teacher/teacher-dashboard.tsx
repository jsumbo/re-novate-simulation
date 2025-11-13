"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, TrendingUp, Award, Download, BookOpen, LogOut, LayoutDashboard, FileText } from "lucide-react"
import { exportToCSV } from "@/lib/teacher/export"
import { FacilitatorNavSidebar } from "./facilitator-nav-sidebar"
import { facilitatorLogoutAction } from "@/lib/auth/facilitator-server-actions"

interface FacilitatorDashboardProps {
  user: any
  students: any[]
  sessions: any[]
  decisions: any[]
  progress: any[]
}

const COLORS = ["#059669", "#0d9488", "#06b6d4", "#14b8a6", "#10b981"]

export function FacilitatorDashboard({ user, students, sessions, decisions, progress }: FacilitatorDashboardProps) {
  const [activeView, setActiveView] = useState("dashboard")
  // Calculate statistics
  const totalStudents = students.length
  const activeStudents = new Set(sessions.filter((s) => s.status === "in_progress").map((s) => s.user_id)).size
  const completedSessions = sessions.filter((s) => s.status === "completed").length
  const averageScore =
    decisions.length > 0 ? Math.round(decisions.reduce((sum, d) => sum + d.outcome_score, 0) / decisions.length) : 0

  // Career path distribution
  const careerDistribution = students.reduce(
    (acc, student) => {
      if (student.career_path) {
        acc[student.career_path] = (acc[student.career_path] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const careerData = Object.entries(careerDistribution).map(([name, value]) => ({
    name,
    value,
  }))

  // Top skills across all students
  const skillAggregation = progress.reduce(
    (acc, p) => {
      const skill = p.skill_name.replace(/_/g, " ")
      acc[skill] = (acc[skill] || 0) + p.skill_level
      return acc
    },
    {} as Record<string, number>,
  )

  const topSkillsData = Object.entries(skillAggregation)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([skill, total]) => ({
      skill,
      total,
    }))

  // Student performance data
  const studentPerformance = students
    .map((student) => {
      const studentDecisions = decisions.filter((d) => d.user_id === student.id)
      const avgScore =
        studentDecisions.length > 0
          ? Math.round(studentDecisions.reduce((sum, d) => sum + d.outcome_score, 0) / studentDecisions.length)
          : 0
      const totalSessions = sessions.filter((s) => s.user_id === student.id).length

      return {
        participant_id: student.participant_id,
        career_path: student.career_path || "Not selected",
        sessions: totalSessions,
        decisions: studentDecisions.length,
        average_score: avgScore,
      }
    })
    .sort((a, b) => b.average_score - a.average_score)

  const handleExportCSV = () => {
    exportToCSV(studentPerformance, `${user.schools?.name}_student_data`)
  }

  const renderMainContent = () => {
    switch (activeView) {
      case "students":
        return renderStudentsView()
      case "sessions":
        return renderSessionsView()
      case "performance":
        return renderPerformanceView()
      case "reports":
        return renderReportsView()
      default:
        return renderDashboardView()
    }
  }

  const renderDashboardView = () => (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facilitator Dashboard</h1>
          <p className="text-gray-700">{user.school?.name}</p>
          <p className="text-sm text-gray-600 mt-1">Supporting {totalStudents} students in their entrepreneurship journey</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card className="border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Students</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{totalStudents}</div>
            <p className="text-xs text-gray-600 mt-1">{activeStudents} currently active</p>
          </CardContent>
        </Card>

        <Card className="border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Completed Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-900">{completedSessions}</div>
            <p className="text-xs text-gray-600 mt-1">Across all students</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Class Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-900">{averageScore}</div>
            <p className="text-xs text-gray-600 mt-1">Out of 100</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Decisions</CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{decisions.length}</div>
            <p className="text-xs text-gray-600 mt-1">Scenarios completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="insights">Student Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Career Path Distribution */}
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle>Career Path Distribution</CardTitle>
                <CardDescription>Student career choices across your class</CardDescription>
              </CardHeader>
              <CardContent>
                {careerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={careerData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {careerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No career selections yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Skills */}
            <Card className="border-teal-200">
              <CardHeader>
                <CardTitle>Top Skills Developed</CardTitle>
                <CardDescription>Most practiced skills across all students</CardDescription>
              </CardHeader>
              <CardContent>
                {topSkillsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSkillsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="skill" type="category" width={120} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#0d9488" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No skill data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle>Recent Student Activity</CardTitle>
              <CardDescription>Latest decisions made by your students</CardDescription>
            </CardHeader>
            <CardContent>
              {decisions.length > 0 ? (
                <div className="space-y-3">
                  {decisions.slice(0, 10).map((decision) => (
                    <div
                      key={decision.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-emerald-700">{decision.outcome_score}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{decision.users?.participant_id}</p>
                          <p className="text-sm text-gray-600">{decision.users?.career_path}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-wrap gap-1 justify-end mb-1">
                          {Object.keys(decision.skills_gained || {}).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{new Date(decision.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No student activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card className="border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Performance Table</CardTitle>
                <CardDescription>Detailed performance metrics for each student</CardDescription>
              </div>
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {studentPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Participant ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Career Path</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Sessions</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Decisions</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentPerformance.map((student, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{student.participant_id}</td>
                          <td className="py-3 px-4 text-gray-700">{student.career_path}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{student.sessions}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{student.decisions}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={student.average_score >= 70 ? "default" : "secondary"}
                              className={student.average_score >= 70 ? "bg-emerald-600" : ""}
                            >
                              {student.average_score}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No student data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle>Skill Development Over Time</CardTitle>
              <CardDescription>Track how your class develops entrepreneurial skills</CardDescription>
            </CardHeader>
            <CardContent>
              {topSkillsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topSkillsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" angle={-45} textAnchor="end" height={120} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No skill development data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual skill breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSkillsData.slice(0, 6).map((skill) => (
              <Card key={skill.skill} className="border-teal-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{skill.skill}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-900">{skill.total}</div>
                  <p className="text-xs text-gray-600 mt-1">Total points earned</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Student Engagement Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle>Student Engagement Levels</CardTitle>
                <CardDescription>Based on session completion and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.slice(0, 10).map((student) => {
                    const studentSessions = sessions.filter(s => s.user_id === student.id)
                    const completedSessions = studentSessions.filter(s => s.status === 'completed').length
                    const engagementLevel = studentSessions.length === 0 ? 0 : Math.round((completedSessions / studentSessions.length) * 100)
                    
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-700">
                              {student.participant_id?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.participant_id}</p>
                            <p className="text-sm text-gray-600">{student.career_path || 'No path selected'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={engagementLevel >= 70 ? "default" : engagementLevel >= 40 ? "secondary" : "outline"}
                            className={engagementLevel >= 70 ? "bg-emerald-600" : engagementLevel >= 40 ? "bg-yellow-500" : "bg-red-100 text-red-800"}
                          >
                            {engagementLevel}% engaged
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {completedSessions}/{studentSessions.length} sessions
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-teal-200">
              <CardHeader>
                <CardTitle>Learning Recommendations</CardTitle>
                <CardDescription>AI-powered insights for your students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Focus Areas</h4>
                    <p className="text-sm text-blue-800">
                      Students are excelling in {topSkillsData[0]?.skill || 'leadership'} but need more practice in financial literacy and strategic thinking.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Success Patterns</h4>
                    <p className="text-sm text-green-800">
                      Students with {Math.round(averageScore)}+ average scores tend to complete scenarios in collaborative learning environments.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-2">⚠️ At-Risk Students</h4>
                    <p className="text-sm text-amber-800">
                      {students.filter(s => {
                        const studentDecisions = decisions.filter(d => d.user_id === s.id)
                        const avgScore = studentDecisions.length > 0 ? studentDecisions.reduce((sum, d) => sum + d.outcome_score, 0) / studentDecisions.length : 0
                        return avgScore < 50
                      }).length} students may need additional support or different learning approaches.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Progress Timeline */}
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle>Class Progress Over Time</CardTitle>
              <CardDescription>Track your class's learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-900">{Math.round((completedSessions / Math.max(sessions.length, 1)) * 100)}%</div>
                    <p className="text-sm text-emerald-700">Session Completion Rate</p>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-900">{Math.round(decisions.length / Math.max(students.length, 1))}</div>
                    <p className="text-sm text-teal-700">Avg Decisions per Student</p>
                  </div>
                  <div className="text-center p-4 bg-cyan-50 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-900">{activeStudents}</div>
                    <p className="text-sm text-cyan-700">Currently Active Students</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderStudentsView = () => (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage and monitor your students</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>All students from your school</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Full Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Participant ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Career Path</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Sessions</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentSessions = sessions.filter(s => s.user_id === student.id)
                    const hasActiveSessions = studentSessions.some(s => s.status === "in_progress")
                    
                    return (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {student.full_name || "Not provided"}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{student.participant_id}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {student.career_path || "Not selected"}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {studentSessions.length}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={hasActiveSessions ? "default" : "secondary"}>
                            {hasActiveSessions ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No students found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderSessionsView = () => (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Learning Sessions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Session Overview</CardTitle>
          <CardDescription>Track all learning sessions across your students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Session management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPerformanceView = () => (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Performance Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Student Performance</CardTitle>
          <CardDescription>Detailed performance metrics and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Performance analytics coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderReportsView = () => (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports & Export</h1>
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>Export student data and generate reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleExportCSV} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Student Performance Data
            </Button>
            <div className="text-center py-8 text-gray-500">
              <p>More report options coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )



  return (
    <div className="flex h-screen bg-white">
      {/* Navigation Sidebar */}
      <FacilitatorNavSidebar
        user={user}
        students={students}
        sessions={sessions}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">RE-Novate</h2>
              <p className="text-sm text-gray-600">{user.school?.name}</p>
            </div>
            <form action={facilitatorLogoutAction}>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "students", label: "Students", icon: Users },
              { id: "sessions", label: "Sessions", icon: BookOpen },
              { id: "performance", label: "Performance", icon: TrendingUp },
              { id: "reports", label: "Reports", icon: FileText }
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={`whitespace-nowrap text-xs ${
                    isActive 
                      ? "bg-black text-white hover:bg-gray-800" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>

        {renderMainContent()}
      </div>
    </div>
  )
}
