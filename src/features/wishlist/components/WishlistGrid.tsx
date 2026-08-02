import { WishCard } from './WishCard';
import { resolveWishSize } from '../utils/resolveWishSize';
import type { WishItem } from '../types';
import type { ProfileSizeItem } from '@/features/profile/types';
import { WISH_PRIORITY_META } from '../types';

interface WishlistGridProps {
  wishes: WishItem[];
  profileSizes?: ProfileSizeItem[];
  onSelectWish?: (wish: WishItem) => void;
  isReadOnly?: boolean;
}

export function WishlistGrid({
  wishes,
  profileSizes = [],
  onSelectWish,
  isReadOnly = false,
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

        return (
          <WishCard
            key={wish.id}
            wish={wish}
            resolvedSize={resolvedSize}
            onClick={() => onSelectWish && onSelectWish(wish)}
            isReadOnly={isReadOnly}
          />
        );
      })}
    </div>
  );
}
