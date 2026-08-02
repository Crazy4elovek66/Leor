import { Outlet } from 'react-router-dom';
import { TelegramSafeContainer } from '@/components/common/TelegramSafeContainer';
import { Header } from '@/components/common/Header';
import { BottomNavigation } from '@/components/common/BottomNavigation';

export function AppLayout() {
  return (
    <TelegramSafeContainer>
      <Header title="Leor" subtitle="Secret Circle" />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNavigation />
    </TelegramSafeContainer>
  );
}
