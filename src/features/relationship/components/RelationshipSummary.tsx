import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRelationshipSummary } from '../hooks/useRelationshipSummary';
import { Heart, Gift, Sparkles, Calendar, Zap } from 'lucide-react';

interface RelationshipSummaryProps {
  profileId: string;
}

export function RelationshipSummary({ profileId }: RelationshipSummaryProps) {
  const { data, isLoading } = useRelationshipSummary(profileId);

  if (isLoading) {
    return <div className="h-44 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />;
  }

  if (!data || !data.found || data.is_self) {
    return null; // Do not show summary for self or if not found
  }

  const { strength, shared_memories, gifts_exchanged, taste_similarity, years_known, timeline_highlights } = data;

  return (
    <Card className="p-5 bg-[#17171A] border-[#26262B] space-y-4 rounded-[24px]">
      {/* Header with Strength Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-[#D8B4B0]" />
          <h3 className="text-sm font-bold text-[#F5F5F7]">Индекс отношений</h3>
        </div>
        <Badge variant="accent" className="text-xs px-2.5 py-1 font-mono font-bold">
          {strength}% связи
        </Badge>
      </div>

      {/* Strength Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-[#26262B] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D8B4B0] to-[#E5C1BC] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, strength))}%` }}
          />
        </div>
      </div>

      {/* 4 Stat Badges Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0F0F10] p-3 rounded-2xl border border-[#26262B] flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-[#D8B4B0] shrink-0" />
          <div>
            <span className="text-[10px] text-[#A1A1AA] block">Воспоминания</span>
            <span className="font-bold text-[#F5F5F7] font-mono">{shared_memories}</span>
          </div>
        </div>

        <div className="bg-[#0F0F10] p-3 rounded-2xl border border-[#26262B] flex items-center space-x-2.5">
          <Gift className="w-4 h-4 text-[#D8B4B0] shrink-0" />
          <div>
            <span className="text-[10px] text-[#A1A1AA] block">Подарки</span>
            <span className="font-bold text-[#F5F5F7] font-mono">{gifts_exchanged}</span>
          </div>
        </div>

        <div className="bg-[#0F0F10] p-3 rounded-2xl border border-[#26262B] flex items-center space-x-2.5">
          <Zap className="w-4 h-4 text-[#D8B4B0] shrink-0" />
          <div>
            <span className="text-[10px] text-[#A1A1AA] block">Вкусы</span>
            <span className="font-bold text-[#F5F5F7] font-mono">{taste_similarity}%</span>
          </div>
        </div>

        <div className="bg-[#0F0F10] p-3 rounded-2xl border border-[#26262B] flex items-center space-x-2.5">
          <Calendar className="w-4 h-4 text-[#D8B4B0] shrink-0" />
          <div>
            <span className="text-[10px] text-[#A1A1AA] block">Знакомы</span>
            <span className="font-bold text-[#F5F5F7] font-mono">{years_known > 0 ? `${years_known} лет` : '< 1 года'}</span>
          </div>
        </div>
      </div>

      {/* Timeline Highlights */}
      {timeline_highlights && timeline_highlights.length > 0 && (
        <div className="pt-2 border-t border-[#26262B] space-y-1.5">
          <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
            Памятные моменты
          </span>
          <div className="space-y-1">
            {timeline_highlights.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-[#0F0F10] px-3 py-1.5 rounded-xl border border-[#26262B]">
                <span className="text-[#F5F5F7] truncate">{h.title}</span>
                <span className="text-[10px] text-[#D8B4B0] font-mono shrink-0 ml-2">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
