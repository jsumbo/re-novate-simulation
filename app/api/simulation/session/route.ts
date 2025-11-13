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
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }

    // Check if user has an ongoing session
    const { data: existingSession } = await supabase
      .from('simulation_sessions')
      .select('id, current_round, total_rounds, status')
      .eq('user_id', userId)
      .eq('status', 'ongoing')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingSession) {
      return NextResponse.json({
        success: true,
        sessionId: existingSession.id,
        existing: true,
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
      return NextResponse.json(
        { success: false, error: sessionResult.error || 'Failed to create session' },
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

