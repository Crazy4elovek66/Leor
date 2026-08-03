import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { usePublicProfile } from '../hooks/usePublicProfile';
import type { WishCategory, WishPriority } from '@/features/wishlist/types';
import { WISH_CATEGORY_META, WISH_PRIORITY_META } from '@/features/wishlist/types';
import { Gift, MapPin, Calendar, Sparkles, Shirt, ExternalLink, ShieldAlert } from 'lucide-react';

export function PublicProfileView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePublicProfile(token);

  // Set OpenGraph and Document Meta Tags dynamically
  useEffect(() => {
    if (data?.found && data.owner) {
      const ownerName = `${data.owner.first_name} ${data.owner.last_name || ''}`.trim();
      document.title = `${ownerName} — Gift Profile | Leor`;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', `Список желаний и вишлист ${ownerName} в Secret Circle Leor.`);

      // OpenGraph title & image
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `${ownerName} — Gift Profile | Leor`);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] text-[#F5F5F7] p-4 max-w-md mx-auto space-y-4 py-8">
        <div className="h-36 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
        <div className="h-44 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  if (!data || !data.found || !data.owner) {
    return (
      <div className="min-h-screen bg-[#0F0F10] text-[#F5F5F7] p-4 max-w-md mx-auto flex items-center justify-center">
        <EmptyState
          icon={<ShieldAlert className="w-10 h-10 text-[#C97B7B]" />}
          title="Страница не найдена (404)"
          description="Публичная ссылка недействительна, была обновлена или отключена владельцем."
          actionText="На главную"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const { owner, basic_info, show_interests, show_wishlist, show_sizes, interests, wishes, sizes } = data;
  const ownerName = `${owner.first_name} ${owner.last_name || ''}`.trim();

  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#F5F5F7] p-4 max-w-md mx-auto space-y-6 py-6 pb-16">
      {/* Public Profile Header Card */}
      <Card className="p-6 bg-[#17171A] border-[#26262B] relative overflow-hidden rounded-[24px]">
        <div className="flex items-center space-x-4">
          <Avatar src={owner.avatar_url} name={owner.first_name} size="lg" />
          <div>
            <h1 className="text-lg font-bold text-[#F5F5F7] tracking-tight">{ownerName}</h1>
            <Badge variant="outline" className="text-[10px] border-[#D8B4B0]/40 text-[#D8B4B0] uppercase mt-1">
              Публичный Gift Profile
            </Badge>
          </div>
        </div>

        {/* Basic Info */}
        {basic_info && (basic_info.bio || basic_info.city || basic_info.birth_date) && (
          <div className="mt-4 pt-3 border-t border-[#26262B] space-y-2">
            {basic_info.bio && (
              <p className="text-xs text-[#A1A1AA] leading-relaxed">{basic_info.bio}</p>
            )}
            <div className="flex items-center space-x-4 text-xs text-[#A1A1AA]">
              {basic_info.city && (
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D8B4B0]" />
                  <span>{basic_info.city}</span>
                </div>
              )}
              {basic_info.birth_date && (
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D8B4B0]" />
                  <span>{basic_info.birth_date}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Public Wishlist Section */}
      {show_wishlist && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <Gift className="w-4 h-4 text-[#D8B4B0]" />
            <h2 className="text-sm font-semibold text-[#F5F5F7]">Список желаний ({wishes?.length || 0})</h2>
          </div>

          {wishes && wishes.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {wishes.map((w, idx) => {
                const categoryKey = (w.category as WishCategory) || 'OTHER';
                const priorityKey = (w.priority as WishPriority) || 'MEDIUM';
                const categoryMeta = WISH_CATEGORY_META[categoryKey] || WISH_CATEGORY_META.OTHER;
                const priorityMeta = WISH_PRIORITY_META[priorityKey] || WISH_PRIORITY_META.MEDIUM;
                const formattedPrice = w.price !== null && w.price !== undefined
                  ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: w.currency, maximumFractionDigits: 0 }).format(w.price)
                  : null;

                return (
                  <Card key={idx} className="p-4 bg-[#17171A] border-[#26262B] space-y-3 rounded-[24px]">
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 rounded-2xl bg-[#26262B] overflow-hidden shrink-0 flex items-center justify-center">
                        {w.image_url ? (
                          <img src={w.image_url} alt={w.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift className="w-8 h-8 text-[#D8B4B0]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#D8B4B0] font-semibold uppercase tracking-wider">
                            {w.brand || categoryMeta.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityMeta.colorClass}`}>
                            {priorityMeta.label}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#F5F5F7] truncate mt-0.5">{w.title}</h3>

                        {w.description && (
                          <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-0.5">{w.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#26262B]">
                      {formattedPrice ? (
                        <span className="text-sm font-extrabold text-[#F5F5F7] font-mono">{formattedPrice}</span>
                      ) : (
                        <span className="text-xs text-[#71717A] italic">Цена не указана</span>
                      )}

                      {w.link && (
                        <a
                          href={w.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors rounded-lg bg-[#26262B]"
                          title="Ссылка на товар"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-5 text-center bg-[#17171A] border-[#26262B]">
              <p className="text-xs text-[#A1A1AA]">Список желаний пока пуст</p>
            </Card>
          )}
        </div>
      )}

      {/* Public Interests Section */}
      {show_interests && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <Sparkles className="w-4 h-4 text-[#D8B4B0]" />
            <h2 className="text-sm font-semibold text-[#F5F5F7]">Интересы и вкусы</h2>
          </div>

          {interests && interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-xs bg-[#26262B] text-[#F5F5F7] border-[#383843]">
                  {item.title}
                </Badge>
              ))}
            </div>
          ) : (
            <Card className="p-5 text-center bg-[#17171A] border-[#26262B]">
              <p className="text-xs text-[#A1A1AA]">Интересы не указаны</p>
            </Card>
          )}
        </div>
      )}

      {/* Public Sizes Section */}
      {show_sizes && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <Shirt className="w-4 h-4 text-[#D8B4B0]" />
            <h2 className="text-sm font-semibold text-[#F5F5F7]">Размеры</h2>
          </div>

          {sizes && sizes.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {sizes.map((s, idx) => (
                <Card key={idx} className="p-3 bg-[#17171A] border-[#26262B] text-center">
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">{s.category}</span>
                  <span className="text-sm font-bold text-[#D8B4B0] font-mono mt-0.5 block">{s.value}</span>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-5 text-center bg-[#17171A] border-[#26262B]">
              <p className="text-xs text-[#A1A1AA]">Размеры не указаны</p>
            </Card>
          )}
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-6 border-t border-[#26262B]/60 text-xs text-[#71717A]">
        <p>Создано в <span className="text-[#D8B4B0] font-semibold">Leor Secret Circle</span></p>
      </div>
    </div>
  );
}
