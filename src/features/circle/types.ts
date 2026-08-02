import type { UserBasicInfo } from '../profile/types';

export type CircleRole = 'OWNER' | 'MEMBER';
export type ProfileSection = 'BASIC_INFO' | 'INTERESTS' | 'SIZES' | 'WISHLIST' | 'MEMORIES';

export interface Circle {
  id: string;
  name: string;
  avatarUrl: string | null;
  ownerId: string;
  inviteCode: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  userRole?: CircleRole;
}

export interface CircleMember {
  id: string;
  circleId: string;
  userId: string;
  role: CircleRole;
  joinedAt: string;
  user: UserBasicInfo;
  profileId?: string;
}

export interface CircleAccessItem {
  id: string;
  circleId: string;
  profileId: string;
  section: ProfileSection;
  createdAt: string;
}

export const SECTION_LABELS: Record<ProfileSection, { label: string; description: string; disabled?: boolean }> = {
  BASIC_INFO: {
    label: 'Базовая информация',
    description: 'О себе, город проживания и дата рождения',
  },
  INTERESTS: {
    label: 'Интересы и вкусы',
    description: 'Любимые книги, фильмы, хобби и бренды',
  },
  SIZES: {
    label: 'Мои размеры',
    description: 'Размеры одежды, обуви, колец и украшений',
  },
  WISHLIST: {
    label: 'Список желаний (Wishlist)',
    description: 'Карточки подарков и бронирование',
    disabled: true,
  },
  MEMORIES: {
    label: 'Совместные воспоминания',
    description: 'Хроника памятных событий и архив фото',
    disabled: true,
  },
};
