import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MemoryType } from '../types';
import { MEMORY_TYPE_META } from '../types';
import { X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    memory_type: MemoryType;
    event_date: string;
    cover_image_url?: string;
  }) => Promise<void>;
  onUploadCover: (file: File) => Promise<string | null>;
}

export function CreateMemoryModal({
  isOpen,
  onClose,
  onSubmit,
  onUploadCover,
}: CreateMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoryType, setMemoryType] = useState<MemoryType>('EVENT');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await onUploadCover(file);
    if (url) {
      setCoverUrl(url);
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      memory_type: memoryType,
      event_date: eventDate,
      cover_image_url: coverUrl || undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0F10]/80 backdrop-blur-sm flex items-center justify-center p-4 pt-[calc(env(safe-area-inset-top,24px)+36px)]">
      <Card className="w-full max-w-md bg-[#17171A] border-[#26262B] p-6 space-y-4 rounded-[28px] overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#D8B4B0]" />
            <h3 className="text-base font-bold text-[#F5F5F7]">Новое воспоминание</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#A1A1AA] hover:text-[#F5F5F7]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[#A1A1AA] font-medium block">Название события *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: День рождения 2026 или Поездка на море"
              className="w-full bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2.5 text-[#F5F5F7] focus:border-[#D8B4B0] focus:outline-none"
            />
          </div>

          {/* Event Date */}
          <div className="space-y-1">
            <label className="text-[#A1A1AA] font-medium block">Дата события *</label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2.5 text-[#F5F5F7] focus:border-[#D8B4B0] focus:outline-none"
            />
          </div>

          {/* Memory Type */}
          <div className="space-y-1">
            <label className="text-[#A1A1AA] font-medium block">Тип события</label>
            <select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value as MemoryType)}
              className="w-full bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2.5 text-[#F5F5F7] focus:border-[#D8B4B0] focus:outline-none"
            >
              {Object.entries(MEMORY_TYPE_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[#A1A1AA] font-medium block">Описание</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите ваши впечатления или историю..."
              className="w-full bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2 text-[#F5F5F7] focus:border-[#D8B4B0] focus:outline-none resize-none"
            />
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-1">
            <label className="text-[#A1A1AA] font-medium block">Обложка (фотография)</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="memory-cover-upload"
              />
              <label
                htmlFor="memory-cover-upload"
                className="flex-1 bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2.5 flex items-center justify-center space-x-2 cursor-pointer hover:border-[#D8B4B0]/50 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D8B4B0]" />
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-[#D8B4B0]" />
                    <span className="text-[#A1A1AA]">{coverUrl ? 'Обложка загружена' : 'Загрузить фото'}</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-2 pt-3 border-t border-[#26262B]">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">
              Отмена
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting || isUploading} className="flex-1">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
