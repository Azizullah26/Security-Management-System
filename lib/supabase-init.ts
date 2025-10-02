import { supabase } from './supabase'

export async function initializeDatabase() {
  try {
    // Check if tables exist by trying to fetch from them
    const { error: entriesError } = await supabase
      .from('entries')
      .select('id')
      .limit(1)

    const { error: assignmentsError } = await supabase
      .from('assignments')
      .select('id')
      .limit(1)

    if (entriesError) {
      console.log('Entries table needs to be created. Please run the SQL schema in Supabase dashboard.')
    }

    if (assignmentsError) {
      console.log('Assignments table needs to be created. Please run the SQL schema in Supabase dashboard.')
    }

    return {
      entriesReady: !entriesError,
      assignmentsReady: !assignmentsError
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    return {
      entriesReady: false,
      assignmentsReady: false
    }
  }
}
