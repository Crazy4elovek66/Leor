import { useState, useEffect, useCallback } from 'react';
import { fromTable } from '@/api/supabase';
import type { ProfileSection } from '../types';

export function useCircleAccess(circleId?: string, profileId?: string) {
  const [grantedSections, setGrantedSections] = useState<ProfileSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAccesses = useCallback(async () => {
    if (!circleId || !profileId) return;

    try {
      setIsLoading(true);
      const { data, error } = await fromTable('circle_accesses')
        .select('section')
        .eq('circle_id', circleId)
        .eq('profile_id', profileId);

      if (error) throw error;

      const sections: ProfileSection[] = (data || []).map((row: any) => row.section);
      setGrantedSections(sections);
    } catch (err) {
      console.error('Failed to fetch circle accesses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [circleId, profileId]);

  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);

  const toggleSectionAccess = async (section: ProfileSection) => {
    if (!circleId || !profileId) return;

    const isGranted = grantedSections.includes(section);

    if (isGranted) {
      const { error } = await fromTable('circle_accesses')
        .delete()
        .eq('circle_id', circleId)
        .eq('profile_id', profileId)
        .eq('section', section);

      if (error) throw error;
    } else {
      const { error } = await fromTable('circle_accesses').insert({
        circle_id: circleId,
        profile_id: profileId,
        section,
      });

      if (error) throw error;
    }

    await fetchAccesses();
  };

  return {
    grantedSections,
    isLoading,
    toggleSectionAccess,
  };
}
