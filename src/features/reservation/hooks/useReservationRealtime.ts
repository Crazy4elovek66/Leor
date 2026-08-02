import { useEffect } from 'react';
import { supabase } from '@/api/supabase';

export function useReservationRealtime(onReservationChange: (wishId: string) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('public:gift_reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gift_reservations' },
        (payload: any) => {
          const wishId = payload.new?.wish_id || payload.old?.wish_id;
          if (wishId) {
            onReservationChange(wishId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onReservationChange]);
}
