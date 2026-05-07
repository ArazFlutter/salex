type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: unknown;
  };
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  MainButton?: {
    setText: (text: string) => void;
    onClick: (onClick: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  BackButton?: {
    onClick: (onClick: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback?: {
    notificationOccurred: (type: 'error' | 'success') => void;
    impactOccurred: (type: 'light' | 'medium' | 'heavy') => void;
  };
  colorScheme?: 'light' | 'dark';
};

const getWebApp = () => {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WebApp = require('@twa-dev/sdk').default as TelegramWebApp;
  return WebApp;
};

export const isInsideTelegram = () => {
  if (typeof window === 'undefined') return false;
  return !!((window.Telegram?.WebApp as TelegramWebApp | undefined)?.initData);
};

export const getTelegramUser = () => {
  const app = getWebApp();
  if (!app) return null;
  return app.initDataUnsafe?.user ?? null;
};

export const getInitData = () => {
  const app = getWebApp();
  if (!app) return '';
  return app.initData ?? '';
};

export const expandApp = () => {
  const app = getWebApp();
  app?.expand?.();
};

export const closeApp = () => {
  const app = getWebApp();
  app?.close?.();
};

export const setMainButton = (text: string, onClick: () => void) => {
  const app = getWebApp();
  if (!app?.MainButton) return;
  app.MainButton.setText(text);
  app.MainButton.onClick(onClick);
  app.MainButton.show();
};

export const hideMainButton = () => {
  const app = getWebApp();
  app?.MainButton?.hide();
};

export const setBackButton = (onClick: () => void) => {
  const app = getWebApp();
  if (!app?.BackButton) return;
  app.BackButton.onClick(onClick);
  app.BackButton.show();
};

export const hideBackButton = () => {
  const app = getWebApp();
  app?.BackButton?.hide();
};

export const haptic = (type: 'light' | 'medium' | 'heavy' | 'error' | 'success') => {
  const app = getWebApp();
  if (!app?.HapticFeedback) return;

  if (type === 'error') app.HapticFeedback.notificationOccurred('error');
  else if (type === 'success') app.HapticFeedback.notificationOccurred('success');
  else app.HapticFeedback.impactOccurred(type);
};

export const getTelegramTheme = () => getWebApp()?.colorScheme; // 'light' | 'dark'
