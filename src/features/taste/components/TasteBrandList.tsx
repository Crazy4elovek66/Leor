import type { TasteTopBrand } from '../types';
import { TasteStrengthBar } from './TasteStrengthBar';
import { Tag } from 'lucide-react';

interface TasteBrandListProps {
  brands: TasteTopBrand[];
}

export function TasteBrandList({ brands }: TasteBrandListProps) {
  if (!brands || brands.length === 0) {
    return <p className="text-xs text-[#71717A] italic">Бренды не указаны</p>;
  }

  return (
    <div className="space-y-3">
      {brands.map((b, idx) => (
        <div key={`${b.brand}_${idx}`} className="bg-[#0F0F10] p-3 rounded-2xl border border-[#26262B] space-y-1.5">
          <div className="flex items-center space-x-2">
            <Tag className="w-3.5 h-3.5 text-[#D8B4B0]" />
            <span className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">{b.brand}</span>
          </div>
          <TasteStrengthBar weight={b.weight} />
        </div>
      ))}
    </div>
  );
}
