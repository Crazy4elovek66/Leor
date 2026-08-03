import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { getTelegramWebApp, initTelegramApp } from '@/lib/telegram';
import type { UserBasicInfo } from '@/features/profile/types';

export function useTelegramAuth() {
  const [user, setUser] = useState<UserBasicInfo | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initTelegramApp();

    async function authenticate() {
      try {
        setIsLoading(true);
        const tg = getTelegramWebApp();
        let initData = tg?.initData;

        // If running in standalone dev browser outside Telegram, provide dev mock initData
        if (!initData) {
          const mockUser = encodeURIComponent(
            JSON.stringify({
              id: 123456789,
              first_name: 'Мария',
              last_name: '',
              username: 'maria_leor',
            })
          );
          const authDate = Math.floor(Date.now() / 1000);
          initData = `user=${mockUser}&auth_date=${authDate}&hash=dev_mock_hash`;
        }

        // 1. Invoke Edge Function 'telegram-auth'
        const { data, error: edgeError } = await supabase.functions.invoke('telegram-auth', {
          body: { initData },
        });

        if (edgeError || !data?.access_token || !data?.refresh_token || !data?.user) {
          throw new Error(edgeError?.message || data?.error || 'Telegram WebApp auth failed');
        }

        // 2. Establish Supabase Auth session for RLS and auth.uid()
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) {
          throw sessionError;
        }

        setUser(data.user);
        setProfileId(data.user.profileId);
      } catch (err: any) {
        console.error('Authentication failed:', err);
        setError(err.message || 'Ошибка авторизации');
      } finally {
        setIsLoading(false);
      }
    }

    authenticate();
  }, []);

  return { user, profileId, isLoading, error };
}
