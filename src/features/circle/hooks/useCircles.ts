import { useState, useEffect, useCallback } from 'react';
import { fromTable } from '@/api/supabase';
import type { Circle } from '../types';

export function useCircles(userId?: string) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch circles where user is a member
      const { data: memberRows, error: memberErr } = await fromTable('circle_members')
        .select('circle_id, role')
        .eq('user_id', userId);

      if (memberErr) throw memberErr;

      const circleIds = (memberRows || []).map((m: any) => m.circle_id);

      if (circleIds.length === 0) {
        setCircles([]);
        setIsLoading(false);
        return;
      }

      const { data: circleRows, error: circleErr } = await fromTable('circles')
        .select('*')
        .in('id', circleIds)
        .order('created_at', { ascending: false });

      if (circleErr) throw circleErr;

      const result: Circle[] = (circleRows || []).map((c: any) => {
        const memberInfo = memberRows?.find((m: any) => m.circle_id === c.id);
        return {
          id: c.id,
          name: c.name,
          avatarUrl: c.avatar_url,
          ownerId: c.owner_id,
          inviteCode: c.invite_code,
          isArchived: c.is_archived,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          userRole: memberInfo?.role as any,
        };
      });

      setCircles(result);
    } catch (err: any) {
      console.error('Failed to fetch circles:', err);
      setError(err.message || 'Ошибка загрузки кругов');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  // Create new circle
  const createCircle = async (name: string, avatarUrl?: string | null) => {
    if (!userId) return null;

    // Helper Base62 generator for client fallback
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let code = '';
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 10; i++) code += chars[bytes[i] % 62];

    const { data, error: createErr } = await fromTable('circles')
      .insert({
        name,
        avatar_url: avatarUrl || null,
        owner_id: userId,
        invite_code: code,
      })
      .select()
      .single();

    if (createErr) throw createErr;
    await fetchCircles();
    return data;
  };

  // Archive circle (owner only)
  const archiveCircle = async (circleId: string) => {
    const { error: err } = await fromTable('circles')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', circleId);

    if (err) throw err;
    await fetchCircles();
  };

  return {
    circles,
    isLoading,
    error,
    refetch: fetchCircles,
    createCircle,
    archiveCircle,
  };
}
