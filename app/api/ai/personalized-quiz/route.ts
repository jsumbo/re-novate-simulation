import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  let interestArea = 'Business & Management' // Default fallback
  
  try {
    const body = await request.json()
    const { interestArea: requestedArea, difficulty = 'beginner' } = body
    
    if (!requestedArea) {
      return NextResponse.json(
        { error: 'Interest area is required' },
        { status: 400 }
      )
    }
    
    interestArea = requestedArea

    const prompt = `Create 3 multiple-choice questions for Liberian secondary students about "${interestArea}". 
    
    Requirements:
    - Difficulty level: ${difficulty}
    - Questions should be relevant to Liberian context when possible
    - Each question should have 4 options (A, B, C, D)
    - Include brief explanations for correct answers
    - Make questions practical and engaging for teenagers
    - Focus on foundational concepts, not advanced theory
    
    Format your response as a JSON array with this structure:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation of why this is correct"
      }
    ]
    
    Only return the JSON array, no other text.`

    // Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn('OpenAI API key not configured, using fallback response')
      throw new Error('OpenAI API key not configured')
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an educational content creator specializing in entrepreneurship education for African secondary students. Create engaging, culturally relevant quiz questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response - handle markdown code blocks
    let questions
    try {
      // Remove markdown code blocks if present
      let cleanResponse = response.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      questions = JSON.parse(cleanResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', response)
      throw new Error('Invalid JSON response from AI')
    }

    // Validate the structure
    if (!Array.isArray(questions) || questions.length !== 3) {
      throw new Error('Invalid question format')
    }

    return NextResponse.json({
      questions,
      success: true
    })

  } catch (error) {
    console.error('AI Quiz Generation Error:', error)
    
    // Provide fallback questions based on interest area
    const fallbackQuestions = {
      "Business & Management": [
        {
          question: "What is the most important factor when starting a business?",
          options: ["Having lots of money", "Understanding your customers", "Having a fancy office", "Being the smartest person"],
          correctAnswer: 1,
          explanation: "Understanding your customers helps you create products they actually want!"
        },
        {
          question: "What does 'profit' mean in business?",
          options: ["Money you borrow", "Money left after paying expenses", "Money you invest", "Money you save"],
          correctAnswer: 1,
          explanation: "Profit is what's left when you subtract all your costs from your income."
        },
        {
          question: "Why is teamwork important in business?",
          options: ["It's not important", "Different people have different strengths", "It's required by law", "It makes work slower"],
          correctAnswer: 1,
          explanation: "Teams succeed because everyone brings unique skills and perspectives!"
        }
      ],
  "Technology & Innovation": [
        {
          question: "What is innovation?",
          options: ["Using old methods", "Creating new solutions to problems", "Copying others", "Avoiding change"],
          correctAnswer: 1,
          explanation: "Innovation is about finding creative new ways to solve problems!"
        },
        {
          question: "How can technology help solve problems?",
          options: ["It can't help", "By making tasks faster and easier", "Only for entertainment", "It creates more problems"],
          correctAnswer: 1,
          explanation: "Technology is a powerful tool that can make our lives better and solve real challenges."
        },
        {
          question: "What's the first step in creating a new app?",
          options: ["Writing code", "Understanding what problem it solves", "Designing the interface", "Finding investors"],
          correctAnswer: 1,
          explanation: "Before building anything, you need to understand what problem you're solving for users."
        }
      ]
      ,
      "Marketing & Sales": [
        {
          question: "What is the main goal of marketing?",
          options: ["To spend money", "To help customers find what they need", "To trick people", "To make noise"],
          correctAnswer: 1,
          explanation: "Good marketing connects customers with products that truly help them!"
        },
        {
          question: "What makes a good advertisement?",
          options: ["Being loud", "Being honest and helpful", "Being expensive", "Being confusing"],
          correctAnswer: 1,
          explanation: "The best ads are honest, clear, and show how a product can help people."
        },
        {
          question: "How do you build trust with customers?",
          options: ["Make big promises", "Be consistent and reliable", "Offer the lowest prices", "Use fancy words"],
          correctAnswer: 1,
          explanation: "Trust comes from consistently delivering on your promises and being reliable!"
        }
      ],
      "Finance & Economics": [
        {
          question: "What is the most important financial skill for entrepreneurs?",
          options: ["Complex math", "Understanding cash flow", "Stock market trading", "Cryptocurrency"],
          correctAnswer: 1,
          explanation: "Cash flow - knowing when money comes in and goes out - is crucial for business survival!"
        },
        {
          question: "Why is budgeting important for a business?",
          options: ["It's required by law", "It helps plan and control spending", "It impresses investors", "It's not really important"],
          correctAnswer: 1,
          explanation: "Budgeting helps you plan ahead and make sure you don't run out of money!"
        },
        {
          question: "What is a simple way to increase profit?",
          options: ["Increase prices without value", "Reduce unnecessary costs", "Ignore customers", "Stop marketing"],
          correctAnswer: 1,
          explanation: "Reducing unnecessary costs while maintaining value can improve profitability."
        }
      ],
      "Law & Ethics": [
        {
          question: "Why are ethics important in business?",
          options: ["They slow decisions", "They build trust", "They are optional", "They help hide mistakes"],
          correctAnswer: 1,
          explanation: "Ethics build trust with customers, partners, and the community."
        },
        {
          question: "What is a simple example of ethical behavior?",
          options: ["Misleading customers", "Being transparent about pricing", "Breaking promises", "Hiding problems"],
          correctAnswer: 1,
          explanation: "Being transparent helps customers make informed decisions and builds credibility."
        },
        {
          question: "Who should businesses consider when making ethical decisions?",
          options: ["Only owners", "Customers, employees, and community", "Only investors", "Only competitors"],
          correctAnswer: 1,
          explanation: "Ethical decisions consider the wider impact on stakeholders."
        }
      ],
      "Health & Well-Being": [
        {
          question: "Why is teamwork important in health-related projects?",
          options: ["It slows work", "Different skills help solve problems", "It's not needed", "Only one person should decide"],
          correctAnswer: 1,
          explanation: "Health projects benefit from diverse expertise and collaboration."
        },
        {
          question: "What does 'well-being' include?",
          options: ["Only physical health", "Physical, mental, and social health", "Only wealth", "Only fame"],
          correctAnswer: 1,
          explanation: "Well-being covers multiple aspects of health, not just physical."
        },
        {
          question: "How can communities support health initiatives?",
          options: ["Ignore them", "Participate and share information", "Avoid involvement", "Stop services"],
          correctAnswer: 1,
          explanation: "Community participation helps programs succeed and reach more people."
        }
      ],
      "Education & Training": [
        {
          question: "What makes a good learning activity?",
          options: ["Being boring", "Being interactive and relevant", "Being long and complex", "Being expensive"],
          correctAnswer: 1,
          explanation: "Interactive activities that relate to learners' lives help learning stick."
        },
        {
          question: "Why is feedback important in learning?",
          options: ["It's not important", "It helps learners improve", "It makes learners sad", "It's only for exams"],
          correctAnswer: 1,
          explanation: "Feedback guides learners on what to improve and reinforces progress."
        },
        {
          question: "How can teachers make lessons more engaging?",
          options: ["Use only lectures", "Include examples and activities", "Avoid student questions", "Use only textbooks"],
          correctAnswer: 1,
          explanation: "Examples and activities help students apply ideas and stay engaged."
        }
      ],
      "Creative Arts & Media": [
        {
          question: "What is storytelling useful for in media?",
          options: ["Confusing people", "Connecting with audiences", "Hiding facts", "Avoiding honesty"],
          correctAnswer: 1,
          explanation: "Stories help people relate to ideas and remember them."
        },
        {
          question: "Which element helps make good design?",
          options: ["Ignoring users", "Thinking about the user's needs", "Using only bright colors", "Making it complex"],
          correctAnswer: 1,
          explanation: "User-centered design ensures the result is useful and usable."
        },
        {
          question: "How can art influence society?",
          options: ["It can't", "By inspiring ideas and discussion", "Only for decoration", "By enforcing rules"],
          correctAnswer: 1,
          explanation: "Art can raise awareness and spark conversations about important issues."
        }
      ],
      "Agriculture & Sustainability": [
        {
          question: "Why is sustainable farming important?",
          options: ["It uses more resources", "It protects soil and future harvests", "It costs too much", "It reduces food"],
          correctAnswer: 1,
          explanation: "Sustainable practices help keep land productive for generations."
        },
        {
          question: "What helps increase crop yields responsibly?",
          options: ["Overuse fertilizers", "Proper crop rotation and care", "Ignore pests", "Plant randomly"],
          correctAnswer: 1,
          explanation: "Good farming practices improve yields without harming the environment."
        },
        {
          question: "How can communities support sustainable agriculture?",
          options: ["Buy locally", "Avoid farming", "Use harmful chemicals", "Ignore education"],
          correctAnswer: 0,
          explanation: "Buying local supports farmers and sustainable practices."
        }
      ],
      "Public Service & Policy": [
        {
          question: "What is public service about?",
          options: ["Helping communities", "Making money only", "Avoiding responsibility", "Only politics"],
          correctAnswer: 0,
          explanation: "Public service aims to improve the well-being of communities."
        },
        {
          question: "How can citizens influence policy?",
          options: ["Stay silent", "Vote and engage in discussion", "Ignore elections", "Only complain online"],
          correctAnswer: 1,
          explanation: "Participation in civic processes helps shape better policies."
        },
        {
          question: "Why is fairness important in policy?",
          options: ["It isn't", "It ensures everyone is treated justly", "It slows progress", "It only helps some people"],
          correctAnswer: 1,
          explanation: "Fair policies build trust and better outcomes for society."
        }
      ]
    }

    // Use the interestArea from the original request body
  const questions = fallbackQuestions[interestArea as keyof typeof fallbackQuestions] || fallbackQuestions["Business & Management"]

    return NextResponse.json({
      questions,
      success: true,
      fallback: true
    })
  }
}