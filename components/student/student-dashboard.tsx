"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  TrendingUp,
  Award,
  Target,
  PlayCircle,
  LogOut,
  Clock,
  Briefcase,
  Code,
  Megaphone,
  DollarSign,
  Settings,
  Users,
  Lightbulb,
  Zap,
  Trophy,
  Flame,
  ArrowRight,
  Play,
  Scale,
  Palette,
  Heart,
  GraduationCap,
  Leaf,
} from "lucide-react"
import { logout } from "@/lib/auth/actions"
import { StudentLayout } from "./student-layout"

interface StudentDashboardProps {
  user: any
  progress: any[]
  sessions: any[]
  stats: {
    totalSessions: number
    completedSessions: number
    averageScore: number
  }
}

// Generate personalized welcome messages based on career path and progress
function generateCareerWelcomeMessage(careerPath: string, careerInfo: any, totalSkillPoints: number) {
  const careerMessages = {
    "Business & Management": {
      new: "Future Business Leader • Your entrepreneurial journey starts here!",
      returning: "Business Leader in Training • Building your strategic leadership skills",
      advanced: "Developing Business Leader • Mastering the art of executive decision-making"
    },
    "Technology & Innovation": {
      new: "Future Tech Innovator • Your technology leadership adventure begins!",
      returning: "Tech Leader • Driving innovation through technology",
      advanced: "Senior Tech Leader • Shaping the future of digital transformation"
    },
    "Marketing & Sales": {
      new: "Future Marketing Leader • Your brand-building journey starts now!",
      returning: "Marketing Strategist • Creating connections that matter",
      advanced: "Marketing Expert • Mastering the art of customer engagement"
    },
    "Finance & Economics": {
      new: "Future Finance Leader • Your numbers-driven journey begins!",
      returning: "Financial Strategist • Managing resources for growth",
      advanced: "Finance Expert • Mastering the science of business growth"
    },
    "Law & Ethics": {
      new: "Future Ethics Leader • Your justice-driven journey starts here!",
      returning: "Ethics Advocate • Championing fairness and integrity",
      advanced: "Ethics Expert • Mastering the art of ethical leadership"
    },
    "Arts & Creativity": {
      new: "Future Creative Leader • Your artistic journey begins!",
      returning: "Creative Strategist • Inspiring through innovation",
      advanced: "Creative Expert • Mastering the art of creative expression"
    },
    "Health & Well-Being": {
      new: "Future Wellness Leader • Your health advocacy journey starts!",
      returning: "Wellness Champion • Promoting health and well-being",
      advanced: "Wellness Expert • Mastering the science of human flourishing"
    },
    "Education & Training": {
      new: "Future Education Leader • Your teaching journey begins!",
      returning: "Learning Facilitator • Empowering through knowledge",
      advanced: "Education Expert • Mastering the art of transformative learning"
    },
    "Environment & Sustainability": {
      new: "Future Sustainability Leader • Your green journey starts here!",
      returning: "Environmental Champion • Building a sustainable future",
      advanced: "Sustainability Expert • Mastering the science of environmental stewardship"
    },
    // Legacy support
    ceo: {
      new: "Future Business Leader • Your entrepreneurial journey starts here!",
      returning: "Business Leader in Training • Building your strategic leadership skills",
      advanced: "Developing Business Leader • Mastering the art of executive decision-making"
    },
    cto: {
      new: "Future Tech Innovator • Your technology leadership adventure begins!",
      returning: "Tech Leader • Driving innovation through technology",
      advanced: "Senior Tech Leader • Shaping the future of digital transformation"
    },
    marketing: {
      new: "Future Marketing Leader • Your brand-building journey starts now!",
      returning: "Marketing Strategist • Creating connections that matter",
      advanced: "Marketing Expert • Mastering the art of customer engagement"
    },
    finance: {
      new: "Future Finance Leader • Your numbers-driven journey begins!",
      returning: "Financial Strategist • Managing resources for growth",
      advanced: "Finance Expert • Mastering the science of business growth"
    }
  };

  // Determine experience level based on skill points
  let experienceLevel: 'new' | 'returning' | 'advanced';
  if (totalSkillPoints === 0) {
    experienceLevel = 'new';
  } else if (totalSkillPoints < 100) {
    experienceLevel = 'returning';
  } else {
    experienceLevel = 'advanced';
  }

  // Get the appropriate message for the career path, fallback to Business & Management if not found
  const messages = careerMessages[careerPath as keyof typeof careerMessages] || careerMessages["Business & Management"];
  return messages[experienceLevel];
}

export function StudentDashboard({ user, progress, sessions, stats }: StudentDashboardProps) {
  const pathname = usePathname()

  // Prepare chart data
  const skillsData = progress.map((p) => ({
    skill: p.skill_name.replace(/_/g, " "),
    level: p.skill_level,
  }))

  const radarData = progress.slice(0, 6).map((p) => ({
    skill: p.skill_name.replace(/_/g, " "),
    value: Math.min(p.skill_level, 100),
  }))

  const hasActiveSession = sessions.some((s) => s.status === "in_progress")

  const careerPaths = {
    // Handle onboarding career paths (actual database values)
    "Business & Management": {
      icon: Briefcase,
      title: "Business Leader",
      color: "emerald",
      description: "Leading with vision and strategy",
      focus: "Strategic leadership and business growth",
    },
    "Technology & Innovation": {
      icon: Code,
      title: "Tech Innovator",
      color: "blue",
      description: "Innovating through technology",
      focus: "Technical innovation and digital transformation",
    },
    "Marketing & Sales": {
      icon: Megaphone,
      title: "Marketing Leader",
      color: "purple",
      description: "Building brands and customer connections",
      focus: "Brand development and market positioning",
    },
    "Finance & Economics": {
      icon: DollarSign,
      title: "Finance Leader",
      color: "green",
      description: "Managing resources and growth",
      focus: "Financial planning and resource optimization",
    },
    "Law & Ethics": {
      icon: Scale,
      title: "Ethics Leader",
      color: "blue",
      description: "Championing fairness and justice",
      focus: "Ethical decision-making and legal compliance",
    },
    "Arts & Creativity": {
      icon: Palette,
      title: "Creative Leader",
      color: "pink",
      description: "Inspiring through creative expression",
      focus: "Creative strategy and artistic innovation",
    },
    "Health & Well-Being": {
      icon: Heart,
      title: "Wellness Leader",
      color: "red",
      description: "Promoting health and well-being",
      focus: "Health advocacy and wellness programs",
    },
    "Education & Training": {
      icon: GraduationCap,
      title: "Education Leader",
      color: "yellow",
      description: "Empowering through knowledge",
      focus: "Learning and development strategies",
    },
    "Environment & Sustainability": {
      icon: Leaf,
      title: "Sustainability Leader",
      color: "green",
      description: "Building a sustainable future",
      focus: "Environmental stewardship and green innovation",
    },
    // Legacy keys for backward compatibility
    ceo: {
      icon: Briefcase,
      title: "Business Leader",
      color: "emerald",
      description: "Leading with vision and strategy",
      focus: "Strategic leadership and business growth",
    },
    cto: {
      icon: Code,
      title: "Tech Innovator",
      color: "blue",
      description: "Innovating through technology",
      focus: "Technical innovation and digital transformation",
    },
    marketing: {
      icon: Megaphone,
      title: "Marketing Leader",
      color: "purple",
      description: "Building brands and customer connections",
      focus: "Brand development and market positioning",
    },
    finance: {
      icon: DollarSign,
      title: "Finance Leader",
      color: "green",
      description: "Managing resources and growth",
      focus: "Financial planning and resource optimization",
    },
  }

  const careerInfo = careerPaths[user.career_path as keyof typeof careerPaths] || careerPaths["Business & Management"]
  const CareerIcon = careerInfo.icon

  const totalSkillPoints = progress.reduce((sum, p) => sum + p.skill_level, 0)
  const level = Math.floor(totalSkillPoints / 50) + 1
  const nextLevelPoints = level * 50
  const levelProgress = ((totalSkillPoints % 50) / 50) * 100

  const topSkill = progress.length > 0 ? progress.reduce((max, p) => (p.skill_level > max.skill_level ? p : max), progress[0]) : null
  const weakestSkill = progress.length > 0 ? progress.reduce((min, p) => (p.skill_level < min.skill_level ? p : min), progress[0]) : null

  return (
    <StudentLayout user={user}>
      <div className="flex-1 p-4 lg:p-8">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6 p-4 bg-black text-white rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">RE-Novate</h2>
              <p className="text-gray-400 text-sm">{user.username || user.participant_id}</p>
            </div>
            <form action={logout}>
              <Button variant="outline" size="sm" className="text-black border-white hover:bg-gray-100">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            <Link
              href="/student/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded whitespace-nowrap text-sm ${pathname === '/student/dashboard'
                ? 'bg-white text-black font-medium'
                : 'bg-gray-800 text-gray-300'
                }`}
            >
              <Target className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/student/simulations"
              className={`flex items-center gap-2 px-3 py-2 rounded whitespace-nowrap text-sm ${pathname === '/student/simulations'
                ? 'bg-white text-black font-medium'
                : 'bg-gray-800 text-gray-300'
                }`}
            >
              <Play className="h-4 w-4" />
              Simulations
            </Link>
            <Link
              href="/student/mentor"
              className={`flex items-center gap-2 px-3 py-2 rounded whitespace-nowrap text-sm ${pathname === '/student/mentor'
                ? 'bg-white text-black font-medium'
                : 'bg-gray-800 text-gray-300'
                }`}
            >
              <div className="h-4 w-4 text-center">🤖</div>
              Noni AI
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-black p-8 text-white shadow-xl">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CareerIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1">
                      {totalSkillPoints === 0 ? `Welcome, ${user.username || user.participant_id}` : `Welcome Back, ${user.username || user.participant_id}`}
                    </h1>
                    <p className="text-gray-300 text-lg">
                      {generateCareerWelcomeMessage(user.career_path, careerInfo, totalSkillPoints)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-5 w-5 text-orange-300" />
                    <span className="font-semibold">Level {level} Entrepreneur</span>
                  </div>
                  <Progress value={levelProgress} className="h-2 mb-2 bg-white/20" />
                  <p className="text-sm text-gray-300">
                    {totalSkillPoints === 0
                      ? "Start your first simulation to begin earning points"
                      : `${totalSkillPoints} / ${nextLevelPoints} points to Level ${level + 1}`
                    }
                  </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold">Top Skill</span>
                  </div>
                  <p className="text-2xl font-bold">{topSkill?.skill_name.replace(/_/g, " ") || "Start simulations"}</p>
                  <p className="text-sm text-gray-300">{topSkill ? `Level ${topSkill.skill_level} - Keep it up!` : "Complete simulations to develop skills"}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    <span className="font-semibold">Focus Area</span>
                  </div>
                  <p className="text-2xl font-bold">{weakestSkill?.skill_name.replace(/_/g, " ") || "All skills"}</p>
                  <p className="text-sm text-gray-300">{weakestSkill ? `Level ${weakestSkill.skill_level} - Room to grow!` : "Begin your learning journey"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <Card className="border-gray-200 mb-8 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-black mb-2">
                    {hasActiveSession ? "Continue Your Simulation" : "Ready to Start Learning?"}
                  </h3>
                  <p className="text-gray-700 mb-3">
                    {hasActiveSession
                      ? `Round ${sessions.find((s) => s.status === "in_progress")?.current_round || 1} of 5. Continue making decisions to progress.`
                      : `Get started with real-world simulations and develop your ${careerInfo.focus.toLowerCase()} skills.`}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>~15 minutes • 5 simulations</span>
                  </div>
                </div>
                <Link href="/student/simulation">
                  <Button size="lg" className="bg-black hover:bg-gray-800 text-white shadow-lg">
                    <PlayCircle className="h-5 w-5 mr-2" />
                    {hasActiveSession ? "Continue Session" : "Start New Session"}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Sessions</CardTitle>
                <Target className="h-4 w-4 text-black" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-black">{stats.totalSessions}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.totalSessions === 0 ? "Ready to start your first!" : `${stats.completedSessions} completed`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-black" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-black">{stats.averageScore}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.averageScore === 0 ? "Your journey begins!" : "Out of 100"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Skills Developed</CardTitle>
                <Award className="h-4 w-4 text-black" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-black">{progress.filter(p => p.skill_level > 0).length}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {progress.filter(p => p.skill_level > 0).length === 0 ? "Ready to unlock!" : "Skills developed"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Skill Levels</CardTitle>
                <CardDescription>Your accumulated skill points across different areas</CardDescription>
              </CardHeader>
              <CardContent>
                {skillsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={skillsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="level" fill="#000000" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <TrendingUp className="h-10 w-10 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Skills Journey Awaits!</h3>
                    <p className="text-gray-600 mb-4 max-w-md">
                      Complete your first simulation to unlock your skill development chart and watch your entrepreneurial abilities grow!
                    </p>
                    <div className="flex items-center gap-2 text-sm text-black font-medium">
                      <PlayCircle className="h-4 w-4" />
                      <span>Start your first simulation to begin</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Skill Balance</CardTitle>
                <CardDescription>Visual representation of your entrepreneurial profile</CardDescription>
              </CardHeader>
              <CardContent>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" fontSize={12} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Skills" dataKey="value" stroke="#000000" fill="#000000" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Target className="h-10 w-10 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover Your Entrepreneurial Profile!</h3>
                    <p className="text-gray-600 mb-4 max-w-md">
                      Your unique skill radar will appear here once you complete simulations. See how balanced your entrepreneurial abilities are!
                    </p>
                    <div className="flex items-center gap-2 text-sm text-black font-medium">
                      <Zap className="h-4 w-4" />
                      <span>Unlock your profile with simulations</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}