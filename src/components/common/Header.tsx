import { Avatar } from '@/components/ui/avatar';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  userAvatar?: string | null;
}

export function Header({ title = 'Leor', subtitle, userName, userAvatar }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-4 mb-4 border-b border-[#26262B]">
      <div>
        <h1 className="text-xl font-bold font-serif text-[#F5F5F7] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#A1A1AA] mt-0.5">{subtitle}</p>}
      </div>
      {userName && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#A1A1AA] font-medium hidden sm:inline">{userName}</span>
          <Avatar src={userAvatar} name={userName} size="sm" />
        </div>
      )}
    </header>
  );
}
