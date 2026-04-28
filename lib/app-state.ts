export type PlanId = 'basic' | 'premium' | 'premiumPlus';
export type AccountType = 'individual' | 'business';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  accountType: AccountType;
}

export interface CarListingDetails {
  category: string;
  brand: string;
  color: string;
  engineVolume: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  year: string;
}

export interface MotorcycleListingDetails {
  brand: string;
  model: string;
  type: string;
  engineVolume: string;
  fuelType: string;
  year: string;
  mileage: string;
  transmission: string;
  color: string;
  condition: string;
  district: string;
  isNew: boolean;
}

export interface VehiclePartListingDetails {
  category: string;
  compatibilityBrand: string;
  compatibilityModel: string;
  productName: string;
  condition: string;
  delivery: string;
}

export interface ListingDraft {
  editingId: number | null;
  category: string;
  price: string;
  city: string;
  description: string;
  images: string[];
  platforms: string[];
  carDetails: CarListingDetails | null;
  motorcycleDetails: MotorcycleListingDetails | null;
  vehiclePartDetails: VehiclePartListingDetails | null;
}

export interface Listing {
  id: number;
  backendId?: string;
  title: string;
  price: string;
  platforms: string[];
  imageSeed: number;
  images: string[];
  category: string;
  city: string;
  description: string;
  createdAt: number;
  status: 'active' | 'sold' | 'archived';
  carDetails: CarListingDetails | null;
  motorcycleDetails: MotorcycleListingDetails | null;
  vehiclePartDetails: VehiclePartListingDetails | null;
}

export interface SupportRequest {
  id: number;
  subject: string;
  message: string;
  createdAt: number;
}

export const DEFAULT_PROFILE: UserProfile = {
  id: '',
  fullName: '',
  phone: '',
  accountType: 'business',
};

/** Display order for marketplace chips (must match backend platform display names). */
export const ALL_SHARE_PLATFORMS = ['Tap.az', 'Lalafo', 'Alan.az', 'Laylo.az', 'Birja.com'] as const;

export const createEmptyDraft = (platforms: string[] = []): ListingDraft => ({
  editingId: null,
  category: '',
  price: '',
  city: '',
  description: '',
  images: [],
  platforms,
  carDetails: null,
  motorcycleDetails: null,
  vehiclePartDetails: null,
});

export const getPlanLabel = (plan: PlanId, translate?: (key: string) => string): string => {
  const t = translate ?? ((value: string) => value);

  switch (plan) {
    case 'basic':
      return t('basic_plan');
    case 'premium':
      return t('premium_plan');
    case 'premiumPlus':
      return 'Premium+';
  }
};

export const createMockImage = (seed: number) => `https://picsum.photos/seed/${seed}/400/400`;

export const deriveListingTitle = (
  draft: ListingDraft,
  options?: {
    formatCategory?: (value: string) => string;
    fallbackTitle?: string;
  }
): string => {
  if (draft.carDetails?.brand && draft.carDetails?.year) {
    return `${draft.carDetails.brand} ${draft.carDetails.year}`;
  }

  if (draft.motorcycleDetails?.brand && draft.motorcycleDetails?.model) {
    return `${draft.motorcycleDetails.brand} ${draft.motorcycleDetails.model}`;
  }

  if (draft.vehiclePartDetails?.productName) {
    return draft.vehiclePartDetails.productName;
  }

  if (draft.carDetails?.brand) {
    return draft.carDetails.brand;
  }

  const categoryTail = draft.category
    .split(/\s+[^\p{L}\p{N}]+\s+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .pop();

  const localizedCategoryTail = categoryTail ? options?.formatCategory?.(categoryTail) ?? categoryTail : '';

  return localizedCategoryTail || draft.description.split(' ').slice(0, 4).join(' ') || options?.fallbackTitle || 'New Listing';
};
