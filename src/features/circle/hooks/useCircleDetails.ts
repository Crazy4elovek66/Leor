import { useState, useEffect, useCallback } from 'react';
import { supabase, fromTable } from '@/api/supabase';
import type { Circle, CircleMember } from '../types';

export function useCircleDetails(circleId?: string, currentUserId?: string) {
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!circleId) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch Circle
      const { data: cData, error: cErr } = await fromTable('circles')
        .select('*')
        .eq('id', circleId)
        .single();

      if (cErr || !cData) throw cErr || new Error('Круг не найден');

      setCircle({
        id: cData.id,
        name: cData.name,
        avatarUrl: cData.avatar_url,
        ownerId: cData.owner_id,
        inviteCode: cData.invite_code,
        isArchived: cData.is_archived,
        createdAt: cData.created_at,
        updatedAt: cData.updated_at,
      });

      // 2. Fetch Members & User info
      const { data: mRows, error: mErr } = await fromTable('circle_members')
        .select('*')
        .eq('circle_id', circleId);

      if (mErr) throw mErr;

      const userIds = (mRows || []).map((m: any) => m.user_id);
      if (userIds.length === 0) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      const { data: userRows } = await fromTable('users')
        .select('*')
        .in('id', userIds);

      const { data: profileRows } = await fromTable('gift_profiles')
        .select('id, user_id')
        .in('user_id', userIds);

      const result: CircleMember[] = (mRows || []).map((m: any) => {
        const u = userRows?.find((usr: any) => usr.id === m.user_id);
        const p = profileRows?.find((prof: any) => prof.user_id === m.user_id);

        return {
          id: m.id,
          circleId: m.circle_id,
          userId: m.user_id,
          role: m.role as any,
          joinedAt: m.joined_at,
          profileId: p?.id,
          user: {
            id: u?.id || m.user_id,
            telegramId: Number(u?.telegram_id || 0),
            firstName: u?.first_name || 'Участник',
            lastName: u?.last_name || null,
            username: u?.username || null,
            avatarUrl: u?.avatar_url || null,
          },
        };
      });

      setMembers(result);
    } catch (err: any) {
      console.error('Failed to fetch circle details:', err);
      setError(err.message || 'Ошибка загрузки данных круга');
    } finally {
      setIsLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Generate new invite code via Edge Function or Direct fallback
  const regenerateInviteCode = async () => {
    if (!circleId || !currentUserId) return null;

    try {
      const { data, error: edgeErr } = await supabase.functions.invoke('circle-invite', {
        body: { action: 'generate', circleId, userId: currentUserId },
      });

      if (!edgeErr && data?.inviteCode) {
        await fetchDetails();
        return data.inviteCode;
      }
    } catch (e) {
      console.warn('Edge function invoke fallback to direct update');
    }

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let newCode = '';
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 10; i++) newCode += chars[bytes[i] % 62];

    const { error: updateErr } = await fromTable('circles')
      .update({ invite_code: newCode, updated_at: new Date().toISOString() })
      .eq('id', circleId);

    if (updateErr) throw updateErr;
    await fetchDetails();
    return newCode;
  };

  // Remove member from circle
  const removeMember = async (memberUserId: string) => {
    if (!circleId) return;

    const { error: delErr } = await fromTable('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', memberUserId);

    if (delErr) throw delErr;
    await fetchDetails();
  };

  return {
    circle,
    members,
    isLoading,
    error,
    refetch: fetchDetails,
    regenerateInviteCode,
    removeMember,
  };
}
