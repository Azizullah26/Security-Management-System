import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const results = {
      entries: { exists: false, message: '' },
      assignments: { exists: false, message: '' }
    }

    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('id')
      .limit(1)

    if (entriesError) {
      results.entries.message = `Entries table error: ${entriesError.message}. Please create the table using the SQL schema.`
    } else {
      results.entries.exists = true
      results.entries.message = 'Entries table is ready'
    }

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id')
      .limit(1)

    if (assignmentsError) {
      results.assignments.message = `Assignments table error: ${assignmentsError.message}. Please create the table using the SQL schema.`
    } else {
      results.assignments.exists = true
      results.assignments.message = 'Assignments table is ready'
    }

    const allReady = results.entries.exists && results.assignments.exists

    return NextResponse.json({
      ready: allReady,
      tables: results,
      instructions: !allReady ? 
        'Please run the SQL schema (lib/supabase-schema.sql) in your Supabase SQL Editor to create the required tables.' : 
        'All tables are set up and ready!'
    })
  } catch (error) {
    console.error('Database setup check error:', error)
    return NextResponse.json(
      { error: 'Failed to check database setup' },
      { status: 500 }
    )
  }
}
