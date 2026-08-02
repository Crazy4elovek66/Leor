import { useState, useEffect, useCallback } from 'react';
import { supabase, fromTable } from '@/api/supabase';
import type { WishItem, CreateWishPayload, UpdateWishPayload } from '../types';

export function useWishlist(userId?: string) {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await fromTable('wishes')
        .select('*')
        .eq('user_id', userId)
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
      console.error('Failed to fetch wishlist:', err);
      setError(err.message || 'Ошибка загрузки желаний');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Upload image to Supabase Storage 'wish-images'
  const uploadWishImage = async (file: File): Promise<string | null> => {
    if (!userId) return null;

    try {
      const ext = file.name.split('.').pop() || 'jpeg';
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('wish-images')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('wish-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err: any) {
      console.error('Upload image failed:', err);
      return null;
    }
  };

  // Create wish
  const createWish = async (payload: CreateWishPayload) => {
    if (!userId) return null;

    const { data, error: createErr } = await fromTable('wishes')
      .insert({
        user_id: userId,
        title: payload.title,
        description: payload.description || null,
        brand: payload.brand || null,
        image_url: payload.imageUrl || null,
        link: payload.link || null,
        price: payload.price !== undefined ? payload.price : null,
        currency: payload.currency || 'RUB',
        category: payload.category || 'OTHER',
        priority: payload.priority || 'MEDIUM',
        context: payload.context || 'JUST_WANT',
        is_surprise_friendly: payload.isSurpriseFriendly ?? true,
        size_override: payload.sizeOverride || null,
      })
      .select()
      .single();

    if (createErr) throw createErr;
    await fetchWishlist();
    return data;
  };

  // Update wish
  const updateWish = async (wishId: string, payload: UpdateWishPayload) => {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description || null;
    if (payload.brand !== undefined) updateData.brand = payload.brand || null;
    if (payload.imageUrl !== undefined) updateData.image_url = payload.imageUrl || null;
    if (payload.link !== undefined) updateData.link = payload.link || null;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.currency !== undefined) updateData.currency = payload.currency;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.context !== undefined) updateData.context = payload.context;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.isSurpriseFriendly !== undefined) updateData.is_surprise_friendly = payload.isSurpriseFriendly;
    if (payload.sizeOverride !== undefined) updateData.size_override = payload.sizeOverride || null;

    const { error: err } = await fromTable('wishes').update(updateData).eq('id', wishId);
    if (err) throw err;
    await fetchWishlist();
  };

  // Archive wish
  const archiveWish = async (wishId: string) => {
    await updateWish(wishId, { status: 'ARCHIVED' });
  };

  // Delete wish
  const deleteWish = async (wishId: string) => {
    const { error: err } = await fromTable('wishes').delete().eq('id', wishId);
    if (err) throw err;
    await fetchWishlist();
  };

  return {
    wishes,
    isLoading,
    error,
    refetch: fetchWishlist,
    uploadWishImage,
    createWish,
    updateWish,
    archiveWish,
    deleteWish,
  };
}
