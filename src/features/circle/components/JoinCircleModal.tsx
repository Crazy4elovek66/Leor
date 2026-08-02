import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabase';
import { toast } from 'sonner';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onJoined: () => void;
}

export function JoinCircleModal({ isOpen, onClose, currentUserId, onJoined }: JoinCircleModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim();
    if (!cleanCode) return;

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase.functions.invoke('circle-invite', {
        body: { action: 'join', inviteCode: cleanCode, userId: currentUserId },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Не удалось вступить в круг');
        return;
      }

      toast.success(`Вы вступили в круг "${data?.circleName || 'Близкие'}"!`);
      setInviteCode('');
      onJoined();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка вступления по коду');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Вступить по приглашению">
      <form onSubmit={handleJoin} className="space-y-4">
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Введите 10-значный код приглашения, отправленный вам создателем круга.
        </p>

        <Input
          label="Код приглашения (Base62)"
          placeholder="например, aB7xK9mP2q"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
          autoFocus
          className="font-mono text-center tracking-wider text-base"
        />

        <div className="flex items-center space-x-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting || !inviteCode.trim()}
          >
            {isSubmitting ? 'Проверка...' : 'Вступить'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
