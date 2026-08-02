import React from 'react';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface TelegramAuthGuardProps {
  children: (props: { userId: string; profileId: string }) => React.ReactNode;
}

export function TelegramAuthGuard({ children }: TelegramAuthGuardProps) {
  const { user, profileId, isLoading, error } = useTelegramAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <Skeleton className="w-48 h-6 rounded-lg" />
        <Skeleton className="w-32 h-4 rounded-lg" />
        <p className="text-xs text-[#A1A1AA] pt-4">Инициализация Leor...</p>
      </div>
    );
  }

  if (error || !user || !profileId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
        <div className="p-4 bg-[#C97B7B]/10 rounded-full border border-[#C97B7B]/20 text-[#C97B7B]">
          ⚠️
        </div>
        <h2 className="text-lg font-semibold text-[#F5F5F7]">Ошибка подключения</h2>
        <p className="text-xs text-[#A1A1AA] max-w-xs">{error || 'Не удалось авторизоваться через Telegram'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-xs font-medium text-[#D8B4B0] border border-[#D8B4B0]/30 rounded-xl"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return <>{children({ userId: user.id, profileId })}</>;
}
