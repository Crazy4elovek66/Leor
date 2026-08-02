import { WishCard } from './WishCard';
import { resolveWishSize } from '../utils/resolveWishSize';
import type { WishItem } from '../types';
import type { ProfileSizeItem } from '@/features/profile/types';
import type { WishReservationState } from '@/features/reservation/types';
import { WISH_PRIORITY_META } from '../types';

interface WishlistGridProps {
  wishes: WishItem[];
  profileSizes?: ProfileSizeItem[];
  reservationStates?: Record<string, WishReservationState>;
  pendingWishes?: Record<string, boolean>;
  isLoadingState?: boolean;
  onSelectWish?: (wish: WishItem) => void;
  onReserveWish?: (wishId: string) => void;
  onCancelReservation?: (wishId: string) => void;
  onConfirmReservation?: (wishId: string) => void;
  isOwner?: boolean;
}

export function WishlistGrid({
  wishes,
  profileSizes = [],
  reservationStates = {},
  pendingWishes = {},
  isLoadingState = false,
  onSelectWish,
  onReserveWish,
  onCancelReservation,
  onConfirmReservation,
  isOwner = false,
}: WishlistGridProps) {
  // Sort wishes: 1. Priority (HIGH -> MEDIUM -> LOW), 2. created_at DESC
  const sortedWishes = [...wishes].sort((a, b) => {
    const weightA = WISH_PRIORITY_META[a.priority]?.weight || 2;
    const weightB = WISH_PRIORITY_META[b.priority]?.weight || 2;

    if (weightA !== weightB) {
      return weightA - weightB;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sortedWishes.map((wish) => {
        const resolvedSize = resolveWishSize(wish.category, profileSizes, wish.sizeOverride);
        const resState = reservationStates[wish.id] || 'AVAILABLE';
        const isPending = !!pendingWishes[wish.id];

        return (
          <WishCard
            key={wish.id}
            wish={wish}
            resolvedSize={resolvedSize}
            reservationState={resState}
            isOwner={isOwner}
            isPending={isPending}
            isLoadingState={isLoadingState}
            onClick={() => onSelectWish && onSelectWish(wish)}
            onReserve={() => onReserveWish && onReserveWish(wish.id)}
            onCancelReservation={() => onCancelReservation && onCancelReservation(wish.id)}
            onConfirmReservation={() => onConfirmReservation && onConfirmReservation(wish.id)}
          />
        );
      })}
    </div>
  );
}
