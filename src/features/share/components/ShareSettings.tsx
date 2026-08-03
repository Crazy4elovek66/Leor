import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShareSettings } from '../hooks/useShareSettings';
import { Share2, Copy, RefreshCw, Power, Eye, Check, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ShareSettingsProps {
  profileId: string;
}

export function ShareSettings({ profileId }: ShareSettingsProps) {
  const { config, isLoading, isPending, createShareLink, rotateToken, disableShare, updateVisibility } = useShareSettings(profileId);
  const [copiedTg, setCopiedTg] = useState<boolean>(false);
  const [copiedWeb, setCopiedWeb] = useState<boolean>(false);

  if (isLoading) {
    return <div className="h-24 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />;
  }

  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'iLeorBot';
  const telegramUrl = config?.share_token
    ? `https://t.me/${botName}?startapp=share_${config.share_token}`
    : '';

  const webUrl = config?.share_token
    ? `${window.location.origin}/share/${config.share_token}`
    : '';

  const handleCopyTg = () => {
    if (!telegramUrl) return;
    navigator.clipboard.writeText(telegramUrl);
    setCopiedTg(true);
    toast.success('Telegram-ссылка скопирована!');
    setTimeout(() => setCopiedTg(false), 2000);
  };

  const handleCopyWeb = () => {
    if (!webUrl) return;
    navigator.clipboard.writeText(webUrl);
    setCopiedWeb(true);
    toast.success('Прямая Web-ссылка скопирована!');
    setTimeout(() => setCopiedWeb(false), 2000);
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
            {/* 1. Telegram Bot Direct Link */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#A1A1AA] block">
                1. Ссылка для Telegram (Mini App):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={telegramUrl}
                  className="flex-1 bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2 text-xs font-mono text-[#D8B4B0] focus:outline-none truncate"
                />
                <Button variant="secondary" size="sm" onClick={handleCopyTg} className="shrink-0">
                  {copiedTg ? <Check className="w-4 h-4 text-[#D8B4B0]" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* 2. Direct Web Link Fallback */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#A1A1AA] block">
                2. Прямая Web-ссылка (для браузеров):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={webUrl}
                  className="flex-1 bg-[#0F0F10] border border-[#26262B] rounded-xl px-3 py-2 text-xs font-mono text-[#D8B4B0] focus:outline-none truncate"
                />
                <Button variant="secondary" size="sm" onClick={handleCopyWeb} className="shrink-0">
                  {copiedWeb ? <Check className="w-4 h-4 text-[#D8B4B0]" /> : <ExternalLink className="w-4 h-4" />}
                </Button>
              </div>
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
                    className="w-4 h-4 rounded border-[#383843] bg-[#26262B] accent-[#D8B4B0]"
                  />
                  <span className="text-[#F5F5F7]">О себе</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_interests}
                    onChange={(e) => updateVisibility(config.show_basic_info, e.target.checked, config.show_wishlist, config.show_sizes)}
                    className="w-4 h-4 rounded border-[#383843] bg-[#26262B] accent-[#D8B4B0]"
                  />
                  <span className="text-[#F5F5F7]">Интересы</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_wishlist}
                    onChange={(e) => updateVisibility(config.show_basic_info, config.show_interests, e.target.checked, config.show_sizes)}
                    className="w-4 h-4 rounded border-[#383843] bg-[#26262B] accent-[#D8B4B0]"
                  />
                  <span className="text-[#F5F5F7]">Wishlist</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#0F0F10] p-2.5 rounded-xl border border-[#26262B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_sizes}
                    onChange={(e) => updateVisibility(config.show_basic_info, config.show_interests, config.show_wishlist, e.target.checked)}
                    className="w-4 h-4 rounded border-[#383843] bg-[#26262B] accent-[#D8B4B0]"
                  />
                  <span className="text-[#F5F5F7]">Размеры</span>
                </label>
              </div>
            </div>

            {/* Management Actions: Regenerate & Disable */}
            <div className="flex items-center space-x-2 pt-2 border-t border-[#26262B]">
              <Button
                variant="outline"
                size="sm"
                onClick={rotateToken}
                disabled={isPending}
                className="flex-1 text-xs"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                Обновить ссылку
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={disableShare}
                disabled={isPending}
                className="flex-1 text-xs"
              >
                <Power className="w-3.5 h-3.5 mr-1" />
                Отключить
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 space-y-3">
            <p className="text-xs text-[#A1A1AA]">
              Создайте публичную ссылку, чтобы делиться вишлистом в Telegram или в браузере.
            </p>
            <Button variant="primary" size="sm" onClick={createShareLink} disabled={isPending}>
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
              Создать публичную ссылку
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
