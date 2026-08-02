import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useReservationRealtime } from './useReservationRealtime';
import type { WishReservationState } from '../types';
import { toast } from 'sonner';

export function useWishReservations(wishIds: string[]) {
  const [reservationStates, setReservationStates] = useState<Record<string, WishReservationState>>({});
  const [pendingWishes, setPendingWishes] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch reservation state for a single wish via RPC get_wish_reservation_state
  const fetchSingleState = useCallback(async (wishId: string) => {
    try {
      const { data, error } = await (supabase as any).rpc('get_wish_reservation_state', {
        p_wish_id: wishId,
      });

      if (error) throw error;

      setReservationStates((prev) => ({
        ...prev,
        [wishId]: (data as WishReservationState) || 'AVAILABLE',
      }));
    } catch (err) {
      console.error(`Failed to fetch reservation state for wish ${wishId}:`, err);
    }
  }, []);

  // Fetch state for all wishIds
  const fetchAllStates = useCallback(async () => {
    if (!wishIds || wishIds.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(wishIds.map((id) => fetchSingleState(id)));
    } finally {
      setIsLoading(false);
    }
  }, [wishIds, fetchSingleState]);

  useEffect(() => {
    fetchAllStates();
  }, [fetchAllStates]);

  // Realtime subscription callback updating ONLY affected wishId
  useReservationRealtime(useCallback((wishId: string) => {
    fetchSingleState(wishId);
  }, [fetchSingleState]));

  // Optimistic Reserve Wish with Rollback
  const reserveWish = async (wishId: string) => {
    const previousState = reservationStates[wishId] || 'AVAILABLE';

    // 1. Optimistic Update
    setReservationStates((prev) => ({ ...prev, [wishId]: 'RESERVED_BY_ME' }));
    setPendingWishes((prev) => ({ ...prev, [wishId]: true }));

    try {
      const { data, error } = await (supabase as any).rpc('reserve_wish', { p_wish_id: wishId });
      const res = data as any;

      if (error || !res?.success) {
        // Rollback
        setReservationStates((prev) => ({ ...prev, [wishId]: previousState }));

        const errState = res?.state;
        if (errState === 'ALREADY_RESERVED') {
          toast.error('Подарок уже забронирован');
        } else if (errState === 'FORBIDDEN') {
          toast.error('Нет доступа');
        } else {
          toast.error(res?.error || error?.message || 'Не удалось забронировать подарок');
        }
        return false;
      }

      toast.success('Подарок забронирован! У вас есть 72 часа для подтверждения.');
      await fetchSingleState(wishId);
      return true;
    } catch (err: any) {
      // Rollback on catch
      setReservationStates((prev) => ({ ...prev, [wishId]: previousState }));
      toast.error(err.message || 'Ошибка бронирования');
      return false;
    } finally {
      setPendingWishes((prev) => ({ ...prev, [wishId]: false }));
    }
  };

  // Optimistic Cancel Reservation with Rollback
  const cancelReservation = async (wishId: string) => {
    const previousState = reservationStates[wishId] || 'RESERVED_BY_ME';

    // 1. Optimistic Update
    setReservationStates((prev) => ({ ...prev, [wishId]: 'AVAILABLE' }));
    setPendingWishes((prev) => ({ ...prev, [wishId]: true }));

    try {
      const { data, error } = await (supabase as any).rpc('cancel_reservation', { p_wish_id: wishId });
      const res = data as any;

      if (error || !res?.success) {
        // Rollback
        setReservationStates((prev) => ({ ...prev, [wishId]: previousState }));
        toast.error(res?.error || error?.message || 'Не удалось отменить бронь');
        return false;
      }

      toast.success('Бронь отменена');
      await fetchSingleState(wishId);
      return true;
    } catch (err: any) {
      // Rollback
      setReservationStates((prev) => ({ ...prev, [wishId]: previousState }));
      toast.error(err.message || 'Ошибка отмены брони');
      return false;
    } finally {
      setPendingWishes((prev) => ({ ...prev, [wishId]: false }));
    }
  };

  // Optimistic Confirm Reservation with Rollback
  const confirmReservation = async (wishId: string) => {
    const previousState = reservationStates[wishId] || 'RESERVED_BY_ME';

    // 1. Optimistic Update
    setReservationStates((prev) => ({ ...prev, [wishId]: 'CONFIRMED' }));
    setPendingWishes((prev) => ({ ...prev, [wishId]: true }));

    try {
      const { data, error } = await (supabase as any).rpc('confirm_reservation', { p_wish_id: wishId });
      const res = data as any;

      if (error || !res?.success) {
        // Rollback
        setReservationStates((prev) => ({ ...prev, [wishId]: previousState }));
        toast.error(res?.error || error?.message || 'Не удалось подтвердить покупку');
        return false;
      }

      toast.success('Покупка подтверждена! Спасибо за подарок 🎉');
      await fetchSingleState(wishId);
      return true;
    } catch (err: any) {
      // Rollback
      setReservationStates((prev) => ({ ...prev, [wishId]: previousState }));
      toast.error(err.message || 'Ошибка подтверждения');
      return false;
    } finally {
      setPendingWishes((prev) => ({ ...prev, [wishId]: false }));
    }
  };

  return {
    reservationStates,
    pendingWishes,
    isLoading,
    refetchAll: fetchAllStates,
    refetchSingle: fetchSingleState,
    reserveWish,
    cancelReservation,
    confirmReservation,
  };
}
