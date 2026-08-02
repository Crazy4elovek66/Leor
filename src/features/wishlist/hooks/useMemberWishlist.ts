import { useState, useEffect, useCallback } from 'react';
import { fromTable } from '@/api/supabase';
import type { WishItem } from '../types';

export function useMemberWishlist(targetUserId?: string) {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemberWishlist = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Select wishes for target user (filtered by RLS wishes_select_policy)
      const { data, error: err } = await fromTable('wishes')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (err) throw err;

      const items: WishItem[] = (data || []).map((w: any) => ({
        id: w.id,
        userId: w.user_id,
        title: w.title,
        description: w.description,
        brand: w.brand,
        imageUrl: w.image_url,
        link: w.link,
        price: w.price ? Number(w.price) : null,
        currency: w.currency || 'RUB',
        category: w.category as any,
        priority: w.priority as any,
        visibility: w.visibility as any,
        status: w.status as any,
        sourceType: w.source_type as any,
        context: w.context as any,
        isSurpriseFriendly: w.is_surprise_friendly ?? true,
        sizeOverride: w.size_override,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      }));

      setWishes(items);
    } catch (err: any) {
      console.error('Failed to fetch member wishlist:', err);
      setError(err.message || 'Ошибка загрузки желаний');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchMemberWishlist();
  }, [fetchMemberWishlist]);

  return {
    wishes,
    isLoading,
    error,
    refetch: fetchMemberWishlist,
  };
}
