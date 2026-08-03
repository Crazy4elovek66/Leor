import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { TimelineItem } from '../types';

export function useTimeline(profileId?: string) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRestricted, setIsRestricted] = useState<boolean>(false);

  const fetchTimeline = useCallback(async () => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any).rpc('get_relationship_timeline', {
        p_profile_id: profileId,
      });

      if (error) throw error;

      const res = data as any;
      if (res?.restricted) {
        setIsRestricted(true);
        setItems([]);
      } else {
        setIsRestricted(false);
        setItems((res?.items as TimelineItem[]) || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    items,
    isLoading,
    isRestricted,
    refetch: fetchTimeline,
  };
}
