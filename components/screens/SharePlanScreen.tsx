import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

interface SharePlanScreenProps {
  onNavigate: (screen: string) => void;
  platforms: Array<{
    name: string;
    status: 'connected' | 'notConnected' | 'locked';
  }>;
  onConnectPlatform: (platform: string) => void;
  showPremiumConnectionBanner?: boolean;
  listingsCount: number;
  limit: number;
  connectedPlatformsCount: number;
  onPublish: () => void;
}

type SharePlanCopy = {
  connected: string;
  notConnected: string;
  connect: string;
  login: string;
  later: string;
  connectTitleSuffix: string;
  connectDescription: string;
  premiumBanner: string;
  premiumBannerAction: string;
};

const sharePlanCopy: Record<Language, SharePlanCopy> = {
  az: {
    connected: '\u0051\u006f\u015f\u0075\u006c\u0075\u0062',
    notConnected: '\u0051\u006f\u015f\u0075\u006c\u006d\u0061\u0079\u0131\u0062',
    connect: '\u0051\u006f\u015f\u0075\u006c',
    login: 'Daxil ol',
    later: 'Sonra',
    connectTitleSuffix: 'hesab\u0131n\u0131 qo\u015fun',
    connectDescription: 'Bu platformada payla\u015fmaq \u00fc\u00e7\u00fcn hesab\u0131n\u0131za daxil olun.',
    premiumBanner: 'Premium aktivdir. Yeni platformalarda payla\u015fmaq \u00fc\u00e7\u00fcn hesablar\u0131n\u0131z\u0131 qo\u015fun.',
    premiumBannerAction: 'Platformalar\u0131 qo\u015f',
  },
  en: {
    connected: 'Connected',
    notConnected: 'Not connected',
    connect: 'Connect',
    login: 'Log in',
    later: 'Later',
    connectTitleSuffix: 'account connection',
    connectDescription: 'Log in to your account to publish on this platform.',
    premiumBanner: 'Premium is active. Connect your accounts to publish on new platforms.',
    premiumBannerAction: 'Connect platforms',
  },
  ru: {
    connected: '\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e',
    notConnected: '\u041d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e',
    connect: '\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c',
    login: '\u0412\u043e\u0439\u0442\u0438',
    later: '\u041f\u043e\u0437\u0436\u0435',
    connectTitleSuffix: '\u0430\u043a\u043a\u0430\u0443\u043d\u0442',
    connectDescription: '\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442, \u0447\u0442\u043e\u0431\u044b \u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c \u043d\u0430 \u044d\u0442\u043e\u0439 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435.',
    premiumBanner: 'Premium \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d. \u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u044b, \u0447\u0442\u043e\u0431\u044b \u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c \u043d\u0430 \u043d\u043e\u0432\u044b\u0445 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430\u0445.',
    premiumBannerAction: '\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b',
  },
};

const INFINITY_SYMBOL = '\u221E';

export const SharePlanScreen = ({
  onNavigate,
  platforms,
  onConnectPlatform,
  showPremiumConnectionBanner = false,
  listingsCount,
  limit,
  connectedPlatformsCount,
  onPublish,
}: SharePlanScreenProps) => {
  const { t, language } = useLanguage();
  const copy = sharePlanCopy[language] ?? sharePlanCopy.en;
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);

  const firstNotConnectedPlatform = useMemo(
    () => platforms.find((platform) => platform.status === 'notConnected')?.name ?? null,
    [platforms]
  );
  const hasConnectedPlatforms = connectedPlatformsCount > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex h-screen flex-col bg-white px-4 pb-6 pt-5">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => onNavigate('imageUpload')}
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#F9FAFB]"
          type="button"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">{t('share_plan')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <h2 className="mb-6 text-[16px] font-medium">{t('published_on')}</h2>

        {showPremiumConnectionBanner && firstNotConnectedPlatform ? (
          <div className="mb-5 rounded-[16px] border border-[#DDE8FF] bg-[#F5F8FF] p-4 shadow-sm">
            <p className="text-[13px] font-medium leading-5 text-[#374151]">{copy.premiumBanner}</p>
            <button
              type="button"
              onClick={() => setPendingPlatform(firstNotConnectedPlatform)}
              className="mt-3 inline-flex text-[13px] font-semibold text-[#5B5CFF] transition-colors hover:text-[#4849D1]"
            >
              {copy.premiumBannerAction}
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          {platforms.map((platform) => {
            const isConnected = platform.status === 'connected';
            const isNotConnected = platform.status === 'notConnected';
            const isLocked = platform.status === 'locked';

            return (
              <Card
                key={platform.name}
                className={`flex items-center justify-between border p-4 transition-colors ${
                  isConnected
                    ? 'border-[#22C55E]/30 bg-[#F0FFF4]'
                    : isLocked
                      ? 'border-[#E5E7EB] bg-[#F7F8FC] opacity-60'
                      : 'border-[#E5E7EB] bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isConnected ? 'bg-white shadow-sm' : 'bg-[#F3F4F6]'}`}>
                    <span className="text-[16px] font-semibold text-[#111827]">{platform.name.charAt(0)}</span>
                  </div>
                  <div>
                    <span className="block font-medium text-[#111827]">{platform.name}</span>
                    <span className={`mt-1 block text-[12px] font-medium ${isConnected ? 'text-[#16A34A]' : 'text-[#6B7280]'}`}>
                      {isConnected ? copy.connected : isNotConnected ? copy.notConnected : t('locked')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isNotConnected ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingPlatform(platform.name);
                      }}
                      className="rounded-[12px] bg-[#EEF0FF] px-4 py-2 text-[13px] font-semibold text-[#5B5CFF] transition-colors hover:bg-[#E4E7FF]"
                    >
                      {copy.connect}
                    </button>
                  ) : null}

                  {isConnected ? (
                    <CheckCircle2 className="text-[#22C55E]" size={24} />
                  ) : isLocked ? (
                    <Lock className="text-[#9CA3AF]" size={18} />
                  ) : (
                    <div className="h-6 w-6 rounded-full border border-[#D1D5DB] bg-[#F9FAFB]" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[14px] text-[#6B7280]">{t('limit_indicator')}</span>
          <span className="text-[14px] font-semibold text-[#111827]">
            {Number.isFinite(limit) ? `${Math.min(listingsCount + 1, limit)} / ${limit}` : `${listingsCount + 1} / ${INFINITY_SYMBOL}`}
          </span>
        </div>
        <Button onClick={onPublish} disabled={!hasConnectedPlatforms} className="mx-auto w-full max-w-[382px]">
          {t('publish_listing')}
        </Button>
      </div>

      {pendingPlatform ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#111827]/40 px-4">
          <div className="w-full max-w-[360px] rounded-[22px] bg-white p-6 shadow-[0_24px_60px_rgba(17,24,39,0.24)]">
            <h2 className="text-[20px] font-semibold text-[#111827]">{`${pendingPlatform} ${copy.connectTitleSuffix}`}</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#6B7280]">{copy.connectDescription}</p>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => {
                  const platformName = pendingPlatform;
                  setPendingPlatform(null);
                  onConnectPlatform(platformName);
                }}
                className="flex-1"
              >
                {copy.login}
              </Button>
              <Button variant="ghost" onClick={() => setPendingPlatform(null)} className="flex-1">
                {copy.later}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};
