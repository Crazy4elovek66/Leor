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
      gift_reservations: {
        Row: {
          id: string
          wish_id: string
          reserved_by: string
          status: Database['public']['Enums']['gift_reservation_status']
          reserved_at: string
          confirmed_at: string | null
          cancelled_at: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wish_id: string
          reserved_by: string
          status?: Database['public']['Enums']['gift_reservation_status']
          reserved_at?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wish_id?: string
          reserved_by?: string
          status?: Database['public']['Enums']['gift_reservation_status']
          reserved_at?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      taste_graph_nodes: {
        Row: {
          id: string
          user_id: string
          node_type: Database['public']['Enums']['taste_node_type']
          value: string
          weight: number
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          node_type: Database['public']['Enums']['taste_node_type']
          value: string
          weight?: number
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          node_type?: Database['public']['Enums']['taste_node_type']
          value?: string
          weight?: number
          source?: string
          created_at?: string
          updated_at?: string
        }
      }
      taste_graph_edges: {
        Row: {
          id: string
          user_id: string
          from_node_id: string
          to_node_id: string
          strength: number
          source_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_node_id: string
          to_node_id: string
          strength?: number
          source_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_node_id?: string
          to_node_id?: string
          strength?: number
          source_count?: number
          created_at?: string
        }
      }
      public_profile_shares: {
        Row: {
          id: string
          profile_id: string
          share_token: string
          is_active: boolean
          show_basic_info: boolean
          show_interests: boolean
          show_wishlist: boolean
          show_sizes: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          share_token: string
          is_active?: boolean
          show_basic_info?: boolean
          show_interests?: boolean
          show_wishlist?: boolean
          show_sizes?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          share_token?: string
          is_active?: boolean
          show_basic_info?: boolean
          show_interests?: boolean
          show_wishlist?: boolean
          show_sizes?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      memories: {
        Row: {
          id: string
          owner_user_id: string
          circle_id: string | null
          wish_id: string | null
          gift_reservation_id: string | null
          title: string
          description: string | null
          memory_type: Database['public']['Enums']['memory_type']
          event_date: string
          cover_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          circle_id?: string | null
          wish_id?: string | null
          gift_reservation_id?: string | null
          title: string
          description?: string | null
          memory_type?: Database['public']['Enums']['memory_type']
          event_date?: string
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_user_id?: string
          circle_id?: string | null
          wish_id?: string | null
          gift_reservation_id?: string | null
          title?: string
          description?: string | null
          memory_type?: Database['public']['Enums']['memory_type']
          event_date?: string
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      memory_participants: {
        Row: {
          id: string
          memory_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      memory_media: {
        Row: {
          id: string
          memory_id: string
          image_url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          image_url: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          image_url?: string
          sort_order?: number
          created_at?: string
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
      wish_reservation_status: {
        Row: {
          wish_id: string
          has_reservation: boolean
          is_confirmed: boolean
          expires_at: string
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
      get_wish_reservation_state: {
        Args: {
          p_wish_id: string
        }
        Returns: string
      }
      reserve_wish: {
        Args: {
          p_wish_id: string
        }
        Returns: Json
      }
      cancel_reservation: {
        Args: {
          p_wish_id: string
        }
        Returns: Json
      }
      confirm_reservation: {
        Args: {
          p_wish_id: string
        }
        Returns: Json
      }
      expire_old_reservations: {
        Args: Record<string, never>
        Returns: number
      }
      calculate_taste_weight: {
        Args: {
          p_user_id: string
          p_node_type: Database['public']['Enums']['taste_node_type']
          p_value: string
        }
        Returns: number
      }
      rebuild_taste_graph: {
        Args: {
          p_user_id: string
        }
        Returns: void
      }
      get_taste_graph: {
        Args: {
          p_profile_id: string
        }
        Returns: Json
      }
      get_discovery_feed: {
        Args: {
          p_limit?: number
        }
        Returns: Json
      }
      create_public_share: {
        Args: {
          p_profile_id: string
        }
        Returns: Json
      }
      rotate_public_share_token: {
        Args: {
          p_profile_id: string
        }
        Returns: Json
      }
      disable_public_share: {
        Args: {
          p_profile_id: string
        }
        Returns: Json
      }
      update_public_share_visibility: {
        Args: {
          p_profile_id: string
          p_basic: boolean
          p_interests: boolean
          p_wishlist: boolean
          p_sizes: boolean
        }
        Returns: Json
      }
      get_public_profile: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      get_relationship_timeline: {
        Args: {
          p_profile_id: string
        }
        Returns: Json
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
      gift_reservation_status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'
      taste_node_type: 'BRAND' | 'CATEGORY' | 'STYLE' | 'COLOR' | 'MATERIAL' | 'HOBBY' | 'BOOK' | 'MOVIE' | 'GAME' | 'MUSIC' | 'TRAVEL' | 'FOOD' | 'CREATOR' | 'OTHER'
      memory_type: 'GIFT' | 'EVENT' | 'PHOTO' | 'TRAVEL' | 'CELEBRATION' | 'ACHIEVEMENT' | 'MILESTONE' | 'OTHER'
    }
  }
}
