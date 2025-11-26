"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DetailedFeedback } from "@/lib/simulation/types"
import { 
  BookOpen, 
  ExternalLink, 
  Play, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb,
  TrendingUp,
  Users,
  Target,
  Clock,
  Star
} from "lucide-react"

interface DetailedFeedbackProps {
  feedback: DetailedFeedback
  performanceScore: number
  skillsGained: Record<string, number>
  onContinue: () => void
}

export function DetailedFeedbackComponent({ 
  feedback, 
  performanceScore, 
  skillsGained, 
  onContinue 
}: DetailedFeedbackProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overall Performance */}
      <Card className="border-2 border-emerald-200 bg-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-emerald-900 flex items-center gap-2">
              <Star className="h-6 w-6" />
              Performance Summary
            </CardTitle>
            <Badge variant="outline" className="text-lg px-4 py-2 border-emerald-600 text-emerald-700">
              {performanceScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={performanceScore} className="h-3 mb-4" />
          <p className="text-emerald-800 leading-relaxed">{feedback.overall_assessment}</p>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="actions">Next Steps</TabsTrigger>
        </TabsList>

        {/* Decision Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.decision_analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.decision_analysis.areas_for_improvement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <Lightbulb className="h-5 w-5" />
                Alternative Approaches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.decision_analysis.alternative_approaches.map((approach, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{approach}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Development */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                  Skills Demonstrated
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedback.skill_development.skills_demonstrated.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{skill.skill}</span>
                      <Badge variant={skill.level === 'advanced' ? 'default' : 'secondary'}>
                        {skill.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{skill.evidence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                  <Target className="h-5 w-5" />
                  Skills to Develop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedback.skill_development.skills_to_develop.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <span className="font-medium capitalize">{skill.skill}</span>
                    <p className="text-sm text-gray-600">{skill.why_important}</p>
                    <p className="text-xs text-purple-600 font-medium">{skill.how_to_improve}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Skills Gained */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                Points Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(skillsGained).map(([skill, points]) => (
                  <div key={skill} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">+{points}</div>
                    <div className="text-sm capitalize">{skill.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real World Examples */}
        <TabsContent value="examples" className="space-y-4">
          {feedback.real_world_examples.map((example, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {example.company}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-700">Situation:</h4>
                  <p className="text-sm text-gray-600">{example.situation}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Outcome:</h4>
                  <p className="text-sm text-gray-600">{example.outcome}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Key Lesson:</h4>
                  <p className="text-sm text-blue-700">{example.lesson}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Learning Resources */}
        <TabsContent value="resources" className="space-y-6">
          {/* Books */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recommended Books
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.learning_resources.books.map((book, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">{book.title}</h4>
                  <p className="text-sm text-gray-600">by {book.author}</p>
                  <p className="text-sm mt-1">{book.relevance}</p>
                  {book.key_chapters && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-blue-600">Key Chapters: </span>
                      <span className="text-xs text-gray-600">{book.key_chapters.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Video Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.learning_resources.videos.map((video, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Play className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{video.title}</h4>
                    <p className="text-sm text-gray-600">{video.channel} • {video.duration}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.key_topics.map((topic, topicIndex) => (
                        <Badge key={topicIndex} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Online Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.learning_resources.courses.map((course, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{course.title}</h4>
                      <p className="text-sm text-gray-600">{course.provider}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={course.level === 'advanced' ? 'default' : 'secondary'}>
                          {course.level}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.estimated_time}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={course.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Items */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Immediate Action Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.action_items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold flex-1">{item.task}</h4>
                    <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                      {item.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {item.timeline}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Resources needed: </span>
                    <span className="text-sm text-gray-600">{item.resources_needed.join(', ')}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reflection Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Reflection Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.reflection_questions.map((question, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm">{question}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Continue Button removed to avoid duplicate actions; parent controls navigation */}
    </div>
  )
}