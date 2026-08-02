import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyReservations } from '../hooks/useMyReservations';
import { useWishReservations } from '../hooks/useWishReservations';
import { formatCountdown } from '../utils/formatCountdown';
import { useMinuteTimer } from '../hooks/useMinuteTimer';
import type { GiftReservationItem } from '../types';
import { BookmarkCheck, Clock, CheckCircle2, XCircle, ChevronLeft, Gift, ExternalLink, History, ShoppingBag } from 'lucide-react';

interface MyReservationsViewProps {
  currentUserId: string;
}

export function MyReservationsView({ currentUserId }: MyReservationsViewProps) {
  useMinuteTimer(); // Re-render every 60 seconds
  const navigate = useNavigate();
  const { reservations, isLoading, error, refetch } = useMyReservations(currentUserId);
  const wishIds = reservations.map((r) => r.wishId);
  const { cancelReservation, confirmReservation, pendingWishes } = useWishReservations(wishIds);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-28 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
        <div className="h-28 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  const activeReservations = reservations.filter((r) => r.status === 'RESERVED');
  const confirmedReservations = reservations.filter((r) => r.status === 'CONFIRMED');
  const historyReservations = reservations.filter((r) => r.status === 'EXPIRED' || r.status === 'CANCELLED');

  const renderReservationCard = (item: GiftReservationItem) => {
    const wish = item.wish;
    const isReserved = item.status === 'RESERVED';
    const isConfirmed = item.status === 'CONFIRMED';
    const countdown = formatCountdown(item.expiresAt);
    const isPending = !!pendingWishes[item.wishId];

    const formattedPrice = wish?.price !== null && wish?.price !== undefined
      ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: wish.currency, maximumFractionDigits: 0 }).format(wish.price)
      : null;

    return (
      <Card key={item.id} className="p-4 bg-[#17171A] border-[#26262B] space-y-3 rounded-[24px]">
        <div className="flex items-start space-x-3">
          <div className="w-16 h-16 rounded-2xl bg-[#26262B] overflow-hidden shrink-0 flex items-center justify-center">
            {wish?.imageUrl ? (
              <img src={wish.imageUrl} alt={wish.title} className="w-full h-full object-cover" />
            ) : (
              <Gift className="w-8 h-8 text-[#D8B4B0]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#D8B4B0] font-semibold uppercase tracking-wider">
                Для: {item.wishOwnerName}
              </span>
              <Badge
                variant={isConfirmed ? 'secondary' : isReserved ? 'accent' : 'outline'}
                className="text-[10px] uppercase tracking-wider"
              >
                {isConfirmed ? 'Куплено' : isReserved ? 'Забронировано' : item.status === 'EXPIRED' ? 'Истекло' : 'Отменено'}
              </Badge>
            </div>

            <h3 className="text-sm font-bold text-[#F5F5F7] truncate mt-0.5">
              {wish?.title || 'Желание'}
            </h3>

            {formattedPrice && (
              <span className="text-xs font-bold text-[#F5F5F7] font-mono">
                {formattedPrice}
              </span>
            )}
          </div>
        </div>

        {/* Expiration Timer Bar for active RESERVED */}
        {isReserved && (
          <div className="flex items-center justify-between bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] text-xs text-[#A1A1AA]">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D8B4B0]" />
              <span>Осталось для покупки:</span>
            </div>
            <span className="font-mono font-bold text-[#D8B4B0]">{countdown}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-1 border-t border-[#26262B]">
          {wish?.link && (
            <a
              href={wish.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Открыть страницу товара"
              className="p-2 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors rounded-xl bg-[#26262B]"
              title="Открыть ссылку"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {isReserved ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={isPending}
                className="flex-1 text-xs"
                onClick={async () => {
                  await confirmReservation(item.wishId);
                  refetch();
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />
                Куплено
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                className="text-xs text-[#C97B7B] border-[#C97B7B]/30 hover:bg-[#C97B7B]/10"
                onClick={async () => {
                  await cancelReservation(item.wishId);
                  refetch();
                }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Отмена
              </Button>
            </>
          ) : isConfirmed ? (
            <span className="text-xs text-[#71717A] italic ml-auto py-1">Покупка подтверждена</span>
          ) : (
            <span className="text-xs text-[#71717A] italic ml-auto py-1">Бронь завершена</span>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back button & Header */}
      <div className="space-y-2">
        <button
          onClick={() => navigate('/circles')}
          className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Назад к кругам</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F7]">Мои Брони</h2>
            <p className="text-xs text-[#A1A1AA]">Подарки, которые вы забронировали для друзей</p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-[#211717] border-[#C97B7B]/30 text-center">
          <p className="text-xs text-[#C97B7B]">{error}</p>
        </Card>
      )}

      <div className="space-y-6">
        {/* Active Reservations */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider px-1">
            Активные брони ({activeReservations.length})
          </h3>
          {activeReservations.length > 0 ? (
            activeReservations.map(renderReservationCard)
          ) : (
            <Card className="p-5 text-center bg-[#17171A] border-[#26262B]">
              <BookmarkCheck className="w-6 h-6 text-[#71717A] mx-auto mb-1.5" />
              <p className="text-xs text-[#A1A1AA]">Нет активных броней</p>
            </Card>
          )}
        </div>

        {/* Confirmed Purchases */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[#F5F5F7] uppercase tracking-wider px-1">
            Подтвержденные покупки ({confirmedReservations.length})
          </h3>
          {confirmedReservations.length > 0 ? (
            confirmedReservations.map(renderReservationCard)
          ) : (
            <Card className="p-5 text-center bg-[#17171A] border-[#26262B]">
              <ShoppingBag className="w-6 h-6 text-[#71717A] mx-auto mb-1.5" />
              <p className="text-xs text-[#A1A1AA]">Нет подтвержденных покупок</p>
            </Card>
          )}
        </div>

        {/* History */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider px-1">
            История ({historyReservations.length})
          </h3>
          {historyReservations.length > 0 ? (
            historyReservations.map(renderReservationCard)
          ) : (
            <Card className="p-5 text-center bg-[#17171A] border-[#26262B]">
              <History className="w-6 h-6 text-[#71717A] mx-auto mb-1.5" />
              <p className="text-xs text-[#A1A1AA]">История пуста</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
