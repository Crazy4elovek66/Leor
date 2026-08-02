import type { WishCategory, WishPriority } from '@/features/wishlist/types';

export interface DiscoveryItem {
  wish_id: string;
  owner_id: string;
  title: string;
  description: string | null;
  brand: string | null;
  image_url: string | null;
  link: string | null;
  price: number | null;
  currency: string;
  category: WishCategory;
  priority: WishPriority;
  owner_name: string;
  owner_avatar: string | null;
  score: number;
  match_percentage: number;
  reasons: string[];
  matched_nodes: string[];
}
