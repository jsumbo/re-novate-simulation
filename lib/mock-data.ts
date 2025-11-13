export const mockScenarios = [
  {
    id: "1",
    title: "Market Research Challenge",
    description: "Conduct market research for a new product launch in Monrovia",
    difficulty: "beginner",
    estimatedTime: 15,
    category: "Market Research"
  },
  {
    id: "2", 
    title: "Financial Planning Scenario",
    description: "Create a budget and financial plan for a small business",
    difficulty: "intermediate",
    estimatedTime: 20,
    category: "Financial Management"
  },
  {
    id: "3",
    title: "Leadership Crisis",
    description: "Navigate a team conflict and restore productivity",
    difficulty: "advanced", 
    estimatedTime: 25,
    category: "Leadership"
  }
]

export const mockTeacherUser = {
  id: "teacher-1",
  participant_id: "FAC001",
  role: "teacher",
  school_id: "school-1",
  schools: {
    id: "school-1",
    name: "Monrovia Central High School",
    code: "MCHS2024"
  },
  created_at: "2024-01-15T00:00:00Z"
}

export const mockStudents = [
  {
    id: "student-1",
    participant_id: "STU001",
    role: "student",
    career_path: "Technology & Innovation",
    school_id: "school-1",
    created_at: "2024-01-20T00:00:00Z"
  },
  {
    id: "student-2", 
    participant_id: "STU002",
    role: "student",
    career_path: "Business & Management",
    school_id: "school-1",
    created_at: "2024-01-21T00:00:00Z"
  },
  {
    id: "student-3",
    participant_id: "STU003", 
    role: "student",
    career_path: "Creative Arts & Media",
    school_id: "school-1",
    created_at: "2024-01-22T00:00:00Z"
  }
]

export const mockSessions = [
  {
    id: "session-1",
    user_id: "student-1",
    status: "completed",
    current_round: 5,
    total_rounds: 5,
    total_score: 85,
    created_at: "2024-01-25T00:00:00Z"
  },
  {
    id: "session-2",
    user_id: "student-2", 
    status: "in_progress",
    current_round: 3,
    total_rounds: 5,
    total_score: 60,
    created_at: "2024-01-26T00:00:00Z"
  }
]

export const mockDecisions = [
  {
    id: "decision-1",
    user_id: "student-1",
    session_id: "session-1",
    outcome_score: 85,
    created_at: "2024-01-25T00:00:00Z"
  },
  {
    id: "decision-2",
    user_id: "student-2",
    session_id: "session-2", 
    outcome_score: 60,
    created_at: "2024-01-26T00:00:00Z"
  }
]

export const mockProgress = [
  {
    id: "progress-1",
    user_id: "student-1",
    skill_name: "leadership",
    skill_level: 75,
    created_at: "2024-01-25T00:00:00Z"
  },
  {
    id: "progress-2",
    user_id: "student-2",
    skill_name: "communication", 
    skill_level: 60,
    created_at: "2024-01-26T00:00:00Z"
  }
]