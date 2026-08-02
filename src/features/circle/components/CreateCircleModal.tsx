import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, avatarUrl?: string) => Promise<void>;
}

export function CreateCircleModal({ isOpen, onClose, onCreate }: CreateCircleModalProps) {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          label="Название круга"
          placeholder="Семья, Близкие друзья, Коллеги..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Ссылка на аватар (опционально)"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />

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
