import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompletenessWidget } from './CompletenessWidget';
import { InterestsGrid } from './InterestsGrid';
import { SizesSection } from './SizesSection';
import { EditProfileModal } from './EditProfileModal';
import { useGiftProfile } from '../hooks/useGiftProfile';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';
import { WishlistGrid } from '@/features/wishlist/components/WishlistGrid';
import { CreateWishModal } from '@/features/wishlist/components/CreateWishModal';
import { WishDetailsModal } from '@/features/wishlist/components/WishDetailsModal';
import { resolveWishSize } from '@/features/wishlist/utils/resolveWishSize';
import type { WishItem } from '@/features/wishlist/types';
import { formatDate } from '@/lib/utils';
import { Edit3, MapPin, Calendar, Sparkles, Shirt, Heart, Gift, Plus } from 'lucide-react';

interface GiftProfileViewProps {
  userId: string;
  profileId: string;
}

export function GiftProfileView({ userId, profileId }: GiftProfileViewProps) {
  const { profile, isLoading, error, updateBaseProfile, toggleInterest, setSize } = useGiftProfile(
    userId,
    profileId
  );
  const { wishes, uploadWishImage, createWish, archiveWish, deleteWish } = useWishlist(userId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateWishOpen, setIsCreateWishOpen] = useState(false);
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);

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
      <div className="text-center py-12">
        <p className="text-sm text-[#C97B7B]">{error || 'Профиль не найден'}</p>
      </div>
    );
  }

  const { user, bio, city, birthDate, completeness, tastes, sizes } = profile;
  const activeWishes = wishes.filter((w) => w.status === 'ACTIVE');

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header Card */}
      <Card className="p-6 bg-[#17171A] border-[#26262B] relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar src={user.avatarUrl} name={user.firstName} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7] tracking-tight">
                {user.firstName} {user.lastName || ''}
              </h2>
              {user.username && (
                <span className="text-xs text-[#A1A1AA] font-mono">@{user.username}</span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="rounded-full px-3 text-xs"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
            Редактировать
          </Button>
        </div>

        {/* Bio section */}
        {bio ? (
          <p className="text-xs text-[#F5F5F7]/90 leading-relaxed mt-4 pt-3 border-t border-[#26262B]">
            «{bio}»
          </p>
        ) : (
          <p className="text-xs text-[#71717A] italic mt-4 pt-3 border-t border-[#26262B]">
            Расскажите немного о себе, чтобы друзья знали, что вас вдохновляет...
          </p>
        )}

        {/* City and BirthDate tags */}
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

      {/* Completeness Widget */}
      <CompletenessWidget
        completeness={completeness}
        onOptimize={() => setIsEditModalOpen(true)}
      />

      {/* Wishlist Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-[#D8B4B0]" />
            <h3 className="text-sm font-semibold text-[#F5F5F7]">Мой Wishlist</h3>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateWishOpen(true)}
            className="rounded-full px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Добавить
          </Button>
        </div>

        {activeWishes.length > 0 ? (
          <WishlistGrid
            wishes={activeWishes}
            profileSizes={sizes}
            onSelectWish={(w) => setSelectedWish(w)}
          />
        ) : (
          <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
            <p className="text-xs text-[#A1A1AA] mb-3">Ваш список желаний пока пуст</p>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateWishOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
              Добавить первое желание
            </Button>
          </Card>
        )}
      </div>

      {/* Interests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-[#D8B4B0]" />
            <h3 className="text-sm font-semibold text-[#F5F5F7]">Интересы и вкусы</h3>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs text-[#D8B4B0] hover:underline"
          >
            Изменить
          </button>
        </div>

        {tastes.length > 0 ? (
          <Card className="p-5 bg-[#17171A] border-[#26262B]">
            <InterestsGrid
              selectedInterests={tastes}
              onToggleInterest={toggleInterest}
              isEditable={false}
            />
          </Card>
        ) : (
          <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
            <p className="text-xs text-[#A1A1AA] mb-3">У вас пока не выбраны интересы</p>
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
              Выбрать 3-5 интересов
            </Button>
          </Card>
        )}
      </div>

      {/* Sizes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Shirt className="w-4 h-4 text-[#D8B4B0]" />
            <h3 className="text-sm font-semibold text-[#F5F5F7]">Мои размеры</h3>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs text-[#D8B4B0] hover:underline"
          >
            Изменить
          </button>
        </div>

        {sizes.length > 0 ? (
          <SizesSection sizes={sizes} onSaveSize={setSize} isEditable={false} />
        ) : (
          <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
            <p className="text-xs text-[#A1A1AA] mb-3">Размеры одежды и обуви еще не указаны</p>
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
              Указать размеры
            </Button>
          </Card>
        )}
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onUpdateBaseProfile={updateBaseProfile}
        onToggleInterest={toggleInterest}
        onSaveSize={setSize}
      />

      <CreateWishModal
        isOpen={isCreateWishOpen}
        onClose={() => setIsCreateWishOpen(false)}
        onSubmit={async (payload) => {
          await createWish(payload);
        }}
        onUploadImage={uploadWishImage}
      />

      <WishDetailsModal
        isOpen={!!selectedWish}
        onClose={() => setSelectedWish(null)}
        wish={selectedWish}
        resolvedSize={selectedWish ? resolveWishSize(selectedWish.category, sizes, selectedWish.sizeOverride) : null}
        isOwner
        onArchive={archiveWish}
        onDelete={deleteWish}
      />
    </div>
  );
}
