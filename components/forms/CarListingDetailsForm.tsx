import React, { useState } from 'react';
import { SelectionPanelField } from '@/components/ui/SelectionPanelField';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeListingText } from '@/lib/listingLocalization';
import type { CarListingDetails } from '@/lib/app-state';

const brandOptions = [
  'Toyota',
  'Mercedes-Benz',
  'BMW',
  'Hyundai',
  'Kia',
  'Lexus',
  'Chevrolet',
  'Nissan',
  'Volkswagen',
  'Ford',
  'Honda',
  'Audi',
  'Land Rover',
  'Porsche',
  'Mitsubishi',
  'Opel',
];

const colorOptions = [
  'Ağ',
  'Qara',
  'Boz',
  'Gümüşü',
  'Göy',
  'Qırmızı',
  'Yaşıl',
  'Bej',
  'Qəhvəyi',
  'Narıncı',
];

const fuelOptions = ['Benzin', 'Dizel', 'Hibrid', 'Plug-in Hibrid', 'Elektrik', 'Qaz'];

const transmissionOptions = ['Avtomat', 'Mexaniki', 'Robotlaşdırılmış', 'Variator'];

const bodyTypeOptions = ['Sedan', 'SUV', 'Hetçbek', 'Liftbek', 'Universal', 'Kupe', 'Kabriolet', 'Pikap', 'Van', 'Miniven'];

type CarFieldKey =
  | 'brand'
  | 'color'
  | 'engineVolume'
  | 'fuelType'
  | 'transmission'
  | 'bodyType'
  | 'year';

interface CarListingDetailsFormProps {
  value: CarListingDetails;
  onChange: (value: CarListingDetails) => void;
  showValidation: boolean;
}

const labels: Record<CarFieldKey, string> = {
  brand: 'Marka',
  color: 'Rəng',
  engineVolume: 'Mühərrik (sm³)',
  fuelType: 'Yanacaq növü',
  transmission: 'Sürətlər qutusu',
  bodyType: 'Kuzov növü',
  year: 'Buraxılış ili',
};

const sectionRows: CarFieldKey[][] = [
  ['brand'],
  ['color', 'engineVolume'],
  ['fuelType', 'transmission'],
  ['bodyType', 'year'],
];

const FieldLabel = ({ label }: { label: string }) => (
  <label className="mb-2 block text-[14px] font-medium text-[#111827]">
    {label}
    <span className="ml-1 text-[#2563EB]">*</span>
  </label>
);

const FieldError = ({ show, message }: { show: boolean; message: string }) =>
  show ? <p className="mt-2 text-[12px] font-medium text-[#DC2626]">{message}</p> : null;

const FieldCard = ({
  label,
  errorMessage,
  active,
  invalid,
  children,
}: {
  label: string;
  errorMessage: string;
  active: boolean;
  invalid: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`rounded-[18px] border bg-white p-4 transition-all ${
      invalid
        ? 'border-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.08)]'
        : active
          ? 'border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]'
          : 'border-[#E5E7EB]'
    }`}
  >
    <FieldLabel label={label} />
    {children}
    <FieldError show={invalid} message={errorMessage} />
  </div>
);

const SelectField = ({
  fieldKey,
  label,
  value,
  options,
  placeholder,
  onChange,
  showValidation,
  tx,
  getRequiredMessage,
  selectBrandLabel,
  searchBrandLabel,
}: {
  fieldKey: CarFieldKey;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  showValidation: boolean;
  tx: (value: string) => string;
  getRequiredMessage: (label: string) => string;
  selectBrandLabel: string;
  searchBrandLabel: string;
}) => (
  <FieldCard label={label} errorMessage={getRequiredMessage(label)} active={Boolean(value)} invalid={showValidation && !value}>
    <SelectionPanelField
      value={value}
      placeholder={placeholder}
      options={options}
      panelTitle={label}
      modalTitle={label}
      contentLabel={fieldKey === 'brand' ? selectBrandLabel : label}
      showSearch={fieldKey === 'brand'}
      searchPlaceholder={fieldKey === 'brand' ? searchBrandLabel : undefined}
      variant="plain"
      triggerClassName="h-[52px]"
      required={false}
      onSelect={onChange}
      getOptionLabel={tx}
    />
  </FieldCard>
);

const InputField = ({
  fieldKey,
  label,
  value,
  placeholder,
  suffix,
  activeField,
  setActiveField,
  onChange,
  showValidation,
  maxLength,
  errorMessage,
}: {
  fieldKey: CarFieldKey;
  label: string;
  value: string;
  placeholder: string;
  suffix?: string;
  activeField: CarFieldKey | null;
  setActiveField: (value: CarFieldKey | null) => void;
  onChange: (value: string) => void;
  showValidation: boolean;
  maxLength?: number;
  errorMessage: string;
}) => (
  <FieldCard label={label} errorMessage={errorMessage} active={activeField === fieldKey || Boolean(value)} invalid={showValidation && !value}>
    <div className="relative">
      <input
        value={value}
        inputMode="numeric"
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
        onFocus={() => setActiveField(fieldKey)}
        onBlur={() => setActiveField(null)}
        className="h-[52px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 pr-14 text-[15px] text-[#111827] outline-none transition-all focus:border-[#2563EB] focus:bg-[#F8FBFF]"
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
          {suffix}
        </span>
      ) : null}
    </div>
  </FieldCard>
);

export const createEmptyCarDetails = (): CarListingDetails => ({
  category: 'Avtomobillər',
  brand: '',
  color: '',
  engineVolume: '',
  fuelType: '',
  transmission: '',
  bodyType: '',
  year: '',
});

export const isCarDetailsComplete = (value: CarListingDetails | null): value is CarListingDetails =>
  Boolean(
    value &&
      value.category &&
      value.brand &&
      value.color &&
      value.engineVolume &&
      value.fuelType &&
      value.transmission &&
      value.bodyType &&
      value.year
  );

export const CarListingDetailsForm = ({ value, onChange, showValidation }: CarListingDetailsFormProps) => {
  const { language, t } = useLanguage();
  const [activeField, setActiveField] = useState<CarFieldKey | null>(null);
  const tx = (token: string) => localizeListingText(token, language);
  const getRequiredMessage = (label: string) =>
    language === 'ru' ? `Поле "${label}" обязательно.` : language === 'az' ? `${label} sahəsi mütləqdir.` : `${label} is required.`;

  const updateField = <Key extends keyof CarListingDetails>(field: Key, nextValue: CarListingDetails[Key]) => {
    onChange({
      ...value,
      [field]: nextValue,
    });
  };

  return (
    <section className="rounded-[24px] border border-[#DCE5F6] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="space-y-3">
        {sectionRows.map((row, index) => (
          <div key={index} className={`grid gap-3 ${row.length === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            {row.map((fieldKey) => {
              if (fieldKey === 'brand') {
                return (
                  <SelectField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.brand}
                    options={brandOptions}
                    placeholder={t('select_brand')}
                    onChange={(nextValue) => updateField('brand', nextValue)}
                    showValidation={showValidation}
                    tx={tx}
                    getRequiredMessage={getRequiredMessage}
                    selectBrandLabel={t('select_brand')}
                    searchBrandLabel={t('search_brand')}
                  />
                );
              }

              if (fieldKey === 'color') {
                return (
                  <SelectField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.color}
                    options={colorOptions}
                    placeholder={tx('Rəng seçin')}
                    onChange={(nextValue) => updateField('color', nextValue)}
                    showValidation={showValidation}
                    tx={tx}
                    getRequiredMessage={getRequiredMessage}
                    selectBrandLabel={t('select_brand')}
                    searchBrandLabel={t('search_brand')}
                  />
                );
              }

              if (fieldKey === 'fuelType') {
                return (
                  <SelectField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.fuelType}
                    options={fuelOptions}
                    placeholder={tx('Yanacaq növünü seçin')}
                    onChange={(nextValue) => updateField('fuelType', nextValue)}
                    showValidation={showValidation}
                    tx={tx}
                    getRequiredMessage={getRequiredMessage}
                    selectBrandLabel={t('select_brand')}
                    searchBrandLabel={t('search_brand')}
                  />
                );
              }

              if (fieldKey === 'transmission') {
                return (
                  <SelectField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.transmission}
                    options={transmissionOptions}
                    placeholder={tx('Sürətlər qutusunu seçin')}
                    onChange={(nextValue) => updateField('transmission', nextValue)}
                    showValidation={showValidation}
                    tx={tx}
                    getRequiredMessage={getRequiredMessage}
                    selectBrandLabel={t('select_brand')}
                    searchBrandLabel={t('search_brand')}
                  />
                );
              }

              if (fieldKey === 'bodyType') {
                return (
                  <SelectField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.bodyType}
                    options={bodyTypeOptions}
                    placeholder={tx('Kuzov növünü seçin')}
                    onChange={(nextValue) => updateField('bodyType', nextValue)}
                    showValidation={showValidation}
                    tx={tx}
                    getRequiredMessage={getRequiredMessage}
                    selectBrandLabel={t('select_brand')}
                    searchBrandLabel={t('search_brand')}
                  />
                );
              }

              if (fieldKey === 'engineVolume') {
                return (
                  <InputField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.engineVolume}
                    placeholder={tx('Məsələn, 1998')}
                    suffix="sm³"
                    activeField={activeField}
                    setActiveField={setActiveField}
                    onChange={(nextValue) => updateField('engineVolume', nextValue)}
                    showValidation={showValidation}
                    maxLength={5}
                    errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                  />
                );
              }

              return (
                <InputField
                  key={fieldKey}
                  fieldKey={fieldKey}
                  label={tx(labels[fieldKey])}
                  value={value.year}
                  placeholder={tx('Məsələn, 2020')}
                  activeField={activeField}
                  setActiveField={setActiveField}
                  onChange={(nextValue) => updateField('year', nextValue)}
                  showValidation={showValidation}
                  maxLength={4}
                  errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};
