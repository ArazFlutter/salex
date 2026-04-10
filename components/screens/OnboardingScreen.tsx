import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Tag, Send, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OnboardingScreenProps {
  onNavigate: (screen: string) => void;
}

export const OnboardingScreen = ({ onNavigate }: OnboardingScreenProps) => {
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigate('registration');
    }, 3000);
    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 pb-6 flex flex-col items-center justify-center h-screen text-center relative">
      <div className="absolute top-5 left-4">
        <button 
          onClick={() => onNavigate('language')} 
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
      </div>

      <div className="mb-12 relative w-full max-w-[280px] aspect-square flex items-center justify-center">
        <div className="absolute inset-0 bg-[#EEF0FF] rounded-full opacity-50 animate-pulse" />
        <div className="relative z-10 flex gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center -rotate-12 transform translate-y-4">
            <ShoppingBag className="text-[#5B5CFF]" size={28} />
          </div>
          <div className="w-20 h-20 bg-[#5B5CFF] rounded-2xl shadow-lg flex items-center justify-center z-20">
            <Tag className="text-white" size={36} />
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center rotate-12 transform translate-y-4">
            <Send className="text-[#22C55E]" size={28} />
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mb-8">
        <div className="w-8 h-1.5 bg-[#5B5CFF] rounded-full" />
        <div className="w-2 h-1.5 bg-[#E5E7EB] rounded-full" />
        <div className="w-2 h-1.5 bg-[#E5E7EB] rounded-full" />
        <div className="w-2 h-1.5 bg-[#E5E7EB] rounded-full" />
      </div>

      <h1 className="text-[24px] font-semibold mb-4">{t('onboarding_title')}</h1>
      <p className="text-[#6B7280] text-[14px]">{t('onboarding_subtitle')}</p>
    </motion.div>
  );
};
