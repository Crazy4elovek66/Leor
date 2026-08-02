export type WishCategory =
  | 'TECH'
  | 'BOOKS'
  | 'CLOTHING'
  | 'BEAUTY'
  | 'HOME'
  | 'HOBBY'
  | 'FOOD'
  | 'TRAVEL'
  | 'EXPERIENCE'
  | 'OTHER';

export type WishPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type WishStatus = 'ACTIVE' | 'ARCHIVED';
export type WishSource = 'MANUAL' | 'LINK' | 'IMPORT';
export type WishContext = 'BIRTHDAY' | 'NEW_YEAR' | 'ANNIVERSARY' | 'JUST_WANT' | 'SOMEDAY' | 'OTHER';

export interface WishItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  link: string | null;
  price: number | null;
  currency: string;
  category: WishCategory;
  priority: WishPriority;
  visibility: 'PRIVATE' | 'CIRCLE' | 'SELECTED_CIRCLES' | 'PUBLIC';
  status: WishStatus;
  sourceType: WishSource;
  context: WishContext;
  isSurpriseFriendly: boolean;
  sizeOverride: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishPayload {
  title: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  link?: string;
  price?: number;
  currency?: string;
  category?: WishCategory;
  priority?: WishPriority;
  context?: WishContext;
  isSurpriseFriendly?: boolean;
  sizeOverride?: string;
}

export interface UpdateWishPayload extends Partial<CreateWishPayload> {
  status?: WishStatus;
}

export const WISH_CATEGORY_META: Record<WishCategory, { label: string; iconName: string }> = {
  TECH: { label: 'Техника & Гаджеты', iconName: 'Smartphone' },
  BOOKS: { label: 'Книги & Литература', iconName: 'BookOpen' },
  CLOTHING: { label: 'Одежда & Обувь', iconName: 'Shirt' },
  BEAUTY: { label: 'Красота & Парфюм', iconName: 'Sparkles' },
  HOME: { label: 'Дом & Уют', iconName: 'Home' },
  HOBBY: { label: 'Хобби & Творчество', iconName: 'Palette' },
  FOOD: { label: 'Еда & Гастрономия', iconName: 'Utensils' },
  TRAVEL: { label: 'Путешествия', iconName: 'Plane' },
  EXPERIENCE: { label: 'Впечатления & Эмоции', iconName: 'Smile' },
  OTHER: { label: 'Другое', iconName: 'Gift' },
};

export const WISH_PRIORITY_META: Record<WishPriority, { label: string; colorClass: string; weight: number }> = {
  HIGH: { label: 'Очень хочу', colorClass: 'bg-[#C97B7B]/20 text-[#C97B7B] border-[#C97B7B]/40', weight: 1 },
  MEDIUM: { label: 'Желанно', colorClass: 'bg-[#D8B4B0]/20 text-[#D8B4B0] border-[#D8B4B0]/40', weight: 2 },
  LOW: { label: 'Буду рад', colorClass: 'bg-[#26262B] text-[#A1A1AA] border-[#383843]', weight: 3 },
};

export const WISH_CONTEXT_LABELS: Record<WishContext, string> = {
  BIRTHDAY: 'На день рождения',
  NEW_YEAR: 'На Новый год',
  ANNIVERSARY: 'На годовщину',
  JUST_WANT: 'Просто мечтаю',
  SOMEDAY: 'Когда-нибудь',
  OTHER: 'Повод',
};
