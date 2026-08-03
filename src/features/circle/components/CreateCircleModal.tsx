import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabase';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CreateCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, avatarUrl?: string) => Promise<void>;
}

export function CreateCircleModal({ isOpen, onClose, onCreate }: CreateCircleModalProps) {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `circles/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
        toast.success('Обложка круга загружена!');
      }
    } catch (err: any) {
      console.error('Failed to upload circle avatar:', err);
      toast.error('Ошибка загрузки обложки');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreate(name.trim(), avatarUrl.trim() || undefined);
      setName('');
      setAvatarUrl('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Создать близкий круг">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Название круга *"
          placeholder="Семья, Близкие друзья, Коллеги..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        {/* Local File Picker for Circle Avatar */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider block">
            Аватар круга
          </label>
          <div className="flex items-center space-x-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Аватар" className="w-12 h-12 rounded-full object-cover border border-[#26262B]" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#26262B] flex items-center justify-center text-xs text-[#A1A1AA]">
                {name ? name.slice(0, 2).toUpperCase() : '👥'}
              </div>
            )}

            <label className="flex-1 cursor-pointer bg-[#17171A] border border-[#26262B] hover:border-[#D8B4B0]/50 rounded-2xl p-3 text-center transition-colors flex items-center justify-center space-x-2 text-xs text-[#A1A1AA]">
              <Upload className="w-4 h-4 text-[#D8B4B0]" />
              <span>{isUploading ? 'Загрузка...' : avatarUrl ? 'Заменить фото' : 'Загрузить с устройства'}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Создание...' : 'Создать круг'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
