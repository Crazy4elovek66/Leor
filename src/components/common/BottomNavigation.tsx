import { User, Gift, Users, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { key: 'profile', label: 'Профиль', icon: User, path: '/profile', active: location.pathname === '/profile' },
    { key: 'wishes', label: 'Желания', icon: Gift, path: '/wishes', active: false, disabled: true },
    { key: 'circles', label: 'Круги', icon: Users, path: '/circles', active: location.pathname.startsWith('/circles'), disabled: false },
    { key: 'memories', label: 'Память', icon: Sparkles, path: '/memories', active: false, disabled: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#17171A]/95 backdrop-blur-md border-t border-[#26262B] h-[72px] px-4 flex items-center justify-around max-w-md mx-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => !item.disabled && navigate(item.path)}
            disabled={item.disabled}
            className={cn(
              'flex flex-col items-center justify-center space-y-1 w-16 py-1 transition-colors select-none',
              item.active ? 'text-[#D8B4B0]' : 'text-[#71717A]',
              item.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
