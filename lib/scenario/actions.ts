"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";


export async function startNewSession(userId: string) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { success: false, error: "Database connection not available" };
  }

  // Get user data to determine career path for scenario generation
  const { data: user } = await supabase
    .from("users")
    .select("career_path")
    .eq("id", userId)
    .single();

  const careerPath = user?.career_path || "ceo";

  // Generate the first scenario to get title and description
  const firstScenario = await getScenarioForRound("temp", 1, careerPath, userId);
  
  // Generate dynamic titles and descriptions based on career path
  const careerDescriptions = {
    ceo: "Executive leadership challenges for strategic decision-making",
    cto: "Technology leadership scenarios for innovation management", 
    marketing: "Brand and market challenges for customer engagement",
    finance: "Financial strategy scenarios for business growth",
    operations: "Operational excellence challenges for efficiency optimization",
    sales: "Revenue generation scenarios for business development",
    hr: "People management challenges for organizational success",
    product: "Product strategy scenarios for user-centered innovation"
  };

  let sessionTitle = `${careerPath.toUpperCase()} Leadership Simulation`;
  let sessionDescription = careerDescriptions[careerPath as keyof typeof careerDescriptions] || "Strategic business challenges for entrepreneurial development";
  
  if (firstScenario.success && firstScenario.scenario) {
    const scenarioData = firstScenario.scenario;
    if (scenarioData.scenario) {
      sessionTitle = scenarioData.scenario.title;
      sessionDescription = scenarioData.scenario.context || scenarioData.scenario.situation;
    } else if (scenarioData.title) {
      sessionTitle = scenarioData.title;
      sessionDescription = scenarioData.description || scenarioData.context;
    }
  }

  // Create simulation session with proper title and description
  const { createSimulationSession } = await import("@/lib/supabase/server-database");
  
  const sessionResult = await createSimulationSession({
    user_id: userId,
    title: sessionTitle,
    description: sessionDescription,
    status: 'ongoing',
    progress: 0,
    current_round: 1,
    total_rounds: 5,
    session_data: {
      career_path: careerPath,
      started_at: new Date().toISOString()
    }
  });

  if (!sessionResult.success) {
    return { success: false, error: sessionResult.error || "Failed to create simulation session" };
  }

  return { success: true, session: sessionResult.data };
}

export async function getScenarioForRound(
  sessionId: string,
  round: number,
  careerPath: string,
  userId: string
) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    // Generate AI simulation in offline mode
    const { generateSimulation } = await import("@/lib/simulation/ai-generator");
    const context = {
      industry: "Technology",
      location: "Monrovia, Liberia",
      businessStage: round <= 2 ? 'startup' as const : round <= 4 ? 'growth' as const : 'established' as const,
      resources: {
        budget: 5000 + (round * 2000),
        team_size: Math.min(2 + round, 10),
        time_constraint: "2-3 months"
      },
      market_conditions: "emerging market with growth potential",
      user_background: {
        career_path: careerPath,
        skill_level: round * 20,
        previous_decisions: []
      }
    };
    
    const simulation = await generateSimulation(context);
    return { success: true, scenario: simulation };
  }

  // Try to get user context for personalized simulation
  const { data: user } = await supabase
    .from("users")
    .select("*, student_profiles(*)")
    .eq("id", userId)
    .single();

  const { data: previousDecisions } = await supabase
    .from("decisions")
    .select("selected_option, ai_feedback")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Try to get an existing scenario from the database first
  const businessStage = round <= 2 ? 'startup' : round <= 4 ? 'growth' : 'established';
  const difficultyLevel = Math.min(round, 5);

  // Check if we have a suitable existing scenario
  const { data: existingScenarios } = await supabase
    .rpc('get_or_create_scenario', {
      p_career_path: careerPath,
      p_difficulty_level: difficultyLevel,
      p_business_stage: businessStage,
      p_user_id: userId
    });

  if (existingScenarios && existingScenarios.length > 0) {
    const existingScenario = existingScenarios[0];
    
    // If we found an existing scenario and it's not marked as new, use it
    if (!existingScenario.is_new && existingScenario.scenario_data) {
      console.log('Using existing scenario:', existingScenario.scenario_id);
      return { success: true, scenario: existingScenario.scenario_data };
    }
  }

  // Generate new AI-powered simulation
  console.log('Generating new AI scenario for:', { careerPath, round, businessStage });
  
  const { generateSimulation } = await import("@/lib/simulation/ai-generator");
  const context = {
    industry: "Technology", // Could be derived from user profile
    location: "Monrovia, Liberia",
    businessStage: businessStage as 'startup' | 'growth' | 'established',
    resources: {
      budget: 5000 + (round * 2000),
      team_size: Math.min(2 + round, 10),
      time_constraint: "2-3 months"
    },
    market_conditions: "emerging market with growth potential",
    user_background: {
      career_path: careerPath,
      skill_level: round * 20,
      previous_decisions: previousDecisions?.map(d => d.selected_option) || []
    }
  };
  
  // Get user simulation history for personalization
  const userHistory = previousDecisions?.map(d => ({
    scenarioType: (d as any).scenario_id || 'unknown',
    selectedOption: d.selected_option,
    feedback: {
      outcome_score: (d as any).outcome_score || 0,
      skills_gained: (d as any).skills_gained || {}
    }
  })) || [];
  
  const simulation = await generateSimulation(context, userHistory);
  
  // Store the newly generated scenario in the database for reuse
  try {
    // Generate a proper UUID for the database
    const scenarioUUID = crypto.randomUUID();
    
    const { error: storeError } = await supabase
      .from('generated_scenarios')
      .insert({
        id: scenarioUUID,
        scenario_data: simulation,
        career_path: careerPath,
        difficulty_level: difficultyLevel,
        business_stage: businessStage,
        usage_count: 1
      });

    if (storeError) {
      console.error('Error storing generated scenario:', storeError);
      // Continue anyway - the scenario generation succeeded
    } else {
      console.log('Successfully stored new scenario for reuse:', scenarioUUID);
    }
  } catch (storeError) {
    console.error('Exception storing scenario:', storeError);
    // Continue anyway
  }
  
  return { success: true, scenario: simulation };
}

export async function submitDecision(
  sessionId: string,
  scenarioId: string,
  userId: string,
  round: number,
  selectedOptionId: string
) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    console.log("Mock mode: Submitting decision", selectedOptionId);
    
    // Generate detailed mock feedback for offline mode
    const { generateDetailedFeedback } = await import("@/lib/simulation/ai-feedback-generator");
    
    // Create mock scenario and option data
    const mockScenario = {
      id: scenarioId,
      title: "Strategic Business Challenge",
      context: "Navigate complex business decisions in the Liberian market",
      situation: "Your startup faces multiple challenges requiring strategic thinking",
      challenge: "Make decisions that balance growth with sustainability",
      stakeholders: ["investors", "employees", "customers"],
      constraints: ["limited_budget", "time_pressure"],
      success_metrics: ["revenue_growth", "team_satisfaction"],
      difficulty_level: round,
      estimated_time: 15
    };
    
    const mockOption = {
      id: selectedOptionId,
      text: "Strategic approach based on market analysis and stakeholder input",
      reasoning: "This approach balances risk with potential rewards",
      immediate_consequences: ["Team alignment", "Resource allocation"],
      long_term_effects: ["Market positioning", "Sustainable growth"],
      skill_development: { leadership: 2, strategic_thinking: 3, decision_making: 2 },
      risk_level: 'medium' as const,
      resource_impact: {
        budget_change: -500,
        time_required: "2-3 weeks",
        team_involvement: ["management", "operations"]
      }
    };
    
    const mockContext = {
      industry: "Technology",
      location: "Monrovia, Liberia",
      businessStage: 'startup' as const,
      resources: { budget: 10000, team_size: 5, time_constraint: "3 months" },
      market_conditions: "emerging market with growth potential",
      user_background: { career_path: "ceo", skill_level: round * 20, previous_decisions: [] }
    };
    
    const detailedFeedback = await generateDetailedFeedback(mockScenario, mockOption, mockContext);
    const outcomeScore = 70 + Math.floor(Math.random() * 30);

    revalidatePath("/student/dashboard");

    return {
      success: true,
      feedback: {
        ai_feedback: detailedFeedback,
        outcome_score: outcomeScore,
        skills_gained: mockOption.skill_development,
      },
    };
  }

  // Try to get the scenario from the traditional scenarios table first
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", scenarioId)
    .single();

  // If not found in scenarios table, check the generated_scenarios table
  let generatedScenario = null;
  if (!scenario) {
    const { data: genScenario } = await supabase
      .from("generated_scenarios")
      .select("*")
      .eq("id", scenarioId)
      .single();
    
    generatedScenario = genScenario;
  }

  // If scenario not found in either table, it's a new AI-generated scenario
  if (!scenario && !generatedScenario) {
    console.log("Scenario not found in database, treating as new AI-generated scenario");
    
    // Generate detailed mock feedback for AI-generated scenarios
    const { generateDetailedFeedback } = await import("@/lib/simulation/ai-feedback-generator");
    
    // Create mock scenario data based on the ID pattern
    const mockScenario = {
      id: scenarioId,
      title: "AI-Generated Strategic Challenge",
      context: "Dynamic business scenario tailored to your experience and career path",
      situation: "You are facing a complex business challenge that requires strategic thinking and decision-making",
      challenge: "Navigate this situation using your professional expertise and business acumen",
      stakeholders: ["team", "customers", "investors", "partners"],
      constraints: ["budget", "time", "resources"],
      success_metrics: ["growth", "efficiency", "satisfaction"],
      difficulty_level: 3,
      estimated_time: 15
    };
    
    const mockOption = {
      id: "ai_response",
      text: typeof selectedOptionId === 'string' ? selectedOptionId.substring(0, 100) + "..." : "User response",
      reasoning: "User-provided strategic response",
      immediate_consequences: ["Strategic implementation", "Stakeholder alignment"],
      long_term_effects: ["Business growth", "Market positioning"],
      skill_development: { strategic_thinking: 3, decision_making: 2, communication: 2 },
      risk_level: 'medium' as const,
      resource_impact: {
        budget_change: 0,
        time_required: "2-4 weeks",
        team_involvement: ["management", "operations"]
      }
    };
    
    const mockContext = {
      industry: "Technology",
      location: "Monrovia, Liberia",
      businessStage: 'startup' as const,
      resources: { budget: 10000, team_size: 5, time_constraint: "3 months" },
      market_conditions: "emerging market with growth potential",
      user_background: { career_path: "ceo", skill_level: 60, previous_decisions: [] }
    };
    
    const detailedFeedback = await generateDetailedFeedback(mockScenario, mockOption, mockContext);
    const outcomeScore = 70 + Math.floor(Math.random() * 30); // 70-100 score range
    
    // Store the decision in the database
    const { error: insertError } = await supabase.from("decisions").insert({
      session_id: sessionId,
      scenario_id: scenarioId,
      user_id: userId,
      selected_option_id: selectedOptionId,
      selected_option: selectedOptionId,
      ai_feedback: JSON.stringify(detailedFeedback),
      outcome_score: outcomeScore,
      skills_gained: mockOption.skill_development,
      time_taken: 300, // 5 minutes default
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error storing decision:", insertError);
    }

    revalidatePath("/student/dashboard");

    return {
      success: true,
      feedback: {
        ai_feedback: detailedFeedback,
        outcome_score: outcomeScore,
        skills_gained: mockOption.skill_development,
      },
    };
  }

  // Handle stored generated scenarios
  if (generatedScenario && generatedScenario.scenario_data) {
    console.log("Using stored generated scenario:", scenarioId);
    
    const scenarioData = generatedScenario.scenario_data;
    const { generateDetailedFeedback } = await import("@/lib/simulation/ai-feedback-generator");
    
    // Extract scenario and task information
    const scenarioInfo = scenarioData.scenario || scenarioData;
    
    const mockOption = {
      id: "stored_response",
      text: typeof selectedOptionId === 'string' ? selectedOptionId.substring(0, 100) + "..." : "User response",
      reasoning: "User-provided strategic response to stored scenario",
      immediate_consequences: ["Strategic implementation", "Stakeholder response"],
      long_term_effects: ["Business development", "Market impact"],
      skill_development: { strategic_thinking: 3, decision_making: 2, communication: 2 },
      risk_level: 'medium' as const,
      resource_impact: {
        budget_change: 0,
        time_required: "2-4 weeks",
        team_involvement: ["management", "operations"]
      }
    };
    
    const mockContext = {
      industry: "Technology",
      location: "Monrovia, Liberia",
      businessStage: generatedScenario.business_stage as 'startup' | 'growth' | 'established',
      resources: { budget: 10000, team_size: 5, time_constraint: "3 months" },
      market_conditions: "emerging market with growth potential",
      user_background: { 
        career_path: generatedScenario.career_path, 
        skill_level: generatedScenario.difficulty_level * 20, 
        previous_decisions: [] 
      }
    };
    
    const detailedFeedback = await generateDetailedFeedback(scenarioInfo, mockOption, mockContext);
    const outcomeScore = 70 + Math.floor(Math.random() * 30);
    
    // Store the decision
    const { error: insertError } = await supabase.from("decisions").insert({
      session_id: sessionId,
      scenario_id: scenarioId,
      user_id: userId,
      selected_option_id: selectedOptionId,
      selected_option: selectedOptionId,
      ai_feedback: JSON.stringify(detailedFeedback),
      outcome_score: outcomeScore,
      skills_gained: mockOption.skill_development,
      time_taken: 300,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error storing decision:", insertError);
    }

    // Update usage count for the stored scenario
    await supabase
      .from("generated_scenarios")
      .update({ usage_count: (generatedScenario.usage_count || 0) + 1 })
      .eq("id", scenarioId);

    revalidatePath("/student/dashboard");

    return {
      success: true,
      feedback: {
        ai_feedback: detailedFeedback,
        outcome_score: outcomeScore,
        skills_gained: mockOption.skill_development,
      },
    };
  }

  const option = scenario.options.find((opt: any) => opt.id === selectedOptionId);
  const aiFeedback = await generateAIFeedback(scenario, option);

  const outcomeScore = calculateOutcomeScore(
    scenario.difficulty_level,
    selectedOptionId
  );

  const skillsGained = option?.skills_impact || {};

  const { error: decisionError } = await supabase.from("decisions").insert({
    session_id: sessionId,
    scenario_id: scenarioId,
    user_id: userId,
    round_number: round,
    selected_option: selectedOptionId,
    ai_feedback: aiFeedback,
    outcome_score: outcomeScore,
    skills_gained: skillsGained,
  });

  if (decisionError) {
    return { success: false, error: "Failed to save decision" };
  }

  // Update progress
  await updateProgress(userId, skillsGained, outcomeScore);

  // Update session
  const { data: currentSession } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (
    currentSession &&
    currentSession.current_round >= currentSession.total_rounds
  ) {
    // Mark session as completed
    await supabase
      .from("sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", sessionId);
  } else {
    // Move to next round
    await supabase
      .from("sessions")
      .update({ current_round: currentSession.current_round + 1 })
      .eq("id", sessionId);
  }

  revalidatePath("/student/dashboard");

  return {
    success: true,
    feedback: {
      ai_feedback: aiFeedback,
      outcome_score: outcomeScore,
      skills_gained: skillsGained,
    },
  };
}

async function generateAIFeedback(scenario: any, option: any): Promise<string> {
  if (!option || !option.text) {
    return "Thank you for your decision. Consider the various factors that influence business outcomes in your local context.";
  }

  // Extract the primary skill (the one with highest impact)
  let primarySkill = "business";
  if (option.skills_impact) {
    const skills = Object.entries(option.skills_impact) as [string, number][];
    if (skills.length > 0) {
      skills.sort((a, b) => b[1] - a[1]);
      primarySkill = skills[0][0].replace(/_/g, " ");
    }
  }

  const feedbackTemplates = [
    `Good choice! By choosing to ${option.text.toLowerCase()}, you demonstrated strong ${primarySkill} skills. In the Liberian business context, this approach shows understanding of local market dynamics.`,
    `Interesting decision. ${option.text} reflects a ${primarySkill} approach. Consider how this might affect your stakeholders in the long term, especially in Liberia's evolving economy.`,
    `This is a practical solution. ${option.text} shows you're thinking about ${primarySkill}. Remember that in Liberia's business environment, relationships and trust are crucial for success.`,
    `Bold move! ${option.text} demonstrates ${primarySkill} thinking. This could lead to innovation, but also consider the risks in a market with limited resources.`,
  ];

  return feedbackTemplates[
    Math.floor(Math.random() * feedbackTemplates.length)
  ];
}

function calculateOutcomeScore(
  difficultyLevel: number,
  selectedOption: string
): number {
  // Simplified scoring algorithm
  const baseScore = 60;
  const randomVariation = Math.floor(Math.random() * 30); // 0-30
  const difficultyBonus = difficultyLevel * 2; // Harder scenarios give more points

  return Math.min(100, baseScore + randomVariation + difficultyBonus);
}

async function updateProgress(
  userId: string,
  skillsGained: Record<string, number>,
  score: number
) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    console.log(" Mock mode: Updating progress", skillsGained);
    return;
  }

  for (const [skill, points] of Object.entries(skillsGained)) {
    const { data: existing } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("skill_name", skill)
      .single();

    if (existing) {
      // Update existing progress
      const newLevel = existing.skill_level + points;
      const newTotal = existing.total_scenarios_completed + 1;
      const newAverage =
        (existing.average_score * existing.total_scenarios_completed + score) /
        newTotal;

      await supabase
        .from("progress")
        .update({
          skill_level: newLevel,
          total_scenarios_completed: newTotal,
          average_score: newAverage,
          last_updated: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new progress entry
      await supabase.from("progress").insert({
        user_id: userId,
        skill_name: skill,
        skill_level: points,
        total_scenarios_completed: 1,
        average_score: score,
      });
    }
  }
}



// Get user's simulation sessions with proper status
export async function getUserSessions(userId: string) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { success: true, data: [] };
  }

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(`
      id,
      current_round,
      total_rounds,
      status,
      started_at,
      completed_at,
      created_at
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user sessions:", error);
    return { success: false, error: error.message, data: [] };
  }

  // Transform sessions into simulation session format
  const simulationSessions = sessions?.map(session => ({
    id: session.id,
    user_id: userId,
    title: `Business Simulation ${session.current_round}/${session.total_rounds}`,
    description: `Strategic business challenges for entrepreneurial development`,
    status: session.status === 'completed' ? 'completed' : 
            session.status === 'in_progress' ? 'ongoing' : 'paused',
    progress: Math.round((session.current_round / session.total_rounds) * 100),
    current_round: session.current_round,
    total_rounds: session.total_rounds,
    created_at: session.created_at || session.started_at,
    updated_at: session.completed_at || session.started_at
  })) || [];

  return { success: true, data: simulationSessions };
}

// Update session progress and status
export async function updateSessionProgress(sessionId: string, currentRound: number, status: 'in_progress' | 'completed') {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { success: false, error: "Database connection not available" };
  }

  try {
    // Calculate progress percentage
    const progress = status === 'completed' ? 100 : Math.round((currentRound / 5) * 100);
    
    // Try updating simulation_sessions first
    const { data: simSession, error: simError } = await supabase
      .from('simulation_sessions')
      .update({
        current_round: currentRound,
        progress: progress,
        status: status === 'completed' ? 'completed' : 'ongoing',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (!simError && simSession) {
      console.log('Updated simulation session:', sessionId, 'to round', currentRound, 'with status', status);
      return { success: true, session: simSession };
    }

    // Fallback to sessions table if simulation_sessions doesn't work
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        current_round: currentRound,
        status: status === 'completed' ? 'completed' : 'in_progress'
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session progress:', error);
      return { success: false, error: error.message };
    }

    console.log('Updated session:', sessionId, 'to round', currentRound, 'with status', status);
    return { success: true, session };
  } catch (error) {
    console.error('Error updating session progress:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}