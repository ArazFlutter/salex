const BASE = '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  return json as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body),
};

// ── Auth ──

export type AuthUser = {
  id: string;
  fullName: string;
  phone: string;
  accountType: string;
  activePlan: string;
  platformConnections: Record<string, boolean>;
};

export function sendOtp(phone: string) {
  return api.post<{ success: boolean; phone: string; expiresAt: string }>(
    '/auth/send-otp',
    { phone },
  );
}

export function verifyOtp(phone: string, code: string) {
  return api.post<{ success: boolean; user: AuthUser }>('/auth/verify-otp', {
    phone,
    code,
  });
}

export function getMe() {
  return api.get<{ success: boolean; user: AuthUser }>('/me');
}

export function logout() {
  return api.post<{ success: boolean }>('/auth/logout', {});
}

// ── Packages ──

export type PlanPlatformRef = { id: string; name: string };

export type PlanCatalogEntry = {
  listingLimit: number | null;
  allowedPlatforms: PlanPlatformRef[];
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  priceAzn: number | null;
};

export type PlanCatalogPlans = Record<'basic' | 'premium' | 'premiumPlus', PlanCatalogEntry>;

export type UserPackageInfo = PlanCatalogEntry & {
  activePlan: string;
};

export function getPackageCatalog() {
  return api.get<{ success: boolean; plans: PlanCatalogPlans }>('/packages/catalog');
}

export function getCurrentPackage() {
  return api.get<{ success: boolean; package: UserPackageInfo }>('/packages/current');
}

export function selectPackage(plan: string) {
  return api.post<{ success: boolean; user: AuthUser; package: UserPackageInfo }>(
    '/packages/select',
    { plan },
  );
}

// ── Payments (dev / fake checkout) ──

export type PaymentOrder = {
  id: string;
  userId: string;
  plan: 'premium' | 'premiumPlus';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  updatedAt: string;
};

export function createPayment(plan: 'premium' | 'premiumPlus') {
  return api.post<{
    success: boolean;
    paymentOrder: PaymentOrder;
    fakePaymentUrl: string;
  }>('/payments/create', { plan });
}

export function getPaymentOrder(id: string) {
  return api.get<{ success: boolean; paymentOrder: PaymentOrder }>(`/payments/${encodeURIComponent(id)}`);
}

export function confirmDevPayment(paymentOrderId: string) {
  return api.post<{
    success: boolean;
    paymentOrder: PaymentOrder;
    user: AuthUser;
    package: UserPackageInfo;
  }>('/payments/confirm', { paymentOrderId });
}

// ── Platforms ──

export type PlatformEntry = {
  id: string;
  name: string;
  connected: boolean;
  allowedByPlan: boolean;
};

export function getPlatforms() {
  return api.get<{ success: boolean; platforms: PlatformEntry[] }>('/platforms');
}

export function connectPlatform(platform: string) {
  return api.post<{
    success: boolean;
    message: string;
    platform: PlatformEntry;
    user: AuthUser;
  }>('/platforms/connect', { platform });
}

// ── Listings ──

export type ApiListing = {
  id: string;
  userId: string;
  title: string;
  category: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  status: string;
  createdAt: string;
};

export function createListing(body: {
  title: string;
  category: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  status: string;
}) {
  return api.post<{ success: boolean; listing: ApiListing }>('/listings', body);
}

export function getListings() {
  return api.get<{ success: boolean; listings: ApiListing[] }>('/listings');
}

/** Multipart upload; returns a path like `/uploads/...` (same-origin via Next rewrite). */
export async function uploadListingImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${BASE}/listings/upload-image`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message ?? `Upload failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return json as { success: boolean; url: string };
}

// ── Publish ──

export type PlatformPublishStatus = {
  platform: string;
  status: 'waiting' | 'processing' | 'success' | 'published_pending_link' | 'failed';
  externalListingId: string | null;
  externalUrl: string | null;
  publishMetadata: Record<string, unknown> | null;
};

export type PublishJobResponse = {
  success: boolean;
  job: {
    id: string;
    listingId: string;
    status: string;
    platforms: PlatformPublishStatus[];
  };
};

export type PublishStatusResponse = {
  success: boolean;
  id: string;
  listingId: string;
  status: string;
  platforms: PlatformPublishStatus[];
};

export function createPublishJob(listingId: string) {
  return api.post<PublishJobResponse>(`/publish/${listingId}`);
}

export function getPublishJobStatus(jobId: string) {
  return api.get<PublishStatusResponse>(`/publish/${jobId}/status`);
}
