import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { motion } from 'motion/react';
import { User, Phone, Store, CreditCard, LogOut, ChevronRight, Link as LinkIcon, Globe, Headset, ShieldCheck } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { getPlanLabel, type AccountType, type PlanId, type UserProfile } from '@/lib/app-state';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  profile: UserProfile;
  activePlan: PlanId;
  hasPrioritySupport: boolean;
  connectedPlatforms: string[];
  onSaveProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

const supportCardCopy: Record<
  Language,
  {
    priorityTitle: string;
    standardTitle: string;
    priorityHint: string;
    standardHint: string;
    badge: string;
  }
> = {
  az: {
    priorityTitle: 'Prioritet dəstək',
    standardTitle: 'Standart dəstək',
    priorityHint: 'Premium+ ilə sürətli cavab və ön növbə aktivdir.',
    standardHint: 'Dəstək sorğuları standart növbədə işlənir.',
    badge: 'Prioritet',
  },
  en: {
    priorityTitle: 'Priority support',
    standardTitle: 'Standard support',
    priorityHint: 'Fast response and priority queue are active with Premium+.',
    standardHint: 'Support requests are handled in the standard queue.',
    badge: 'Priority',
  },
  ru: {
    priorityTitle: 'Приоритетная поддержка',
    standardTitle: 'Стандартная поддержка',
    priorityHint: 'С Premium+ активны быстрый ответ и приоритетная очередь.',
    standardHint: 'Запросы поддержки обрабатываются в стандартной очереди.',
    badge: 'Приоритет',
  },
};

export const ProfileScreen = ({
  onNavigate,
  profile,
  activePlan,
  hasPrioritySupport: prioritySupportEntitlement,
  connectedPlatforms,
  onSaveProfile,
  onLogout,
}: ProfileScreenProps) => {
  const { t, language } = useLanguage();
  const supportCopy = supportCardCopy[language] ?? supportCardCopy.en;
  const isPriorityLane = prioritySupportEntitlement;
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    setDraftProfile(profile);
  }, [profile]);

  const handleSave = () => {
    onSaveProfile({
      id: draftProfile.id,
      fullName: draftProfile.fullName.trim(),
      phone: draftProfile.phone.trim(),
      accountType: draftProfile.accountType,
    });
    setIsEditing(false);
  };

  const updateAccountType = (accountType: AccountType) => {
    setDraftProfile((current) => ({
      ...current,
      accountType,
    }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-screen flex flex-col pt-12 pb-24 overflow-y-auto">
      <h1 className="text-[24px] font-semibold mb-8">{t('profile')}</h1>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-[#EEF0FF] rounded-full flex items-center justify-center">
          <User size={32} className="text-[#5B5CFF]" />
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={draftProfile.fullName}
                onChange={(e) => setDraftProfile((current) => ({ ...current, fullName: e.target.value }))}
                placeholder={t('enter_full_name')}
              />
              <Input
                value={draftProfile.phone}
                onChange={(e) => setDraftProfile((current) => ({ ...current, phone: e.target.value }))}
                placeholder="+994 50 123 45 67"
              />
            </div>
          ) : (
            <>
              <h2 className="text-[18px] font-semibold text-[#111827]">{profile.fullName}</h2>
              <p className="text-[#6B7280] text-[14px] flex items-center gap-1 mt-1">
                <Phone size={14} /> {profile.phone}
              </p>
            </>
          )}
        </div>
      </div>

      <Card className="mb-8 border border-[#E5E7EB] shadow-sm p-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F0FFF4] rounded-full flex items-center justify-center">
              <Store size={20} className="text-[#22C55E]" />
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] uppercase tracking-wider font-medium">{t('account_type')}</p>
              <p className="font-semibold text-[#111827]">
                {draftProfile.accountType === 'business' ? t('business_store') : t('individual_seller')}
              </p>
            </div>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="h-8 px-3 text-[12px]">
                {t('cancel')}
              </Button>
              <Button onClick={handleSave} className="h-8 px-3 text-[12px]">
                {t('save')}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(true)} className="h-8 px-3 text-[12px]">
              {t('edit')}
            </Button>
          )}
        </div>

        {isEditing && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              onClick={() => updateAccountType('individual')}
              className={`h-[44px] rounded-[12px] border text-[14px] font-medium ${
                draftProfile.accountType === 'individual'
                  ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]'
                  : 'border-[#E5E7EB] bg-white text-[#111827]'
              }`}
            >
              {t('individual_seller')}
            </button>
            <button
              type="button"
              onClick={() => updateAccountType('business')}
              className={`h-[44px] rounded-[12px] border text-[14px] font-medium ${
                draftProfile.accountType === 'business'
                  ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]'
                  : 'border-[#E5E7EB] bg-white text-[#111827]'
              }`}
            >
              {t('business_store')}
            </button>
          </div>
        )}
      </Card>

      <div className="space-y-4 mb-8">
        <h3 className="text-[16px] font-semibold text-[#111827]">{t('settings')}</h3>

        <Card
          onClick={() => onNavigate('language')}
          className="flex items-center justify-between p-4 cursor-pointer hover:border-[#5B5CFF] transition-all border border-[#E5E7EB] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EEF0FF] rounded-full flex items-center justify-center">
              <Globe size={20} className="text-[#5B5CFF]" />
            </div>
            <div>
              <p className="font-medium text-[#111827]">{t('language')}</p>
            </div>
          </div>
          <ChevronRight className="text-[#6B7280]" size={20} />
        </Card>

        <Card
          onClick={() => onNavigate('packages')}
          className="flex items-center justify-between p-4 cursor-pointer hover:border-[#5B5CFF] transition-all border border-[#E5E7EB] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EEF0FF] rounded-full flex items-center justify-center">
              <CreditCard size={20} className="text-[#5B5CFF]" />
            </div>
            <div>
              <p className="font-medium text-[#111827]">{t('active_plan')}</p>
              <p className="text-[12px] text-[#F59E0B] font-semibold">{getPlanLabel(activePlan, t)}</p>
            </div>
          </div>
          <ChevronRight className="text-[#6B7280]" size={20} />
        </Card>

        <Card
          onClick={() => onNavigate('support')}
          className={`flex items-center justify-between p-4 cursor-pointer hover:border-[#5B5CFF] transition-all border shadow-sm ${
            isPriorityLane ? 'border-[#5B5CFF]/30 bg-[#EEF0FF]' : 'border-[#E5E7EB] bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPriorityLane ? 'bg-[#5B5CFF] text-white' : 'bg-[#F7F8FC] text-[#111827]'}`}>
              {isPriorityLane ? <ShieldCheck size={20} /> : <Headset size={20} />}
            </div>
            <div>
              <p className="font-medium text-[#111827]">{t('help_support')}</p>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                {isPriorityLane ? supportCopy.priorityTitle : supportCopy.standardTitle}
              </p>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                {isPriorityLane ? supportCopy.priorityHint : supportCopy.standardHint}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPriorityLane ? (
              <span className="rounded-full bg-[#5B5CFF] px-2.5 py-1 text-[11px] font-semibold text-white">{supportCopy.badge}</span>
            ) : null}
            <ChevronRight className="text-[#6B7280]" size={20} />
          </div>
        </Card>

        <Card
          onClick={() => onNavigate('platformActivation')}
          className="flex items-center justify-between p-4 cursor-pointer hover:border-[#5B5CFF] transition-all border border-[#E5E7EB] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F7F8FC] rounded-full flex items-center justify-center">
              <LinkIcon size={20} className="text-[#111827]" />
            </div>
            <div>
              <span className="font-medium text-[#111827]">{t('connect_platforms')}</span>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                {connectedPlatforms.length > 0 ? connectedPlatforms.join(', ') : t('inactive')}
              </p>
            </div>
          </div>
          <ChevronRight className="text-[#6B7280]" size={20} />
        </Card>
      </div>

      <Button
        variant="ghost"
        onClick={onLogout}
        className="w-full mt-auto text-red-500 border-red-200 hover:bg-red-50"
      >
        <LogOut size={20} className="mr-2" /> {t('log_out')}
      </Button>
    </motion.div>
  );
};
