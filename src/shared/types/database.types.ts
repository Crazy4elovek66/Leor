export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: number
          username: string | null
          first_name: string
          last_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          username?: string | null
          first_name: string
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          username?: string | null
          first_name?: string
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gift_profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profile_sizes: {
        Row: {
          id: string
          profile_id: string
          category: string
          value: string
          visibility: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          category: string
          value: string
          visibility?: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          category?: string
          value?: string
          visibility?: string
          created_at?: string
        }
      }
      taste_items: {
        Row: {
          id: string
          profile_id: string
          category: string
          title: string
          weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          category: string
          title: string
          weight?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          category?: string
          title?: string
          weight?: number
          created_at?: string
          updated_at?: string
        }
      }
      current_focuses: {
        Row: {
          id: string
          profile_id: string
          title: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          is_active?: boolean
          created_at?: string
        }
      }
      anti_gift_preferences: {
        Row: {
          id: string
          profile_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
