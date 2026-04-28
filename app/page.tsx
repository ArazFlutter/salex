'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { StartScreen } from '@/components/screens/StartScreen';
import { LanguageScreen } from '@/components/screens/LanguageScreen';
import { OnboardingScreen } from '@/components/screens/OnboardingScreen';
import { RegistrationScreen } from '@/components/screens/RegistrationScreen';
import { PlatformActivationScreen } from '@/components/screens/PlatformActivationScreen';
import { PlatformConnectionScreen } from '@/components/screens/PlatformConnectionScreen';
import { RegistrationSuccessScreen } from '@/components/screens/RegistrationSuccessScreen';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { CreateListingScreen } from '@/components/screens/CreateListingScreen';
import { ImageUploadScreen } from '@/components/screens/ImageUploadScreen';
import { SharePlanScreen } from '@/components/screens/SharePlanScreen';
import { ShareProgressScreen } from '@/components/screens/ShareProgressScreen';
import { ListingSuccessScreen } from '@/components/screens/ListingSuccessScreen';
import { MyListingsScreen } from '@/components/screens/MyListingsScreen';
import { StatisticsScreen } from '@/components/screens/StatisticsScreen';
import { DevPaymentScreen } from '@/components/screens/DevPaymentScreen';
import { PackagesScreen } from '@/components/screens/PackagesScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { SupportScreen } from '@/components/screens/SupportScreen';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { localizeListingPath } from '@/lib/listingLocalization';
import {
  ALL_SHARE_PLATFORMS,
  createEmptyDraft,
  DEFAULT_PROFILE,
  deriveListingTitle,
  type Listing,
  type ListingDraft,
  type PlanId,
  type SupportRequest,
  type UserProfile,
} from '@/lib/app-state';
import {
  getMe,
  getCurrentPackage,
  getPackageCatalog,
  getPlatforms,
  getListings as apiGetListings,
  createListing as apiCreateListing,
  createPublishJob,
  logout as logoutApi,
  selectPackage,
  ApiError,
  type ApiListing,
  type PlanCatalogPlans,
  type PlatformEntry,
  type UserPackageInfo,
} from '@/lib/api';
import {
  clearStoredClientUserId,
  getStoredClientUserId,
  setStoredClientUserId,
} from '@/lib/clientSession';

type Screen =
  | 'start'
  | 'language'
  | 'onboarding'
  | 'registration'
  | 'platformActivation'
  | 'platformConnection'
  | 'registrationSuccess'
  | 'dashboard'
  | 'createListing'
  | 'imageUpload'
  | 'sharePlan'
  | 'shareProgress'
  | 'listingSuccess'
  | 'myListings'
  | 'statistics'
  | 'packages'
  | 'devPayment'
  | 'profile'
  | 'support';

type ConnectionReturnScreen = 'platformActivation' | 'sharePlan';
type PlatformOption = {
  name: string;
  status: 'connected' | 'notConnected' | 'locked';
};

const FALLBACK_USER_PACKAGE: UserPackageInfo = {
  activePlan: 'basic',
  listingLimit: 3,
  allowedPlatforms: [
    { id: 'tapaz', name: 'Tap.az' },
    { id: 'lalafo', name: 'Lalafo' },
  ],
  advancedAnalytics: false,
  prioritySupport: false,
  priceAzn: null,
};

function apiListingToLocal(api: ApiListing, platforms: string[]): Listing {
  const ts = new Date(api.createdAt).getTime();
  return {
    id: ts,
    backendId: api.id,
    title: api.title,
    price: `${api.price} AZN`,
    platforms,
    imageSeed: ts,
    images: api.images ?? [],
    category: api.category,
    city: api.city,
    description: api.description,
    createdAt: ts,
    status: (api.status as Listing['status']) || 'active',
    carDetails: null,
    motorcycleDetails: null,
    vehiclePartDetails: null,
  };
}

export default function SalexAppWrapper() {
  return (
    <LanguageProvider>
      <SalexApp />
    </LanguageProvider>
  );
}

function SalexApp() {
  const { t, language } = useLanguage();
  const [screen, setScreen] = useState<Screen>('start');
  const [platformEntries, setPlatformEntries] = useState<PlatformEntry[]>([]);
  const [planCatalog, setPlanCatalog] = useState<PlanCatalogPlans | null>(null);
  const [userPackage, setUserPackage] = useState<UserPackageInfo | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string>('');
  const [connectionReturnScreen, setConnectionReturnScreen] = useState<ConnectionReturnScreen>('platformActivation');
  const [publishingPlatforms, setPublishingPlatforms] = useState<string[]>([]);
  const [publishJobId, setPublishJobId] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [draftListing, setDraftListing] = useState<ListingDraft>(() => createEmptyDraft());
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [activePlan, setActivePlan] = useState<PlanId>('basic');
  const [showDashboardToast, setShowDashboardToast] = useState(false);
  const [lastPublishedListingId, setLastPublishedListingId] = useState<number | null>(null);
  const [packagesMode, setPackagesMode] = useState<'default' | 'limitReached'>('default');
  const [resumeCreateAfterUpgrade, setResumeCreateAfterUpgrade] = useState(false);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [pendingPaymentOrderId, setPendingPaymentOrderId] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);

  const effectivePackage = useMemo<UserPackageInfo>(() => {
    if (userPackage) {
      return userPackage;
    }
    if (planCatalog) {
      const key = activePlan in planCatalog ? activePlan : 'basic';
      return { activePlan: key, ...planCatalog[key] };
    }
    return FALLBACK_USER_PACKAGE;
  }, [userPackage, planCatalog, activePlan]);

  const limit = useMemo(
    () =>
      effectivePackage.listingLimit === null ? Number.POSITIVE_INFINITY : effectivePackage.listingLimit,
    [effectivePackage.listingLimit],
  );

  const sharePlatforms = useMemo(
    () => effectivePackage.allowedPlatforms.map((p) => p.name),
    [effectivePackage.allowedPlatforms],
  );

  const connectedPlatforms = useMemo(
    () => platformEntries.filter((p) => p.connected).map((p) => p.name),
    [platformEntries],
  );

  const activeListingsCount = useMemo(
    () => listings.filter((listing) => listing.status === 'active').length,
    [listings]
  );
  const hasReachedListingLimit = Number.isFinite(limit) && activeListingsCount >= limit;
  const connectedSharePlatforms = useMemo(
    () => connectedPlatforms.filter((platform) => sharePlatforms.includes(platform)),
    [connectedPlatforms, sharePlatforms]
  );
  const effectivePlatforms = useMemo(() => connectedSharePlatforms, [connectedSharePlatforms]);
  const platformOptions = useMemo<PlatformOption[]>(() => {
    const allowed = new Set(sharePlatforms);
    return ALL_SHARE_PLATFORMS.map((platform) => {
      if (!allowed.has(platform)) {
        return { name: platform, status: 'locked' as const };
      }
      const entry = platformEntries.find((p) => p.name === platform);
      if (entry?.connected) {
        return { name: platform, status: 'connected' as const };
      }
      return { name: platform, status: 'notConnected' as const };
    });
  }, [platformEntries, sharePlatforms]);
  const unlockedButNotConnectedPlatforms = useMemo(
    () =>
      platformOptions
        .filter((platform) => platform.status === 'notConnected')
        .map((platform) => platform.name),
    [platformOptions]
  );

  const lastPublishedListing = useMemo(
    () => listings.find((listing) => listing.id === lastPublishedListingId) ?? null,
    [lastPublishedListingId, listings]
  );
  const showPremiumConnectionBanner = activePlan !== 'basic' && unlockedButNotConnectedPlatforms.length > 0;

  useEffect(() => {
    void getPackageCatalog()
      .then((res) => setPlanCatalog(res.plans))
      .catch(() => undefined);
  }, []);

  const refreshPlatforms = useCallback(async () => {
    try {
      const data = await getPlatforms();
      setPlatformEntries(data.platforms);
    } catch (err) {
      console.error('[SALex] refreshPlatforms failed', err);
      // TODO: toast notification əlavə et
    }
  }, []);

  const refreshListings = useCallback(async () => {
    try {
      const [listRes, platRes] = await Promise.all([apiGetListings(), getPlatforms()]);
      setPlatformEntries(platRes.platforms);
      const connected = platRes.platforms.filter((p) => p.connected).map((p) => p.name);
      setListings(listRes.listings.map((api) => apiListingToLocal(api, connected)));
    } catch (err) {
      console.error('[SALex] refreshListings failed', err);
      // TODO: toast notification əlavə et
    }
  }, []);

  const hydrateFromApi = useCallback(async () => {
    try {
      const clientUserId = getStoredClientUserId();
      const userData = await getMe();
      const user = userData.user;

      // Backend "session" is a single global otp_sessions row, not per-browser cookies.
      // Only treat GET /me as this client's session when it matches the user id we stored at OTP success.
      if (!clientUserId || user.id !== clientUserId) {
        return;
      }

      setProfile({
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        accountType: (user.accountType as UserProfile['accountType']) || 'business',
      });
      setActivePlan((user.activePlan as PlanId) || 'basic');

      const [platformData, pkgData] = await Promise.all([getPlatforms(), getCurrentPackage()]);
      setPlatformEntries(platformData.platforms);
      setUserPackage(pkgData.package);

      const connected = platformData.platforms.filter((p) => p.connected).map((p) => p.name);

      const listingData = await apiGetListings();
      const mapped = listingData.listings.map((api) =>
        apiListingToLocal(api, connected),
      );
      setListings(mapped);

      // Only auto-route from early onboarding screens. Late hydration must not override
      // in-app navigation (e.g. packages → dev payment after POST /api/payments/create).
      const bootScreens: Screen[] = ['start', 'language', 'onboarding'];
      setScreen((prev) => (bootScreens.includes(prev as Screen) ? 'dashboard' : prev));
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        clearStoredClientUserId();
      }
      // not authenticated — stay on current screen (typically start)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hydrateFromApi();
  }, [hydrateFromApi]);

  const navigate = (nextScreen: string) => {
    if (nextScreen !== 'packages' && nextScreen !== 'devPayment') {
      setPackagesMode('default');
      setResumeCreateAfterUpgrade(false);
    }

    setScreen(nextScreen as Screen);
  };

  const openLimitPackages = (shouldResumeCreate = false) => {
    setResumeCreateAfterUpgrade(shouldResumeCreate);
    setPackagesMode('limitReached');
    setScreen('packages');
  };

  const handleStartNewListing = () => {
    if (hasReachedListingLimit) {
      setDraftListing(createEmptyDraft(effectivePlatforms));
      openLimitPackages(true);
      return;
    }

    setDraftListing(createEmptyDraft(effectivePlatforms));
    setScreen('createListing');
  };

  const syncDraftListing = (updater: ListingDraft | ((current: ListingDraft) => ListingDraft)) => {
    setDraftListing((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      const nextPlatforms = next.platforms.filter((platform) => connectedSharePlatforms.includes(platform));

      return {
        ...next,
        platforms: nextPlatforms.length > 0 ? nextPlatforms : effectivePlatforms,
      };
    });
  };

  const handleNavigateToConnection = (platform: string, returnScreen: ConnectionReturnScreen = 'platformActivation') => {
    setConnectingPlatform(platform);
    setConnectionReturnScreen(returnScreen);
    setScreen('platformConnection');
  };

  const handleConnectionSuccess = async () => {
    await refreshPlatforms();
    setScreen(connectionReturnScreen);
  };

  const handleAuthenticated = async (user: { id: string; phone: string; fullName: string; activePlan: string }) => {
    setStoredClientUserId(user.id);
    setProfile((p) => ({ ...p, id: user.id, phone: user.phone, fullName: user.fullName }));
    setActivePlan((user.activePlan as PlanId) || 'basic');
    await refreshPlatforms();
    try {
      const pkg = await getCurrentPackage();
      setUserPackage(pkg.package);
    } catch {
      setUserPackage(null);
    }
    await refreshListings();
  };

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
  };

  const handleSaveDraft = (nextDraft: ListingDraft) => {
    syncDraftListing(nextDraft);
  };

  const handleStartPublish = async () => {
    if (!draftListing.editingId && hasReachedListingLimit) {
      openLimitPackages(false);
      return;
    }

    const finalPlatforms = connectedSharePlatforms;
    setPublishingPlatforms(finalPlatforms);
    setPublishLoading(true);

    try {
      const title = deriveListingTitle(draftListing, {
        formatCategory: (value) => localizeListingPath(value, language),
        fallbackTitle: t('create_new_listing'),
      });

      const listingResult = await apiCreateListing({
        title,
        category: draftListing.category,
        price: parseFloat(draftListing.price) || 0,
        city: draftListing.city,
        description: draftListing.description,
        images: draftListing.images,
        status: 'active',
      });

      const backendListingId = listingResult.listing.id;

      const publishResult = await createPublishJob(backendListingId);
      setPublishJobId(publishResult.job.id);

      const nextId = draftListing.editingId ?? Date.now();
      const nextListing: Listing = {
        id: nextId,
        backendId: backendListingId,
        title,
        price: `${draftListing.price} AZN`,
        platforms: finalPlatforms,
        imageSeed: nextId,
        images: draftListing.images,
        category: draftListing.category,
        city: draftListing.city,
        description: draftListing.description,
        createdAt: Date.now(),
        status: 'active',
        carDetails: draftListing.carDetails,
        motorcycleDetails: draftListing.motorcycleDetails,
        vehiclePartDetails: draftListing.vehiclePartDetails,
      };

      setListings((prev) => {
        if (draftListing.editingId) {
          return prev.map((listing) => (listing.id === draftListing.editingId ? nextListing : listing));
        }
        return [nextListing, ...prev];
      });
      setLastPublishedListingId(nextId);

      setScreen('shareProgress');
    } catch {
      setPublishingPlatforms(connectedSharePlatforms);
      setScreen('shareProgress');
      setPublishJobId(null);
    } finally {
      setPublishLoading(false);
    }
  };

  const handlePublishComplete = () => {
    setShowDashboardToast(true);
    setDraftListing(createEmptyDraft(effectivePlatforms));
    setPublishingPlatforms([]);
    setPublishJobId(null);
    setScreen('listingSuccess');
  };

  const handleEditListing = (listing: Listing) => {
    setDraftListing({
      editingId: listing.id,
      category: listing.category,
      price: listing.price.replace(' AZN', ''),
      city: listing.city,
      description: listing.description,
      images: listing.images,
      platforms: listing.platforms,
      carDetails: listing.carDetails,
      motorcycleDetails: listing.motorcycleDetails,
      vehiclePartDetails: listing.vehiclePartDetails,
    });
    setScreen('createListing');
  };

  const handleDeleteListing = (listingId: number) => {
    setListings((prev) => prev.filter((listing) => listing.id !== listingId));
  };

  const handleRepostListing = (listingId: number) => {
    if (hasReachedListingLimit) {
      openLimitPackages(false);
      return;
    }

    const listing = listings.find((item) => item.id === listingId);

    if (!listing) {
      return;
    }

    const repostedListing: Listing = {
      ...listing,
      id: Date.now(),
      imageSeed: Date.now(),
      createdAt: Date.now(),
    };

    setListings((prev) => [repostedListing, ...prev]);
    setLastPublishedListingId(repostedListing.id);
    setShowDashboardToast(true);
    setScreen('listingSuccess');
  };

  const applyPlanToDraft = (plan: PlanId) => {
    setDraftListing((current) => {
      const nextAvailablePlatforms =
        planCatalog?.[plan]?.allowedPlatforms.map((p) => p.name) ??
        FALLBACK_USER_PACKAGE.allowedPlatforms.map((p) => p.name);
      return {
        ...current,
        platforms: current.platforms.filter(
          (platform) => nextAvailablePlatforms.includes(platform) && connectedPlatforms.includes(platform)
        ),
      };
    });
  };

  const handlePaymentConfirmed = (payload: { activePlan: PlanId; package?: UserPackageInfo }) => {
    const { activePlan: plan, package: pkg } = payload;
    setActivePlan(plan);
    if (pkg) {
      setUserPackage(pkg);
    } else {
      void getCurrentPackage()
        .then((r) => setUserPackage(r.package))
        .catch(() => undefined);
    }
    applyPlanToDraft(plan);
    setPendingPaymentOrderId(null);
    setPackagesMode('default');
    setScreen(resumeCreateAfterUpgrade ? 'createListing' : 'dashboard');
    setResumeCreateAfterUpgrade(false);
  };

  const handleDevPaymentCancel = () => {
    setPendingPaymentOrderId(null);
    setScreen('packages');
  };

  const handleSelectPlan = async (plan: PlanId) => {
    if (plan === 'basic') {
      try {
        const res = await selectPackage('basic');
        setUserPackage(res.package);
      } catch {
        // keep local state in sync when possible
      }
      setActivePlan('basic');
      applyPlanToDraft('basic');
      setPackagesMode('default');
      setScreen(resumeCreateAfterUpgrade ? 'createListing' : 'dashboard');
      setResumeCreateAfterUpgrade(false);
      return;
    }

    if (plan === 'premium' || plan === 'premiumPlus') {
      const currentUser = { id: profile.id };
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'YourSALexBot';
      const telegramPayUrl = `https://t.me/${botUsername}?start=link_${currentUser.id}`;
      window.open(telegramPayUrl, '_blank');
      return;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Clear local binding regardless so this tab does not re-hydrate into another user's global session.
    }
    clearStoredClientUserId();

    setScreen('start');
    setPlatformEntries([]);
    setUserPackage(null);
    setConnectingPlatform('');
    setConnectionReturnScreen('platformActivation');
    setPublishingPlatforms([]);
    setPublishJobId(null);
    setListings([]);
    setDraftListing(createEmptyDraft());
    setProfile(DEFAULT_PROFILE);
    setActivePlan('basic');
    setShowDashboardToast(false);
    setLastPublishedListingId(null);
    setPackagesMode('default');
    setResumeCreateAfterUpgrade(false);
    setSupportRequests([]);
    setPendingPaymentOrderId(null);
  };

  const handleSubmitSupportRequest = ({ subject, message }: { subject: string; message: string }) => {
    setSupportRequests((prev) => [
      {
        id: Date.now(),
        subject,
        message,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen onNavigate={navigate} />;
      case 'language':
        return <LanguageScreen onNavigate={navigate} />;
      case 'onboarding':
        return <OnboardingScreen onNavigate={navigate} />;
      case 'registration':
        return (
          <RegistrationScreen
            onNavigate={navigate}
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onAuthenticated={handleAuthenticated}
          />
        );
      case 'platformActivation':
        return (
          <PlatformActivationScreen
            onNavigate={navigate}
            allowedPlatformNames={sharePlatforms}
            connectedPlatforms={connectedPlatforms}
            onConnectPlatform={(platform) => handleNavigateToConnection(platform, 'platformActivation')}
          />
        );
      case 'platformConnection':
        return (
          <PlatformConnectionScreen
            onNavigate={navigate}
            backScreen={connectionReturnScreen}
            platformName={connectingPlatform}
            onSuccess={handleConnectionSuccess}
          />
        );
      case 'registrationSuccess':
        return (
          <RegistrationSuccessScreen
            onCreateListing={handleStartNewListing}
            hasReachedListingLimit={hasReachedListingLimit}
          />
        );
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigate={navigate}
            onCreateListing={handleStartNewListing}
            listings={listings}
            showToast={showDashboardToast}
            setShowToast={setShowDashboardToast}
            activePlan={activePlan}
            limit={limit}
            hasReachedListingLimit={hasReachedListingLimit}
          />
        );
      case 'createListing':
        return (
          <CreateListingScreen
            onNavigate={navigate}
            draftListing={draftListing}
            onSaveDraft={handleSaveDraft}
            sharePlatformOptions={sharePlatforms}
          />
        );
      case 'imageUpload':
        return (
          <ImageUploadScreen
            onNavigate={navigate}
            images={draftListing.images}
            onImagesChange={(images) =>
              syncDraftListing((current) => ({
                ...current,
                images,
              }))
            }
          />
        );
      case 'sharePlan':
        return (
          <SharePlanScreen
            onNavigate={navigate}
            platforms={platformOptions}
            onConnectPlatform={(platform) => handleNavigateToConnection(platform, 'sharePlan')}
            showPremiumConnectionBanner={showPremiumConnectionBanner}
            listingsCount={activeListingsCount}
            limit={limit}
            connectedPlatformsCount={connectedSharePlatforms.length}
            onPublish={() => {
              if (!draftListing.editingId && hasReachedListingLimit) {
                openLimitPackages(false);
                return;
              }

              handleStartPublish();
            }}
          />
        );
      case 'shareProgress':
        return (
          <ShareProgressScreen
            platforms={publishingPlatforms}
            publishJobId={publishJobId}
            onComplete={handlePublishComplete}
          />
        );
      case 'listingSuccess':
        return (
          <ListingSuccessScreen
            onNavigate={navigate}
            listing={lastPublishedListing}
            onViewListing={() => setScreen('myListings')}
          />
        );
      case 'myListings':
        return (
          <MyListingsScreen
            listings={listings}
            onEditListing={handleEditListing}
            onRepostListing={handleRepostListing}
            onDeleteListing={handleDeleteListing}
          />
        );
      case 'statistics':
        return (
          <StatisticsScreen
            listings={listings}
            allowedPlatformNames={sharePlatforms}
            showAdvancedAnalytics={effectivePackage.advancedAnalytics}
          />
        );
      case 'packages':
        return (
          <PackagesScreen
            onNavigate={navigate}
            activePlan={activePlan}
            onSelectPlan={handleSelectPlan}
            isLimitReachedView={packagesMode === 'limitReached'}
            planCatalog={planCatalog}
          />
        );
      case 'devPayment':
        if (!pendingPaymentOrderId) {
          return (
            <PackagesScreen
              onNavigate={navigate}
              activePlan={activePlan}
              onSelectPlan={handleSelectPlan}
              isLimitReachedView={packagesMode === 'limitReached'}
              planCatalog={planCatalog}
            />
          );
        }
        return (
          <DevPaymentScreen
            orderId={pendingPaymentOrderId}
            onCancel={handleDevPaymentCancel}
            onConfirmed={handlePaymentConfirmed}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onNavigate={navigate}
            profile={profile}
            activePlan={activePlan}
            hasPrioritySupport={effectivePackage.prioritySupport}
            connectedPlatforms={connectedPlatforms}
            onSaveProfile={handleSaveProfile}
            onLogout={handleLogout}
          />
        );
      case 'support':
        return (
          <SupportScreen
            onNavigate={navigate}
            hasPrioritySupport={effectivePackage.prioritySupport}
            requests={supportRequests}
            onSubmitRequest={handleSubmitSupportRequest}
          />
        );
      default:
        return <div>{t('screen_not_found')}</div>;
    }
  };

  const showBottomNav = ['dashboard', 'myListings', 'packages', 'statistics', 'profile'].includes(screen);

  const getActiveTab = () => {
    switch (screen) {
      case 'dashboard':
        return 'Home';
      case 'myListings':
        return 'Listings';
      case 'packages':
        return 'Packages';
      case 'statistics':
        return 'Stats';
      case 'profile':
        return 'Profile';
      default:
        return 'Home';
    }
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'Home':
        setScreen('dashboard');
        break;
      case 'Listings':
        setScreen('myListings');
        break;
      case 'Packages':
        setResumeCreateAfterUpgrade(false);
        setPackagesMode('default');
        setScreen('packages');
        break;
      case 'Stats':
        setScreen('statistics');
        break;
      case 'Profile':
        setScreen('profile');
        break;
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F7F8FC] relative shadow-2xl overflow-hidden">
      {renderScreen()}
      {showBottomNav && <BottomNav activeTab={getActiveTab()} onTabChange={handleTabChange} />}
    </div>
  );
}
