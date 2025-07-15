import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

// Warn if using demo mode
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not configured. Using demo mode.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          game_code: string
          status: 'waiting' | 'active' | 'finished'
          current_question: number
          host_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_code: string
          status?: 'waiting' | 'active' | 'finished'
          current_question?: number
          host_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_code?: string
          status?: 'waiting' | 'active' | 'finished'
          current_question?: number
          host_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          game_id: string
          name: string
          team: 'adah' | 'ruth' | 'esther' | 'martha' | 'electa'
          score: number
          is_host: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name: string
          team: 'adah' | 'ruth' | 'esther' | 'martha' | 'electa'
          score?: number
          is_host?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string
          team?: 'adah' | 'ruth' | 'esther' | 'martha' | 'electa'
          score?: number
          is_host?: boolean
          joined_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          game_id: string
          player_id: string
          question_id: number
          answer: string
          is_correct: boolean
          submitted_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          question_id: number
          answer: string
          is_correct: boolean
          submitted_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          question_id?: number
          answer?: string
          is_correct?: boolean
          submitted_at?: string
        }
      }
    }
  }
}