import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Infinity, Lock, MoreVertical, PackageOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { getPlanLabel, type Listing, type PlanId } from '@/lib/app-state';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
  onCreateListing: () => void;
  listings: Listing[];
  showToast: boolean;
  setShowToast: React.Dispatch<React.SetStateAction<boolean>>;
  activePlan: PlanId;
  limit: number;
  hasReachedListingLimit: boolean;
}

const listingLimitCopy: Record<
  Language,
  {
    limitLabel: string;
    limitHint: string;
    limitBadge: string;
    unlimitedBadge: string;
  }
> = {
  az: {
    limitLabel: 'Aktiv elan limiti',
    limitHint: 'Daha çox elan üçün paket aktivləşdirin',
    limitBadge: 'Limitə çatdınız',
    unlimitedBadge: 'Limitsiz',
  },
  en: {
    limitLabel: 'Active listing limit',
    limitHint: 'Activate a package to publish more listings',
    limitBadge: 'Limit reached',
    unlimitedBadge: 'Unlimited',
  },
  ru: {
    limitLabel: 'Лимит активных объявлений',
    limitHint: 'Активируйте пакет, чтобы разместить больше объявлений',
    limitBadge: 'Лимит достигнут',
    unlimitedBadge: 'Безлимит',
  },
};

const INFINITY_SYMBOL = '\u221E';

export const DashboardScreen = ({
  onNavigate,
  onCreateListing,
  listings,
  showToast,
  setShowToast,
  activePlan,
  limit,
  hasReachedListingLimit,
}: DashboardScreenProps) => {
  const { t, language } = useLanguage();
  const listingsCount = listings.length;
  const activeListingsCount = listings.filter((listing) => listing.status === 'active').length;
  const copy = listingLimitCopy[language] ?? listingLimitCopy.en;
  const isUnlimitedPlan = !Number.isFinite(limit);

  React.useEffect(() => {
    if (!showToast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showToast, setShowToast]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-screen overflow-y-auto p-6 pb-24 pt-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-[24px] font-semibold text-[#111827]">Salex</h2>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF] font-semibold text-[#5B5CFF]">
          JD
        </div>
      </div>

      <Card className="relative mb-8 overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-bl-full bg-[#5B5CFF]/5" />
        {isUnlimitedPlan ? <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#5B5CFF]/10 to-transparent" /> : null}

        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[14px] font-medium text-[#6B7280]">{copy.limitLabel}</p>
            <p className="text-[24px] font-semibold text-[#111827]">
              {isUnlimitedPlan ? `${activeListingsCount} / ${INFINITY_SYMBOL}` : `${activeListingsCount} / ${limit}`}
            </p>
            <p className="mt-1 text-[12px] text-[#6B7280]">{getPlanLabel(activePlan, t)}</p>
          </div>

          {isUnlimitedPlan ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#5B5CFF]/10 px-3 py-1 text-[12px] font-semibold text-[#5B5CFF]">
              <Infinity size={14} />
              {copy.unlimitedBadge}
            </span>
          ) : hasReachedListingLimit ? (
            <span className="rounded-md bg-[#F59E0B]/10 px-2 py-1 text-[12px] font-medium text-[#F59E0B]">
              {copy.limitBadge}
            </span>
          ) : null}
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${isUnlimitedPlan ? 100 : Math.min((activeListingsCount / limit) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isUnlimitedPlan ? 'bg-gradient-to-r from-[#5B5CFF] via-[#7A7BFF] to-[#5B5CFF]' : hasReachedListingLimit ? 'bg-[#EF4444]' : 'bg-[#5B5CFF]'
            }`}
          />
        </div>
      </Card>

      <div className="mb-8">
        <Button
          onClick={onCreateListing}
          aria-label={hasReachedListingLimit ? copy.limitHint : t('create_new_listing')}
          className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] text-[16px] font-semibold text-white shadow-md ${
            hasReachedListingLimit
              ? 'border border-[#D7DCEF] bg-gradient-to-r from-[#2F3651] to-[#50597A]'
              : 'bg-gradient-to-r from-[#5B5CFF] to-[#7A7BFF]'
          }`}
        >
          {hasReachedListingLimit ? <Lock size={18} /> : <Plus size={20} />}
          {t('create_new_listing')}
        </Button>
        {hasReachedListingLimit ? <p className="mt-3 text-center text-[12px] text-[#6B7280]">{copy.limitHint}</p> : null}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-[#111827]">{t('recent_listings')}</h3>
        {listingsCount > 0 ? (
          <button onClick={() => onNavigate('myListings')} className="text-[14px] font-medium text-[#5B5CFF]">
            {t('see_all')}
          </button>
        ) : null}
      </div>

      {listingsCount === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F8FC]">
            <PackageOpen size={32} className="text-[#9CA3AF]" />
          </div>
          <h4 className="mb-2 text-[16px] font-semibold text-[#111827]">{t('no_listings_yet')}</h4>
          <p className="text-[14px] text-[#6B7280]">{t('create_first_listing_desc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {listings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="flex items-center gap-4 rounded-[16px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F7F8FC]">
                    <Image
                      src={
                        listing.images[0] && !/^https?:\/\/(www\.)?example\.com/i.test(listing.images[0])
                          ? listing.images[0]
                          : 'https://picsum.photos/200/200'
                      }
                      alt={listing.title}
                      fill
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-[#111827]">{listing.title}</p>
                    <p className="mt-0.5 text-[14px] font-semibold text-[#5B5CFF]">{listing.price}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {listing.platforms.map((platform) => (
                        <span key={platform} className="rounded-md bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-medium text-[#5B5CFF]">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="shrink-0 rounded-full p-2 text-[#6B7280] transition-colors hover:bg-[#F7F8FC]" type="button">
                    <MoreVertical size={20} />
                  </button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showToast ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 rounded-[12px] bg-[#111827] px-4 py-3 text-white shadow-lg"
          >
            <CheckCircle2 size={20} className="text-[#22C55E]" />
            <span className="text-[14px] font-medium">{t('listing_published')}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
