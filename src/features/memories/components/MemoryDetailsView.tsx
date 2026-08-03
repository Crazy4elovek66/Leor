import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { fromTable } from '@/api/supabase';
import type { MemoryItem, MemoryMedia, MemoryType } from '../types';
import { MEMORY_TYPE_META } from '../types';
import { MemoryGallery } from './MemoryGallery';
import { ChevronLeft, Calendar, Image as ImageIcon, Users } from 'lucide-react';

export function MemoryDetailsView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [memory, setMemory] = useState<MemoryItem | null>(null);
  const [media, setMedia] = useState<MemoryMedia[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;

    async function loadDetails() {
      try {
        setIsLoading(true);
        const { data: memRow, error: memErr } = await fromTable('memories')
          .select('*')
          .eq('id', id)
          .single();

        if (memErr) throw memErr;

        // Fetch participants
        const { data: partRows } = await fromTable('memory_participants')
          .select('*, users(id, first_name, last_name, avatar_url)')
          .eq('memory_id', id);

        // Fetch media gallery
        const { data: mediaRows } = await fromTable('memory_media')
          .select('*')
          .eq('memory_id', id)
          .order('sort_order', { ascending: true });

        const parts = (partRows || []).map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          name: `${p.users?.first_name || ''} ${p.users?.last_name || ''}`.trim(),
          avatar_url: p.users?.avatar_url || null,
          role: p.role,
        }));

        setMemory({
          id: memRow.id,
          owner_user_id: memRow.owner_user_id,
          circle_id: memRow.circle_id,
          wish_id: memRow.wish_id,
          gift_reservation_id: memRow.gift_reservation_id,
          title: memRow.title,
          description: memRow.description,
          memory_type: memRow.memory_type as MemoryType,
          event_date: memRow.event_date,
          cover_image_url: memRow.cover_image_url,
          created_at: memRow.created_at,
          updated_at: memRow.updated_at,
          participants: parts,
        });

        setMedia((mediaRows || []).map((m: any) => ({
          id: m.id,
          image_url: m.image_url,
          sort_order: m.sort_order,
        })));
      } catch (err: any) {
        console.error('Failed to load memory details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4 max-w-md mx-auto">
        <div className="h-44 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
        <div className="h-32 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <p className="text-xs text-[#C97B7B]">Воспоминание не найдено</p>
        <button onClick={() => navigate('/memories')} className="text-xs text-[#D8B4B0] underline mt-2">
          Вернуться к ленте
        </button>
      </div>
    );
  }

  const typeMeta = MEMORY_TYPE_META[memory.memory_type] || MEMORY_TYPE_META.OTHER;

  return (
    <div className="space-y-5 pb-8 max-w-md mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/memories')}
        className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Назад к воспоминаниям</span>
      </button>

      {/* Hero Cover Card */}
      <Card className="bg-[#17171A] border-[#26262B] overflow-hidden rounded-[28px]">
        <div className="relative w-full h-56 bg-[#26262B] flex items-center justify-center">
          {memory.cover_image_url ? (
            <img src={memory.cover_image_url} alt={memory.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-[#D8B4B0]">
              <ImageIcon className="w-12 h-12 opacity-60 mb-1" />
            </div>
          )}

          <div className="absolute top-3 left-3">
            <Badge className={`text-[10px] uppercase font-semibold px-2.5 py-1 backdrop-blur-md ${typeMeta.colorClass}`}>
              {typeMeta.label}
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs text-[#D8B4B0]">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-mono font-bold">{memory.event_date}</span>
          </div>

          <h1 className="text-lg font-bold text-[#F5F5F7] tracking-tight">{memory.title}</h1>

          {memory.description && (
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{memory.description}</p>
          )}

          {/* Participants */}
          {memory.participants && memory.participants.length > 0 && (
            <div className="pt-3 border-t border-[#26262B] space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#A1A1AA]">
                <Users className="w-3.5 h-3.5 text-[#D8B4B0]" />
                <span>Участники события</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {memory.participants.map((p) => (
                  <div key={p.id} className="flex items-center space-x-2 bg-[#26262B] px-3 py-1.5 rounded-full">
                    <Avatar src={p.avatar_url} name={p.name} size="sm" />
                    <span className="text-xs font-medium text-[#F5F5F7]">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Media Gallery */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#F5F5F7] px-1">Галерея фотографий</h3>
        <MemoryGallery media={media} />
      </div>
    </div>
  );
}
