import type { TasteTopCategory } from '../types';
import { Sparkles } from 'lucide-react';

interface TasteCategoryCloudProps {
  categories: TasteTopCategory[];
}

export function TasteCategoryCloud({ categories }: TasteCategoryCloudProps) {
  if (!categories || categories.length === 0) {
    return <p className="text-xs text-[#71717A] italic">Категории не сформированы</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat, idx) => {
        const pct = Math.round(cat.weight * 100);
        return (
          <div
            key={`${cat.category}_${idx}`}
            className="flex items-center space-x-1.5 bg-[#26262B] border border-[#383843] hover:border-[#D8B4B0]/50 transition-colors px-3 py-1.5 rounded-full"
          >
            <Sparkles className="w-3 h-3 text-[#D8B4B0]" />
            <span className="text-xs font-semibold text-[#F5F5F7]">{cat.category}</span>
            <span className="text-[10px] text-[#D8B4B0] font-mono font-bold bg-[#17171A] px-1.5 py-0.5 rounded-md">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
