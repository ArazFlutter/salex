import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { getPublishJobStatus, type PlatformPublishStatus } from '@/lib/api';

type DisplayStatus = 'waiting' | 'processing' | 'success' | 'pending_link' | 'failed';

interface ShareProgressScreenProps {
  platforms: string[];
  publishJobId: string | null;
  onComplete: () => void;
}

type ShareProgressCopy = {
  waiting: string;
  failed: string;
  retry: string;
  pending_link: string;
};

const shareProgressCopy: Record<Language, ShareProgressCopy> = {
  az: {
    waiting: 'gözləyir',
    failed: 'xəta',
    retry: 'Təkrar yoxla',
    pending_link: 'link gözlənilir',
  },
  en: {
    waiting: 'waiting',
    failed: 'failed',
    retry: 'Retry',
    pending_link: 'link pending',
  },
  ru: {
    waiting: 'ожидание',
    failed: 'ошибка',
    retry: 'Повторить',
    pending_link: 'ссылка ожидается',
  },
};

function toDisplayStatus(raw: PlatformPublishStatus['status']): DisplayStatus {
  if (raw === 'published_pending_link') return 'pending_link';
  return raw;
}

export const ShareProgressScreen = ({ platforms, publishJobId, onComplete }: ShareProgressScreenProps) => {
  const { t, language } = useLanguage();
  const copy = shareProgressCopy[language] ?? shareProgressCopy.en;

  const [platformStatuses, setPlatformStatuses] = useState<{ name: string; status: DisplayStatus }[]>(() =>
    platforms.map((name) => ({ name, status: 'waiting' })),
  );
  const [jobDone, setJobDone] = useState(false);
  const completionFired = useRef(false);

  const poll = useCallback(async () => {
    if (!publishJobId) return;

    try {
      const data = await getPublishJobStatus(publishJobId);
      const mapped = data.platforms.map((p) => ({
        name: p.platform,
        status: toDisplayStatus(p.status),
      }));

      if (mapped.length > 0) {
        setPlatformStatuses(mapped);
      }

      const allTerminal = data.platforms.every(
        (p) => p.status === 'success' || p.status === 'published_pending_link' || p.status === 'failed',
      );
      const jobTerminal = data.status === 'success' || data.status === 'failed';

      if (allTerminal || jobTerminal) {
        setJobDone(true);
      }
    } catch {
      // polling failure is transient; keep trying
    }
  }, [publishJobId]);

  useEffect(() => {
    if (!publishJobId) {
      const t = setTimeout(() => onComplete(), 0);
      return () => clearTimeout(t);
    }

    const firstPoll = setTimeout(() => {
      void poll();
    }, 0);
    const interval = setInterval(poll, 2500);
    return () => {
      clearTimeout(firstPoll);
      clearInterval(interval);
    };
  }, [publishJobId, poll, onComplete]);

  useEffect(() => {
    if (jobDone && !completionFired.current) {
      completionFired.current = true;
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [jobDone, onComplete]);

  const hasFailures = useMemo(
    () => platformStatuses.some((p) => p.status === 'failed'),
    [platformStatuses],
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-screen flex-col justify-center bg-white px-6">
      <div className="mx-auto w-full max-w-[340px]">
        <h1 className="mb-8 text-center text-[24px] font-semibold text-[#111827]">{t('publishing')}</h1>

        <div className="space-y-4">
          {platformStatuses.map((platform) => {
            const isSuccess = platform.status === 'success';
            const isProcessing = platform.status === 'processing';
            const isWaiting = platform.status === 'waiting';
            const isFailed = platform.status === 'failed';
            const isPendingLink = platform.status === 'pending_link';

            return (
              <div
                key={platform.name}
                className={`flex items-center justify-between rounded-[16px] border px-4 py-3 transition-colors ${
                  isSuccess
                    ? 'border-[#BBF7D0] bg-[#F0FFF4]'
                    : isProcessing
                      ? 'border-[#C7D2FE] bg-[#EEF2FF]'
                      : isFailed
                        ? 'border-[#FECACA] bg-[#FEF2F2]'
                        : isPendingLink
                          ? 'border-[#FDE68A] bg-[#FFFBEB]'
                          : 'border-[#E5E7EB] bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center">
                    {isSuccess ? <CheckCircle2 className="text-[#22C55E]" size={24} /> : null}
                    {isProcessing ? <Loader2 className="animate-spin text-[#5B5CFF]" size={24} /> : null}
                    {isWaiting ? <div className="h-3 w-3 rounded-full bg-[#D1D5DB]" /> : null}
                    {isFailed ? <AlertCircle className="text-[#EF4444]" size={22} /> : null}
                    {isPendingLink ? <Clock className="text-[#F59E0B]" size={22} /> : null}
                  </div>

                  <div>
                    <div
                      className={`text-[15px] font-medium ${
                        isProcessing ? 'text-[#4338CA]' : isWaiting ? 'text-[#6B7280]' : 'text-[#111827]'
                      }`}
                    >
                      {platform.name}
                    </div>
                    {isProcessing ? <div className="text-[12px] text-[#5B5CFF]">{t('processing')}</div> : null}
                    {isWaiting ? <div className="text-[12px] text-[#9CA3AF]">{copy.waiting}</div> : null}
                    {isFailed ? <div className="text-[12px] text-[#EF4444]">{copy.failed}</div> : null}
                    {isPendingLink ? <div className="text-[12px] text-[#D97706]">{copy.pending_link}</div> : null}
                  </div>
                </div>

                {isFailed ? (
                  <Button
                    variant="ghost"
                    onClick={() => {}}
                    className="h-9 rounded-[10px] border-[#FCA5A5] px-3 text-[12px] text-[#DC2626] hover:bg-[#FEE2E2]"
                  >
                    {copy.retry}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {hasFailures ? <p className="mt-5 text-center text-[12px] text-[#6B7280]">{copy.retry}</p> : null}
      </div>
    </motion.div>
  );
};
