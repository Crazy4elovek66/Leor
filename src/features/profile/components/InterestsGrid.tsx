import type { TasteCategory, TasteItem } from '../types';
import { BookOpen, Film, Gamepad2, Music, Plane, Sparkles, Home, Trophy, Palette } from 'lucide-react';

interface InterestsGridProps {
  selectedInterests: TasteItem[];
  onToggleInterest: (category: TasteCategory, title: string) => void;
  isEditable?: boolean;
}

export const PRESET_INTERESTS: { category: TasteCategory; label: string; icon: any; items: string[] }[] = [
  {
    category: 'BOOKS',
    label: 'Книги',
    icon: BookOpen,
    items: ['Художественная литература', 'Нон-фикшн', 'Психология', 'Поэзия', 'Классика', 'Фэнтези'],
  },
  {
    category: 'MOVIES',
    label: 'Фильмы & Кино',
    icon: Film,
    items: ['Артхаус', 'Драмы', 'Детективы', 'Французское кино', 'Документальные фильмы', 'Аниме'],
  },
  {
    category: 'MUSIC',
    label: 'Музыка',
    icon: Music,
    items: ['Винил', 'Инди', 'Джаз', 'Классическая музыка', 'Поп-музыка', 'Рок'],
  },
  {
    category: 'TRAVEL',
    label: 'Путешествия',
    icon: Plane,
    items: ['Горные походы', 'Европа', 'Азия', 'Отели & СПА', 'Выходные за городом', 'Море'],
  },
  {
    category: 'STYLE',
    label: 'Красота & Стиль',
    icon: Sparkles,
    items: ['Парфюмерия', 'Уходовая косметика', 'Минимализм', 'Нишевая парфюмерия', 'Украшения'],
  },
  {
    category: 'HOME',
    label: 'Дом & Керамика',
    icon: Home,
    items: ['Свечи', 'Керамика ручной работы', 'Растения', 'Текстиль', 'Декор', 'Чайные наборы'],
  },
  {
    category: 'HOBBY',
    label: 'Хобби & Творчество',
    icon: Palette,
    items: ['Фотография', 'Рисование', 'Кулинария', 'Выпечка', 'Вязание', 'Садоводство'],
  },
  {
    category: 'GAMES',
    label: 'Игры & Развлечения',
    icon: Gamepad2,
    items: ['Настольные игры', 'PlayStation', 'Пазлы', 'Головоломки', 'Кооперативные игры'],
  },
  {
    category: 'SPORT',
    label: 'Спорт & Велнес',
    icon: Trophy,
    items: ['Йога', 'Бег', 'Пилатес', 'Растяжка', 'Теннис', 'Плавание'],
  },
];

export function InterestsGrid({ selectedInterests, onToggleInterest, isEditable = true }: InterestsGridProps) {
  const isSelected = (category: TasteCategory, title: string) => {
    return selectedInterests.some((t) => t.category === category && t.title === title);
  };

  return (
    <div className="space-y-6">
      {PRESET_INTERESTS.map((group) => {
        const Icon = group.icon;
        const groupSelected = selectedInterests.filter((t) => t.category === group.category);

        if (!isEditable && groupSelected.length === 0) return null;

        return (
          <div key={group.category} className="space-y-2.5">
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4 text-[#D8B4B0]" />
              <h4 className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider">
                {group.label}
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {group.items.map((itemTitle) => {
                const active = isSelected(group.category, itemTitle);
                if (!isEditable && !active) return null;

                return (
                  <button
                    key={itemTitle}
                    disabled={!isEditable}
                    onClick={() => isEditable && onToggleInterest(group.category, itemTitle)}
                    className={`transition-all duration-200 text-xs px-3.5 py-1.5 rounded-full font-medium border ${
                      active
                        ? 'bg-[#D8B4B0] text-[#0F0F10] border-[#D8B4B0] font-semibold shadow-sm'
                        : 'bg-[#17171A] text-[#A1A1AA] border-[#26262B] hover:border-[#D8B4B0]/50 hover:text-[#F5F5F7]'
                    }`}
                  >
                    {itemTitle}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
