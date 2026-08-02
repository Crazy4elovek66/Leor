import type { WishItem } from '@/features/wishlist/types';

export type GiftReservationStatus = 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export type WishReservationState = 'AVAILABLE' | 'RESERVED_BY_ME' | 'RESERVED' | 'CONFIRMED';

export interface GiftReservationItem {
  id: string;
  wishId: string;
  reservedBy: string;
  status: GiftReservationStatus;
  reservedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  wish?: WishItem;
  wishOwnerName?: string;
}

export const RESERVATION_STATE_META: Record<WishReservationState, { label: string; badgeClass: string }> = {
  AVAILABLE: {
    label: 'Доступно',
    badgeClass: 'bg-[#26262B] text-[#A1A1AA] border-[#383843]',
  },
  RESERVED_BY_ME: {
    label: 'Забронировано вами',
    badgeClass: 'bg-[#D8B4B0]/20 text-[#D8B4B0] border-[#D8B4B0]/50 font-semibold',
  },
  RESERVED: {
    label: 'Забронировано',
    badgeClass: 'bg-[#26262B]/80 text-[#D8B4B0] border-[#383843]',
  },
  CONFIRMED: {
    label: 'Куплено',
    badgeClass: 'bg-[#26262B] text-[#71717A] border-[#383843] line-through',
  },
};
