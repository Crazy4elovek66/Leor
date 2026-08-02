import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface BasicInfoFormProps {
  initialBio?: string | null;
  initialCity?: string | null;
  initialBirthDate?: string | null;
  onSave: (data: { bio: string; city: string; birthDate: string }) => Promise<void>;
  onCancel?: () => void;
}

export function BasicInfoForm({
  initialBio = '',
  initialCity = '',
  initialBirthDate = '',
  onSave,
  onCancel,
}: BasicInfoFormProps) {
  const [bio, setBio] = useState(initialBio || '');
  const [city, setCity] = useState(initialCity || '');
  const [birthDate, setBirthDate] = useState(initialBirthDate || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave({ bio, city, birthDate });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        label="Коротко о себе (био)"
        placeholder="Люблю эстетичные вещи, нишевый парфюм и уютные книги..."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
      />

      <Input
        label="Город проживания"
        placeholder="Москва, Санкт-Петербург..."
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <Input
        label="Дата рождения"
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />

      <div className="flex items-center space-x-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </form>
  );
}
