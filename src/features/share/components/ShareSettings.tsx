import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShareSettings } from '../hooks/useShareSettings';
import { Share2, Copy, RefreshCw, Power, Eye, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareSettingsProps {
  profileId: string;
}

export function ShareSettings({ profileId }: ShareSettingsProps) {
  const { config, isLoading, isPending, createShareLink, rotateToken, disableShare, updateVisibility } = useShareSettings(profileId);
  const [copied, setCopied] = useState<boolean>(false);

  if (isLoading) {
    return <div className="h-24 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />;
  }

  const shareUrl = config?.share_token
    ? `${window.location.origin}/share/${config.share_token}`
    : '';

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Публичная ссылка скопирована в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-[#D8B4B0]" />
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Публичная ссылка</h3>
        </div>
        {config?.is_active && (
          <Badge variant="accent" className="text-[10px] uppercase">
            Активна
          </Badge>
        )}
      </div>

      <Card className="p-5 bg-[#17171A] border-[#26262B] space-y-4 rounded-[24px]">
        {config?.is_active ? (
          <div className="space-y-4">
            {/* Share URL display & Copy button */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2 text-xs font-mono text-[#D8B4B0] focus:outline-none"
              />
              <Button variant="secondary" size="sm" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-[#D8B4B0]" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Section Visibility Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#26262B]">
              <div className="text-[11px] font-semibold text-[#A1A1AA] flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-[#D8B4B0]" />
                <span>Видимость разделов по ссылке</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2 bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_basic_info}
                    onChange={(e) => updateVisibility(e.target.checked, config.show_interests, config.show_wishlist, config.show_sizes)}
                    className="accent-[#D8B4B0]"
                  />
                  <span>Инфо профиля</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_wishlist}
                    onChange={(e) => updateVisibility(config.show_basic_info, config.show_interests, e.target.checked, config.show_sizes)}
                    className="accent-[#D8B4B0]"
                  />
                  <span>Wishlist</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_interests}
                    onChange={(e) => updateVisibility(config.show_basic_info, e.target.checked, config.show_wishlist, config.show_sizes)}
                    className="accent-[#D8B4B0]"
                  />
                  <span>Интересы</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_sizes}
                    onChange={(e) => updateVisibility(config.show_basic_info, config.show_interests, config.show_wishlist, e.target.checked)}
                    className="accent-[#D8B4B0]"
                  />
                  <span>Размеры</span>
                </label>
              </div>
            </div>

            {/* Action Buttons: Rotate & Disable */}
            <div className="flex items-center justify-between pt-2 border-t border-[#26262B]">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={rotateToken}
                className="text-xs border-[#26262B]"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#D8B4B0]" />}
                Обновить ссылку
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={disableShare}
                className="text-xs text-[#C97B7B] border-[#C97B7B]/30 hover:bg-[#C97B7B]/10"
              >
                <Power className="w-3.5 h-3.5 mr-1" />
                Отключить
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 space-y-3">
            <p className="text-xs text-[#A1A1AA]">
              Поделитесь вашим списком желаний с кем угодно вне кругов Leor без авторизации.
            </p>
            <Button
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={createShareLink}
              className="rounded-full px-4 text-xs"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
              Создать публичную ссылку
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
