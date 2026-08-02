import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Circle } from '../types';
import { ChevronRight, Lock } from 'lucide-react';

interface CircleCardProps {
  circle: Circle;
  onClick: () => void;
}

export function CircleCard({ circle, onClick }: CircleCardProps) {
  const isOwner = circle.userRole === 'OWNER';

  return (
    <Card
      onClick={onClick}
      className="p-5 bg-[#17171A] border-[#26262B] hover:border-[#D8B4B0]/50 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#26262B] border border-[#383843] flex items-center justify-center text-[#D8B4B0] font-bold text-lg overflow-hidden shrink-0">
            {circle.avatarUrl ? (
              <img src={circle.avatarUrl} alt={circle.name} className="w-full h-full object-cover" />
            ) : (
              circle.name.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[#F5F5F7] group-hover:text-[#D8B4B0] transition-colors">
                {circle.name}
              </h3>
              {circle.isArchived && (
                <Badge variant="outline" className="text-[10px] text-[#A1A1AA] border-[#383843]">
                  <Lock className="w-2.5 h-2.5 mr-1" /> Архив
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={isOwner ? 'accent' : 'secondary'} className="text-[10px] uppercase tracking-wider">
                {isOwner ? 'Создатель' : 'Участник'}
              </Badge>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-[#71717A] group-hover:text-[#D8B4B0] transition-colors" />
      </div>
    </Card>
  );
}
