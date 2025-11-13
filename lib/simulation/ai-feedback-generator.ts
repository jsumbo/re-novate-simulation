"use server"

import { SimulationOption, SimulationScenario, DetailedFeedback, SimulationContext } from './types'
import { calculateUserPerformance } from './ai-generator'

// Comprehensive feedback generation system
export async function generateDetailedFeedback(
  scenario: SimulationScenario,
  selectedOption: SimulationOption,
  context: SimulationContext,
  userHistory?: any[]
): Promise<DetailedFeedback> {
  
  const userPerformance = await calculateUserPerformance(userHistory)
  const careerPath = context.user_background.career_path
  // Generate richer, unique feedback using the model.
  // Otherwise fall back to the template-based generator above.
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = buildFeedbackPrompt({ scenario, selectedOption, context, userPerformance })
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert instructional designer and business mentor. Provide clear, concise, and actionable feedback tailored to the simulation context.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      })

      if (resp.ok) {
        const data = await resp.json()
        let text = data.choices?.[0]?.message?.content || ''
        
        // Strip markdown code blocks if present
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
        
        // The model returns a single blob of text. Try to parse JSON if the model returned structured JSON.
        try {
          const parsed = JSON.parse(text)
          // Validate that parsed object has required structure
          if (parsed && typeof parsed === 'object' && parsed.overall_assessment) {
            return parsed as DetailedFeedback
          }
          throw new Error('Invalid structure')
        } catch {
          // If parsing fails, use the text as overall_assessment and use templates for structured fields
          return {
            overall_assessment: text.length > 0 ? text : generateOverallAssessment(selectedOption, scenario, careerPath),
            decision_analysis: generateDecisionAnalysis(selectedOption, scenario, context),
            skill_development: generateSkillDevelopment(selectedOption, careerPath, userPerformance),
            real_world_examples: generateRealWorldExamples(scenario, selectedOption, careerPath),
            learning_resources: generateLearningResources(selectedOption, scenario, careerPath),
            action_items: generateActionItems(selectedOption, scenario, careerPath),
            reflection_questions: generateReflectionQuestions(scenario, selectedOption, careerPath),
          }
        }
      }
    } catch (e) {
      // If the AI call fails for any reason, fall back to the template generator below.
      // eslint-disable-next-line no-console
      console.warn('OpenAI feedback generation failed, falling back to template generator.', e)
    }
  }

  return {
    overall_assessment: generateOverallAssessment(selectedOption, scenario, careerPath),
    decision_analysis: generateDecisionAnalysis(selectedOption, scenario, context),
    skill_development: generateSkillDevelopment(selectedOption, careerPath, userPerformance),
    real_world_examples: generateRealWorldExamples(scenario, selectedOption, careerPath),
    learning_resources: generateLearningResources(selectedOption, scenario, careerPath),
    action_items: generateActionItems(selectedOption, scenario, careerPath),
    reflection_questions: generateReflectionQuestions(scenario, selectedOption, careerPath),
  }
}

function buildFeedbackPrompt({ scenario, selectedOption, context, userPerformance }: any) {
  // Build a detailed prompt describing the simulation, the chosen option, and the learner context.
  return `You are an expert business mentor providing feedback on a student's decision in a business simulation.

Scenario:
Title: ${scenario.title}
Context: ${scenario.context}
Challenge: ${scenario.challenge}

Selected Option:
${selectedOption.text}
Risk level: ${selectedOption.risk_level}
Immediate consequences: ${JSON.stringify(selectedOption.immediate_consequences)}
Long term effects: ${JSON.stringify(selectedOption.long_term_effects)}

Learner Context:
Career path: ${context.user_background.career_path}
Skill level: ${context.user_background.skill_level}
Business stage: ${context.businessStage}
Market conditions: ${context.market_conditions}
Resources: ${JSON.stringify(context.resources)}

User performance summary: ${JSON.stringify(userPerformance)}

Provide detailed, personalized feedback. Return ONLY valid JSON (no markdown code blocks, no explanations). The JSON must have this exact structure:
{
  "overall_assessment": "A concise 2-3 sentence assessment of the decision",
  "decision_analysis": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "areas_for_improvement": ["area 1", "area 2", "area 3"],
    "alternative_approaches": ["approach 1", "approach 2"]
  },
  "skill_development": {
    "skills_demonstrated": [
      {"skill": "skill name", "level": "beginner|intermediate|advanced", "evidence": "how they demonstrated it"}
    ],
    "skills_to_develop": [
      {"skill": "skill name", "why_important": "reason", "how_to_improve": "actionable advice"}
    ]
  },
  "real_world_examples": [
    {"company": "Company name", "situation": "brief situation", "outcome": "what happened", "lesson": "key takeaway"}
  ],
  "learning_resources": {
    "books": [{"title": "Book Title", "author": "Author", "relevance": "why relevant"}],
    "videos": [{"title": "Video Title", "url": "url", "channel": "Channel", "duration": "duration", "key_topics": ["topic1", "topic2"]}],
    "courses": [{"title": "Course Title", "provider": "Provider", "url": "url", "level": "beginner|intermediate|advanced", "estimated_time": "time"}]
  },
  "action_items": [
    {"task": "specific task", "priority": "high|medium|low", "timeline": "timeframe", "resources_needed": ["resource1", "resource2"]}
  ],
  "reflection_questions": ["question 1", "question 2", "question 3", "question 4"]
}

Make the feedback specific to this decision and context. Keep it concise and actionable.`
}

function generateOverallAssessment(
  selectedOption: SimulationOption, 
  scenario: SimulationScenario, 
  careerPath: string
): string {
  const riskLevel = selectedOption.risk_level
  const assessments = {
    low: [
      `Your conservative approach demonstrates strong risk management skills, which is crucial for ${careerPath} roles. This decision shows you prioritize stability and sustainable growth over quick wins.`,
      `You've chosen a measured approach that aligns well with best practices in ${careerPath}. This shows maturity in decision-making and understanding of long-term consequences.`
    ],
    medium: [
      `Your balanced approach shows good judgment in weighing risks against potential rewards. This is exactly the kind of strategic thinking expected from a ${careerPath}.`,
      `You've struck a good balance between innovation and prudence. This decision demonstrates the analytical skills essential for ${careerPath} success.`
    ],
    high: [
      `Your bold decision shows entrepreneurial courage and willingness to take calculated risks. While risky, this approach could lead to significant breakthroughs if executed well.`,
      `You've chosen an aggressive strategy that could differentiate your business. This shows the kind of innovative thinking that drives industry leadership.`
    ]
  }
  
  const options = assessments[riskLevel] || assessments.medium
  return options[Math.floor(Math.random() * options.length)]
}

function generateDecisionAnalysis(
  selectedOption: SimulationOption,
  scenario: SimulationScenario,
  context: SimulationContext
) {
  return {
    strengths: generateStrengths(selectedOption, scenario, context),
    areas_for_improvement: generateImprovementAreas(selectedOption, scenario, context),
    alternative_approaches: generateAlternatives(selectedOption, scenario, context)
  }
}

function generateStrengths(
  selectedOption: SimulationOption,
  scenario: SimulationScenario,
  context: SimulationContext
): string[] {
  const strengths = []
  
  // Risk-based strengths
  if (selectedOption.risk_level === 'low') {
    strengths.push("Demonstrated strong risk management by choosing a conservative approach")
    strengths.push("Prioritized business stability and stakeholder confidence")
  } else if (selectedOption.risk_level === 'high') {
    strengths.push("Showed entrepreneurial courage and willingness to innovate")
    strengths.push("Recognized the potential for significant competitive advantage")
  }
  
  // Context-based strengths
  if (context.businessStage === 'startup') {
    strengths.push("Considered the unique constraints and opportunities of a startup environment")
  }
  
  // Stakeholder consideration
  if (scenario.stakeholders.length > 3) {
    strengths.push("Navigated a complex stakeholder environment effectively")
  }
  
  return strengths.slice(0, 3) // Limit to top 3 strengths
}

function generateImprovementAreas(
  selectedOption: SimulationOption,
  scenario: SimulationScenario,
  context: SimulationContext
): string[] {
  const improvements = []
  
  // Risk-based improvements
  if (selectedOption.risk_level === 'high') {
    improvements.push("Consider developing more detailed risk mitigation strategies for high-risk decisions")
    improvements.push("Explore ways to test assumptions before full implementation")
  } else if (selectedOption.risk_level === 'low') {
    improvements.push("Look for opportunities to be more innovative while maintaining prudent risk management")
    improvements.push("Consider how to accelerate growth while preserving stability")
  }
  
  // Resource optimization
  if (selectedOption.resource_impact.budget_change < -1000) {
    improvements.push("Develop more cost-effective approaches to achieve similar outcomes")
  }
  
  // Stakeholder management
  improvements.push("Enhance stakeholder communication and buy-in strategies")
  
  return improvements.slice(0, 3)
}

function generateAlternatives(
  selectedOption: SimulationOption,
  scenario: SimulationScenario,
  context: SimulationContext
): string[] {
  return [
    "Implement a phased approach to reduce risk while maintaining innovation potential",
    "Develop partnerships to share resources and risks",
    "Create pilot programs to test concepts before full-scale implementation",
    "Establish clear success metrics and decision checkpoints for course correction"
  ].slice(0, 2)
}

function generateSkillDevelopment(
  selectedOption: SimulationOption,
  careerPath: string,
  userPerformance?: any
) {
  const skillsMap = {
    ceo: ['strategic_thinking', 'leadership', 'decision_making', 'stakeholder_management'],
    cto: ['technical_leadership', 'innovation_management', 'system_thinking', 'team_building'],
    marketing: ['market_analysis', 'brand_management', 'customer_insights', 'creative_strategy'],
    finance: ['financial_analysis', 'risk_management', 'budgeting', 'investment_strategy'],
    operations: ['process_optimization', 'quality_management', 'efficiency_improvement', 'logistics'],
    sales: ['relationship_building', 'negotiation', 'market_penetration', 'revenue_optimization'],
    hr: ['talent_management', 'organizational_development', 'culture_building', 'performance_management'],
    product: ['user_experience', 'product_strategy', 'market_research', 'innovation']
  }
  
  const relevantSkills = skillsMap[careerPath as keyof typeof skillsMap] || skillsMap.ceo
  
  return {
    skills_demonstrated: relevantSkills.slice(0, 2).map(skill => ({
      skill: skill.replace('_', ' '),
      level: selectedOption.risk_level === 'high' ? 'advanced' as const : 'intermediate' as const,
      evidence: `Your decision to ${selectedOption.text.toLowerCase()} demonstrates practical application of ${skill.replace('_', ' ')} principles`
    })),
    skills_to_develop: relevantSkills.slice(2, 4).map(skill => ({
      skill: skill.replace('_', ' '),
      why_important: `${skill.replace('_', ' ')} is crucial for ${careerPath} success in today's business environment`,
      how_to_improve: `Practice ${skill.replace('_', ' ')} through case studies, mentorship, and hands-on projects`
    }))
  }
}

function generateRealWorldExamples(
  scenario: SimulationScenario,
  selectedOption: SimulationOption,
  careerPath: string
) {
  const examples = {
    startup: [
      {
        company: "Airbnb",
        situation: "Faced regulatory challenges in multiple cities while trying to scale",
        outcome: "Developed city-specific compliance strategies and stakeholder engagement",
        lesson: "Proactive regulatory engagement is crucial for platform businesses"
      },
      {
        company: "Slack",
        situation: "Pivoted from gaming company to communication platform during financial crisis",
        outcome: "Became one of the fastest-growing business applications",
        lesson: "Sometimes the best opportunities come from unexpected pivots"
      }
    ],
    growth: [
      {
        company: "Netflix",
        situation: "Transitioned from DVD-by-mail to streaming while cannibalizing existing business",
        outcome: "Became the dominant streaming platform globally",
        lesson: "Bold strategic moves sometimes require sacrificing current success for future growth"
      },
      {
        company: "Shopify",
        situation: "Scaled platform while maintaining performance and adding new features",
        outcome: "Became the leading e-commerce platform for small businesses",
        lesson: "Technical excellence and customer focus enable sustainable scaling"
      }
    ]
  }

  // Determine stage from scenario if available, otherwise fallback to context in title
  const lowerTitle = scenario.title?.toLowerCase() || ''
  const stage = lowerTitle.includes('startup') ? 'startup' : lowerTitle.includes('growth') ? 'growth' : 'startup'
  const stageExamples = examples[stage] || examples.startup
  // Personalize examples selection using selectedOption text to vary output
  const seed = (selectedOption.text || '').length
  const idx = seed % stageExamples.length
  return [stageExamples[idx], stageExamples[(idx + 1) % stageExamples.length]]
}

function generateLearningResources(
  selectedOption: SimulationOption,
  scenario: SimulationScenario,
  careerPath: string
) {
  const baseResources = {
    books: [
      {
        title: "The Lean Startup",
        author: "Eric Ries",
        relevance: "Essential for understanding iterative business development and risk management",
        key_chapters: ["Build-Measure-Learn", "Validated Learning"]
      },
      {
        title: "Good to Great",
        author: "Jim Collins",
        relevance: "Provides frameworks for sustainable business growth and leadership",
        key_chapters: ["Level 5 Leadership", "The Hedgehog Concept"]
      }
    ],
    articles: [
      {
        title: "The Hard Thing About Hard Things",
        url: "https://a16z.com/2014/05/09/the-hard-thing-about-hard-things/",
        source: "Andreessen Horowitz",
        summary: "Practical advice for navigating difficult business decisions"
      },
      {
        title: "Blitzscaling: The Lightning-Fast Path to Building Massively Valuable Companies",
        url: "https://hbr.org/2016/04/blitzscaling",
        source: "Harvard Business Review",
        summary: "Strategies for rapid scaling in competitive markets"
      }
    ],
    videos: [
      {
        title: "How to Build Your Startup",
        url: "https://www.youtube.com/watch?v=CVfnkM44Urs",
        channel: "Stanford eCorner",
        duration: "45 minutes",
        key_topics: ["Product-Market Fit", "Team Building", "Fundraising"]
      },
      {
        title: "The Single Biggest Reason Why Startups Succeed",
        url: "https://www.youtube.com/watch?v=bNpx7gpSqbY",
        channel: "TED",
        duration: "6 minutes",
        key_topics: ["Timing", "Market Analysis", "Execution"]
      }
    ],
    courses: [
      {
        title: "Entrepreneurship Specialization",
        provider: "Coursera (University of Pennsylvania)",
        url: "https://www.coursera.org/specializations/wharton-entrepreneurship",
        level: "intermediate" as const,
        estimated_time: "4-6 months"
      },
      {
        title: "Strategic Leadership and Management",
        provider: "edX (MIT)",
        url: "https://www.edx.org/course/strategic-leadership",
        level: "advanced" as const,
        estimated_time: "8-10 weeks"
      }
    ]
  }
  
  // Customize resources based on career path
  const careerSpecificResources = getCareerSpecificResources(careerPath)
  
  return {
    books: [...baseResources.books, ...careerSpecificResources.books].slice(0, 3),
    articles: [...baseResources.articles, ...careerSpecificResources.articles].slice(0, 3),
    videos: [...baseResources.videos, ...careerSpecificResources.videos].slice(0, 3),
    courses: [...baseResources.courses, ...careerSpecificResources.courses].slice(0, 2)
  }
}

function getCareerSpecificResources(careerPath: string) {
  const resources = {
    cto: {
      books: [{
        title: "The Technology Fallacy",
        author: "Gerald Kane",
        relevance: "Understanding technology's role in business strategy",
        key_chapters: ["Digital Transformation", "Technology Leadership"]
      }],
      articles: [{
        title: "What Makes a Great CTO",
        url: "https://firstround.com/review/what-makes-a-great-cto/",
        source: "First Round Review",
        summary: "Key competencies and responsibilities of technical leaders"
      }],
      videos: [{
        title: "Building Technical Teams",
        url: "https://www.youtube.com/watch?v=technical-teams",
        channel: "Tech Leadership",
        duration: "30 minutes",
        key_topics: ["Hiring", "Team Culture", "Technical Vision"]
      }],
      courses: [{
        title: "Technical Leadership",
        provider: "Pluralsight",
        url: "https://www.pluralsight.com/courses/technical-leadership",
        level: "advanced" as const,
        estimated_time: "6 weeks"
      }]
    },
    marketing: {
      books: [{
        title: "Building a StoryBrand",
        author: "Donald Miller",
        relevance: "Creating clear marketing messages that resonate",
        key_chapters: ["The StoryBrand Framework", "Customer Journey"]
      }],
      articles: [{
        title: "The Future of Marketing",
        url: "https://hbr.org/2020/01/marketing-in-the-age-of-alexa",
        source: "Harvard Business Review",
        summary: "How technology is changing marketing strategies"
      }],
      videos: [{
        title: "Digital Marketing Strategy",
        url: "https://www.youtube.com/watch?v=digital-marketing",
        channel: "Marketing School",
        duration: "25 minutes",
        key_topics: ["SEO", "Content Marketing", "Social Media"]
      }],
      courses: [{
        title: "Digital Marketing Specialization",
        provider: "Coursera (University of Illinois)",
        url: "https://www.coursera.org/specializations/digital-marketing",
        level: "intermediate" as const,
        estimated_time: "3-4 months"
      }]
    }
    // Add more career-specific resources as needed
  }
  
  return resources[careerPath as keyof typeof resources] || {
    books: [], articles: [], videos: [], courses: []
  }
}

function generateActionItems(
  selectedOption: SimulationOption,
  scenario: SimulationScenario,
  careerPath: string
) {
  const baseActions = [
    {
      task: "Create a detailed implementation plan with milestones and success metrics",
      priority: "high" as const,
      timeline: "1 week",
      resources_needed: ["team input", "market research", "financial projections"]
    },
    {
      task: "Identify and engage key stakeholders for buy-in and support",
      priority: "high" as const,
      timeline: "2 weeks",
      resources_needed: ["stakeholder mapping", "communication plan", "presentation materials"]
    },
    {
      task: "Develop risk mitigation strategies for potential challenges",
      priority: "medium" as const,
      timeline: "1 week",
      resources_needed: ["risk assessment framework", "contingency planning", "expert consultation"]
    },
    {
      task: "Set up monitoring and feedback systems to track progress",
      priority: "medium" as const,
      timeline: "2 weeks",
      resources_needed: ["analytics tools", "reporting dashboard", "feedback mechanisms"]
    }
  ]
  
  return baseActions.slice(0, 3)
}

function generateReflectionQuestions(
  scenario: SimulationScenario,
  selectedOption: SimulationOption,
  careerPath: string
): string[] {
  return [
    "What assumptions did you make when choosing this option, and how could you validate them?",
    "How might different stakeholders react to your decision, and how would you address their concerns?",
    "What would you do differently if you had unlimited resources versus significant constraints?",
    "How does this decision align with your long-term career goals and values?",
    "What early warning signs would indicate that your chosen approach isn't working?",
    "How could you apply the lessons from this scenario to real-world situations in your career?"
  ].slice(0, 4)
}

// note: user performance calculation is provided by ai-generator.calculateUserPerformance