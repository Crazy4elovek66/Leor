import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { AccessMatrixModal } from './AccessMatrixModal';
import { useCircleDetails } from '../hooks/useCircleDetails';
import { useGiftProfile } from '@/features/profile/hooks/useGiftProfile';
import {
  Shield,
  Copy,
  RefreshCw,
  ChevronLeft,
  UserX,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface CircleDetailsViewProps {
  currentUserId: string;
}

export function CircleDetailsView({ currentUserId }: CircleDetailsViewProps) {
  const { id: circleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { circle, members, isLoading, error, regenerateInviteCode, removeMember } =
    useCircleDetails(circleId, currentUserId);
  const { profile } = useGiftProfile(currentUserId);

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-24 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
        <div className="h-40 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#C97B7B]">{error || 'Круг не найден'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/circles')}>
          Вернуться к кругам
        </Button>
      </div>
    );
  }

  const isOwner = circle.ownerId === currentUserId;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(circle.inviteCode);
    toast.success('Код приглашения скопирован в буфер!');
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      await regenerateInviteCode();
      toast.success('Сгенерирован новый код приглашения');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка обновления кода');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/circles')}
        className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Назад к списку кругов</span>
      </button>

      {/* Circle Banner Card */}
      <Card className="p-6 bg-[#17171A] border-[#26262B] relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#26262B] border border-[#383843] flex items-center justify-center text-[#D8B4B0] font-bold text-xl overflow-hidden shrink-0">
              {circle.avatarUrl ? (
                <img src={circle.avatarUrl} alt={circle.name} className="w-full h-full object-cover" />
              ) : (
                circle.name.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-[#F5F5F7]">{circle.name}</h2>
                {circle.isArchived && (
                  <Badge variant="outline" className="text-[10px] text-[#A1A1AA] border-[#383843]">
                    <Lock className="w-2.5 h-2.5 mr-1" /> Архивирован
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5">{members.length} участников</p>
            </div>
          </div>

          <Badge variant={isOwner ? 'accent' : 'secondary'} className="text-[10px] uppercase">
            {isOwner ? 'Создатель' : 'Участник'}
          </Badge>
        </div>

        {/* Invite Code Bar (Owner only or active) */}
        {!circle.isArchived && (
          <div className="mt-5 pt-4 border-t border-[#26262B] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 bg-[#0F0F10] px-3.5 py-1.5 rounded-xl border border-[#26262B]">
              <span className="text-[11px] text-[#71717A]">Код:</span>
              <span className="text-xs font-mono font-bold text-[#D8B4B0] tracking-wider">
                {circle.inviteCode}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopyInvite} className="h-8 px-2.5 text-xs">
                <Copy className="w-3.5 h-3.5 mr-1 text-[#D8B4B0]" />
                Копировать
              </Button>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="h-8 px-2 text-xs text-[#A1A1AA] hover:text-[#F5F5F7]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Access Matrix Button */}
        {profile && (
          <div className="mt-4 pt-4 border-t border-[#26262B]/50">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={() => setIsAccessModalOpen(true)}
            >
              <Shield className="w-3.5 h-3.5 mr-2 text-[#D8B4B0]" />
              Настроить доступ к моему профилю для этого круга
            </Button>
          </div>
        )}
      </Card>

      {/* Members Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider px-1">
          Участники круга ({members.length})
        </h3>

        <div className="space-y-2">
          {members.map((mem) => {
            const isMe = mem.userId === currentUserId;

            return (
              <Card
                key={mem.id}
                className="p-3.5 bg-[#17171A] border-[#26262B] flex items-center justify-between hover:border-[#383843] transition-colors"
              >
                <div
                  onClick={() => mem.profileId && navigate(`/profile/${mem.profileId}`)}
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                >
                  <Avatar src={mem.user.avatarUrl} name={mem.user.firstName} size="sm" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#F5F5F7] hover:text-[#D8B4B0] transition-colors">
                        {mem.user.firstName} {mem.user.lastName || ''}
                      </span>
                      {isMe && <span className="text-[10px] text-[#A1A1AA]">(Вы)</span>}
                    </div>
                    {mem.user.username && (
                      <span className="text-[10px] text-[#71717A] font-mono">@{mem.user.username}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={mem.role === 'OWNER' ? 'accent' : 'secondary'} className="text-[9px]">
                    {mem.role === 'OWNER' ? 'Создатель' : 'Участник'}
                  </Badge>

                  {!isMe && mem.profileId && (
                    <button
                      onClick={() => navigate(`/profile/${mem.profileId}`)}
                      className="p-1.5 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors"
                      title="Просмотреть Gift Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isOwner && !isMe && (
                    <button
                      onClick={() => removeMember(mem.userId)}
                      className="p-1.5 text-[#71717A] hover:text-[#C97B7B] transition-colors"
                      title="Удалить из круга"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Access Matrix Modal */}
      {profile && (
        <AccessMatrixModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          circleId={circle.id}
          circleName={circle.name}
          profileId={profile.id}
        />
      )}
    </div>
  );
}
