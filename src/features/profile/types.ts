export type SizeCategory = 
  | 'CLOTHING_TOP'
  | 'CLOTHING_BOTTOM'
  | 'SHOES'
  | 'RING'
  | 'BRACELET'
  | 'NECKLACE';

export type TasteCategory = 
  | 'MOVIES'
  | 'BOOKS'
  | 'GAMES'
  | 'MUSIC'
  | 'TRAVEL'
  | 'STYLE'
  | 'HOME'
  | 'FOOD'
  | 'SPORT'
  | 'HOBBY'
  | 'BRANDS';

export type VisibilityLevel = 'PRIVATE' | 'CIRCLE' | 'SELECTED_CIRCLES' | 'PUBLIC';

export interface ProfileSizeItem {
  id?: string;
  category: SizeCategory;
  value: string;
  visibility?: VisibilityLevel;
}

export interface TasteItem {
  id?: string;
  category: TasteCategory;
  title: string;
  weight?: number;
}

export interface UserBasicInfo {
  id: string;
  telegramId: number;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface FullGiftProfile {
  id: string;
  userId: string;
  bio?: string | null;
  birthDate?: string | null;
  city?: string | null;
  user: UserBasicInfo;
  sizes: ProfileSizeItem[];
  tastes: TasteItem[];
  completeness: number; // 0..100%
}
