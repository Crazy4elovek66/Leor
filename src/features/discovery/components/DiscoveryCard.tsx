import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { DiscoveryItem } from '../types';
import { WISH_CATEGORY_META, WISH_PRIORITY_META } from '@/features/wishlist/types';
import { Sparkles, Gift, ExternalLink, UserCheck, Tag } from 'lucide-react';

interface DiscoveryCardProps {
  item: DiscoveryItem;
}

export function DiscoveryCard({ item }: DiscoveryCardProps) {
  const navigate = useNavigate();

  const categoryMeta = WISH_CATEGORY_META[item.category] || WISH_CATEGORY_META.OTHER;
  const priorityMeta = WISH_PRIORITY_META[item.priority] || WISH_PRIORITY_META.MEDIUM;

  const formattedPrice = item.price !== null && item.price !== undefined
    ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: item.currency, maximumFractionDigits: 0 }).format(item.price)
    : null;

  return (
    <Card className="bg-[#17171A] border-[#26262B] hover:border-[#D8B4B0]/50 transition-all duration-200 overflow-hidden rounded-[24px] flex flex-col justify-between">
      {/* Cover Image & Match Badge */}
      <div className="relative w-full h-48 bg-[#26262B] overflow-hidden flex items-center justify-center shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#26262B] to-[#1D1D21] flex flex-col items-center justify-center text-[#D8B4B0]">
            <Gift className="w-12 h-12 opacity-60 mb-1" />
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">{categoryMeta.label}</span>
          </div>
        )}

        {/* Match Percentage Overlay */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-[#0F0F10]/90 border border-[#D8B4B0]/60 text-[#D8B4B0] font-bold text-xs px-2.5 py-1 backdrop-blur-md flex items-center space-x-1 shadow-md">
            <Sparkles className="w-3 h-3 text-[#D8B4B0]" />
            <span>{item.match_percentage}% совпадение</span>
          </Badge>
        </div>

        {/* Priority Badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md ${priorityMeta.colorClass}`}>
            {priorityMeta.label}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Owner Info Bar */}
          <div
            onClick={() => navigate(`/profile/${item.owner_id}`)}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Avatar src={item.owner_avatar} name={item.owner_name} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#F5F5F7] truncate">{item.owner_name}</div>
              <div className="text-[10px] text-[#A1A1AA]">Из вашего круга</div>
            </div>
          </div>

          <div>
            {item.brand && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#D8B4B0] flex items-center space-x-1">
                <Tag className="w-2.5 h-2.5" />
                <span>{item.brand}</span>
              </div>
            )}

            <h3 className="text-sm font-bold text-[#F5F5F7] line-clamp-2 leading-tight mt-0.5">
              {item.title}
            </h3>

            {item.description && (
              <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1 leading-normal">
                {item.description}
              </p>
            )}
          </div>

          {/* Explanation Reasons List */}
          {item.reasons && item.reasons.length > 0 && (
            <div className="bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] space-y-1">
              <div className="text-[10px] text-[#71717A] uppercase font-semibold tracking-wider">
                Почему подходит:
              </div>
              <ul className="space-y-0.5">
                {item.reasons.map((reason, idx) => (
                  <li key={idx} className="text-[11px] text-[#D8B4B0] flex items-center space-x-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#D8B4B0] shrink-0" />
                    <span className="truncate">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer: Price & Navigation Actions */}
        <div className="pt-2 border-t border-[#26262B] flex items-center justify-between">
          <div>
            {formattedPrice ? (
              <span className="text-sm font-extrabold text-[#F5F5F7] font-mono tracking-tight">
                {formattedPrice}
              </span>
            ) : (
              <span className="text-xs text-[#71717A] italic">Цена не указана</span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Открыть внешнюю ссылку товара"
                className="p-2 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors rounded-xl bg-[#26262B]"
                title="Ссылка на товар"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => navigate(`/profile/${item.owner_id}`)}
              aria-label="Перейти к профилю владельца желания"
              className="p-2 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors rounded-xl bg-[#26262B]"
              title="Открыть профиль"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
