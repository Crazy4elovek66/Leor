import type { WishCategory, WishPriority } from '@/features/wishlist/types';
import type { Database } from '@/shared/types/database.types';

export type TasteCategory = Database['public']['Enums']['taste_category'];
export type SizeCategory = Database['public']['Enums']['size_category'];

export interface PublicShareConfig {
  id: string;
  profile_id: string;
  share_token: string;
  is_active: boolean;
  show_basic_info: boolean;
  show_interests: boolean;
  show_wishlist: boolean;
  show_sizes: boolean;
}

export interface PublicWish {
  title: string;
  description: string | null;
  brand: string | null;
  image_url: string | null;
  link: string | null;
  price: number | null;
  currency: string;
  category: WishCategory;
  priority: WishPriority;
}

export interface PublicInterest {
  category: TasteCategory;
  title: string;
  weight: number;
}

export interface PublicSize {
  category: SizeCategory;
  value: string;
}

export interface PublicProfileData {
  found: boolean;
  error?: string;
  owner?: {
    first_name: string;
    last_name: string | null;
    avatar_url: string | null;
  };
  basic_info?: {
    bio: string | null;
    city: string | null;
    birth_date: string | null;
  } | null;
  show_interests?: boolean;
  show_wishlist?: boolean;
  show_sizes?: boolean;
  interests?: PublicInterest[];
  wishes?: PublicWish[];
  sizes?: PublicSize[];
}
