import { createClient } from '../../utils/supabase/server'

export async function checkDatabaseMigration() {
  try {
    const supabase = await createClient()
    
    // Test if event_participants table exists
    const { data, error } = await supabase
      .from('event_participants')
      .select('id')
      .limit(1)
    
    if (error) {
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          migrationApplied: false,
          missingTables: ['event_participants'],
          error: 'Database migration not applied'
        }
      }
      
      return {
        migrationApplied: false,
        error: error.message
      }
    }
    
    return {
      migrationApplied: true,
      error: null
    }
  } catch (error: any) {
    return {
      migrationApplied: false,
      error: error.message || 'Unknown database error'
    }
  }
}