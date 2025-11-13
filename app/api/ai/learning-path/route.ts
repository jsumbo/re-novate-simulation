import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      interestArea, 
      skillLevel, 
      goals, 
      learningPreference,
      motivation 
    } = body

    if (!interestArea || !skillLevel) {
      return NextResponse.json(
        { error: 'Interest area and skill level are required' },
        { status: 400 }
      )
    }

    // Initialize OpenAI client inside the function
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn('OpenAI API key not configured, using fallback response')
      throw new Error('OpenAI API key not configured')
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const goalsList = goals?.map((g: any) => g.text).join(', ') || 'general learning'
    
    const prompt = `Create a personalized learning path for a Liberian secondary student with these details:
    
    - Interest Area: ${interestArea}
    - Current Skill Level: ${skillLevel}
    - Learning Goals: ${goalsList}
    - Learning Preference: ${learningPreference}
    - Motivation: ${motivation}
    
    Create a learning path with:
    1. 5 progressive learning modules (from basic to advanced)
    2. Each module should have a clear title and brief description
    3. Include practical activities relevant to Liberian context
    4. Suggest 2-3 real-world scenarios for each module
    5. Recommend skills they'll develop
    
    Format as JSON:
    {
      "learningPath": {
        "title": "Your Personalized Learning Journey",
        "description": "Brief motivating description",
        "modules": [
          {
            "id": 1,
            "title": "Module Title",
            "description": "What they'll learn",
            "skills": ["skill1", "skill2"],
            "scenarios": ["scenario1", "scenario2"],
            "duration": "estimated time"
          }
        ],
        "nextSteps": "What to do after completing the path"
      }
    }
    
    Only return the JSON, no other text.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an educational curriculum designer specializing in entrepreneurship education for African secondary students. Create practical, culturally relevant learning paths."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from AI')
    }

    let learningPath
    try {
      learningPath = JSON.parse(response)
    } catch (parseError) {
      console.error('Failed to parse AI response:', response)
      throw new Error('Invalid JSON response from AI')
    }

    return NextResponse.json({
      ...learningPath,
      success: true
    })

  } catch (error) {
    console.error('AI Learning Path Error:', error)
    
    // Provide fallback learning path
    const fallbackPath = {
      learningPath: {
        title: "Your Personalized Learning Journey",
        description: `Welcome to your ${body.interestArea || 'entrepreneurship'} learning adventure! We've created a path that matches your ${body.skillLevel || 'beginner'} level and will help you achieve your goals.`,
        modules: [
          {
            id: 1,
            title: "Foundation Building",
            description: "Learn the basic concepts and principles",
            skills: ["Critical Thinking", "Problem Solving"],
            scenarios: ["Market Research Challenge", "Customer Interview Practice"],
            duration: "2-3 weeks"
          },
          {
            id: 2,
            title: "Practical Application",
            description: "Apply your knowledge to real situations",
            skills: ["Decision Making", "Analysis"],
            scenarios: ["Business Case Study", "Resource Management"],
            duration: "3-4 weeks"
          },
          {
            id: 3,
            title: "Advanced Concepts",
            description: "Explore complex topics and strategies",
            skills: ["Strategic Planning", "Innovation"],
            scenarios: ["Competitive Analysis", "Growth Strategy"],
            duration: "4-5 weeks"
          },
          {
            id: 4,
            title: "Leadership & Communication",
            description: "Develop leadership and presentation skills",
            skills: ["Leadership", "Communication"],
            scenarios: ["Team Management", "Pitch Presentation"],
            duration: "3-4 weeks"
          },
          {
            id: 5,
            title: "Real-World Project",
            description: "Complete a comprehensive capstone project",
            skills: ["Project Management", "Implementation"],
            scenarios: ["Business Plan Creation", "Community Impact Project"],
            duration: "5-6 weeks"
          }
        ],
        nextSteps: "After completing this path, you'll be ready to take on advanced challenges and potentially mentor other students!"
      }
    }

    return NextResponse.json({
      ...fallbackPath,
      success: true,
      fallback: true
    })
  }
}