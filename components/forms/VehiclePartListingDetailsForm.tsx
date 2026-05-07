import React, { useMemo, useState } from 'react';
import { SelectionPanelField } from '@/components/ui/SelectionPanelField';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeListingText } from '@/lib/listingLocalization';
import type { VehiclePartListingDetails } from '@/lib/app-state';

const partCategoryOptions = [
  'Mühərrik hissələri',
  'Kuzov hissələri',
  'Elektrik hissələri',
  'Təkər və disklər',
  'Yağlar və mayelər',
  'Aksesuarlar',
  'Digər',
];

const compatibilityBrandOptions = [
  'Toyota',
  'Mercedes-Benz',
  'BMW',
  'Honda',
  'Yamaha',
  'Kawasaki',
  'Suzuki',
  'Hyundai',
  'Kia',
  'Digər',
];

const compatibilityModelsByBrand: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'Prado', 'Land Cruiser', 'Digər model'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'Vito', 'Digər model'],
  BMW: ['3 Series', '5 Series', 'X5', 'X6', 'Digər model'],
  Honda: ['CBR 600RR', 'CB 125F', 'PCX 125', 'Digər model'],
  Yamaha: ['R6', 'MT-07', 'NMAX 155', 'Digər model'],
  Kawasaki: ['Ninja 650', 'Z650', 'Versys 650', 'Digər model'],
  Suzuki: ['GSX-R600', 'V-Strom 650', 'Address 110', 'Digər model'],
  Hyundai: ['Elantra', 'Sonata', 'Santa Fe', 'Digər model'],
  Kia: ['Rio', 'Cerato', 'Sportage', 'Digər model'],
  Digər: ['Modeli əl ilə daxil edin'],
};

const conditionOptions = ['Yeni', 'İşlənmiş'];
const deliveryOptions = ['Çatdırılma var', 'Çatdırılma yoxdur'];

type FieldKey =
  | 'category'
  | 'compatibilityBrand'
  | 'compatibilityModel'
  | 'productName'
  | 'condition'
  | 'delivery';

interface VehiclePartListingDetailsFormProps {
  value: VehiclePartListingDetails;
  onChange: (value: VehiclePartListingDetails) => void;
  showValidation: boolean;
}

const labels: Record<FieldKey, string> = {
  category: 'Kateqoriya',
  compatibilityBrand: 'Marka uyğunluğu',
  compatibilityModel: 'Model uyğunluğu',
  productName: 'Məhsul adı',
  condition: 'Vəziyyət',
  delivery: 'Çatdırılma',
};

const sectionRows: FieldKey[][] = [
  ['category'],
  ['compatibilityBrand', 'compatibilityModel'],
  ['productName'],
  ['condition', 'delivery'],
];

const FieldShell = ({
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
    <label className="mb-2 block text-[14px] font-medium text-[#111827]">
      {label}
      <span className="ml-1 text-[#2563EB]">*</span>
    </label>
    {children}
    {invalid ? <p className="mt-2 text-[12px] font-medium text-[#DC2626]">{errorMessage}</p> : null}
  </div>
);

const SelectField = ({
  label,
  value,
  options,
  placeholder,
  invalid,
  isOpen,
  onOpenChange,
  onChange,
  getOptionLabel,
  errorMessage,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  invalid: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  getOptionLabel: (value: string) => string;
  errorMessage: string;
}) => (
  <div>
    <SelectionPanelField
      value={value}
      placeholder={placeholder}
      options={options}
      panelTitle={label}
      invalid={invalid}
      open={isOpen}
      onOpenChange={onOpenChange}
      onSelect={onChange}
      getOptionLabel={getOptionLabel}
    />
    {invalid ? <p className="mt-2 text-[12px] font-medium text-[#DC2626]">{errorMessage}</p> : null}
  </div>
);

const InputField = ({
  label,
  value,
  placeholder,
  active,
  invalid,
  onChange,
  onFocus,
  onBlur,
  errorMessage,
}: {
  label: string;
  value: string;
  placeholder: string;
  active: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  errorMessage: string;
}) => (
  <FieldShell label={label} errorMessage={errorMessage} active={active} invalid={invalid}>
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      className="h-[52px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[15px] text-[#111827] outline-none transition-all focus:border-[#2563EB] focus:bg-[#F8FBFF]"
    />
  </FieldShell>
);

export const createEmptyVehiclePartDetails = (): VehiclePartListingDetails => ({
  category: '',
  compatibilityBrand: '',
  compatibilityModel: '',
  productName: '',
  condition: '',
  delivery: '',
});

export const isVehiclePartDetailsComplete = (value: VehiclePartListingDetails | null): value is VehiclePartListingDetails =>
  Boolean(
    value &&
      value.category &&
      value.compatibilityBrand &&
      value.compatibilityModel &&
      value.productName &&
      value.condition &&
      value.delivery
  );

export const VehiclePartListingDetailsForm = ({
  value,
  onChange,
  showValidation,
}: VehiclePartListingDetailsFormProps) => {
  const { language } = useLanguage();
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const [openField, setOpenField] = useState<FieldKey | null>(null);
  const tx = (token: string) => localizeListingText(token, language);
  const getRequiredMessage = (label: string) =>
    language === 'ru' ? `Поле "${label}" обязательно.` : language === 'az' ? `${label} sahəsi mütləqdir.` : `${label} is required.`;
  const [manualModelMode, setManualModelMode] = useState(
    () => Boolean(value.compatibilityModel && !compatibilityModelsByBrand[value.compatibilityBrand]?.includes(value.compatibilityModel))
  );

  const modelOptions = useMemo(
    () => compatibilityModelsByBrand[value.compatibilityBrand] ?? ['Modeli əl ilə daxil edin'],
    [value.compatibilityBrand]
  );
  const completion = useMemo(() => {
    const keys: (keyof VehiclePartListingDetails)[] = [
      'category',
      'compatibilityBrand',
      'compatibilityModel',
      'productName',
      'condition',
      'delivery',
    ];
    const filled = keys.filter((key) => Boolean(value[key])).length;
    return Math.min(100, Math.round((filled / keys.length) * 100));
  }, [value]);

  const updateField = <Key extends keyof VehiclePartListingDetails>(field: Key, nextValue: VehiclePartListingDetails[Key]) => {
    onChange({
      ...value,
      [field]: nextValue,
    });
  };

  return (
    <section className="rounded-[24px] border border-[#DCE5F6] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="mb-5 flex items-start justify-between gap-3 rounded-[18px] border border-[#E5EAF5] bg-white px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]">{tx('Ehtiyat hissələri sistemi')}</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#111827]">{tx('Uyğunluq və məhsul detalları')}</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
            {tx('Bölmə, uyğun marka-model və çatdırılma məlumatı marketplace səviyyəsində toplanır.')}
          </p>
        </div>
        <div className="shrink-0 rounded-[16px] bg-[#F3F7FF] px-3 py-2 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">{tx('Hazırlıq')}</div>
          <div className="mt-1 text-[20px] font-semibold text-[#111827]">{completion}%</div>
        </div>
      </div>

      <div className="space-y-3">
        {sectionRows.map((row, index) => (
          <div key={index} className={`grid gap-3 ${row.length === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            {row.map((fieldKey) => {
              if (fieldKey === 'category') {
                return (
                  <SelectField
                    key={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.category}
                    options={partCategoryOptions}
                    placeholder={tx('Kateqoriyanı seçin')}
                    invalid={showValidation && !value.category}
                    isOpen={openField === fieldKey}
                    onOpenChange={(open) => setOpenField(open ? fieldKey : null)}
                    getOptionLabel={tx}
                    errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                    onChange={(nextValue) => {
                      updateField('category', nextValue);
                      setOpenField(null);
                    }}
                  />
                );
              }

              if (fieldKey === 'compatibilityBrand') {
                return (
                  <SelectField
                    key={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.compatibilityBrand}
                    options={compatibilityBrandOptions}
                    placeholder={tx('Marka seçin')}
                    invalid={showValidation && !value.compatibilityBrand}
                    isOpen={openField === fieldKey}
                    onOpenChange={(open) => setOpenField(open ? fieldKey : null)}
                    getOptionLabel={tx}
                    errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                    onChange={(nextValue) => {
                      updateField('compatibilityBrand', nextValue);
                      updateField('compatibilityModel', '');
                      setManualModelMode(nextValue === 'Digər');
                      setOpenField(null);
                    }}
                  />
                );
              }

              if (fieldKey === 'compatibilityModel') {
                if (manualModelMode || value.compatibilityBrand === 'Digər') {
                  return (
                    <InputField
                      key={fieldKey}
                      label={tx(labels[fieldKey])}
                      value={value.compatibilityModel}
                      placeholder={tx('Modeli yazın')}
                      active={activeField === fieldKey || Boolean(value.compatibilityModel)}
                      invalid={showValidation && !value.compatibilityModel}
                      onChange={(nextValue) => updateField('compatibilityModel', nextValue)}
                      onFocus={() => setActiveField(fieldKey)}
                      onBlur={() => setActiveField(null)}
                      errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                    />
                  );
                }

                return (
                  <div key={fieldKey} className="space-y-2">
                    <SelectField
                      label={tx(labels[fieldKey])}
                      value={value.compatibilityModel}
                      options={modelOptions}
                      placeholder={tx('Model')}
                      invalid={showValidation && !value.compatibilityModel}
                      isOpen={openField === fieldKey}
                      onOpenChange={(open) => setOpenField(open ? fieldKey : null)}
                      getOptionLabel={tx}
                      errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                      onChange={(nextValue) => {
                        if (nextValue === 'Digər model' || nextValue === 'Modeli əl ilə daxil edin') {
                          updateField('compatibilityModel', '');
                          setManualModelMode(true);
                          setOpenField(null);
                          return;
                        }

                        updateField('compatibilityModel', nextValue);
                        setOpenField(null);
                      }}
                    />
                    {!manualModelMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManualModelMode(true);
                          updateField('compatibilityModel', '');
                          setOpenField(null);
                        }}
                        className="text-[13px] font-medium text-[#2563EB]"
                      >
                        {tx('Modeli əl ilə daxil et')}
                      </button>
                    ) : null}
                  </div>
                );
              }

              if (fieldKey === 'productName') {
                return (
                  <InputField
                    key={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.productName}
                    placeholder={tx('Məhsul adını yazın')}
                    active={activeField === fieldKey || Boolean(value.productName)}
                    invalid={showValidation && !value.productName}
                    onChange={(nextValue) => updateField('productName', nextValue)}
                    onFocus={() => setActiveField(fieldKey)}
                    onBlur={() => setActiveField(null)}
                    errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                  />
                );
              }

              if (fieldKey === 'condition') {
                return (
                  <SelectField
                    key={fieldKey}
                    label={tx(labels[fieldKey])}
                    value={value.condition}
                    options={conditionOptions}
                    placeholder={tx('Vəziyyəti seçin')}
                    invalid={showValidation && !value.condition}
                    isOpen={openField === fieldKey}
                    onOpenChange={(open) => setOpenField(open ? fieldKey : null)}
                    getOptionLabel={tx}
                    errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                    onChange={(nextValue) => {
                      updateField('condition', nextValue);
                      setOpenField(null);
                    }}
                  />
                );
              }

              return (
                <SelectField
                  key={fieldKey}
                  label={tx(labels[fieldKey])}
                  value={value.delivery}
                  options={deliveryOptions}
                  placeholder={tx('Çatdırılma seçin')}
                  invalid={showValidation && !value.delivery}
                  isOpen={openField === fieldKey}
                  onOpenChange={(open) => setOpenField(open ? fieldKey : null)}
                  getOptionLabel={tx}
                  errorMessage={getRequiredMessage(tx(labels[fieldKey]))}
                  onChange={(nextValue) => {
                    updateField('delivery', nextValue);
                    setOpenField(null);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};
