import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { CircleCard } from './CircleCard';
import { CreateCircleModal } from './CreateCircleModal';
import { JoinCircleModal } from './JoinCircleModal';
import { useCircles } from '../hooks/useCircles';
import { Users, Plus, KeyRound } from 'lucide-react';

interface CircleListProps {
  currentUserId: string;
}

export function CircleList({ currentUserId }: CircleListProps) {
  const navigate = useNavigate();
  const { circles, isLoading, error, refetch, createCircle } = useCircles(currentUserId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-20 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
        <div className="h-20 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F5F5F7] tracking-tight">Мои Круги</h2>
          <p className="text-xs text-[#A1A1AA]">Приватные пространства для обмена желаниями</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsJoinOpen(true)}
            className="rounded-full px-3 text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
            Вступить
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Создать
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-[#211717] border-[#C97B7B]/30 text-center">
          <p className="text-xs text-[#C97B7B]">{error}</p>
        </Card>
      )}

      {/* Circles List */}
      {circles.length > 0 ? (
        <div className="space-y-3">
          {circles.map((circle) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onClick={() => navigate(`/circles/${circle.id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="w-8 h-8 text-[#D8B4B0]" />}
          title="У вас пока нет ни одного круга"
          description="Создайте свой первый круг близких людей или вступите по коду приглашения."
          actionText="Создать круг"
          onAction={() => setIsCreateOpen(true)}
        />
      )}

      {/* Modals */}
      <CreateCircleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={async (name, avatarUrl) => {
          await createCircle(name, avatarUrl);
        }}
      />

      <JoinCircleModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        currentUserId={currentUserId}
        onJoined={refetch}
      />
    </div>
  );
}
