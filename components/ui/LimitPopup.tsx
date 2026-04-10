import React from 'react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { Package2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LimitPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPackages: () => void;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  badgeLabel?: string;
}

export const LimitPopup = ({
  isOpen,
  onClose,
  onViewPackages,
  title,
  description,
  primaryActionLabel,
  secondaryActionLabel,
  badgeLabel,
}: LimitPopupProps) => {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t('todays_limit_reached');
  const resolvedDescription = description ?? t('limit_reached_desc');
  const resolvedPrimaryActionLabel = primaryActionLabel ?? t('view_packages');
  const resolvedSecondaryActionLabel = secondaryActionLabel ?? t('cancel');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[360px] rounded-[28px] border border-[#E6EAF5] bg-white p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-[#6B7280] transition-colors hover:bg-[#F7F8FC]"
            >
              <X size={20} />
            </button>

            {badgeLabel ? (
              <div className="mb-4 flex justify-center">
                <span className="inline-flex items-center rounded-full border border-[#D9E0FF] bg-[#F6F8FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B5CFF]">
                  {badgeLabel}
                </span>
              </div>
            ) : null}

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#DCE2FF] bg-gradient-to-br from-[#EEF0FF] to-[#F7F8FF]">
              <Package2 size={30} className="text-[#5B5CFF]" />
            </div>

            <h3 className="mb-2 text-center text-[20px] font-semibold text-[#111827]">{resolvedTitle}</h3>
            <p className="mb-8 text-center text-[14px] text-[#6B7280]">{resolvedDescription}</p>

            <div className="space-y-3">
              <Button onClick={onViewPackages} className="w-full bg-gradient-to-r from-[#5B5CFF] to-[#7A7BFF]">
                {resolvedPrimaryActionLabel}
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                {resolvedSecondaryActionLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
