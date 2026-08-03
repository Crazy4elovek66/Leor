import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { RelationshipSummaryData } from '../types';

export function useRelationshipSummary(profileId?: string) {
  const [data, setData] = useState<RelationshipSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSummary = useCallback(async () => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: resData, error: err } = await (supabase as any).rpc('get_relationship_summary', {
        p_profile_id: profileId,
      });

      if (err) throw err;

      setData(resData as RelationshipSummaryData);
    } catch (err: any) {
      console.error('Failed to fetch relationship summary:', err);
      setData({ found: false, error: err.message || 'Ошибка загрузки аналитики отношений' } as any);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    isLoading,
    refetch: fetchSummary,
  };
}
