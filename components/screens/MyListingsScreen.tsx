import React from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'motion/react';
import { Edit2, RefreshCw, Trash2, MoreVertical, PackageOpen } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeCityCode } from '@/lib/listingLocalization';
import type { Listing } from '@/lib/app-state';

interface MyListingsScreenProps {
  listings: Listing[];
  onEditListing: (listing: Listing) => void;
  onRepostListing: (listingId: number) => void;
  onDeleteListing: (listingId: number) => void;
}

export const MyListingsScreen = ({
  listings,
  onEditListing,
  onRepostListing,
  onDeleteListing,
}: MyListingsScreenProps) => {
  const { t, language } = useLanguage();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-screen flex flex-col pt-12 pb-24 overflow-y-auto relative">
      <h1 className="text-[24px] font-semibold mb-8">{t('my_listings')}</h1>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-[#F7F8FC] rounded-full flex items-center justify-center mb-4">
            <PackageOpen size={32} className="text-[#9CA3AF]" />
          </div>
          <h4 className="text-[16px] font-semibold text-[#111827] mb-2">{t('no_listings_yet')}</h4>
          <p className="text-[14px] text-[#6B7280]">{t('create_first_listing_desc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="p-0 overflow-hidden border border-[#E5E7EB] shadow-sm">
              <div className="relative h-48 w-full bg-[#F7F8FC]">
                <Image
                  src={listing.images[0] ?? `https://picsum.photos/seed/${listing.imageSeed}/400/400`}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] font-medium text-[#22C55E]">
                  {t(listing.status)}
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-[16px] text-[#111827]">{listing.title}</h3>
                    <p className="text-[#5B5CFF] font-semibold mt-1">{listing.price}</p>
                    <p className="text-[13px] text-[#6B7280] mt-1">{localizeCityCode(listing.city, language)}</p>
                  </div>
                  <button className="text-[#6B7280] p-1" type="button" aria-label={t('listing_actions')}>
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {listing.platforms.map((platform) => (
                    <span key={platform} className="px-2 py-1 bg-[#F7F8FC] text-[#6B7280] text-[12px] rounded-md border border-[#E5E7EB]">
                      {platform}
                    </span>
                  ))}
                </div>

                <p className="text-[13px] text-[#6B7280] mb-6 line-clamp-2">{listing.description}</p>

                <div className="flex gap-2 pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => onEditListing(listing)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-[14px] font-medium text-[#111827] hover:bg-[#F7F8FC] rounded-lg transition-colors"
                  >
                    <Edit2 size={16} /> {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRepostListing(listing.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-[14px] font-medium text-[#5B5CFF] hover:bg-[#EEF0FF] rounded-lg transition-colors"
                  >
                    <RefreshCw size={16} /> {t('repost')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteListing(listing.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-[14px] font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} /> {t('delete')}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};
