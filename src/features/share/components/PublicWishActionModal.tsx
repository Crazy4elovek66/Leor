import { Gift, Sparkles, Heart, BookmarkCheck, X, ArrowRight } from 'lucide-react';

interface PublicWishActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishTitle: string;
  ownerName: string;
  actionType: 'reserve' | 'gift';
}

export function PublicWishActionModal({
  isOpen,
  onClose,
  wishTitle,
  ownerName,
  actionType,
}: PublicWishActionModalProps) {
  if (!isOpen) return null;

  const isReserve = actionType === 'reserve';

  const handleOpenBot = () => {
    // Opens Telegram bot — replace with your actual bot link
    const botUrl = 'https://t.me/LeorSecretBot';
    window.open(botUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F0F10]/80 backdrop-blur-sm flex items-end justify-center p-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#17171A] border border-[#26262B] rounded-[28px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-[#D8B4B0]/20 to-[#26262B] px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D8B4B0]/20 border border-[#D8B4B0]/30 flex items-center justify-center shrink-0">
              {isReserve ? (
                <BookmarkCheck className="w-5 h-5 text-[#D8B4B0]" />
              ) : (
                <Gift className="w-5 h-5 text-[#D8B4B0]" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-[#A1A1AA] uppercase tracking-widest font-semibold">
                {isReserve ? 'Забронировать подарок' : 'Сделать подарок'}
              </p>
              <h3 className="text-base font-bold text-[#F5F5F7] leading-tight mt-0.5">
                {isReserve ? 'Хочу подарить это!' : 'Я дарю этот подарок'}
              </h3>
            </div>
          </div>

          {/* Wish title preview */}
          <div className="bg-[#0F0F10]/60 rounded-2xl px-4 py-3 border border-[#26262B]">
            <p className="text-[10px] text-[#A1A1AA] mb-0.5">Желание {ownerName}:</p>
            <p className="text-sm font-semibold text-[#F5F5F7] line-clamp-2">{wishTitle}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-6 space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Чтобы{' '}
            <span className="text-[#D8B4B0] font-semibold">
              {isReserve ? 'зарезервировать подарок' : 'отметить подарок как врученный'}
            </span>{' '}
            и не пересечься с другими дарителями — войдите в Leor Secret Circle через Telegram.
          </p>

          {/* Benefits */}
          <div className="space-y-2">
            {[
              { icon: BookmarkCheck, text: 'Бронируйте желания — никто другой не купит то же самое' },
              { icon: Sparkles, text: 'Получайте умные подсказки на основе интересов именинника' },
              { icon: Heart, text: 'Создавайте воспоминания и сохраняйте истории подарков' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-xl bg-[#26262B] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[#D8B4B0]" />
                </div>
                <p className="text-xs text-[#F5F5F7]/80 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleOpenBot}
              className="w-full flex items-center justify-center space-x-2 py-3.5 bg-[#D8B4B0] hover:bg-[#E8C4C0] text-[#0F0F10] font-bold text-sm rounded-2xl transition-colors"
            >
              <span>Войти через Telegram</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors"
            >
              Продолжить просмотр
            </button>
          </div>

          <p className="text-center text-[10px] text-[#71717A]">
            Leor Secret Circle — приватный вишлист для близких
          </p>
        </div>
      </div>
    </div>
  );
}
