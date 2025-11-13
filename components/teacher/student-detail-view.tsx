"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { 
  User, 
  Calendar, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Target,
  Clock,
  Star,
  ArrowLeft
} from "lucide-react"

interface StudentDetailViewProps {
  student: any
  sessions: any[]
  decisions: any[]
  progress: any[]
  onBack: () => void
}

export function StudentDetailView({ 
  student, 
  sessions, 
  decisions, 
  progress, 
  onBack 
}: StudentDetailViewProps) {
  // Filter data for this specific student
  const studentSessions = sessions.filter(s => s.user_id === student.id)
  const studentDecisions = decisions.filter(d => d.user_id === student.id)
  const studentProgress = progress.filter(p => p.user_id === student.id)

  // Calculate student metrics
  const completedSessions = studentSessions.filter(s => s.status === "completed").length
  const inProgressSessions = studentSessions.filter(s => s.status === "in_progress").length
  const totalDecisions = studentDecisions.length
  const avgScore = totalDecisions > 0 
    ? Math.round(studentDecisions.reduce((sum, d) => sum + d.outcome_score, 0) / totalDecisions)
    : 0

  // Skills data
  const skillsData = studentProgress.reduce((acc, p) => {
    const skill = p.skill_name.replace(/_/g, " ")
    acc[skill] = p.skill_level
    return acc
  }, {} as Record<string, number>)

  const skillsChartData = Object.entries(skillsData).map(([skill, level]) => ({
    skill,
    level
  }))

  // Performance over time
  const performanceData = studentDecisions
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((decision, index) => ({
      decision: index + 1,
      score: decision.outcome_score,
      date: new Date(decision.created_at).toLocaleDateString()
    }))

  // Recent activity
  const recentActivity = [
    ...studentSessions.map(s => ({
      type: 'session',
      action: s.status === 'completed' ? 'Completed session' : 'Started session',
      date: s.created_at,
      status: s.status
    })),
    ...studentDecisions.map(d => ({
      type: 'decision',
      action: `Made decision (Score: ${d.outcome_score})`,
      date: d.created_at,
      score: d.outcome_score
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.full_name || student.participant_id}
            </h1>
            <p className="text-gray-600">{student.career_path || "No career path selected"}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-xl font-bold">{studentSessions.length}</p>
                <p className="text-xs text-gray-500">{completedSessions} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-gray-600">Decisions</p>
                <p className="text-xl font-bold">{totalDecisions}</p>
                <p className="text-xs text-gray-500">Total made</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className={`text-xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</p>
                <p className="text-xs text-gray-500">Out of 100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Skills</p>
                <p className="text-xl font-bold">{Object.keys(skillsData).length}</p>
                <p className="text-xs text-gray-500">Developed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Participant ID:</span>
                  <span className="font-medium">{student.participant_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{student.full_name || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Career Path:</span>
                  <span className="font-medium">{student.career_path || "Not selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium">
                    {new Date(student.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={inProgressSessions > 0 ? "default" : "secondary"}>
                    {inProgressSessions > 0 ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>Overall engagement and completion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Session Completion</span>
                    <span className="text-sm font-medium">
                      {studentSessions.length > 0 ? Math.round((completedSessions / studentSessions.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={studentSessions.length > 0 ? (completedSessions / studentSessions.length) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Average Performance</span>
                    <span className="text-sm font-medium">{avgScore}/100</span>
                  </div>
                  <Progress value={avgScore} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Sessions:</span>
                      <span className="ml-2 font-medium">{studentSessions.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Decisions Made:</span>
                      <span className="ml-2 font-medium">{totalDecisions}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest learning activities and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'session' 
                          ? getStatusColor(activity.status || 'default')
                          : 'bg-purple-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString()} at{' '}
                          {new Date(activity.date).toLocaleTimeString()}
                        </p>
                      </div>
                      {activity.score && (
                        <Badge variant="outline" className={getScoreColor(activity.score)}>
                          {activity.score}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Track decision-making scores across sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="decision" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => `Decision ${value}`}
                      formatter={(value: any, name) => [value, 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#059669" 
                      strokeWidth={2}
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No performance data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Development</CardTitle>
              <CardDescription>Current skill levels across different areas</CardDescription>
            </CardHeader>
            <CardContent>
              {skillsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="skill" type="category" width={120} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="level" fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No skill data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Skills */}
          {Object.keys(skillsData).length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(skillsData).map(([skill, level]) => (
                <Card key={skill}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium capitalize">{skill}</h4>
                      <span className="text-sm font-bold">{level}</span>
                    </div>
                    <Progress value={level} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Activity Log</CardTitle>
              <CardDescription>Complete history of student interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="border-l-4 border-emerald-200 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{activity.action}</h4>
                        {activity.score && (
                          <Badge variant="outline" className={getScoreColor(activity.score)}>
                            Score: {activity.score}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No activity recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}