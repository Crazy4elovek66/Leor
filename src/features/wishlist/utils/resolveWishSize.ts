import type { WishCategory } from '../types';
import type { ProfileSizeItem } from '@/features/profile/types';

export function resolveWishSize(
  category: WishCategory,
  sizes: ProfileSizeItem[],
  sizeOverride?: string | null
): string | null {
  if (sizeOverride && sizeOverride.trim().length > 0) {
    return sizeOverride.trim();
  }

  if (!sizes || sizes.length === 0) return null;

  if (category === 'CLOTHING') {
    const top = sizes.find((s) => s.category === 'CLOTHING_TOP')?.value;
    const bottom = sizes.find((s) => s.category === 'CLOTHING_BOTTOM')?.value;
    const shoes = sizes.find((s) => s.category === 'SHOES')?.value;

    const parts: string[] = [];
    if (top) parts.push(`Верх: ${top}`);
    if (bottom) parts.push(`Низ: ${bottom}`);
    if (shoes) parts.push(`Обувь: ${shoes}`);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  if (category === 'BEAUTY' || category === 'OTHER') {
    const ring = sizes.find((s) => s.category === 'RING')?.value;
    const bracelet = sizes.find((s) => s.category === 'BRACELET')?.value;
    const necklace = sizes.find((s) => s.category === 'NECKLACE')?.value;

    const parts: string[] = [];
    if (ring) parts.push(`Кольцо: ${ring}`);
    if (bracelet) parts.push(`Браслет: ${bracelet}`);
    if (necklace) parts.push(`Цепочка: ${necklace}`);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  return null;
}
