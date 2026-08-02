import { useState, useEffect, useCallback } from 'react';
import { fromTable } from '@/api/supabase';
import type { FullGiftProfile, ProfileSizeItem, TasteItem } from '@/features/profile/types';

export function useMemberProfile(targetProfileId?: string) {
  const [profile, setProfile] = useState<FullGiftProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemberProfile = useCallback(async () => {
    if (!targetProfileId) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch GiftProfile (filtered by RLS can_view_profile(id, 'BASIC_INFO'))
      const { data: dbProfile, error: profErr } = await fromTable('gift_profiles')
        .select('*')
        .eq('id', targetProfileId)
        .maybeSingle();

      if (profErr || !dbProfile) {
        setError('У вас нет доступа к просмотру этого профиля или профиль не найден');
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // 2. Fetch User info
      const { data: dbUser, error: userErr } = await fromTable('users')
        .select('*')
        .eq('id', dbProfile.user_id)
        .single();

      if (userErr || !dbUser) throw userErr || new Error('Пользователь не найден');

      // 3. Fetch Sizes (filtered by RLS can_view_profile(profile_id, 'SIZES'))
      const { data: dbSizes } = await fromTable('profile_sizes')
        .select('*')
        .eq('profile_id', targetProfileId);

      // 4. Fetch Tastes (filtered by RLS can_view_profile(profile_id, 'INTERESTS'))
      const { data: dbTastes } = await fromTable('taste_items')
        .select('*')
        .eq('profile_id', targetProfileId);

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
        completeness: 100, // Not displayed for other member profiles
      });
    } catch (err: any) {
      console.error('Failed to load member profile:', err);
      setError(err.message || 'Ошибка доступа к профилю');
    } finally {
      setIsLoading(false);
    }
  }, [targetProfileId]);

  useEffect(() => {
    fetchMemberProfile();
  }, [fetchMemberProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchMemberProfile,
  };
}
