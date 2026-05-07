import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

interface RegistrationSuccessScreenProps {
  onCreateListing: () => void;
  hasReachedListingLimit?: boolean;
}

const limitHintCopy: Record<Language, string> = {
  az: 'Daha çox elan üçün paket aktivləşdirin',
  en: 'Activate a package to publish more listings',
  ru: 'Активируйте пакет, чтобы разместить больше объявлений',
};

export const RegistrationSuccessScreen = ({ onCreateListing, hasReachedListingLimit = false }: RegistrationSuccessScreenProps) => {
  const { t, language } = useLanguage();
  const limitHint = limitHintCopy[language] ?? limitHintCopy.en;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-screen flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#F0FFF4]"
      >
        <CheckCircle2 size={48} className="text-[#22C55E]" />
      </motion.div>

      <h1 className="mb-4 text-[24px] font-semibold">{t('registration_completed')}</h1>
      <p className="mb-12 text-[#6B7280]">{t('platforms_ready')}</p>

      <Button
        onClick={onCreateListing}
        className={`w-full gap-2 ${hasReachedListingLimit ? 'border border-[#D7DCEF] bg-gradient-to-r from-[#2F3651] to-[#50597A]' : ''}`}
      >
        {hasReachedListingLimit ? <Lock size={18} /> : null}
        {t('create_first_listing')}
      </Button>
      {hasReachedListingLimit ? <p className="mt-4 text-[12px] text-[#6B7280]">{limitHint}</p> : null}
    </motion.div>
  );
};
