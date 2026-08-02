import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useDiscoveryFeed } from '../hooks/useDiscoveryFeed';
import { DiscoveryCard } from './DiscoveryCard';
import { Sparkles, RefreshCw, Compass } from 'lucide-react';

export function DiscoveryFeedView() {
  const { items, isLoading, error, refetch } = useDiscoveryFeed(20);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#D8B4B0]" />
            <h2 className="text-lg font-bold text-[#F5F5F7]">Открытия & Идеи</h2>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Персональные идеи подарков на основе вашего Taste Graph и желаний друзей
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors rounded-xl bg-[#17171A] border border-[#26262B]"
          title="Обновить ленту"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-72 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
          <div className="h-72 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="p-4 bg-[#211717] border-[#C97B7B]/30 text-center">
          <p className="text-xs text-[#C97B7B]">{error}</p>
        </Card>
      )}

      {/* Recommendations Feed Grid */}
      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <DiscoveryCard key={item.wish_id} item={item} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          icon={<Compass className="w-10 h-10 text-[#D8B4B0]" />}
          title="Лента открытий пока пуста"
          description="Вступайте в круги друзей и указывайте больше интересов. Движок рекомендаций Taste Graph автоматически сформирует список идеальных идей!"
        />
      )}
    </div>
  );
}
