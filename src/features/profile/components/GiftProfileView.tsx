import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { TasteGraphView } from '@/features/taste/components/TasteGraphView';
import { ShareSettings } from '@/features/share/components/ShareSettings';
import { resolveWishSize } from '@/features/wishlist/utils/resolveWishSize';
import type { WishItem } from '@/features/wishlist/types';
import { formatDate } from '@/lib/utils';
import { Edit3, MapPin, Calendar, Sparkles, Shirt, Heart, Gift, Plus, BookmarkCheck, Archive } from 'lucide-react';

interface GiftProfileViewProps {
  userId: string;
  profileId: string;
}

export function GiftProfileView({ userId, profileId }: GiftProfileViewProps) {
  const navigate = useNavigate();
  const { profile, isLoading, error, updateBaseProfile, toggleInterest, setSize } = useGiftProfile(
    userId,
    profileId
  );
  const { wishes, uploadWishImage, createWish, updateWish, archiveWish, deleteWish } = useWishlist(userId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'info' | 'interests' | 'sizes'>('info');

  const [isCreateWishOpen, setIsCreateWishOpen] = useState(false);
  const [wishToEdit, setWishToEdit] = useState<WishItem | null>(null);
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);

  const [wishlistTab, setWishlistTab] = useState<'active' | 'archived'>('active');

  const openEditModal = (tab: 'info' | 'interests' | 'sizes' = 'info') => {
    setEditModalTab(tab);
    setIsEditModalOpen(true);
  };

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
  const archivedWishes = wishes.filter((w) => w.status === 'ARCHIVED');
  const displayWishes = wishlistTab === 'active' ? activeWishes : archivedWishes;

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header Card - Responsive & Compact Layout for mobile screens */}
      <Card className="p-5 bg-[#17171A] border-[#26262B] relative overflow-hidden space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar src={user.avatarUrl} name={user.firstName} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#F5F5F7] tracking-tight truncate">
              {user.firstName} {user.lastName || ''}
            </h2>
            {user.username && (
              <span className="text-xs text-[#A1A1AA] font-mono truncate block">@{user.username}</span>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#26262B]/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reservations')}
            className="rounded-full px-3 text-xs w-full flex items-center justify-center"
          >
            <BookmarkCheck className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0] shrink-0" />
            <span>Мои брони</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal('info')}
            className="rounded-full px-3 text-xs w-full flex items-center justify-center"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0] shrink-0" />
            <span>Редактировать</span>
          </Button>
        </div>

        {/* Bio section */}
        {bio ? (
          <p className="text-xs text-[#F5F5F7]/90 leading-relaxed pt-2 border-t border-[#26262B]/50">
            «{bio}»
          </p>
        ) : (
          <p className="text-xs text-[#71717A] italic pt-2 border-t border-[#26262B]/50">
            Расскажите немного о себе, чтобы друзья знали, что вас вдохновляет...
          </p>
        )}

        {/* City and BirthDate tags */}
        {(city || birthDate) && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-[#26262B]/50 text-xs text-[#A1A1AA]">
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
        onOptimize={() => openEditModal('interests')}
      />

      {/* Wishlist Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-[#D8B4B0]" />
            <h3 className="text-sm font-semibold text-[#F5F5F7]">Мой Wishlist</h3>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setWishToEdit(null);
                setIsCreateWishOpen(true);
              }}
              className="rounded-full px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Wishlist Tabs (Active vs Archived) */}
        <div className="flex items-center space-x-2 px-1 border-b border-[#26262B] pb-2 text-xs">
          <button
            onClick={() => setWishlistTab('active')}
            className={`px-3 py-1 rounded-full transition-all ${
              wishlistTab === 'active'
                ? 'bg-[#D8B4B0] text-[#0F0F10] font-semibold'
                : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
            }`}
          >
            Активные ({activeWishes.length})
          </button>
          <button
            onClick={() => setWishlistTab('archived')}
            className={`px-3 py-1 rounded-full transition-all flex items-center space-x-1 ${
              wishlistTab === 'archived'
                ? 'bg-[#D8B4B0] text-[#0F0F10] font-semibold'
                : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
            }`}
          >
            <Archive className="w-3 h-3" />
            <span>Архив ({archivedWishes.length})</span>
          </button>
        </div>

        {displayWishes.length > 0 ? (
          <div className="space-y-3">
            <WishlistGrid
              wishes={displayWishes}
              profileSizes={sizes}
              onSelectWish={(w) => setSelectedWish(w)}
              isOwner={true}
            />

            {/* In Archive view: provide quick restore button option */}
            {wishlistTab === 'archived' && (
              <div className="text-center pt-2">
                <p className="text-[11px] text-[#A1A1AA]">
                  Кликните на желание для просмотра деталей или восстановления.
                </p>
              </div>
            )}
          </div>
        ) : (
          <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
            <p className="text-xs text-[#A1A1AA] mb-3">
              {wishlistTab === 'active' ? 'Ваш список активных желаний пока пуст' : 'В архиве нет желаний'}
            </p>
            {wishlistTab === 'active' && (
              <Button variant="secondary" size="sm" onClick={() => {
                setWishToEdit(null);
                setIsCreateWishOpen(true);
              }}>
                <Plus className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
                Добавить первое желание
              </Button>
            )}
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
            onClick={() => openEditModal('interests')}
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
            <Button variant="secondary" size="sm" onClick={() => openEditModal('interests')}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
              Выбрать 3-5 интересов
            </Button>
          </Card>
        )}
      </div>

      {/* Taste Graph Section */}
      <TasteGraphView profileId={profileId} />

      {/* Sizes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Shirt className="w-4 h-4 text-[#D8B4B0]" />
            <h3 className="text-sm font-semibold text-[#F5F5F7]">Мои размеры</h3>
          </div>
          <button
            onClick={() => openEditModal('sizes')}
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
            <Button variant="secondary" size="sm" onClick={() => openEditModal('sizes')}>
              Указать размеры
            </Button>
          </Card>
        )}
      </div>

      {/* Public Share Settings Section */}
      <ShareSettings profileId={profileId} />

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        initialTab={editModalTab}
        onUpdateBaseProfile={updateBaseProfile}
        onToggleInterest={toggleInterest}
        onSaveSize={setSize}
      />

      <CreateWishModal
        isOpen={isCreateWishOpen}
        onClose={() => {
          setIsCreateWishOpen(false);
          setWishToEdit(null);
        }}
        wishToEdit={wishToEdit}
        onSubmit={async (payload) => {
          if (wishToEdit) {
            await updateWish(wishToEdit.id, payload);
          } else {
            await createWish(payload);
          }
          setWishToEdit(null);
        }}
        onUploadImage={uploadWishImage}
      />

      <WishDetailsModal
        isOpen={!!selectedWish}
        onClose={() => setSelectedWish(null)}
        wish={selectedWish}
        resolvedSize={selectedWish ? resolveWishSize(selectedWish.category, sizes, selectedWish.sizeOverride) : null}
        isOwner
        onEdit={(w) => {
          setSelectedWish(null);
          setWishToEdit(w);
          setIsCreateWishOpen(true);
        }}
        onArchive={async (id) => {
          if (selectedWish?.status === 'ARCHIVED') {
            await updateWish(id, { status: 'ACTIVE' });
          } else {
            await archiveWish(id);
          }
        }}
        onDelete={deleteWish}
      />
    </div>
  );
}
