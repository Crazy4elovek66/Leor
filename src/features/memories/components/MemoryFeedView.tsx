import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMemories } from '../hooks/useMemories';
import { useTimeline } from '../hooks/useTimeline';
import { MemoryCard } from './MemoryCard';
import { RelationshipTimeline } from './RelationshipTimeline';
import { CreateMemoryModal } from './CreateMemoryModal';
import { Sparkles, Plus, Image as ImageIcon } from 'lucide-react';

interface MemoryFeedViewProps {
  currentUserId: string;
  profileId: string;
}

export function MemoryFeedView({ currentUserId, profileId }: MemoryFeedViewProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'timeline'>('feed');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const { memories, isLoading: memLoading, createMemory, uploadMemoryImage } = useMemories(currentUserId);
  const { items: timelineItems, isLoading: timeLoading, isRestricted } = useTimeline(profileId);

  return (
    <div className="space-y-5 pb-8">
      {/* Header & New Memory Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#D8B4B0]" />
            <h2 className="text-lg font-bold text-[#F5F5F7]">Память & События</h2>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            История совместных моментов, праздников и врученных подарков
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="rounded-full px-3 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Добавить
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#17171A] p-1 rounded-2xl border border-[#26262B]">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${activeTab === 'feed' ? 'bg-[#26262B] text-[#D8B4B0]' : 'text-[#A1A1AA]'}`}
        >
          Лента воспоминаний ({memories.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${activeTab === 'timeline' ? 'bg-[#26262B] text-[#D8B4B0]' : 'text-[#A1A1AA]'}`}
        >
          Хронология отношений
        </button>
      </div>

      {/* Tab Content: Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {memLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-60 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
              <div className="h-60 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
            </div>
          ) : memories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {memories.map((m) => (
                <MemoryCard key={m.id} memory={m} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
              <ImageIcon className="w-8 h-8 text-[#71717A] mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-[#F5F5F7]">У вас пока нет сохраненных воспоминаний</h4>
              <p className="text-[11px] text-[#A1A1AA] mt-1 mb-3">
                Создавайте совместные моменты и связывайте их с вишлистами друзей.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
                Создать первое воспоминание
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content: Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {timeLoading ? (
            <div className="h-44 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
          ) : (
            <RelationshipTimeline items={timelineItems} isRestricted={isRestricted} />
          )}
        </div>
      )}

      {/* Create Modal */}
      <CreateMemoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => {
          await createMemory(payload);
        }}
        onUploadCover={uploadMemoryImage}
      />
    </div>
  );
}
