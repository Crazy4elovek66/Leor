import { useState, useEffect } from 'react';
import { supabase, fromTable } from '@/api/supabase';
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
        const initData = tg?.initData;
        const tgUser = tg?.initDataUnsafe?.user;

        if (initData) {
          // Call Supabase Edge Function to validate initData HMAC
          const { data, error: edgeError } = await supabase.functions.invoke('telegram-auth', {
            body: { initData },
          });

          if (edgeError) {
            console.warn('Edge function auth error, falling back to client upsert:', edgeError);
          } else if (data?.user) {
            setUser(data.user);
            setProfileId(data.user.profileId);
            setIsLoading(false);
            return;
          }
        }

        // Development / Fallback Flow if Edge function is not deployed locally yet
        const telegramId = tgUser?.id || 123456789;
        const firstName = tgUser?.first_name || 'Мария';
        const lastName = tgUser?.last_name || '';
        const username = tgUser?.username || 'maria_leor';
        const avatarUrl = tgUser?.photo_url || null;

        // Upsert user directly in Supabase
        const { data: dbUser, error: userErr } = await fromTable('users')
          .upsert(
            {
              telegram_id: telegramId,
              first_name: firstName,
              last_name: lastName || null,
              username: username || null,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'telegram_id' }
          )
          .select()
          .single();

        if (userErr || !dbUser) {
          throw userErr || new Error('Failed to upsert user');
        }

        // Get or Create GiftProfile
        const { data: existingProfile } = await fromTable('gift_profiles')
          .select('id')
          .eq('user_id', dbUser.id)
          .maybeSingle();

        let profId = existingProfile?.id;

        if (!profId) {
          const { data: newProfile, error: profErr } = await fromTable('gift_profiles')
            .insert({ user_id: dbUser.id })
            .select('id')
            .single();

          if (profErr || !newProfile) throw profErr || new Error('Failed to create gift profile');
          profId = newProfile.id;
        }

        setUser({
          id: dbUser.id,
          telegramId: Number(dbUser.telegram_id),
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          username: dbUser.username,
          avatarUrl: dbUser.avatar_url,
        });
        setProfileId(profId);
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
