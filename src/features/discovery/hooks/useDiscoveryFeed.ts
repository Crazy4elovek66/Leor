import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { DiscoveryItem } from '../types';

export function useDiscoveryFeed(limit: number = 20) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await (supabase as any).rpc('get_discovery_feed', {
        p_limit: limit,
      });

      if (err) throw err;

      setItems((data as DiscoveryItem[]) || []);
    } catch (err: any) {
      console.error('Failed to fetch discovery feed:', err);
      setError(err.message || 'Ошибка загрузки ленты открытий');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    items,
    isLoading,
    error,
    refetch: fetchFeed,
  };
}
