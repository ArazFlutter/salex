import React from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Listing } from '@/lib/app-state';

interface ListingSuccessScreenProps {
  onNavigate: (screen: string) => void;
  listing: Listing | null;
  onViewListing: () => void;
}

const platformLinks: Record<string, string> = {
  'Tap.az': 'https://tap.az/',
  Lalafo: 'https://lalafo.az/',
  Telegram: 'https://telegram.org/',
};

export const ListingSuccessScreen = ({ onNavigate, listing, onViewListing }: ListingSuccessScreenProps) => {
  const { t } = useLanguage();
  const platforms = listing?.platforms ?? ['Tap.az', 'Lalafo'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-screen flex flex-col items-center justify-center text-center bg-white">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-24 h-24 bg-[#F0FFF4] rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle2 size={48} className="text-[#22C55E]" />
      </motion.div>

      <h1 className="text-[24px] font-semibold mb-2">{t('congratulations')}</h1>
      <p className="text-[#6B7280] mb-3">{t('listing_published')}</p>
      {listing && <p className="text-[14px] text-[#111827] font-medium mb-12">{listing.title}</p>}

      <div className="w-full space-y-3 mb-12">
        {platforms.map((platform) => (
          <a
            key={platform}
            href={platformLinks[platform] ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-4 bg-[#F7F8FC] rounded-[14px]"
          >
            <span className="font-medium text-[#111827]">{platform}</span>
            <ExternalLink size={20} className="text-[#5B5CFF]" />
          </a>
        ))}
      </div>

      <div className="w-full space-y-3">
        <Button onClick={onViewListing} variant="ghost" className="w-full">
          {t('view_listing')}
        </Button>
        <Button onClick={() => onNavigate('dashboard')} className="w-full">
          {t('go_to_dashboard')}
        </Button>
      </div>
    </motion.div>
  );
};
