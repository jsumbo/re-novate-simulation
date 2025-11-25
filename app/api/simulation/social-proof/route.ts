import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scenarioTitle = searchParams.get('title')

    if (!scenarioTitle) {
      return NextResponse.json(
        { success: false, error: 'Scenario title is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { count, error } = await supabase
      .from('simulation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .ilike('title', `%${scenarioTitle}%`)

    if (error) {
      console.error('Error fetching social proof:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch social proof' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    })
  } catch (error) {
    console.error('Error in social proof API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


