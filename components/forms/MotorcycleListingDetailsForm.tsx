import React, { useState } from 'react';
import { SelectionPanelField } from '@/components/ui/SelectionPanelField';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeListingText } from '@/lib/listingLocalization';
import type { MotorcycleListingDetails } from '@/lib/app-state';

const typeOptions = ['Motosiklet', 'Moped', 'Skuter', 'Kvadrotsikl', 'Digər'];
const brandOptions = ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'KTM', 'Digər'];

type InputKey = 'model' | 'engineVolume' | 'year' | 'mileage';

interface MotorcycleListingDetailsFormProps {
  value: MotorcycleListingDetails;
  onChange: (value: MotorcycleListingDetails) => void;
  showValidation: boolean;
}

const labelClassName = 'mb-2 block text-[14px] font-medium text-[#7C8AA5]';
const fieldClassName =
  'h-[60px] w-full rounded-[18px] border border-[#E6EBF2] bg-white px-5 text-[16px] text-[#111827] outline-none transition-all focus:border-[#5B5CFF] focus:ring-0';

const FieldLabel = ({ label }: { label: string }) => (
  <label className={labelClassName}>
    {label} <span className="text-[#FF6B4A]">*</span>
  </label>
);

export const createEmptyMotorcycleDetails = (): MotorcycleListingDetails => ({
  brand: '',
  model: '',
  type: '',
  engineVolume: '',
  fuelType: '',
  year: '',
  mileage: '',
  transmission: '',
  color: '',
  condition: '',
  district: '',
  isNew: false,
});

export const isMotorcycleDetailsComplete = (value: MotorcycleListingDetails | null): value is MotorcycleListingDetails =>
  Boolean(value && value.brand && value.model && value.type && value.engineVolume && value.year && value.mileage);

export const MotorcycleListingDetailsForm = ({
  value,
  onChange,
  showValidation,
}: MotorcycleListingDetailsFormProps) => {
  const { language, t } = useLanguage();
  const [activeInput, setActiveInput] = useState<InputKey | null>(null);
  const tx = (value: string) => localizeListingText(value, language);
  const getRequiredMessage = (label: string) =>
    language === 'ru' ? `Поле "${label}" обязательно.` : language === 'az' ? `${label} sahəsi mütləqdir.` : `${label} is required.`;

  const updateField = <Key extends keyof MotorcycleListingDetails>(field: Key, nextValue: MotorcycleListingDetails[Key]) => {
    onChange({
      ...value,
      [field]: nextValue,
    });
  };

  const renderError = (visible: boolean, message: string) =>
    visible ? <p className="mt-2 text-[12px] font-medium text-[#DC2626]">{message}</p> : null;

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={tx('Malın növü')} />
        <SelectionPanelField
          value={value.type}
          placeholder={tx('Malın növü')}
          options={typeOptions}
          panelTitle={tx('Malın növü')}
          modalTitle={tx('Malın növü')}
          contentLabel={tx('Malın növünü seçin')}
          variant="plain"
          triggerClassName={fieldClassName}
          required={false}
          onSelect={(nextValue) => updateField('type', nextValue)}
          getOptionLabel={tx}
        />
        {renderError(showValidation && !value.type, getRequiredMessage(tx('Malın növü')))}
      </div>

      <div>
        <FieldLabel label={tx('Marka')} />
        <SelectionPanelField
          value={value.brand}
          placeholder={tx('Marka')}
          options={brandOptions}
          panelTitle={tx('Marka')}
          modalTitle={tx('Marka')}
          contentLabel={t('select_brand')}
          showSearch
          searchPlaceholder={t('search_brand')}
          variant="plain"
          triggerClassName={fieldClassName}
          required={false}
          onSelect={(nextValue) => updateField('brand', nextValue)}
          getOptionLabel={tx}
        />
        {renderError(showValidation && !value.brand, getRequiredMessage(tx('Marka')))}
      </div>

      <div>
        <FieldLabel label={tx('Model')} />
        <input
          value={value.model}
          onChange={(event) => updateField('model', event.target.value)}
          onFocus={() => setActiveInput('model')}
          onBlur={() => setActiveInput(null)}
          placeholder={tx('Model')}
          className={`${fieldClassName} ${activeInput === 'model' ? 'border-[#5B5CFF]' : ''} placeholder:text-[#94A3B8]`}
        />
        {renderError(showValidation && !value.model, getRequiredMessage(tx('Model')))}
      </div>

      <div>
        <FieldLabel label={tx('Mühərrikin həcmi, sm³')} />
        <input
          value={value.engineVolume}
          onChange={(event) => updateField('engineVolume', event.target.value.replace(/[^\d]/g, ''))}
          onFocus={() => setActiveInput('engineVolume')}
          onBlur={() => setActiveInput(null)}
          inputMode="numeric"
          placeholder={tx('Mühərrikin həcmi, sm³')}
          className={`${fieldClassName} ${activeInput === 'engineVolume' ? 'border-[#5B5CFF]' : ''} placeholder:text-[#94A3B8]`}
        />
        {renderError(showValidation && !value.engineVolume, getRequiredMessage(tx('Mühərrikin həcmi, sm³')))}
      </div>

      <div>
        <FieldLabel label={tx('Buraxılış ili')} />
        <input
          value={value.year}
          onChange={(event) => updateField('year', event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
          onFocus={() => setActiveInput('year')}
          onBlur={() => setActiveInput(null)}
          inputMode="numeric"
          placeholder={tx('Buraxılış ili')}
          className={`${fieldClassName} ${activeInput === 'year' ? 'border-[#5B5CFF]' : ''} placeholder:text-[#94A3B8]`}
        />
        {renderError(showValidation && !value.year, getRequiredMessage(tx('Buraxılış ili')))}
      </div>

      <div>
        <FieldLabel label={tx('Yürüşü, km')} />
        <input
          value={value.mileage}
          onChange={(event) => updateField('mileage', event.target.value.replace(/[^\d]/g, ''))}
          onFocus={() => setActiveInput('mileage')}
          onBlur={() => setActiveInput(null)}
          inputMode="numeric"
          placeholder={tx('Yürüşü, km')}
          className={`${fieldClassName} ${activeInput === 'mileage' ? 'border-[#5B5CFF]' : ''} placeholder:text-[#94A3B8]`}
        />
        {renderError(showValidation && !value.mileage, getRequiredMessage(tx('Yürüşü, km')))}
      </div>

      <label className="flex h-[60px] items-center justify-between rounded-[18px] border border-[#E6EBF2] bg-white px-5">
        <span className="text-[16px] font-medium text-[#111827]">{tx('Yeni?')}</span>
        <span className="relative">
          <input
            type="checkbox"
            checked={value.isNew}
            onChange={(event) => updateField('isNew', event.target.checked)}
            className="peer sr-only"
          />
          <span className="flex h-7 w-12 items-center rounded-full bg-[#E5E7EB] px-1 transition-colors peer-checked:bg-[#5B5CFF]">
            <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </span>
        </span>
      </label>
    </div>
  );
};
