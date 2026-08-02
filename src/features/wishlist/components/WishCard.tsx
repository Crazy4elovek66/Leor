import { Card } from '@/components/ui/card';
import type { WishItem } from '../types';
import { WISH_CATEGORY_META, WISH_PRIORITY_META, WISH_CONTEXT_LABELS } from '../types';
import { ExternalLink, Sparkles, Tag, Gift } from 'lucide-react';

interface WishCardProps {
  wish: WishItem;
  resolvedSize?: string | null;
  onClick?: () => void;
  isReadOnly?: boolean;
}

export function WishCard({ wish, resolvedSize, onClick }: WishCardProps) {
  const categoryMeta = WISH_CATEGORY_META[wish.category] || WISH_CATEGORY_META.OTHER;
  const priorityMeta = WISH_PRIORITY_META[wish.priority] || WISH_PRIORITY_META.MEDIUM;
  const contextLabel = WISH_CONTEXT_LABELS[wish.context] || WISH_CONTEXT_LABELS.JUST_WANT;

  const formattedPrice = wish.price !== null && wish.price !== undefined
    ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: wish.currency, maximumFractionDigits: 0 }).format(wish.price)
    : null;

  return (
    <Card
      onClick={onClick}
      className="bg-[#17171A] border-[#26262B] hover:border-[#D8B4B0]/50 transition-all duration-200 overflow-hidden group cursor-pointer flex flex-col h-full rounded-[24px]"
    >
      {/* Cover Image Header */}
      <div className="relative w-full h-44 bg-[#26262B] overflow-hidden flex items-center justify-center shrink-0">
        {wish.imageUrl ? (
          <img
            src={wish.imageUrl}
            alt={wish.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#26262B] to-[#1D1D21] flex flex-col items-center justify-center text-[#D8B4B0]">
            <Gift className="w-10 h-10 opacity-70 mb-1" />
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">{categoryMeta.label}</span>
          </div>
        )}

        {/* Priority Badge Overlay */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md ${priorityMeta.colorClass}`}>
            {priorityMeta.label}
          </span>
        </div>

        {/* Context Tag Overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-medium bg-[#0F0F10]/80 text-[#F5F5F7] px-2.5 py-1 rounded-full border border-[#383843] backdrop-blur-md flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-[#D8B4B0]" />
            <span>{contextLabel}</span>
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {wish.brand && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#D8B4B0] mb-0.5">
              {wish.brand}
            </div>
          )}

          <h3 className="text-sm font-bold text-[#F5F5F7] group-hover:text-[#D8B4B0] transition-colors line-clamp-2 leading-tight">
            {wish.title}
          </h3>

          {wish.description && (
            <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1.5 leading-normal">
              {wish.description}
            </p>
          )}
        </div>

        {/* Dynamic Size Badge & Price Footer */}
        <div className="pt-2 border-t border-[#26262B]/60 space-y-2">
          {resolvedSize && (
            <div className="flex items-center space-x-1.5 text-[11px] text-[#D8B4B0] bg-[#26262B]/50 px-2.5 py-1 rounded-xl w-fit">
              <Tag className="w-3 h-3 text-[#D8B4B0] shrink-0" />
              <span className="font-medium">{resolvedSize}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {formattedPrice ? (
              <span className="text-sm font-extrabold text-[#F5F5F7] font-mono tracking-tight">
                {formattedPrice}
              </span>
            ) : (
              <span className="text-xs text-[#71717A] italic">Цена не указана</span>
            )}

            {wish.link && (
              <a
                href={wish.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors rounded-lg hover:bg-[#26262B]"
                title="Открыть ссылку на товар"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
