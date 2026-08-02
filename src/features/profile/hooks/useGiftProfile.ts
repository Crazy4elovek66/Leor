import { useState, useEffect, useCallback } from 'react';
import { fromTable } from '@/api/supabase';
import type { FullGiftProfile, ProfileSizeItem, TasteItem, TasteCategory } from '../types';

export function useGiftProfile(userId?: string, profileId?: string) {
  const [profile, setProfile] = useState<FullGiftProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId || !profileId) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch User Base Info
      const { data: dbUser, error: userError } = await fromTable('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !dbUser) throw userError || new Error('User not found');

      // 2. Fetch GiftProfile
      const { data: dbProfile, error: profileError } = await fromTable('gift_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError || !dbProfile) throw profileError || new Error('Gift profile not found');

      // 3. Fetch Sizes
      const { data: dbSizes } = await fromTable('profile_sizes')
        .select('*')
        .eq('profile_id', profileId);

      // 4. Fetch Tastes (Interests)
      const { data: dbTastes } = await fromTable('taste_items')
        .select('*')
        .eq('profile_id', profileId);

      const sizes: ProfileSizeItem[] = (dbSizes || []).map((s: any) => ({
        id: s.id,
        category: s.category as any,
        value: s.value,
        visibility: s.visibility as any,
      }));

      const tastes: TasteItem[] = (dbTastes || []).map((t: any) => ({
        id: t.id,
        category: t.category as any,
        title: t.title,
        weight: t.weight,
      }));

      // Calculate completeness %
      let score = 0;
      if (dbUser.first_name) score += 10;
      if (dbProfile.bio) score += 10;
      if (dbProfile.birth_date) score += 10;
      if (dbProfile.city) score += 10;
      if (tastes.length >= 1) score += 15;
      if (tastes.length >= 3) score += 15;
      if (sizes.length >= 1) score += 15;
      if (sizes.length >= 3) score += 15;

      setProfile({
        id: dbProfile.id,
        userId: dbProfile.user_id,
        bio: dbProfile.bio,
        birthDate: dbProfile.birth_date,
        city: dbProfile.city,
        user: {
          id: dbUser.id,
          telegramId: Number(dbUser.telegram_id),
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          username: dbUser.username,
          avatarUrl: dbUser.avatar_url,
        },
        sizes,
        tastes,
        completeness: Math.min(100, score),
      });
    } catch (err: any) {
      console.error('Failed to load GiftProfile:', err);
      setError(err.message || 'Ошибка загрузки профиля');
    } finally {
      setIsLoading(false);
    }
  }, [userId, profileId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update Base Profile
  const updateBaseProfile = async (data: { bio?: string; birthDate?: string; city?: string }) => {
    if (!profileId) return;

    const { error: err } = await fromTable('gift_profiles')
      .update({
        bio: data.bio || null,
        birth_date: data.birthDate || null,
        city: data.city || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (err) throw err;
    await fetchProfile();
  };

  // Add or Remove Interest
  const toggleInterest = async (category: TasteCategory, title: string) => {
    if (!profileId || !profile) return;

    const existing = profile.tastes.find((t) => t.category === category && t.title === title);

    if (existing && existing.id) {
      const { error: err } = await fromTable('taste_items').delete().eq('id', existing.id);
      if (err) throw err;
    } else {
      const { error: err } = await fromTable('taste_items').insert({
        profile_id: profileId,
        category,
        title,
      });
      if (err) throw err;
    }

    await fetchProfile();
  };

  // Upsert Size
  const setSize = async (category: string, value: string) => {
    if (!profileId || !profile) return;

    const existing = profile.sizes.find((s) => s.category === category);

    if (value.trim() === '') {
      if (existing && existing.id) {
        await fromTable('profile_sizes').delete().eq('id', existing.id);
      }
    } else {
      await fromTable('profile_sizes').insert({
        profile_id: profileId,
        category,
        value,
        visibility: 'CIRCLE',
      });
    }

    await fetchProfile();
  };

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateBaseProfile,
    toggleInterest,
    setSize,
  };
}
