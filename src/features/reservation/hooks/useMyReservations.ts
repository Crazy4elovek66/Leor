import { useState, useEffect, useCallback } from 'react';
import { fromTable } from '@/api/supabase';
import type { GiftReservationItem, GiftReservationStatus } from '../types';

const STATUS_WEIGHTS: Record<GiftReservationStatus, number> = {
  RESERVED: 1,
  CONFIRMED: 2,
  EXPIRED: 3,
  CANCELLED: 4,
};

export function useMyReservations(currentUserId?: string) {
  const [reservations, setReservations] = useState<GiftReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyReservations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all reservations reserved by current user
      const { data: resRows, error: resErr } = await fromTable('gift_reservations')
        .select('*')
        .eq('reserved_by', currentUserId)
        .order('created_at', { ascending: false });

      if (resErr) throw resErr;

      if (!resRows || resRows.length === 0) {
        setReservations([]);
        setIsLoading(false);
        return;
      }

      // Fetch wish details for each reservation
      const wishIds = resRows.map((r: any) => r.wish_id);
      const { data: wishRows, error: wishErr } = await fromTable('wishes')
        .select('*')
        .in('id', wishIds);

      if (wishErr) throw wishErr;

      // Fetch wish owners
      const ownerUserIds = Array.from(new Set((wishRows || []).map((w: any) => w.user_id)));
      const { data: ownerRows } = await fromTable('users')
        .select('id, first_name, last_name')
        .in('id', ownerUserIds);

      const items: GiftReservationItem[] = resRows.map((r: any) => {
        const wishData = wishRows?.find((w: any) => w.id === r.wish_id);
        const ownerData = ownerRows?.find((u: any) => u.id === wishData?.user_id);

        return {
          id: r.id,
          wishId: r.wish_id,
          reservedBy: r.reserved_by,
          status: r.status as any,
          reservedAt: r.reserved_at,
          confirmedAt: r.confirmed_at,
          cancelledAt: r.cancelled_at,
          expiresAt: r.expires_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          wish: wishData
            ? {
                id: wishData.id,
                userId: wishData.user_id,
                title: wishData.title,
                description: wishData.description,
                brand: wishData.brand,
                imageUrl: wishData.image_url,
                link: wishData.link,
                price: wishData.price ? Number(wishData.price) : null,
                currency: wishData.currency || 'RUB',
                category: wishData.category as any,
                priority: wishData.priority as any,
                visibility: wishData.visibility as any,
                status: wishData.status as any,
                sourceType: wishData.source_type as any,
                context: wishData.context as any,
                isSurpriseFriendly: wishData.is_surprise_friendly ?? true,
                sizeOverride: wishData.size_override,
                createdAt: wishData.created_at,
                updatedAt: wishData.updated_at,
              }
            : undefined,
          wishOwnerName: ownerData ? `${ownerData.first_name} ${ownerData.last_name || ''}`.trim() : 'Друг',
        };
      });

      // Sort by status: RESERVED -> CONFIRMED -> EXPIRED -> CANCELLED, then created_at DESC
      items.sort((a, b) => {
        const wA = STATUS_WEIGHTS[a.status] || 99;
        const wB = STATUS_WEIGHTS[b.status] || 99;
        if (wA !== wB) return wA - wB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setReservations(items);
    } catch (err: any) {
      console.error('Failed to fetch my reservations:', err);
      setError(err.message || 'Ошибка загрузки моих бронирований');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchMyReservations();
  }, [fetchMyReservations]);

  return {
    reservations,
    isLoading,
    error,
    refetch: fetchMyReservations,
  };
}
