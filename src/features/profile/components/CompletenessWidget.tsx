import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface CompletenessWidgetProps {
  completeness: number;
  onOptimize?: () => void;
}

export function CompletenessWidget({ completeness, onOptimize }: CompletenessWidgetProps) {
  return (
    <Card className="bg-[#17171A] border-[#26262B] p-5 my-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#D8B4B0]" />
          <h4 className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider">
            Карта профиля
          </h4>
        </div>
        <span className="text-sm font-bold text-[#D8B4B0] font-mono">{completeness}%</span>
      </div>

      <Progress value={completeness} className="mb-3" />

      <p className="text-xs text-[#A1A1AA] leading-normal mb-3">
        {completeness < 50
          ? 'Добавьте интересы и размеры, чтобы близким было легче выбирать подарки.'
          : completeness < 80
          ? 'Ваш профиль почти заполнен! Расскажите о ваших любимых книгах или фильмах.'
          : 'Ваш Gift Profile отлично заполнен и готов для вашего круга!'}
      </p>

      {onOptimize && completeness < 100 && (
        <button
          onClick={onOptimize}
          className="text-xs font-medium text-[#D8B4B0] hover:text-[#E5C5C1] transition-colors underline underline-offset-4"
        >
          Заполнить профиль дальше &rarr;
        </button>
      )}
    </Card>
  );
}
