/**
 * Binds this browser tab to a SALex user after OTP. The API uses a single global
 * `otp_sessions.is_current` row (not HTTP cookies), so GET /me alone is not
 * enough to know this client "logged in" — we only trust hydration when the id matches.
 */
export const CLIENT_USER_ID_KEY = 'salex_client_user_id';

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
