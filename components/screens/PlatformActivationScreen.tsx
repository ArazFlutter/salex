import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, ChevronLeft, Lock, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ALL_SHARE_PLATFORMS } from '@/lib/app-state';

interface PlatformActivationScreenProps {
  onNavigate: (screen: string) => void;
  /** Marketplaces included in the user's current package (from backend entitlements). */
  allowedPlatformNames: string[];
  connectedPlatforms?: string[];
  onConnectPlatform?: (platform: string) => void;
}

export const PlatformActivationScreen = ({
  onNavigate,
  allowedPlatformNames,
  connectedPlatforms = [],
  onConnectPlatform,
}: PlatformActivationScreenProps) => {
  const { t } = useLanguage();
  const availablePlatforms = allowedPlatformNames;
  const lockedPlatforms = ALL_SHARE_PLATFORMS.filter((platform) => !availablePlatforms.includes(platform));

  const isStep1 = connectedPlatforms.length === 0;

  const handleConnect = (platform: string) => {
    if (onConnectPlatform) {
      onConnectPlatform(platform);
    } else {
      onNavigate('platformConnection');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 pb-6 h-screen flex flex-col relative">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => onNavigate('registration')} 
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#E6E9F5] transition-colors shrink-0"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">
          {isStep1 ? t('connect_platforms') : t('connect_marketplaces')}
        </h1>
      </div>

      {isStep1 && (
        <div className="mb-8">
          <p className="text-[#6B7280] text-[14px] mb-6">{t('connect_platforms_subtitle')}</p>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#111827]" />
            <div className="w-2 h-2 rounded-full bg-[#111827]" />
            <div className="w-2 h-2 rounded-full bg-[#E5E7EB]" />
            <div className="w-2 h-2 rounded-full bg-[#E5E7EB]" />
          </div>
        </div>
      )}

      <div className="space-y-8 flex-1 overflow-y-auto pb-24">
        {isStep1 ? (
          <>
            <div>
              <h2 className="text-[12px] font-semibold text-[#6B7280] mb-4 uppercase tracking-wider">{t('available_platforms')}</h2>
              <div className="space-y-4">
                {availablePlatforms.map((platform) => (
                  <Card 
                    key={platform} 
                    onClick={() => handleConnect(platform)}
                    className="flex items-center justify-between p-4 h-[72px] rounded-[16px] bg-white border border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] active:bg-[#F7F8FC] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[44px] h-[44px] bg-[#F7F8FC] rounded-[12px] flex items-center justify-center shrink-0">
                        <span className="text-[20px]">🛍️</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#111827] text-[15px]">{platform}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          <span className="text-[13px] text-[#22C55E] font-medium">{t('ready_to_connect')}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-[#9CA3AF]" size={20} />
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[12px] font-semibold text-[#6B7280] mb-4 uppercase tracking-wider">{t('coming_soon')}</h2>
              <div className="space-y-4">
                {lockedPlatforms.map((platform) => (
                  <Card 
                    key={platform} 
                    className="flex items-center justify-between p-4 h-[72px] rounded-[16px] bg-[#F7F8FC] border border-[#E5E7EB] opacity-70"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[44px] h-[44px] bg-[#EEF1F6] rounded-[12px] flex items-center justify-center shrink-0">
                        <Zap className="text-[#9CA3AF]" size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#9CA3AF] text-[16px]">{platform}</span>
                        <span className="text-[12px] text-[#9CA3AF] font-medium mt-0.5 uppercase">{t('locked')}</span>
                      </div>
                    </div>
                    <Lock className="text-[#9CA3AF]" size={20} />
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-[12px] font-semibold text-[#6B7280] mb-4 uppercase tracking-wider">{t('active')}</h2>
              <div className="space-y-4">
                {connectedPlatforms.map((platform) => (
                  <Card key={platform} className="flex items-center justify-between p-4 h-[72px] rounded-[16px] bg-[#F0FFF4] border border-[#22C55E]">
                    <div className="flex items-center gap-4">
                      <div className="w-[44px] h-[44px] bg-white rounded-[12px] flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[20px]">🛍️</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#111827] text-[15px]">{platform}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="text-[#22C55E]" size={14} />
                          <span className="text-[13px] text-[#22C55E] font-medium">{t('connected')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[12px] font-semibold text-[#6B7280] mb-4 uppercase tracking-wider">{t('available_to_connect')}</h2>
              <div className="space-y-4">
                {availablePlatforms.filter((platform) => !connectedPlatforms.includes(platform)).map((platform) => (
                  <Card 
                    key={platform} 
                    onClick={() => handleConnect(platform)}
                    className="flex items-center justify-between p-4 h-[72px] rounded-[16px] bg-white border border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] active:bg-[#F7F8FC] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[44px] h-[44px] bg-[#F7F8FC] rounded-[12px] flex items-center justify-center shrink-0">
                        <span className="text-[20px]">🛍️</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#111827] text-[15px]">{platform}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          <span className="text-[13px] text-[#22C55E] font-medium">{t('ready_to_connect')}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-[#9CA3AF]" size={20} />
                  </Card>
                ))}
                {lockedPlatforms.map((platform) => (
                  <Card 
                    key={platform} 
                    className="flex items-center justify-between p-4 h-[72px] rounded-[16px] bg-[#F7F8FC] border border-[#E5E7EB] opacity-70"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[44px] h-[44px] bg-[#EEF1F6] rounded-[12px] flex items-center justify-center shrink-0">
                        <Zap className="text-[#9CA3AF]" size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#9CA3AF] text-[16px]">{platform}</span>
                        <span className="text-[12px] text-[#9CA3AF] font-medium mt-0.5 uppercase">{t('locked')}</span>
                      </div>
                    </div>
                    <Lock className="text-[#9CA3AF]" size={20} />
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {!isStep1 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F7F8FC] via-[#F7F8FC] to-transparent">
          <Button 
            onClick={() => onNavigate('registrationSuccess')} 
            className="w-full max-w-[382px] mx-auto bg-gradient-to-r from-[#5B5CFF] to-[#7A7BFF] text-white"
          >
            {t('continue')}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
