import { useState, useCallback, useEffect } from 'react';
import { supabase, fromTable } from '@/api/supabase';
import type { PublicShareConfig } from '../types';
import { toast } from 'sonner';

export function useShareSettings(profileId?: string) {
  const [config, setConfig] = useState<PublicShareConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, setIsPending] = useState<boolean>(false);

  const fetchConfig = useCallback(async () => {
    if (!profileId) return;

    try {
      setIsLoading(true);
      const { data, error } = await fromTable('public_profile_shares')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as PublicShareConfig | null);
    } catch (err: any) {
      console.error('Failed to fetch share config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const createShareLink = async () => {
    if (!profileId) return;
    try {
      setIsPending(true);
      const { data, error } = await (supabase as any).rpc('create_public_share', { p_profile_id: profileId });
      if (error) throw error;

      setConfig(data as PublicShareConfig);
      toast.success('Публичная ссылка создана!');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка создания ссылки');
    } finally {
      setIsPending(false);
    }
  };

  const rotateToken = async () => {
    if (!profileId) return;
    try {
      setIsPending(true);
      const { data, error } = await (supabase as any).rpc('rotate_public_share_token', { p_profile_id: profileId });
      if (error) throw error;

      setConfig(data as PublicShareConfig);
      toast.success('Ссылка обновлена! Старая ссылка больше недоступна.');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка обновления ссылки');
    } finally {
      setIsPending(false);
    }
  };

  const disableShare = async () => {
    if (!profileId) return;
    try {
      setIsPending(true);
      const { error } = await (supabase as any).rpc('disable_public_share', { p_profile_id: profileId });
      if (error) throw error;

      setConfig((prev) => (prev ? { ...prev, is_active: false } : null));
      toast.success('Публичная ссылка отключена');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отключения ссылки');
    } finally {
      setIsPending(false);
    }
  };

  const updateVisibility = async (basic: boolean, interests: boolean, wishlist: boolean, sizes: boolean) => {
    if (!profileId) return;

    // Client-side validation: at least one section must remain visible
    if (!basic && !interests && !wishlist && !sizes) {
      toast.error('Выделите минимум один раздел для показа по публичной ссылке');
      return;
    }

    try {
      setIsPending(true);
      const { data, error } = await (supabase as any).rpc('update_public_share_visibility', {
        p_profile_id: profileId,
        p_basic: basic,
        p_interests: interests,
        p_wishlist: wishlist,
        p_sizes: sizes,
      });
      if (error) throw error;

      setConfig(data as PublicShareConfig);
      toast.success('Настройки видимости сохранены');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка сохранения настроек');
    } finally {
      setIsPending(false);
    }
  };

  return {
    config,
    isLoading,
    isPending,
    createShareLink,
    rotateToken,
    disableShare,
    updateVisibility,
    refetch: fetchConfig,
  };
}
