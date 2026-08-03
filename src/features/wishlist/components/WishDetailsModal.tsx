import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { WishItem } from '../types';
import { WISH_CATEGORY_META, WISH_PRIORITY_META, WISH_CONTEXT_LABELS } from '../types';
import { ExternalLink, Tag, Sparkles, Archive, Trash2, Edit3 } from 'lucide-react';

interface WishDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wish: WishItem | null;
  resolvedSize?: string | null;
  isOwner?: boolean;
  isReadOnly?: boolean;
  onEdit?: (wish: WishItem) => void;
  onArchive?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function WishDetailsModal({
  isOpen,
  onClose,
  wish,
  resolvedSize,
  isOwner = false,
  onEdit,
  onArchive,
  onDelete,
}: WishDetailsModalProps) {
  if (!wish) return null;

  const categoryMeta = WISH_CATEGORY_META[wish.category] || WISH_CATEGORY_META.OTHER;
  const priorityMeta = WISH_PRIORITY_META[wish.priority] || WISH_PRIORITY_META.MEDIUM;
  const contextLabel = WISH_CONTEXT_LABELS[wish.context] || WISH_CONTEXT_LABELS.JUST_WANT;

  const formattedPrice = wish.price !== null && wish.price !== undefined
    ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: wish.currency, maximumFractionDigits: 0 }).format(wish.price)
    : null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={wish.brand ? `${wish.brand}` : 'Карточка желания'}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Cover Image */}
        {wish.imageUrl && (
          <div className="w-full h-52 rounded-2xl overflow-hidden bg-[#26262B]">
            <img src={wish.imageUrl} alt={wish.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header & Title */}
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${priorityMeta.colorClass}`}>
              {priorityMeta.label}
            </span>
            <span className="text-[10px] text-[#A1A1AA] bg-[#26262B] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5 text-[#D8B4B0]" />
              <span>{contextLabel}</span>
            </span>
          </div>

          <h2 className="text-lg font-bold text-[#F5F5F7] mt-1">{wish.title}</h2>
          {wish.brand && (
            <div className="text-xs font-semibold text-[#D8B4B0] uppercase tracking-wider mt-0.5">
              {wish.brand}
            </div>
          )}
          {formattedPrice && (
            <div className="text-xl font-extrabold text-[#D8B4B0] font-mono mt-1">
              {formattedPrice}
            </div>
          )}
        </div>

        {/* Description */}
        {wish.description && (
          <div className="bg-[#0F0F10] p-4 rounded-2xl border border-[#26262B]">
            <p className="text-xs text-[#F5F5F7]/90 leading-relaxed whitespace-pre-wrap">
              {wish.description}
            </p>
          </div>
        )}

        {/* Resolved Size Badge */}
        {resolvedSize && (
          <div className="flex items-center space-x-2 text-xs text-[#D8B4B0] bg-[#26262B]/50 p-3 rounded-2xl">
            <Tag className="w-4 h-4 text-[#D8B4B0] shrink-0" />
            <div>
              <div className="text-[10px] text-[#A1A1AA]">Размер из Gift Profile:</div>
              <div className="font-semibold">{resolvedSize}</div>
            </div>
          </div>
        )}

        {/* Category Info */}
        <div className="text-xs text-[#A1A1AA] border-t border-[#26262B] pt-3 flex items-center justify-between">
          <span>Категория: {categoryMeta.label}</span>
        </div>

        {/* Link Button */}
        {wish.link && (
          <a
            href={wish.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full py-3 bg-[#26262B] hover:bg-[#383843] text-[#F5F5F7] text-xs font-semibold rounded-2xl transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#D8B4B0]" />
            <span>Открыть ссылку на страницу товара</span>
          </a>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#26262B]">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onEdit(wish);
                }}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Изменить
              </Button>
            )}

            {onArchive && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={async () => {
                  await onArchive(wish.id);
                  onClose();
                }}
              >
                <Archive className="w-3.5 h-3.5 mr-1" /> В архив
              </Button>
            )}

            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                className="text-xs"
                onClick={async () => {
                  await onDelete(wish.id);
                  onClose();
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Удалить
              </Button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
