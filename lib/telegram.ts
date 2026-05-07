import WebApp from '@twa-dev/sdk';

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: unknown;
  };
};

export const isInsideTelegram = () =>
  typeof window !== 'undefined' && !!((window.Telegram?.WebApp as TelegramWebApp | undefined)?.initData);

export const getTelegramUser = () => {
  if (!isInsideTelegram()) return null;
  return ((WebApp.initDataUnsafe as any)?.user ?? null) as any;
};

export const getInitData = () => {
  if (!isInsideTelegram()) return '';
  return WebApp.initData;
};

export const expandApp = () => WebApp.expand();

export const closeApp = () => WebApp.close();

export const setMainButton = (text: string, onClick: () => void) => {
  WebApp.MainButton.setText(text);
  WebApp.MainButton.onClick(onClick);
  WebApp.MainButton.show();
};

export const hideMainButton = () => WebApp.MainButton.hide();

export const setBackButton = (onClick: () => void) => {
  WebApp.BackButton.onClick(onClick);
  WebApp.BackButton.show();
};

export const hideBackButton = () => WebApp.BackButton.hide();

export const haptic = (type: 'light' | 'medium' | 'heavy' | 'error' | 'success') => {
  if (type === 'error') WebApp.HapticFeedback.notificationOccurred('error');
  else if (type === 'success') WebApp.HapticFeedback.notificationOccurred('success');
  else WebApp.HapticFeedback.impactOccurred(type);
};

export const getTelegramTheme = () => WebApp.colorScheme; // 'light' | 'dark'
