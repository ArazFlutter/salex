'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
      };
    };
  }
}

export function TelegramMiniAppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;

    if (!webApp) {
      return;
    }

    try {
      webApp.ready?.();
      webApp.expand?.();
      webApp.setHeaderColor?.('#F7F8FC');
      webApp.setBackgroundColor?.('#F7F8FC');
    } catch {
      // Ignore Telegram SDK issues so the app still works in browsers.
    }
  }, []);

  return <>{children}</>;
}
