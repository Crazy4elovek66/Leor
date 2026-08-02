import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { InterestsGrid } from '@/features/profile/components/InterestsGrid';
import { SizesSection } from '@/features/profile/components/SizesSection';
import { useMemberProfile } from '../hooks/useMemberProfile';
import { formatDate } from '@/lib/utils';
import { ChevronLeft, MapPin, Calendar, Lock, Heart, Shirt } from 'lucide-react';

export function MemberProfileView() {
  const { id: profileId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isLoading, error } = useMemberProfile(profileId);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-[#26262B] animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-[#26262B] rounded-lg animate-pulse w-1/2" />
            <div className="h-3 bg-[#26262B] rounded-lg animate-pulse w-1/3" />
          </div>
        </div>
        <div className="h-28 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#26262B] flex items-center justify-center text-[#C97B7B] mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-xs mx-auto">
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Доступ ограничен</h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            {error || 'У вас нет доступа к просмотру этого профиля.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/circles')}>
          Вернуться к кругам
        </Button>
      </div>
    );
  }

  const { user, bio, city, birthDate, tastes, sizes } = profile;

  return (
    <div className="space-y-6 pb-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Назад</span>
      </button>

      {/* User Card */}
      <Card className="p-6 bg-[#17171A] border-[#26262B]">
        <div className="flex items-center space-x-4">
          <Avatar src={user.avatarUrl} name={user.firstName} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F7]">
              {user.firstName} {user.lastName || ''}
            </h2>
            {user.username && (
              <span className="text-xs text-[#A1A1AA] font-mono">@{user.username}</span>
            )}
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-xs text-[#F5F5F7]/90 leading-relaxed mt-4 pt-3 border-t border-[#26262B]">
            «{bio}»
          </p>
        )}

        {/* City and BirthDate */}
        {(city || birthDate) && (
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[#26262B]/50 text-xs text-[#A1A1AA]">
            {city && (
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D8B4B0]" />
                <span>{city}</span>
              </div>
            )}
            {birthDate && (
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D8B4B0]" />
                <span>{formatDate(birthDate)}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Interests Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 px-1">
          <Heart className="w-4 h-4 text-[#D8B4B0]" />
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Интересы и вкусы</h3>
        </div>

        {tastes.length > 0 ? (
          <Card className="p-5 bg-[#17171A] border-[#26262B]">
            <InterestsGrid selectedInterests={tastes} onToggleInterest={() => {}} isEditable={false} />
          </Card>
        ) : (
          <Card className="p-5 text-center bg-[#17171A] border-[#26262B]/60">
            <Lock className="w-4 h-4 text-[#71717A] mx-auto mb-1.5" />
            <p className="text-xs text-[#A1A1AA]">Раздел интересов не предоставлен или пуст</p>
          </Card>
        )}
      </div>

      {/* Sizes Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 px-1">
          <Shirt className="w-4 h-4 text-[#D8B4B0]" />
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Размеры</h3>
        </div>

        {sizes.length > 0 ? (
          <SizesSection sizes={sizes} onSaveSize={async () => {}} isEditable={false} />
        ) : (
          <Card className="p-5 text-center bg-[#17171A] border-[#26262B]/60">
            <Lock className="w-4 h-4 text-[#71717A] mx-auto mb-1.5" />
            <p className="text-xs text-[#A1A1AA]">Раздел размеров не предоставлен или не заполнен</p>
          </Card>
        )}
      </div>
    </div>
  );
}
