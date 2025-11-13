import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createSimulationSession } from '@/lib/supabase/server-database'

export async function POST(request: NextRequest) {
  try {
    const { userId, careerPath } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.error('Supabase configuration check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseKey?.length || 0
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not available. Please check your Supabase configuration in .env file. Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY' 
        },
        { status: 500 }
      )
    }

    // Check if user has an ongoing session
    const { data: existingSessions, error: queryError } = await supabase
      .from('simulation_sessions')
      .select('id, current_round, total_rounds, status, progress')
      .eq('user_id', userId)
      .eq('status', 'ongoing')
      .order('created_at', { ascending: false })
      .limit(1)

    // If query error is not "no rows found", log it
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error querying existing sessions:', queryError)
    }

    if (existingSessions && existingSessions.length > 0) {
      const existingSession = existingSessions[0]
      return NextResponse.json({
        success: true,
        sessionId: existingSession.id,
        existing: true,
        currentRound: existingSession.current_round || 1,
        progress: existingSession.progress || 0,
      })
    }

    // Create new session
    const sessionResult = await createSimulationSession({
      user_id: userId,
      title: `Business Simulation - ${careerPath || 'Entrepreneurship'}`,
      description: `Strategic business challenges for ${careerPath || 'entrepreneurial'} development`,
      status: 'ongoing',
      progress: 0,
      current_round: 1,
      total_rounds: 5,
      session_data: {
        career_path: careerPath,
        started_at: new Date().toISOString(),
      },
    })

    if (!sessionResult.success) {
      console.error('Failed to create simulation session:', sessionResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: sessionResult.error || 'Failed to create session',
          details: 'Make sure the simulation_sessions table exists in your Supabase database. Run the migration: supabase/migrations/create_simulation_sessions.sql'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionResult.data?.id,
    })
  } catch (error) {
    console.error('Error creating/retrieving session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process session request' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, currentRound, progress, status } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }

    const updates: any = {}
    if (currentRound !== undefined) updates.current_round = currentRound
    if (progress !== undefined) updates.progress = progress
    if (status) updates.status = status

    const { data, error } = await supabase
      .from('simulation_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: data,
    })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

