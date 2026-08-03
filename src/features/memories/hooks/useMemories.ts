import { useState, useEffect, useCallback } from 'react';
import { supabase, fromTable } from '@/api/supabase';
import type { MemoryItem, MemoryType } from '../types';
import { toast } from 'sonner';

export function useMemories(ownerUserId?: string) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMemories = useCallback(async () => {
    if (!ownerUserId) return;

    try {
      setIsLoading(true);
      const { data: memRows, error: memErr } = await fromTable('memories')
        .select('*')
        .order('event_date', { ascending: false });

      if (memErr) throw memErr;

      if (!memRows || memRows.length === 0) {
        setMemories([]);
        setIsLoading(false);
        return;
      }

      // Fetch participants for memories
      const memoryIds = memRows.map((m: any) => m.id);
      const { data: partRows } = await fromTable('memory_participants')
        .select('*, users(id, first_name, last_name, avatar_url)')
        .in('memory_id', memoryIds);

      const items: MemoryItem[] = memRows.map((m: any) => {
        const parts = (partRows || [])
          .filter((p: any) => p.memory_id === m.id)
          .map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            name: `${p.users?.first_name || ''} ${p.users?.last_name || ''}`.trim(),
            avatar_url: p.users?.avatar_url || null,
            role: p.role,
          }));

        return {
          id: m.id,
          owner_user_id: m.owner_user_id,
          circle_id: m.circle_id,
          wish_id: m.wish_id,
          gift_reservation_id: m.gift_reservation_id,
          title: m.title,
          description: m.description,
          memory_type: m.memory_type as MemoryType,
          event_date: m.event_date,
          cover_image_url: m.cover_image_url,
          created_at: m.created_at,
          updated_at: m.updated_at,
          participants: parts,
        };
      });

      setMemories(items);
    } catch (err: any) {
      console.error('Failed to fetch memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ownerUserId]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const createMemory = async (payload: {
    title: string;
    description?: string;
    memory_type: MemoryType;
    event_date: string;
    cover_image_url?: string;
    wish_id?: string;
    participant_user_ids?: string[];
  }) => {
    if (!ownerUserId) return null;

    try {
      const { data: memData, error: memErr } = await fromTable('memories')
        .insert({
          owner_user_id: ownerUserId,
          title: payload.title,
          description: payload.description || null,
          memory_type: payload.memory_type,
          event_date: payload.event_date,
          cover_image_url: payload.cover_image_url || null,
          wish_id: payload.wish_id || null,
        })
        .select()
        .single();

      if (memErr) throw memErr;

      // Add participants if any
      if (payload.participant_user_ids && payload.participant_user_ids.length > 0) {
        const participantInserts = payload.participant_user_ids.map((uid) => ({
          memory_id: memData.id,
          user_id: uid,
          role: 'PARTICIPANT',
        }));
        await fromTable('memory_participants').insert(participantInserts);
      }

      toast.success('Воспоминание сохранено!');
      await fetchMemories();
      return memData.id;
    } catch (err: any) {
      toast.error(err.message || 'Ошибка создания воспоминания');
      return null;
    }
  };

  const uploadMemoryImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${ownerUserId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('memory-images')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: pubData } = supabase.storage
        .from('memory-images')
        .getPublicUrl(fileName);

      return pubData.publicUrl;
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки обложки');
      return null;
    }
  };

  return {
    memories,
    isLoading,
    createMemory,
    uploadMemoryImage,
    refetch: fetchMemories,
  };
}
