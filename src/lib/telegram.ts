/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();

    // Disable swipe-down-to-close gesture on mobile devices
    if (typeof (tg as any).disableVerticalSwipes === 'function') {
      try {
        (tg as any).disableVerticalSwipes();
      } catch (e) {
        console.warn('disableVerticalSwipes not supported on this version', e);
      }
    }

    // Request full screen mode if supported by Telegram client
    if (typeof (tg as any).requestFullscreen === 'function') {
      try {
        (tg as any).requestFullscreen();
      } catch (e) {
        console.warn('requestFullscreen not supported on this version', e);
      }
    }

    tg.setHeaderColor('#0F0F10');
    tg.setBackgroundColor('#0F0F10');
  }
}
