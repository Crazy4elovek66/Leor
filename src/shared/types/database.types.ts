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
          category: Database['public']['Enums']['size_category']
          value: string
          visibility: Database['public']['Enums']['visibility_level']
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          category: Database['public']['Enums']['size_category']
          value: string
          visibility?: Database['public']['Enums']['visibility_level']
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          category?: Database['public']['Enums']['size_category']
          value?: string
          visibility?: Database['public']['Enums']['visibility_level']
          created_at?: string
        }
      }
      taste_items: {
        Row: {
          id: string
          profile_id: string
          category: Database['public']['Enums']['taste_category']
          title: string
          weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          category: Database['public']['Enums']['taste_category']
          title: string
          weight?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          category?: Database['public']['Enums']['taste_category']
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
      circles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          owner_id: string
          invite_code: string
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          avatar_url?: string | null
          owner_id: string
          invite_code: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          owner_id?: string
          invite_code?: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      circle_members: {
        Row: {
          id: string
          circle_id: string
          user_id: string
          role: Database['public']['Enums']['circle_role']
          joined_at: string
        }
        Insert: {
          id?: string
          circle_id: string
          user_id: string
          role?: Database['public']['Enums']['circle_role']
          joined_at?: string
        }
        Update: {
          id?: string
          circle_id?: string
          user_id?: string
          role?: Database['public']['Enums']['circle_role']
          joined_at?: string
        }
      }
      circle_accesses: {
        Row: {
          id: string
          circle_id: string
          profile_id: string
          section: Database['public']['Enums']['profile_section']
          created_at: string
        }
        Insert: {
          id?: string
          circle_id: string
          profile_id: string
          section: Database['public']['Enums']['profile_section']
          created_at?: string
        }
        Update: {
          id?: string
          circle_id?: string
          profile_id?: string
          section?: Database['public']['Enums']['profile_section']
          created_at?: string
        }
      }
      wishes: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          brand: string | null
          image_url: string | null
          link: string | null
          price: number | null
          currency: string
          category: Database['public']['Enums']['wish_category']
          priority: Database['public']['Enums']['wish_priority']
          visibility: Database['public']['Enums']['visibility_level']
          status: Database['public']['Enums']['wish_status']
          source_type: Database['public']['Enums']['wish_source']
          context: Database['public']['Enums']['wish_context']
          is_surprise_friendly: boolean
          size_override: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          brand?: string | null
          image_url?: string | null
          link?: string | null
          price?: number | null
          currency?: string
          category?: Database['public']['Enums']['wish_category']
          priority?: Database['public']['Enums']['wish_priority']
          visibility?: Database['public']['Enums']['visibility_level']
          status?: Database['public']['Enums']['wish_status']
          source_type?: Database['public']['Enums']['wish_source']
          context?: Database['public']['Enums']['wish_context']
          is_surprise_friendly?: boolean
          size_override?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          brand?: string | null
          image_url?: string | null
          link?: string | null
          price?: number | null
          currency?: string
          category?: Database['public']['Enums']['wish_category']
          priority?: Database['public']['Enums']['wish_priority']
          visibility?: Database['public']['Enums']['visibility_level']
          status?: Database['public']['Enums']['wish_status']
          source_type?: Database['public']['Enums']['wish_source']
          context?: Database['public']['Enums']['wish_context']
          is_surprise_friendly?: boolean
          size_override?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      gift_profile_public: {
        Row: {
          profile_id: string
          user_id: string
          first_name: string
          avatar_url: string | null
          bio: string | null
          city: string | null
          birth_date: string | null
        }
      }
    }
    Functions: {
      calculate_profile_completeness: {
        Args: {
          p_profile_id: string
        }
        Returns: number
      }
      can_view_profile: {
        Args: {
          p_profile_id: string
          p_section?: Database['public']['Enums']['profile_section'] | null
        }
        Returns: boolean
      }
      check_circle_access: {
        Args: {
          p_profile_id: string
          p_section?: Database['public']['Enums']['profile_section'] | null
        }
        Returns: boolean
      }
    }
    Enums: {
      visibility_level: 'PRIVATE' | 'CIRCLE' | 'SELECTED_CIRCLES' | 'PUBLIC'
      size_category: 'CLOTHING_TOP' | 'CLOTHING_BOTTOM' | 'SHOES' | 'RING' | 'BRACELET' | 'NECKLACE'
      taste_category: 'MOVIES' | 'BOOKS' | 'GAMES' | 'MUSIC' | 'TRAVEL' | 'STYLE' | 'HOME' | 'FOOD' | 'SPORT' | 'HOBBY' | 'BRANDS'
      circle_role: 'OWNER' | 'MEMBER'
      profile_section: 'BASIC_INFO' | 'INTERESTS' | 'SIZES' | 'WISHLIST' | 'MEMORIES'
      wish_category: 'TECH' | 'BOOKS' | 'CLOTHING' | 'BEAUTY' | 'HOME' | 'HOBBY' | 'FOOD' | 'TRAVEL' | 'EXPERIENCE' | 'OTHER'
      wish_priority: 'LOW' | 'MEDIUM' | 'HIGH'
      wish_status: 'ACTIVE' | 'ARCHIVED'
      wish_source: 'MANUAL' | 'LINK' | 'IMPORT'
      wish_context: 'BIRTHDAY' | 'NEW_YEAR' | 'ANNIVERSARY' | 'JUST_WANT' | 'SOMEDAY' | 'OTHER'
    }
  }
}
