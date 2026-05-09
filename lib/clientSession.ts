/**
 * Binds this browser tab to a SALex user after OTP. The API uses a single global
 * `otp_sessions.is_current` row (not HTTP cookies), so GET /me alone is not
 * enough to know this client "logged in" — we only trust hydration when the id matches.
 */
export const CLIENT_USER_ID_KEY = 'salex_client_user_id';
export const APP_VERSION_KEY = 'salex_app_version';
export const APP_VERSION = '1.0.0'; // Increment this to force cache invalidation

export function getStoredClientUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(CLIENT_USER_ID_KEY);
}

export function setStoredClientUserId(userId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CLIENT_USER_ID_KEY, userId);
}

export function clearStoredClientUserId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(CLIENT_USER_ID_KEY);
}

export function clearAllSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.clear();
}

/**
 * Check if app version has changed. If so, clear all localStorage.
 * This forces Telegram Mini App to refresh stale data when we deploy.
 * Call this on app mount before any other initialization.
 */
export function invalidateStaleAppVersion(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const storedVersion = window.localStorage.getItem(APP_VERSION_KEY);

  if (storedVersion !== APP_VERSION) {
    // Version mismatch: clear everything and set new version
    console.log(`[SALex] App version changed: ${storedVersion} → ${APP_VERSION}. Clearing session.`);
    clearAllSession();
    window.localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
  }
}

/**
 * Force clear any stale Telegram Mini App cache.
 * Telegram WebView may cache localStorage even after browser.clear().
 * This ensures we start with a clean slate on every mount.
 */
export function forceClearTelegramCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Aggressively clear all storage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    // In rare cases, some browsers block storage.clear() in certain contexts
    console.warn('[SALex] Failed to clear storage', e);
  }

  // Also clear any potential cached data in memory
  if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
    delete (window as any).__NEXT_DATA__;
  }
}
