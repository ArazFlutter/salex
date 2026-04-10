import React from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';

interface LanguageScreenProps {
  onNavigate: (screen: string) => void;
}

export const LanguageScreen = ({ onNavigate }: LanguageScreenProps) => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; nameKey: string; flag: string }[] = [
    { code: 'az', nameKey: 'azerbaijani', flag: '🇦🇿' },
    { code: 'ru', nameKey: 'russian', flag: '🇷🇺' },
    { code: 'en', nameKey: 'english', flag: '🇬🇧' },
  ];

  const handleSelect = (langCode: Language) => {
    setLanguage(langCode);
    setTimeout(() => onNavigate('onboarding'), 300);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 pb-6 h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => onNavigate('start')} 
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#E6E9F5] transition-colors shrink-0"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">{t('choose_language')}</h1>
      </div>
      
      <div className="space-y-4">
        {languages.map((lang) => (
          <Card 
            key={lang.code} 
            onClick={() => handleSelect(lang.code)} 
            className={`cursor-pointer hover:bg-[#EEF0FF] hover:border-[#5B5CFF] border transition-all flex items-center gap-4 p-5 ${language === lang.code ? 'border-[#5B5CFF] bg-[#EEF0FF]' : 'border-transparent'}`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-[16px] font-medium text-[#111827]">{t(lang.nameKey)}</span>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
