import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ProfileSizeItem, SizeCategory } from '../types';
import { Shirt, Footprints, Sparkles, Edit2, Check } from 'lucide-react';

interface SizesSectionProps {
  sizes: ProfileSizeItem[];
  onSaveSize: (category: SizeCategory, value: string) => Promise<void>;
  isEditable?: boolean;
}

const SIZE_CATEGORIES: { category: SizeCategory; label: string; placeholder: string; icon: any }[] = [
  { category: 'CLOTHING_TOP', label: 'Верхняя одежда', placeholder: 'например, S или 42-44', icon: Shirt },
  { category: 'CLOTHING_BOTTOM', label: 'Нижняя одежда / брюки', placeholder: 'например, M или 27-28', icon: Shirt },
  { category: 'SHOES', label: 'Обувь', placeholder: 'например, EU 38 или 24.5 см', icon: Footprints },
  { category: 'RING', label: 'Кольца', placeholder: 'например, 16.5', icon: Sparkles },
  { category: 'BRACELET', label: 'Браслеты', placeholder: 'например, 16 см', icon: Sparkles },
  { category: 'NECKLACE', label: 'Цепочки / колье', placeholder: 'например, 45 см', icon: Sparkles },
];

export function SizesSection({ sizes, onSaveSize, isEditable = true }: SizesSectionProps) {
  const [editingCategory, setEditingCategory] = useState<SizeCategory | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const getValue = (cat: SizeCategory) => {
    return sizes.find((s) => s.category === cat)?.value || '';
  };

  const handleStartEdit = (cat: SizeCategory) => {
    setEditingCategory(cat);
    setTempValue(getValue(cat));
  };

  const handleSave = async (cat: SizeCategory) => {
    try {
      setIsSaving(true);
      await onSaveSize(cat, tempValue);
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {SIZE_CATEGORIES.map((item) => {
        const value = getValue(item.category);
        const isEditing = editingCategory === item.category;
        const Icon = item.icon;

        if (!isEditable && !value) return null;

        return (
          <Card key={item.category} className="p-4 bg-[#17171A] border-[#26262B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#26262B] flex items-center justify-center text-[#D8B4B0]">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#A1A1AA]">{item.label}</div>
                  {!isEditing && (
                    <div className="text-sm font-semibold text-[#F5F5F7]">
                      {value || <span className="text-xs font-normal text-[#71717A]">Не указано</span>}
                    </div>
                  )}
                </div>
              </div>

              {isEditable && !isEditing && (
                <button
                  onClick={() => handleStartEdit(item.category)}
                  className="p-2 text-[#71717A] hover:text-[#D8B4B0] transition-colors rounded-lg hover:bg-[#26262B]"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditing && (
              <div className="mt-3 pt-3 border-t border-[#26262B] flex items-center space-x-2">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder={item.placeholder}
                  className="h-10 text-xs"
                  autoFocus
                />
                <button
                  onClick={() => handleSave(item.category)}
                  disabled={isSaving}
                  className="h-10 px-3 bg-[#D8B4B0] text-[#0F0F10] rounded-2xl font-semibold text-xs flex items-center justify-center shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
