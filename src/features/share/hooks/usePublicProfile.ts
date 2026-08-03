import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { PublicProfileData } from '../types';

export function usePublicProfile(token?: string) {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPublicProfile = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: resData, error: err } = await (supabase as any).rpc('get_public_profile', {
        p_token: token,
      });

      if (err) throw err;

      setData(resData as PublicProfileData);
    } catch (err: any) {
      console.error('Failed to fetch public profile:', err);
      setData({ found: false, error: err.message || 'Ошибка загрузки профиля' });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPublicProfile();
  }, [fetchPublicProfile]);

  return {
    data,
    isLoading,
    refetch: fetchPublicProfile,
  };
}
