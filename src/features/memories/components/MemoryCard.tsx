import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { MemoryItem } from '../types';
import { MEMORY_TYPE_META } from '../types';
import { Calendar, Image as ImageIcon } from 'lucide-react';

interface MemoryCardProps {
  memory: MemoryItem;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const navigate = useNavigate();
  const typeMeta = MEMORY_TYPE_META[memory.memory_type] || MEMORY_TYPE_META.OTHER;

  return (
    <Card
      onClick={() => navigate(`/memories/${memory.id}`)}
      className="bg-[#17171A] border-[#26262B] hover:border-[#D8B4B0]/50 transition-all duration-200 overflow-hidden cursor-pointer rounded-[24px] flex flex-col justify-between"
    >
      {/* Cover Image */}
      <div className="relative w-full h-44 bg-[#26262B] overflow-hidden flex items-center justify-center shrink-0">
        {memory.cover_image_url ? (
          <img
            src={memory.cover_image_url}
            alt={memory.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#26262B] to-[#1D1D21] flex flex-col items-center justify-center text-[#D8B4B0]">
            <ImageIcon className="w-10 h-10 opacity-60 mb-1" />
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">{typeMeta.label}</span>
          </div>
        )}

        {/* Type Badge Overlay */}
        <div className="absolute top-3 left-3">
          <Badge className={`text-[10px] uppercase font-semibold px-2.5 py-1 backdrop-blur-md ${typeMeta.colorClass}`}>
            {typeMeta.label}
          </Badge>
        </div>

        {/* Event Date Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-medium bg-[#0F0F10]/80 text-[#F5F5F7] px-2.5 py-1 rounded-full border border-[#383843] backdrop-blur-md flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-[#D8B4B0]" />
            <span>{memory.event_date}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#F5F5F7] line-clamp-1 leading-tight">
            {memory.title}
          </h3>

          {memory.description && (
            <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1 leading-normal">
              {memory.description}
            </p>
          )}
        </div>

        {/* Participants Avatars */}
        {memory.participants && memory.participants.length > 0 && (
          <div className="pt-2 border-t border-[#26262B] flex items-center justify-between">
            <span className="text-[10px] text-[#71717A] uppercase font-semibold">Участники:</span>
            <div className="flex -space-x-2 overflow-hidden">
              {memory.participants.map((p) => (
                <Avatar key={p.id} src={p.avatar_url} name={p.name} size="sm" className="border-2 border-[#17171A]" />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
