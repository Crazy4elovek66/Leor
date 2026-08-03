import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { TimelineItem } from '../types';
import { Gift, Calendar, Sparkles, Heart } from 'lucide-react';

interface RelationshipTimelineProps {
  items: TimelineItem[];
  isRestricted?: boolean;
}

export function RelationshipTimeline({ items, isRestricted = false }: RelationshipTimelineProps) {
  if (isRestricted) {
    return (
      <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
        <Heart className="w-8 h-8 text-[#71717A] mx-auto mb-2" />
        <p className="text-xs text-[#A1A1AA]">Хронология отношений скрыта настройками приватности</p>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
        <Calendar className="w-8 h-8 text-[#71717A] mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-[#F5F5F7]">Хронология отношений пока пуста</h4>
        <p className="text-[11px] text-[#A1A1AA] mt-1">
          Добавляйте совместные воспоминания и вручайте подарки — они автоматически сформируют историю вашей дружбы.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#26262B]">
      {items.map((item, idx) => {
        const isGift = item.kind === 'GIFT';
        return (
          <div key={`${item.id}_${idx}`} className="relative space-y-2">
            {/* Timeline Marker Node */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-[#17171A] flex items-center justify-center ${isGift ? 'bg-[#D8B4B0] text-[#0F0F10]' : 'bg-[#26262B] text-[#D8B4B0]'}`}>
              {isGift ? <Gift className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            </div>

            {/* Date Tag */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#D8B4B0] bg-[#26262B] px-2 py-0.5 rounded-md">
                {item.date}
              </span>
              <Badge variant={isGift ? 'accent' : 'outline'} className="text-[10px] uppercase">
                {isGift ? 'Подарок' : item.sub_type}
              </Badge>
            </div>

            {/* Content Box */}
            <Card className="p-4 bg-[#17171A] border-[#26262B] space-y-2 rounded-[20px]">
              <div className="flex items-start justify-between">
                <h4 className="text-xs font-bold text-[#F5F5F7]">{item.title}</h4>
                {item.wish_title && (
                  <span className="text-[10px] text-[#D8B4B0] font-medium bg-[#26262B] px-2 py-0.5 rounded-lg">
                    {item.wish_title}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-[#A1A1AA] line-clamp-2">{item.description}</p>
              )}

              {item.image_url && (
                <div className="w-full h-32 bg-[#26262B] rounded-xl overflow-hidden mt-2">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}

              {item.participants && item.participants.length > 0 && (
                <div className="pt-2 flex items-center justify-between border-t border-[#26262B]">
                  <span className="text-[10px] text-[#71717A]">Участники:</span>
                  <div className="flex -space-x-1">
                    {item.participants.map((p) => (
                      <Avatar key={p.id} src={p.avatar_url} name={p.name} size="sm" />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
