import React from 'react';
import { motion } from 'motion/react';
import { Check, ChevronLeft, Crown, Lock, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import type { PlanCatalogEntry, PlanCatalogPlans } from '@/lib/api';
import type { PlanId } from '@/lib/app-state';

interface PackagesScreenProps {
  onNavigate?: (screen: string) => void;
  activePlan: PlanId;
  onSelectPlan: (plan: PlanId) => void;
  isLimitReachedView?: boolean;
  /** Server-defined plan rules for limits, platforms, and prices (optional until loaded). */
  planCatalog: PlanCatalogPlans | null;
}

function catalogFeaturesFor(lang: Language, entry: PlanCatalogEntry): string[] {
  const names = entry.allowedPlatforms.map((p) => p.name).join(', ');
  const limitLine =
    entry.listingLimit === null
      ? { az: 'Limitsiz aktiv elan', en: 'Unlimited active listings', ru: 'Неограниченно активных объявлений' }[lang]
      : {
          az: `Maksimum ${entry.listingLimit} aktiv elan`,
          en: `Up to ${entry.listingLimit} active listings`,
          ru: `До ${entry.listingLimit} активных объявлений`,
        }[lang];
  const platformLine = {
    az: `Platformalar: ${names}`,
    en: `Marketplaces: ${names}`,
    ru: `Площадки: ${names}`,
  }[lang];
  const lines = [limitLine, platformLine];
  if (entry.advancedAnalytics) {
    lines.push({
      az: 'Ətraflı statistika və analiz',
      en: 'Detailed statistics and analytics',
      ru: 'Подробная статистика и аналитика',
    }[lang]);
  }
  if (entry.prioritySupport) {
    lines.push({
      az: 'Prioritet dəstək',
      en: 'Priority support',
      ru: 'Приоритетная поддержка',
    }[lang]);
  }
  return lines;
}

type PlanCardContent = {
  name: string;
  price: string;
  period: string;
  action: string;
  features: string[];
  badge?: string;
};

type PackageCopy = {
  title: string;
  subtitle: string;
  limitTitle: string;
  limitDescription: string;
  limitHint: string;
  currentPlan: string;
  activateBasic: string;
  basic: PlanCardContent;
  premium: PlanCardContent;
  premiumPlus: PlanCardContent;
};

const packageCopy: Record<Language, PackageCopy> = {
  az: {
    title: 'Paketlər',
    subtitle: 'Elan axınınıza uyğun plan seçin və paylaşımı daha rahat idarə edin.',
    limitTitle: 'Limitə çatdınız',
    limitDescription: 'Sadə paketdə maksimum {n} elan yerləşdirə bilərsiniz',
    limitHint: 'Daha çox elan üçün paket aktivləşdirin',
    currentPlan: 'Cari paket',
    activateBasic: 'Sadə paket',
    basic: {
      name: 'Sadə paket',
      price: 'Pulsuz',
      period: 'hazırkı plan',
      action: 'Sadə paket',
      features: ['Maksimum 3 aktiv elan', 'Standart paylaşım alətləri', 'Başlamaq üçün uyğundur'],
    },
    premium: {
      name: 'Premium',
      price: '10 AZN',
      period: '/ həftə',
      action: 'Telegram Stars ilə ödə ⭐',
      badge: 'Populyar',
      features: ['Həftəlik 10 elan', 'Bütün platformalarda paylaşım', 'Ətraflı statistika və analiz'],
    },
    premiumPlus: {
      name: 'Premium+',
      price: '20 AZN',
      period: '/ ay',
      action: 'Telegram Stars ilə ödə ⭐',
      features: ['Limitsiz elan yerləşdir', 'Ətraflı statistika', 'Prioritet dəstək'],
    },
  },
  en: {
    title: 'Packages',
    subtitle: 'Choose a plan that fits your listing flow and manage publishing more easily.',
    limitTitle: 'Limit reached',
    limitDescription: 'You can publish up to {n} listings on the basic plan',
    limitHint: 'Activate a package to publish more listings',
    currentPlan: 'Current plan',
    activateBasic: 'Basic plan',
    basic: {
      name: 'Basic',
      price: 'Free',
      period: 'current plan',
      action: 'Basic plan',
      features: ['Maximum 3 active listings', 'Standard publishing tools', 'Best for getting started'],
    },
    premium: {
      name: 'Premium',
      price: '10 AZN',
      period: '/ week',
      action: 'Pay with Telegram Stars',
      badge: 'Popular',
      features: ['10 listings per week', 'Share across all platforms', 'Detailed statistics and analytics'],
    },
    premiumPlus: {
      name: 'Premium+',
      price: '20 AZN',
      period: '/ month',
      action: 'Pay with Telegram Stars',
      features: ['Unlimited listings', 'Advanced analytics', 'Priority support'],
    },
  },
  ru: {
    title: 'Пакеты',
    subtitle: 'Выберите план под ваш поток объявлений и управляйте размещением удобнее.',
    limitTitle: 'Вы достигли лимита',
    limitDescription: 'В базовом пакете можно разместить максимум {n} объявлений',
    limitHint: 'Активируйте пакет, чтобы разместить больше объявлений',
    currentPlan: 'Текущий пакет',
    activateBasic: 'Базовый пакет',
    basic: {
      name: 'Базовый пакет',
      price: 'Бесплатно',
      period: 'текущий план',
      action: 'Базовый пакет',
      features: ['Максимум 3 активных объявления', 'Стандартные инструменты публикации', 'Подходит для старта'],
    },
    premium: {
      name: 'Premium',
      price: '10 AZN',
      period: '/ неделя',
      action: 'Оплатить Telegram Stars',
      badge: 'Популярно',
      features: ['10 объявлений в неделю', 'Публикация на всех платформах', 'Подробная статистика и аналитика'],
    },
    premiumPlus: {
      name: 'Premium+',
      price: '20 AZN',
      period: '/ месяц',
      action: 'Оплатить Telegram Stars',
      features: ['Безлимитное размещение', 'Расширенная аналитика', 'Приоритетная поддержка'],
    },
  },
};

type PlanTone = 'light' | 'highlight' | 'dark';

export const PackagesScreen = ({
  onNavigate,
  activePlan,
  onSelectPlan,
  isLimitReachedView = false,
  planCatalog,
}: PackagesScreenProps) => {
  const { language } = useLanguage();
  const copy = packageCopy[language] ?? packageCopy.en;
  const basicLimit = planCatalog?.basic.listingLimit ?? 3;

  const basicFeatures = planCatalog
    ? [...catalogFeaturesFor(language, planCatalog.basic), copy.basic.features[2] ?? ''].filter(Boolean)
    : copy.basic.features;

  const premiumFeatures = planCatalog
    ? catalogFeaturesFor(language, planCatalog.premium)
    : copy.premium.features;

  const premiumPlusFeatures = planCatalog
    ? catalogFeaturesFor(language, planCatalog.premiumPlus)
    : copy.premiumPlus.features;

  const premiumPrice =
    planCatalog?.premium.priceAzn != null ? `${planCatalog.premium.priceAzn} AZN` : copy.premium.price;
  const premiumPlusPrice =
    planCatalog?.premiumPlus.priceAzn != null ? `${planCatalog.premiumPlus.priceAzn} AZN` : copy.premiumPlus.price;

  const premiumCard = { ...copy.premium, price: premiumPrice, features: premiumFeatures };
  const premiumPlusCard = { ...copy.premiumPlus, price: premiumPlusPrice, features: premiumPlusFeatures };
  const basicCard = { ...copy.basic, features: basicFeatures };

  const renderAction = (plan: PlanId, label: string, className?: string) => {
    if (activePlan === plan) {
      return (
        <Button
          variant="ghost"
          className={`w-full ${plan === 'premiumPlus' ? 'border-white/20 text-white hover:bg-white/10' : 'border-[#22C55E] text-[#22C55E]'}`}
        >
          {copy.currentPlan}
        </Button>
      );
    }

    return (
      <Button onClick={() => onSelectPlan(plan)} className={className ?? 'w-full'}>
        {label}
      </Button>
    );
  };

  const renderPlanCard = (plan: PlanId, content: PlanCardContent, tone: PlanTone) => {
    const isDark = tone === 'dark';
    const isHighlight = tone === 'highlight';

    const cardClassName =
      tone === 'light'
        ? 'rounded-[22px] border border-[#E5E7EB] bg-white p-6 shadow-sm'
        : tone === 'highlight'
          ? 'relative overflow-hidden rounded-[24px] border-2 border-[#5B5CFF] bg-white p-6 shadow-[0_14px_35px_rgba(91,92,255,0.14)]'
          : 'rounded-[24px] border border-[#111827] bg-[#111827] p-6 text-white shadow-[0_16px_38px_rgba(17,24,39,0.24)]';

    return (
      <Card className={cardClassName}>
        {content.badge ? (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#5B5CFF] px-3 py-1 text-[11px] font-semibold text-white">
            <Sparkles size={12} />
            {content.badge}
          </div>
        ) : null}

        <div className={`flex items-center gap-3 ${content.badge ? 'pr-24' : ''}`}>
          {isHighlight ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EEF0FF] text-[#5B5CFF]">
              <Crown size={20} />
            </div>
          ) : null}
          {tone === 'light' ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F7F8FC] text-[#5B5CFF]">
              <Package size={20} strokeWidth={1.9} />
            </div>
          ) : null}
          {isDark ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white">
              <Sparkles size={20} />
            </div>
          ) : null}
          <h3 className={`text-[18px] font-semibold ${isDark ? 'text-white' : isHighlight ? 'text-[#5B5CFF]' : 'text-[#111827]'}`}>
            {content.name}
          </h3>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className={`text-[32px] font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>{content.price}</span>
          <span className={isDark ? 'text-white/65' : 'text-[#6B7280]'}>{content.period}</span>
        </div>

        <ul className="mt-5 space-y-2.5">
          {content.features.map((feature) => (
            <li key={feature} className={`flex items-start gap-3 text-[13px] leading-5 ${isDark ? 'text-white/90' : 'text-[#111827]'}`}>
              <Check size={17} className={`mt-0.5 shrink-0 ${isDark ? 'text-[#22C55E]' : 'text-[#5B5CFF]'}`} />
              <span className="min-w-0">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          {isDark
            ? renderAction(plan, content.action, 'w-full bg-white text-[#111827] hover:bg-white/90')
            : renderAction(plan, content.action, isHighlight ? 'w-full bg-gradient-to-r from-[#5B5CFF] to-[#7A7BFF]' : undefined)}
        </div>
      </Card>
    );
  };

  const paidCards = (
    <div className={isLimitReachedView ? 'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-1' : 'space-y-5'}>
      <div className={isLimitReachedView ? 'min-w-[292px] shrink-0 snap-start' : ''}>
        {renderPlanCard('premium', premiumCard, 'highlight')}
      </div>
      <div className={isLimitReachedView ? 'min-w-[292px] shrink-0 snap-start' : ''}>
        {renderPlanCard('premiumPlus', premiumPlusCard, 'dark')}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-screen flex-col overflow-y-auto px-4 pb-24 pt-5">
      <div className="mb-6 flex items-center gap-3">
        {onNavigate ? (
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#F9FAFB] active:bg-[#E6E9F5]"
            type="button"
          >
            <ChevronLeft size={24} className="text-[#111827]" />
          </button>
        ) : null}
        <h1 className="text-[24px] font-semibold text-[#111827]">{copy.title}</h1>
      </div>

      {isLimitReachedView ? (
        <div className="mt-2">
          <div className="rounded-[28px] border border-[#D9E0FF] bg-gradient-to-br from-white to-[#F7F8FF] p-5 shadow-[0_16px_36px_rgba(91,92,255,0.1)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EEF0FF] text-[#5B5CFF]">
              <Lock size={22} />
            </div>
            <h2 className="text-[24px] font-semibold text-[#111827]">{copy.limitTitle}</h2>
            <p className="mt-2 text-[15px] leading-6 text-[#374151]">
              {copy.limitDescription.replace('{n}', String(basicLimit))}
            </p>
            <p className="mt-3 text-[13px] text-[#6B7280]">{copy.limitHint}</p>
          </div>

          <div className="mt-6">{paidCards}</div>
        </div>
      ) : (
        <>
          <p className="mb-8 text-[#6B7280]">{copy.subtitle}</p>

          <div className="space-y-5">
            {renderPlanCard('basic', basicCard, 'light')}
            {paidCards}
          </div>
        </>
      )}
    </motion.div>
  );
};
