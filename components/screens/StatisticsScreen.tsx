import React from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import Image from 'next/image';
import type { Listing } from '@/lib/app-state';

interface StatisticsScreenProps {
  listings: Listing[];
  /** Platforms the current package may publish to (display names). */
  allowedPlatformNames: string[];
  showAdvancedAnalytics: boolean;
}

const analyticsCopy: Record<
  Language,
  {
    engagementRate: string;
    avgViews: string;
    totalMessages: string;
    detailedTitle: string;
    performance: string;
    engagement: string;
    messages: string;
    advancedHint: string;
  }
> = {
  az: {
    engagementRate: 'Engagement rate',
    avgViews: 'Orta baxış',
    totalMessages: 'Mesajlar',
    detailedTitle: 'Ətraflı statistika',
    performance: 'Performans',
    engagement: 'Engagement',
    messages: 'Mesaj',
    advancedHint: 'Premium və Premium+ planlarında geniş performans və engagement göstəriciləri görünür.',
  },
  en: {
    engagementRate: 'Engagement rate',
    avgViews: 'Average views',
    totalMessages: 'Messages',
    detailedTitle: 'Detailed analytics',
    performance: 'Performance',
    engagement: 'Engagement',
    messages: 'Messages',
    advancedHint: 'Advanced performance and engagement metrics are available on Premium and Premium+.',
  },
  ru: {
    engagementRate: 'Уровень вовлечения',
    avgViews: 'Средние просмотры',
    totalMessages: 'Сообщения',
    detailedTitle: 'Подробная аналитика',
    performance: 'Эффективность',
    engagement: 'Вовлечение',
    messages: 'Сообщения',
    advancedHint: 'Расширенные метрики эффективности и вовлечения доступны в Premium и Premium+.',
  },
};

const getListingMetrics = (listing: Listing) => {
  const baseViews = 40 + listing.platforms.length * 28 + listing.images.length * 10 + listing.title.length * 2;
  const engagement = Math.min(72, 12 + listing.platforms.length * 5 + listing.images.length * 2 + listing.description.length / 45);
  const messages = Math.max(1, Math.round(baseViews * 0.08) + listing.platforms.length);

  return {
    views: baseViews,
    engagementRate: Number(engagement.toFixed(1)),
    messages,
  };
};

export const StatisticsScreen = ({ listings, allowedPlatformNames, showAdvancedAnalytics }: StatisticsScreenProps) => {
  const { t, language } = useLanguage();
  const copy = analyticsCopy[language] ?? analyticsCopy.en;
  const availablePlatforms = allowedPlatformNames;

  const listingMetrics = listings.map((listing) => ({
    listing,
    ...getListingMetrics(listing),
  }));

  const data = availablePlatforms.map((platform) => {
    const views = listingMetrics.reduce((total, item) => {
      if (!item.listing.platforms.includes(platform)) {
        return total;
      }

      return total + item.views;
    }, 0);

    return { name: platform, views };
  });

  const totalViews = data.reduce((sum, item) => sum + item.views, 0);
  const totalMessages = listingMetrics.reduce((sum, item) => sum + item.messages, 0);
  const averageViews = listingMetrics.length > 0 ? Math.round(totalViews / listingMetrics.length) : 0;
  const averageEngagement =
    listingMetrics.length > 0
      ? Number((listingMetrics.reduce((sum, item) => sum + item.engagementRate, 0) / listingMetrics.length).toFixed(1))
      : 0;
  const topListing = listingMetrics.slice().sort((left, right) => right.views - left.views)[0] ?? null;
  const topListings = listingMetrics.slice().sort((left, right) => right.views - left.views).slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-screen flex flex-col pt-12 pb-24 overflow-y-auto">
      <h1 className="text-[24px] font-semibold mb-8">{t('statistics')}</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="bg-[#5B5CFF] text-white border-none">
          <p className="text-white/80 text-[14px] mb-1">{t('total_views')}</p>
          <p className="text-[24px] font-semibold">{totalViews}</p>
        </Card>
        <Card className="border border-[#E5E7EB] shadow-sm">
          <p className="text-[#6B7280] text-[14px] mb-1">{t('active_listings')}</p>
          <p className="text-[24px] font-semibold text-[#111827]">{listings.length}</p>
        </Card>
      </div>

      {showAdvancedAnalytics ? (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="border border-[#E5E7EB] shadow-sm p-4">
            <p className="text-[#6B7280] text-[12px] mb-1">{copy.engagementRate}</p>
            <p className="text-[20px] font-semibold text-[#111827]">{averageEngagement}%</p>
          </Card>
          <Card className="border border-[#E5E7EB] shadow-sm p-4">
            <p className="text-[#6B7280] text-[12px] mb-1">{copy.avgViews}</p>
            <p className="text-[20px] font-semibold text-[#111827]">{averageViews}</p>
          </Card>
          <Card className="border border-[#E5E7EB] shadow-sm p-4">
            <p className="text-[#6B7280] text-[12px] mb-1">{copy.totalMessages}</p>
            <p className="text-[20px] font-semibold text-[#111827]">{totalMessages}</p>
          </Card>
        </div>
      ) : (
        <Card className="mb-8 border border-dashed border-[#D7DCEF] bg-white/90 p-4 text-[13px] text-[#6B7280] shadow-sm">
          {copy.advancedHint}
        </Card>
      )}

      <Card className="p-6 border border-[#E5E7EB] shadow-sm mb-8">
        <h3 className="text-[16px] font-semibold mb-6">{t('views_by_platform')}</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: '#F7F8FC' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="views" fill="#5B5CFF" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <h3 className="text-[18px] font-semibold mb-4">{t('top_performing')}</h3>
      {topListing ? (
        <Card className="flex items-center gap-4 border border-[#E5E7EB] shadow-sm">
          <div className="w-16 h-16 bg-[#F7F8FC] rounded-lg overflow-hidden relative">
            <Image
              src={topListing.listing.images[0] ?? `https://picsum.photos/seed/${topListing.listing.imageSeed}/100/100`}
              alt={topListing.listing.title}
              fill
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#111827]">{topListing.listing.title}</p>
            <p className="text-[#6B7280] text-[14px]">{topListing.views} {t('views_this_week')}</p>
          </div>
          <div className="text-[#22C55E] font-semibold">+{Math.round(topListing.engagementRate)}%</div>
        </Card>
      ) : (
        <Card className="border border-[#E5E7EB] shadow-sm text-[#6B7280]">
          {t('no_listings_yet')}
        </Card>
      )}

      {showAdvancedAnalytics && topListings.length > 0 ? (
        <>
          <h3 className="text-[18px] font-semibold mt-8 mb-4">{copy.detailedTitle}</h3>
          <div className="space-y-3">
            {topListings.map((item) => (
              <Card key={item.listing.id} className="border border-[#E5E7EB] shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#111827]">{item.listing.title}</p>
                    <p className="mt-1 text-[13px] text-[#6B7280]">{item.listing.platforms.join(', ')}</p>
                  </div>
                  <span className="rounded-full bg-[#EEF0FF] px-3 py-1 text-[12px] font-semibold text-[#5B5CFF]">
                    {item.views} {copy.performance}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-[12px] bg-[#F7F8FC] px-3 py-3">
                    <p className="text-[12px] text-[#6B7280]">{t('total_views')}</p>
                    <p className="mt-1 text-[16px] font-semibold text-[#111827]">{item.views}</p>
                  </div>
                  <div className="rounded-[12px] bg-[#F7F8FC] px-3 py-3">
                    <p className="text-[12px] text-[#6B7280]">{copy.engagement}</p>
                    <p className="mt-1 text-[16px] font-semibold text-[#111827]">{item.engagementRate}%</p>
                  </div>
                  <div className="rounded-[12px] bg-[#F7F8FC] px-3 py-3">
                    <p className="text-[12px] text-[#6B7280]">{copy.messages}</p>
                    <p className="mt-1 text-[16px] font-semibold text-[#111827]">{item.messages}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </motion.div>
  );
};
