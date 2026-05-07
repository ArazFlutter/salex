import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

interface SelectionPanelFieldProps {
  value: string;
  placeholder: string;
  options: string[];
  panelTitle: string;
  modalTitle?: string;
  contentLabel?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  accentColorClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'select' | 'input';
  inputPlaceholder?: string;
  variant?: 'labeled' | 'plain';
  triggerClassName?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  getOptionLabel?: (option: string) => string;
}

export const SelectionPanelField = ({
  value,
  placeholder,
  options,
  panelTitle,
  modalTitle,
  contentLabel,
  onSelect,
  disabled = false,
  invalid = false,
  required = true,
  accentColorClassName = 'text-[#2563EB]',
  open,
  onOpenChange,
  mode = 'select',
  inputPlaceholder = '',
  variant = 'labeled',
  triggerClassName = '',
  showSearch = false,
  searchPlaceholder,
  getOptionLabel,
}: SelectionPanelFieldProps) => {
  const { t } = useLanguage();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [searchValue, setSearchValue] = useState('');
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const confirmDisabled = !draftValue.trim();
  const triggerTone = invalid
    ? 'border-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.08)]'
    : value
      ? 'border-[#C7D7F8] bg-[#F8FBFF]'
      : 'border-[#E5E7EB] bg-white';

  const filteredOptions = useMemo(() => {
    if (!showSearch) {
      return options;
    }

    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, searchValue, showSearch]);

  const formatOptionLabel = (option: string) => getOptionLabel?.(option) ?? option;
  const resolvedInputPlaceholder = inputPlaceholder || t('search_city_district_or_address');
  const resolvedSearchPlaceholder = searchPlaceholder || t('search');
  const resolvedContentLabel = contentLabel || t('enter_location');
  const displayValue = value ? formatOptionLabel(value) : placeholder;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setDraftValue(value);
          setSearchValue('');
          setOpen(true);
        }}
        className={`w-full rounded-[18px] border text-left transition-all disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] ${triggerTone} ${triggerClassName}`}
      >
        {variant === 'labeled' ? (
          <div className="flex min-h-[68px] items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
                {panelTitle}
                {required ? <span className="ml-1 text-[#2563EB]">*</span> : null}
              </div>
              <div className={`mt-1 truncate text-[15px] ${value ? 'text-[#111827]' : 'text-[#94A3B8]'}`}>
                {displayValue}
              </div>
            </div>
            <ChevronDown className="ml-3 shrink-0 text-[#64748B]" size={20} />
          </div>
        ) : (
          <div className="flex min-h-[60px] items-center justify-between px-5 py-3">
            <span className={`truncate text-[16px] ${value ? 'text-[#111827]' : 'text-[#94A3B8]'}`}>
              {displayValue}
            </span>
            <ChevronDown className="ml-3 shrink-0 text-[#64748B]" size={20} />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 z-[80] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative z-10 flex h-[85vh] w-full flex-col overflow-hidden rounded-t-[22px] bg-[#F7F8FC] shadow-[0_-8px_28px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
                >
                  <ChevronLeft size={22} />
                </button>
                <h3 className="text-[18px] font-semibold text-[#111827]">{modalTitle ?? panelTitle}</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
                {mode === 'input' ? (
                  <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-5">
                    <label className="mb-3 block text-[16px] font-medium text-[#111827]">
                      {resolvedContentLabel}
                    </label>
                    <input
                      value={draftValue}
                      onChange={(event) => setDraftValue(event.target.value)}
                      placeholder={resolvedInputPlaceholder}
                      className="h-[64px] w-full rounded-[18px] border border-[#E5E7EB] bg-white px-5 text-[16px] text-[#111827] outline-none transition-all focus:border-[#5B5CFF]"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {showSearch ? (
                      <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-5">
                        <label className="mb-3 block text-[16px] font-medium text-[#111827]">
                          {contentLabel ?? panelTitle}
                        </label>
                        <input
                          value={searchValue}
                          onChange={(event) => setSearchValue(event.target.value)}
                          placeholder={resolvedSearchPlaceholder}
                          className="h-[64px] w-full rounded-[18px] border border-[#E5E7EB] bg-white px-5 text-[16px] text-[#111827] outline-none transition-all focus:border-[#5B5CFF]"
                        />
                      </div>
                    ) : null}

                    <div className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white">
                      {filteredOptions.map((option) => {
                        const selected = draftValue === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setDraftValue(option)}
                            className={`flex h-[52px] w-full items-center justify-between border-b border-[#EEF2F7] px-4 text-left last:border-b-0 ${
                              selected ? 'bg-[#F3F6FF]' : 'bg-white hover:bg-[#F8FAFF]'
                            }`}
                          >
                            <span className={`truncate pr-3 text-[14px] font-medium ${selected ? accentColorClassName : 'text-[#111827]'}`}>
                              {formatOptionLabel(option)}
                            </span>
                            <ChevronRight size={16} className={`shrink-0 ${selected ? 'text-[#345CFF]' : 'text-[#9CA3AF]'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 border-t border-[#E5E7EB] bg-white p-4">
                <Button
                  className="h-[52px] w-full rounded-[16px] text-[16px] font-semibold disabled:cursor-not-allowed disabled:bg-[#D1D5DB] disabled:text-white disabled:shadow-none"
                  disabled={confirmDisabled}
                  onClick={() => {
                    if (confirmDisabled) {
                      return;
                    }

                    onSelect(draftValue.trim());
                    setOpen(false);
                  }}
                >
                  {t('confirm')}
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
