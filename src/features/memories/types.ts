import type { Database } from '@/shared/types/database.types';

export type MemoryType = Database['public']['Enums']['memory_type'];

export interface MemoryParticipant {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  role?: string;
}

export interface MemoryMedia {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface MemoryItem {
  id: string;
  owner_user_id: string;
  circle_id: string | null;
  wish_id: string | null;
  gift_reservation_id: string | null;
  title: string;
  description: string | null;
  memory_type: MemoryType;
  event_date: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  participants?: MemoryParticipant[];
  media?: MemoryMedia[];
  wish_title?: string;
}

export interface TimelineItem {
  id: string;
  kind: 'MEMORY' | 'GIFT';
  sub_type: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  created_at: string;
  wish_id: string | null;
  wish_title: string | null;
  participants: MemoryParticipant[];
}

export const MEMORY_TYPE_META: Record<MemoryType, { label: string; colorClass: string }> = {
  GIFT: { label: 'Подарок', colorClass: 'bg-[#D8B4B0]/20 text-[#D8B4B0] border-[#D8B4B0]/40' },
  EVENT: { label: 'Событие', colorClass: 'bg-[#26262B] text-[#F5F5F7] border-[#383843]' },
  PHOTO: { label: 'Фото', colorClass: 'bg-[#26262B] text-[#A1A1AA] border-[#383843]' },
  TRAVEL: { label: 'Путешествие', colorClass: 'bg-[#26262B] text-[#D8B4B0] border-[#383843]' },
  CELEBRATION: { label: 'Праздник', colorClass: 'bg-[#D8B4B0]/20 text-[#D8B4B0] border-[#D8B4B0]/40' },
  ACHIEVEMENT: { label: 'Достижение', colorClass: 'bg-[#26262B] text-[#F5F5F7] border-[#383843]' },
  MILESTONE: { label: 'Этап', colorClass: 'bg-[#26262B] text-[#D8B4B0] border-[#383843]' },
  OTHER: { label: 'Момент', colorClass: 'bg-[#26262B] text-[#71717A] border-[#383843]' },
};
