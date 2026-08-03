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
          <>
            <img
              src={wish.imageUrl}
              alt={wish.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Dark gradient overlay for 100% badge contrast on light cover images */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#26262B] to-[#1D1D21] flex flex-col items-center justify-center text-[#D8B4B0]">
            <Gift className="w-10 h-10 opacity-70 mb-1" />
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">{categoryMeta.label}</span>
          </div>
        )}

        {/* Priority Badge Overlay */}
        <div className="absolute top-3 right-3 z-10 bg-[#0F0F10] rounded-full p-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${priorityMeta.colorClass}`}>
            {priorityMeta.label}
          </span>
        </div>

        {/* Context Tag Overlay */}
        <div className="absolute bottom-3 left-3 z-10 bg-[#0F0F10] rounded-full p-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
          <span className="text-[10px] font-semibold bg-[#0F0F10]/95 text-[#F5F5F7] px-2.5 py-1 rounded-full border border-[#383843] backdrop-blur-md flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-[#D8B4B0]" />
            <span>{contextLabel}</span>
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* 1. Large Item Title FIRST */}
          <h3 className="text-base font-bold text-[#F5F5F7] group-hover:text-[#D8B4B0] transition-colors line-clamp-2 leading-tight">
            {wish.title}
          </h3>

          {/* 2. Brand Name BELOW Title */}
          {wish.brand && (
            <div className="text-xs font-semibold uppercase tracking-wider text-[#D8B4B0] mt-1">
              {wish.brand}
            </div>
          )}

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
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${resMeta.badgeClass}`}>
                  {resMeta.label}
                </span>
              </div>

              {/* Action Buttons depending on Reservation State */}
              {isLoadingState || isPending ? (
                <Button size="sm" variant="ghost" disabled className="h-8 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D8B4B0]" />
                </Button>
              ) : reservationState === 'AVAILABLE' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReserve?.(e);
                  }}
                  className="rounded-full px-3 text-xs h-8"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 mr-1" /> Забронировать
                </Button>
              ) : reservationState === 'RESERVED_BY_ME' ? (
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelReservation?.(e);
                    }}
                    className="rounded-full px-2.5 text-[11px] h-8 text-[#C97B7B] border-[#C97B7B]/40 hover:bg-[#C97B7B]/10"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Снять
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmReservation?.(e);
                    }}
                    className="rounded-full px-2.5 text-[11px] h-8"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Подарил
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Price & External Link Row */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {formattedPrice ? (
              <span className="font-extrabold text-[#D8B4B0] font-mono text-sm">{formattedPrice}</span>
            ) : (
              <span className="text-[11px] text-[#A1A1AA]">Без указания цены</span>
            )}

            {wish.link && (
              <a
                href={wish.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors p-1"
                aria-label="Открыть ссылку на товар"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
