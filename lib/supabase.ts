import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_URL!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          id: string
          category: string
          name: string
          file_id: string | null
          company: string | null
          phone: string | null
          vehicle_no: string | null
          items: string | null
          purpose: string | null
          host: string | null
          photo: string | null
          entry_time: string
          exit_time: string | null
          duration: string | null
          project_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          name: string
          file_id?: string | null
          company?: string | null
          phone?: string | null
          vehicle_no?: string | null
          items?: string | null
          purpose?: string | null
          host?: string | null
          photo?: string | null
          entry_time: string
          exit_time?: string | null
          duration?: string | null
          project_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          name?: string
          file_id?: string | null
          company?: string | null
          phone?: string | null
          vehicle_no?: string | null
          items?: string | null
          purpose?: string | null
          host?: string | null
          photo?: string | null
          entry_time?: string
          exit_time?: string | null
          duration?: string | null
          project_name?: string | null
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          staff_id: string
          project_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          project_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          project_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
