import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { TasteGraphData } from '../types';

export function useTasteGraph(profileId?: string) {
  const [data, setData] = useState<TasteGraphData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    if (!profileId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: resData, error: err } = await (supabase as any).rpc('get_taste_graph', {
        p_profile_id: profileId,
      });

      if (err) throw err;

      setData((resData as TasteGraphData) || null);
    } catch (err: any) {
      console.error('Failed to fetch taste graph:', err);
      setError(err.message || 'Ошибка загрузки графа вкусов');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return {
    graphData: data,
    isLoading,
    error,
    refetch: fetchGraph,
  };
}
