import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { WishItem } from '../types';
import { WISH_CATEGORY_META, WISH_PRIORITY_META, WISH_CONTEXT_LABELS } from '../types';
import type { WishReservationState } from '@/features/reservation/types';
import { RESERVATION_STATE_META } from '@/features/reservation/types';
import { useMinuteTimer } from '@/features/reservation/hooks/useMinuteTimer';
import { ExternalLink, Sparkles, Tag, Gift, BookmarkCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface WishCardProps {
  wish: WishItem;
  resolvedSize?: string | null;
  reservationState?: WishReservationState;
  isOwner?: boolean;
  isPending?: boolean;
  isLoadingState?: boolean;
  onClick?: () => void;
  onReserve?: (e: React.MouseEvent) => void;
  onCancelReservation?: (e: React.MouseEvent) => void;
  onConfirmReservation?: (e: React.MouseEvent) => void;
}

export function WishCard({
  wish,
  resolvedSize,
  reservationState = 'AVAILABLE',
  isOwner = false,
  isPending = false,
  isLoadingState = false,
  onClick,
  onReserve,
  onCancelReservation,
  onConfirmReservation,
}: WishCardProps) {
  useMinuteTimer(); // Triggers re-render once every 60 seconds

  const categoryMeta = WISH_CATEGORY_META[wish.category] || WISH_CATEGORY_META.OTHER;
  const priorityMeta = WISH_PRIORITY_META[wish.priority] || WISH_PRIORITY_META.MEDIUM;
  const contextLabel = WISH_CONTEXT_LABELS[wish.context] || WISH_CONTEXT_LABELS.JUST_WANT;
  const resMeta = RESERVATION_STATE_META[reservationState] || RESERVATION_STATE_META.AVAILABLE;

  const formattedPrice = wish.price !== null && wish.price !== undefined
    ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: wish.currency, maximumFractionDigits: 0 }).format(wish.price)
    : null;

  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      role="article"
      aria-label={`Карточка желания: ${wish.title}`}
      className="bg-[#17171A] border-[#26262B] hover:border-[#D8B4B0]/50 focus:border-[#D8B4B0] focus:outline-none transition-all duration-200 overflow-hidden group cursor-pointer flex flex-col h-full rounded-[24px]"
    >
      {/* Cover Image Header */}
      <div className="relative w-full h-44 bg-[#26262B] overflow-hidden flex items-center justify-center shrink-0">
        {wish.imageUrl ? (
          <img
            src={wish.imageUrl}
            alt={wish.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#26262B] to-[#1D1D21] flex flex-col items-center justify-center text-[#D8B4B0]">
            <Gift className="w-10 h-10 opacity-70 mb-1" />
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">{categoryMeta.label}</span>
          </div>
        )}

        {/* Priority Badge Overlay */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md ${priorityMeta.colorClass}`}>
            {priorityMeta.label}
          </span>
        </div>

        {/* Context Tag Overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] font-medium bg-[#0F0F10]/80 text-[#F5F5F7] px-2.5 py-1 rounded-full border border-[#383843] backdrop-blur-md flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-[#D8B4B0]" />
            <span>{contextLabel}</span>
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {wish.brand && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#D8B4B0] mb-0.5">
              {wish.brand}
            </div>
          )}

          <h3 className="text-sm font-bold text-[#F5F5F7] group-hover:text-[#D8B4B0] transition-colors line-clamp-2 leading-tight">
            {wish.title}
          </h3>

          {wish.description && (
            <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1.5 leading-normal">
              {wish.description}
            </p>
          )}
        </div>

        {/* Dynamic Size Badge & Reservation State */}
        <div className="pt-2 border-t border-[#26262B]/60 space-y-2">
          {resolvedSize && (
            <div className="flex items-center space-x-1.5 text-[11px] text-[#D8B4B0] bg-[#26262B]/50 px-2.5 py-1 rounded-xl w-fit">
              <Tag className="w-3 h-3 text-[#D8B4B0] shrink-0" />
              <span className="font-medium">{resolvedSize}</span>
            </div>
          )}

          {/* Reservation Status Badge (ONLY FOR CIRCLE MEMBERS, NOT OWNER) */}
          {!isOwner && (
            <div className="flex items-center justify-between pt-1 min-h-[32px]">
              {isLoadingState ? (
                <div className="h-6 w-24 bg-[#26262B] rounded-full animate-pulse" />
              ) : (
                <span className={`text-[10px] px-2.5 py-1 rounded-full border ${resMeta.badgeClass}`}>
                  {resMeta.label}
                </span>
              )}

              {/* Action buttons depending on state */}
              {reservationState === 'AVAILABLE' && onReserve && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending || isLoadingState}
                  aria-label="Забронировать этот подарок"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReserve(e);
                  }}
                  className="h-7 text-[11px] px-2.5 rounded-full border-[#D8B4B0]/40 text-[#D8B4B0] hover:bg-[#D8B4B0]/10 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <BookmarkCheck className="w-3 h-3 mr-1" />
                  )}
                  Забронировать
                </Button>
              )}

              {reservationState === 'RESERVED_BY_ME' && (
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {onConfirmReservation && (
                    <button
                      disabled={isPending}
                      aria-label="Подтвердить покупку"
                      onClick={onConfirmReservation}
                      className="p-1.5 text-[#D8B4B0] hover:text-[#F5F5F7] disabled:opacity-50 transition-colors"
                      title="Подтвердить покупку"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  )}
                  {onCancelReservation && (
                    <button
                      disabled={isPending}
                      aria-label="Отменить бронирование"
                      onClick={onCancelReservation}
                      className="p-1.5 text-[#71717A] hover:text-[#C97B7B] disabled:opacity-50 transition-colors"
                      title="Отменить бронь"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Price & External Link Footer */}
          <div className="flex items-center justify-between pt-1">
            {formattedPrice ? (
              <span className="text-sm font-extrabold text-[#F5F5F7] font-mono tracking-tight">
                {formattedPrice}
              </span>
            ) : (
              <span className="text-xs text-[#71717A] italic">Цена не указана</span>
            )}

            {wish.link && (
              <a
                href={wish.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Открыть внешнюю ссылку на страницу товара"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-[#A1A1AA] hover:text-[#D8B4B0] focus:ring-1 focus:ring-[#D8B4B0] transition-colors rounded-lg hover:bg-[#26262B]"
                title="Открыть ссылку на товар"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
