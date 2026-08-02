import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { CreateWishPayload, WishCategory, WishPriority, WishContext } from '../types';
import { WISH_CATEGORY_META, WISH_PRIORITY_META, WISH_CONTEXT_LABELS } from '../types';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CreateWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateWishPayload) => Promise<void>;
  onUploadImage?: (file: File) => Promise<string | null>;
}

const CATEGORIES: WishCategory[] = ['TECH', 'BOOKS', 'CLOTHING', 'BEAUTY', 'HOME', 'HOBBY', 'FOOD', 'TRAVEL', 'EXPERIENCE', 'OTHER'];
const PRIORITIES: WishPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
const CONTEXTS: WishContext[] = ['BIRTHDAY', 'NEW_YEAR', 'ANNIVERSARY', 'JUST_WANT', 'SOMEDAY', 'OTHER'];

export function CreateWishModal({ isOpen, onClose, onSubmit, onUploadImage }: CreateWishModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<WishCategory>('OTHER');
  const [priority, setPriority] = useState<WishPriority>('MEDIUM');
  const [context, setContext] = useState<WishContext>('JUST_WANT');
  const [isSurpriseFriendly, setIsSurpriseFriendly] = useState(true);
  const [sizeOverride, setSizeOverride] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    try {
      setIsUploading(true);
      const url = await onUploadImage(file);
      if (url) {
        setImageUrl(url);
        toast.success('Обложка успешно загружена!');
      } else {
        toast.error('Не удалось загрузить изображение');
      }
    } catch (err) {
      toast.error('Ошибка загрузки фото');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        link: link.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: 'RUB',
        category,
        priority,
        context,
        isSurpriseFriendly,
        sizeOverride: sizeOverride.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setBrand('');
      setPrice('');
      setLink('');
      setImageUrl('');
      setCategory('OTHER');
      setPriority('MEDIUM');
      setContext('JUST_WANT');
      setIsSurpriseFriendly(true);
      setSizeOverride('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка создания желания');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Добавить карточку желания">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <Input
          label="Название желания *"
          placeholder="например, Наушники Sony WH-1000XM5"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Бренд / Производитель"
            placeholder="Sony, Zara, Nike..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <Input
            label="Примерная цена (₽)"
            type="number"
            placeholder="35 000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <Textarea
          label="Описание / Детали"
          placeholder="Желательно в черном цвете, с поддержкой шумоподавления..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <Input
          label="Ссылка на магазин / товар"
          placeholder="https://..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        {/* Image Upload Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider block">
            Обложка (фото)
          </label>
          <div className="flex items-center space-x-3">
            {imageUrl ? (
              <img src={imageUrl} alt="Превью" className="w-12 h-12 rounded-xl object-cover border border-[#26262B]" />
            ) : null}

            <label className="flex-1 cursor-pointer bg-[#17171A] border border-[#26262B] hover:border-[#D8B4B0]/50 rounded-2xl p-3 text-center transition-colors flex items-center justify-center space-x-2 text-xs text-[#A1A1AA]">
              <Upload className="w-4 h-4 text-[#D8B4B0]" />
              <span>{isUploading ? 'Загрузка...' : imageUrl ? 'Заменить фото' : 'Загрузить обложку'}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Category Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider block">Категория</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((catKey) => {
              const meta = WISH_CATEGORY_META[catKey];
              const active = category === catKey;
              return (
                <button
                  type="button"
                  key={catKey}
                  onClick={() => setCategory(catKey)}
                  className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? 'bg-[#D8B4B0] text-[#0F0F10] border-[#D8B4B0] font-semibold'
                      : 'bg-[#17171A] text-[#A1A1AA] border-[#26262B] hover:text-[#F5F5F7]'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority & Context Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider block">Приоритет</label>
            <div className="space-y-1">
              {PRIORITIES.map((pKey) => {
                const meta = WISH_PRIORITY_META[pKey];
                const active = priority === pKey;
                return (
                  <button
                    type="button"
                    key={pKey}
                    onClick={() => setPriority(pKey)}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-[#D8B4B0] text-[#0F0F10] border-[#D8B4B0] font-semibold'
                        : 'bg-[#17171A] text-[#A1A1AA] border-[#26262B]'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider block">Повод / Контекст</label>
            <div className="space-y-1">
              {CONTEXTS.map((cKey) => {
                const label = WISH_CONTEXT_LABELS[cKey];
                const active = context === cKey;
                return (
                  <button
                    type="button"
                    key={cKey}
                    onClick={() => setContext(cKey)}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-[#D8B4B0] text-[#0F0F10] border-[#D8B4B0] font-semibold'
                        : 'bg-[#17171A] text-[#A1A1AA] border-[#26262B]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Surprise Friendly Checkbox */}
        <label className="flex items-center space-x-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isSurpriseFriendly}
            onChange={(e) => setIsSurpriseFriendly(e.target.checked)}
            className="w-4 h-4 rounded border-[#383843] bg-[#26262B] accent-[#D8B4B0]"
          />
          <span className="text-xs text-[#F5F5F7]">Будет отличным сюрпризом</span>
        </label>

        {/* Size Override (Exceptions) */}
        <Input
          label="Свой размер (только если отличается от указанного в профиле)"
          placeholder="например, Oversize L"
          value={sizeOverride}
          onChange={(e) => setSizeOverride(e.target.value)}
        />

        <div className="flex items-center space-x-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? 'Сохранение...' : 'Добавить желание'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
