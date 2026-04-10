import React, { useEffect, useRef, useState } from 'react';
import { createEmptyCarDetails } from '@/components/forms/CarListingDetailsForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectionPanelField } from '@/components/ui/SelectionPanelField';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronDown, ChevronRight, X, Smartphone, Car, Building, Camera } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CarListingDetails, ListingDraft } from '@/lib/app-state';
import { AZERBAIJAN_CITY_OPTIONS, localizeCityCode, localizeDomText, localizeListingPath, localizeListingSegments, localizeListingText } from '@/lib/listingLocalization';

interface CreateListingScreenProps {
  onNavigate: (screen: string) => void;
  draftListing?: ListingDraft;
  onSaveDraft?: (draftListing: ListingDraft) => void;
  sharePlatformOptions: string[];
}

const storageOptions = ['8 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'];
const ramOptions = ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '32 GB', '64 GB'];

const categoryData: any = {
  'Elektronika': {
    'Telefonlar və aksesuarlar': {
      'Smartfonlar': {
        'Apple': [
          'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 15 Plus',
          'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 14 Plus',
          'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
          'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
          'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
          'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
          'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
          'iPhone SE (2022)', 'iPhone SE (2020)', 'Digər model'
        ],
        'Samsung': [
          'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
          'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
          'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
          'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21',
          'Galaxy A73', 'Galaxy A72', 'Galaxy A71',
          'Galaxy A54', 'Galaxy A53', 'Galaxy A52', 'Galaxy A51',
          'Galaxy A34', 'Galaxy A33', 'Galaxy A32', 'Galaxy A31',
          'Galaxy Z Fold', 'Galaxy Z Flip',
          'Galaxy Note 20', 'Galaxy Note 10', 'Digər model'
        ],
        'Xiaomi': [
          'Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Xiaomi 13',
          'Xiaomi 12 Pro', 'Xiaomi 12', 'Mi 11', 'Mi 10',
          'Xiaomi Poco F5', 'Xiaomi Poco F4', 'Xiaomi Poco F3', 'Digər model'
        ],
        'Redmi': [
          'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro', 'Redmi Note 12',
          'Redmi Note 11 Pro', 'Redmi Note 11', 'Redmi Note 10 Pro', 'Redmi Note 10',
          'Redmi 13', 'Redmi 12', 'Redmi 11', 'Redmi 10', 'Digər model'
        ],
        'Huawei': [
          'Huawei P60 Pro', 'Huawei P50 Pro', 'Huawei P40 Pro', 'Huawei P30 Pro',
          'Huawei Mate 50', 'Huawei Mate 40', 'Huawei Mate 30',
          'Huawei Nova 11', 'Huawei Nova 10', 'Huawei Nova 9', 'Huawei Nova 8', 'Digər model'
        ],
        'Honor': [
          'Honor Magic 6', 'Honor Magic 5', 'Honor Magic 4',
          'Honor 90', 'Honor 80', 'Honor 70',
          'Honor X9', 'Honor X8', 'Honor X7', 'Digər model'
        ],
        'Oppo': [
          'Oppo Find X7', 'Oppo Find X6', 'Oppo Find X5',
          'Oppo Reno 10', 'Oppo Reno 9', 'Oppo Reno 8',
          'Oppo A78', 'Oppo A77', 'Oppo A76', 'Digər model'
        ],
        'Realme': [
          'Realme GT 5', 'Realme GT 3', 'Realme GT Neo',
          'Realme 11 Pro', 'Realme 10 Pro', 'Realme 9 Pro',
          'Realme C55', 'Realme C53', 'Realme C51', 'Digər model'
        ],
        'Vivo': [
          'Vivo X100', 'Vivo X90', 'Vivo X80',
          'Vivo V29', 'Vivo V27', 'Vivo V25',
          'Vivo Y36', 'Vivo Y35', 'Vivo Y33', 'Digər model'
        ],
        'OnePlus': [
          'OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro',
          'OnePlus 9 Pro', 'OnePlus 9',
          'OnePlus Nord 3', 'OnePlus Nord 2', 'Digər model'
        ],
        'Google Pixel': [
          'Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7',
          'Pixel 6 Pro', 'Pixel 6', 'Pixel 5', 'Digər model'
        ],
        'Sony': [
          'Sony Xperia 1 V', 'Sony Xperia 1 IV',
          'Sony Xperia 5 V', 'Sony Xperia 5 IV',
          'Sony Xperia 10', 'Digər model'
        ],
        'Nokia': [
          'Nokia G60', 'Nokia G50', 'Nokia G21',
          'Nokia X30', 'Nokia X20',
          'Nokia C32', 'Nokia C21', 'Digər model'
        ],
        'Motorola': [
          'Motorola Edge 40', 'Motorola Edge 30',
          'Moto G73', 'Moto G72', 'Moto G71',
          'Moto E40', 'Moto E32', 'Digər model'
        ],
        'Asus': [
          'Asus ROG Phone 8', 'Asus ROG Phone 7', 'Asus ROG Phone 6',
          'Asus Zenfone 11', 'Asus Zenfone 10', 'Digər model'
        ],
        'Digər marka': []
      },
      'Düyməli telefonlar': {
        'Nokia': ['3310', '105', '110', '150', 'Digər model'],
        'Samsung': ['B310E', 'E1200', 'Digər model'],
        'Alcatel': ['1066D', '2019G', 'Digər model'],
        'Panasonic': ['KX-TU150', 'Digər model'],
        'Digər marka': []
      },
      'Smart saatlar və qolbaqlar': {
        'Apple': ['Watch Ultra 2', 'Watch Ultra', 'Watch Series 9', 'Watch Series 8', 'Watch SE', 'Digər model'],
        'Samsung': ['Galaxy Watch6 Classic', 'Galaxy Watch6', 'Galaxy Watch5 Pro', 'Galaxy Watch5', 'Digər model'],
        'Xiaomi': ['Watch S3', 'Watch 2 Pro', 'Smart Band 8', 'Smart Band 7', 'Digər model'],
        'Huawei': ['Watch GT 4', 'Watch 4 Pro', 'Watch Ultimate', 'Band 8', 'Digər model'],
        'Garmin': ['Fenix 7', 'Epix Gen 2', 'Forerunner 965', 'Digər model'],
        'Digər marka': []
      },
      'Qulaqlıqlar': {
        'Apple': ['AirPods Pro 2', 'AirPods 3', 'AirPods 2', 'AirPods Max', 'Digər model'],
        'Samsung': ['Galaxy Buds2 Pro', 'Galaxy Buds2', 'Galaxy Buds FE', 'Galaxy Buds Live', 'Digər model'],
        'Xiaomi': ['Redmi Buds 4 Pro', 'Redmi Buds 4 Active', 'Xiaomi Buds 4 Pro', 'Digər model'],
        'JBL': ['Tune 510BT', 'Wave Buds', 'Live Pro 2', 'Digər model'],
        'Sony': ['WH-1000XM5', 'WF-1000XM5', 'WH-CH720N', 'Digər model'],
        'Marshall': ['Major IV', 'Minor III', 'Motif II', 'Digər model'],
        'Digər marka': []
      },
      'Telefon aksesuarları': ['Qablar və qoruyucular', 'Şarj cihazları və kabellər', 'Powerbank', 'Digər aksesuar'],
    },
    'Planşetlər': {
      'Apple': ['iPad Pro', 'iPad Air', 'iPad mini', 'iPad', 'Digər model'],
      'Samsung': ['Galaxy Tab S9', 'Galaxy Tab S8', 'Galaxy Tab A8', 'Galaxy Tab A7', 'Digər model'],
      'Lenovo': ['Tab P12', 'Tab P11', 'Tab M10', 'Tab M9', 'Digər model'],
      'Huawei': ['MatePad Pro', 'MatePad 11', 'MatePad SE', 'Digər model'],
      'Xiaomi': ['Pad 6', 'Pad 5', 'Redmi Pad', 'Digər model'],
    },
    'Noutbuklar': {
      'Apple': ['MacBook Air', 'MacBook Pro', 'Digər model'],
      'HP': ['Pavilion', 'Envy', 'Spectre', 'Omen', 'Victus', 'Digər model'],
      'Dell': ['XPS', 'Inspiron', 'Latitude', 'Alienware', 'Digər model'],
      'Lenovo': ['ThinkPad', 'IdeaPad', 'Legion', 'Yoga', 'Digər model'],
      'Asus': ['ZenBook', 'VivoBook', 'ROG', 'TUF', 'Digər model'],
      'Acer': ['Swift', 'Aspire', 'Predator', 'Nitro', 'Digər model'],
      'MSI': ['Katana', 'Stealth', 'Raider', 'Titan', 'Digər model'],
      'Huawei': ['MateBook X', 'MateBook D', 'MateBook 14', 'Digər model'],
      'Samsung': ['Galaxy Book3', 'Galaxy Book2', 'Galaxy Book Pro', 'Digər model'],
    },
    'Televizorlar': {
      'Samsung': ['QLED', 'OLED', 'Crystal UHD', 'Neo QLED', 'The Frame', 'Digər model'],
      'LG': ['OLED', 'QNED', 'NanoCell', 'UHD', 'Digər model'],
      'Sony': ['Bravia XR', 'Bravia OLED', 'Bravia LED', 'Digər model'],
      'TCL': ['Mini LED', 'QLED', 'UHD', 'Digər model'],
      'Xiaomi': ['Mi TV Q1', 'Mi TV P1', 'Mi TV A2', 'Digər model'],
      'Hisense': ['ULED', 'QLED', 'UHD', 'Digər model'],
      'Philips': ['OLED+', 'The One', 'Ambilight', 'Digər model'],
      'Toshiba': ['OLED', 'QLED', 'UHD', 'Digər model'],
      'Hoffmann': ['Smart TV', 'UHD', 'Digər model'],
    },
    'Audio sistemlər və dinamiklər': {
      'JBL': ['Charge 5', 'Flip 6', 'Boombox 3', 'Xtreme 3', 'Digər model'],
      'Sony': ['SRS-XB43', 'SRS-XG500', 'HT-A7000', 'Digər model'],
      'Bose': ['SoundLink Revolve+', 'QuietComfort Earbuds II', 'Smart Soundbar 900', 'Digər model'],
      'Marshall': ['Stanmore II', 'Emberton', 'Kilburn II', 'Digər model'],
      'LG': ['XBOOM Go', 'Soundbar S95QR', 'Digər model'],
      'Samsung': ['Sound Tower', 'HW-Q990C', 'Digər model'],
      'Xiaomi': ['Mi Smart Speaker', 'Redmi Buds 4 Pro', 'Digər model'],
      'Huawei': ['Sound Joy', 'FreeBuds Pro 2', 'Digər model'],
      'Beats': ['Studio Buds', 'Fit Pro', 'Pill+', 'Digər model'],
    },
    'Oyun konsolları və oyun aksesuarları': {
      'Sony': {
        'Controller': ['DualSense', 'DualShock 4', 'Digər model'],
        'Headset': ['Pulse 3D', 'Digər model'],
        'VR accessory': ['PS VR2 Sense', 'Digər model'],
        'Charging dock': ['DualSense Charging Station', 'Digər model'],
      },
      'Microsoft': {
        'Controller': ['Xbox Wireless Controller', 'Xbox Elite Series 2', 'Digər model'],
        'Headset': ['Xbox Wireless Headset', 'Digər model'],
      },
      'Nintendo': {
        'Controller': ['Joy-Con', 'Pro Controller', 'Digər model'],
      },
      'Logitech': {
        'Racing wheel': ['G923', 'G29', 'G920', 'Digər model'],
        'Mouse': ['G Pro X Superlight', 'G502', 'Digər model'],
        'Keyboard': ['G915', 'G Pro X', 'Digər model'],
        'Headset': ['G Pro X', 'G733', 'Digər model'],
      },
      'Razer': {
        'Mouse': ['DeathAdder V3 Pro', 'Viper V2 Pro', 'Digər model'],
        'Keyboard': ['Huntsman V2', 'BlackWidow V3', 'Digər model'],
        'Headset': ['BlackShark V2', 'Kraken V3', 'Digər model'],
      },
      'SteelSeries': {
        'Headset': ['Arctis Nova Pro', 'Arctis 7', 'Digər model'],
        'Mouse': ['Aerox 3', 'Prime', 'Digər model'],
        'Keyboard': ['Apex Pro', 'Apex 7', 'Digər model'],
      },
      'HyperX': {
        'Headset': ['Cloud II', 'Cloud Alpha', 'Digər model'],
        'Keyboard': ['Alloy Origins', 'Digər model'],
        'Mouse': ['Pulsefire Dart', 'Digər model'],
      },
      'ASUS': {
        'Mouse': ['ROG Gladius III', 'ROG Chakram', 'Digər model'],
        'Keyboard': ['ROG Strix Scope', 'ROG Claymore II', 'Digər model'],
        'Headset': ['ROG Delta S', 'ROG Cetra', 'Digər model'],
      },
      'MSI': {
        'Mouse': ['Clutch GM41', 'Digər model'],
        'Keyboard': ['Vigor GK71', 'Digər model'],
        'Headset': ['Immerse GH50', 'Digər model'],
      },
    },
    'Fotoaparatlar və videokameralar': {
      'Canon': ['EOS R5', 'EOS R6', 'EOS 5D Mark IV', 'EOS 90D', 'Digər model'],
      'Nikon': ['Z9', 'Z7 II', 'Z6 II', 'D850', 'D780', 'Digər model'],
      'Sony': ['A7 IV', 'A7S III', 'A7R V', 'FX3', 'A6700', 'Digər model'],
      'Panasonic': ['Lumix GH6', 'Lumix S5 II', 'Lumix G9', 'Digər model'],
      'Fujifilm': ['X-T5', 'X-H2S', 'X100V', 'GFX 100S', 'Digər model'],
      'GoPro': ['Hero 12 Black', 'Hero 11 Black', 'Hero 10 Black', 'Max', 'Digər model'],
      'DJI': ['Osmo Action 4', 'Osmo Pocket 3', 'Ronin 4D', 'Digər model'],
      'Insta360': ['X3', 'One RS', 'Go 3', 'Digər model'],
      'Blackmagic': ['Pocket Cinema Camera 4K', 'Pocket Cinema Camera 6K', 'URSA Mini Pro', 'Digər model'],
    }
  },
  'Daşınmaz əmlak': {
    'Mənzillər': {
      'Satılır': null,
      'Kirayə (uzunmüddətli)': null
    },
    'Villalar, bağ evləri': {
      'Satılır': null,
      'Kirayə (uzunmüddətli)': null
    },
    'Torpaq': {
      'Satılır': null,
      'Kirayə': null
    },
    'Obyektlər və ofislər': {
      'Satılır': null,
      'Kirayə': null
    },
    'Qarajlar': {
      'Satılır': null,
      'Kirayə': null
    },
  },
  'Nəqliyyat': {
    'Avtomobillər': null,
  },
};



const categoryIcons: Record<string, React.ReactNode> = {
  'Elektronika': <Smartphone size={24} />,
  'Daşınmaz əmlak': <Building size={24} />,
  'Nəqliyyat': <Car size={24} />,
};

export const CreateListingScreen = ({ onNavigate, draftListing, onSaveDraft, sharePlatformOptions }: CreateListingScreenProps) => {
  const { t, language } = useLanguage();
  const tx = (value: string) => localizeListingText(value, language);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [category, setCategory] = useState(draftListing?.category ?? '');
  const [price, setPrice] = useState(draftListing?.price ?? '');
  const [city, setCity] = useState(draftListing?.city ?? '');
  const [description, setDescription] = useState(draftListing?.description ?? '');
  const [platforms, setPlatforms] = useState<string[]>(
    draftListing?.platforms && draftListing.platforms.length > 0
      ? draftListing.platforms.filter((platform) => sharePlatformOptions.includes(platform))
      : ['Tap.az']
  );
  const [carDetails, setCarDetails] = useState<CarListingDetails>(draftListing?.carDetails ?? createEmptyCarDetails());
  const [showCarValidation, setShowCarValidation] = useState(false);
  const [isCarBrandSelectorOpen, setIsCarBrandSelectorOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [categoryPath, setCategoryPath] = useState<string[]>(['Elektronika']);
  const localizedCategoryPath = localizeListingSegments(categoryPath, language);
  const [isCustomBrandMode, setIsCustomBrandMode] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [isCustomModelMode, setIsCustomModelMode] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [isStorageMode, setIsStorageMode] = useState(false);
  const [selectedStorageLocal, setSelectedStorageLocal] = useState('');
  const [isRamSelectorOpen, setIsRamSelectorOpen] = useState(false);
  const [selectedRamLocal, setSelectedRamLocal] = useState('');
  const [isDeliverySelectorOpen, setIsDeliverySelectorOpen] = useState(false);
  const [selectedDeliveryLocal, setSelectedDeliveryLocal] = useState('');
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);
  const [selectedColorLocal, setSelectedColorLocal] = useState('');
  const [isConditionSelectorOpen, setIsConditionSelectorOpen] = useState(false);
  const [selectedConditionLocal, setSelectedConditionLocal] = useState('');
  const [isRefrigeratorTypeSelectorOpen, setIsRefrigeratorTypeSelectorOpen] = useState(false);
  const [selectedRefrigeratorTypeLocal, setSelectedRefrigeratorTypeLocal] = useState('');
  const [isCapacitySelectorOpen, setIsCapacitySelectorOpen] = useState(false);
  const [selectedCapacityLocal, setSelectedCapacityLocal] = useState('');
  const [isEnergyClassSelectorOpen, setIsEnergyClassSelectorOpen] = useState(false);
  const [isNoFrostSelectorOpen, setIsNoFrostSelectorOpen] = useState(false);
  const [selectedNoFrostLocal, setSelectedNoFrostLocal] = useState('');
  const [selectedEnergyClassLocal, setSelectedEnergyClassLocal] = useState('');
  
  // Washing Machine
  const [isWashingMachineTypeSelectorOpen, setIsWashingMachineTypeSelectorOpen] = useState(false);
  const [selectedWashingMachineTypeLocal, setSelectedWashingMachineTypeLocal] = useState('');
  const [isWashingMachineCapacitySelectorOpen, setIsWashingMachineCapacitySelectorOpen] = useState(false);
  const [selectedWashingMachineCapacityLocal, setSelectedWashingMachineCapacityLocal] = useState('');
  const [isSpinSpeedSelectorOpen, setIsSpinSpeedSelectorOpen] = useState(false);
  const [selectedSpinSpeedLocal, setSelectedSpinSpeedLocal] = useState('');

  // Dishwasher
  const [isDishwasherTypeSelectorOpen, setIsDishwasherTypeSelectorOpen] = useState(false);
  const [selectedDishwasherTypeLocal, setSelectedDishwasherTypeLocal] = useState('');
  const [isDishwasherCapacitySelectorOpen, setIsDishwasherCapacitySelectorOpen] = useState(false);
  const [selectedDishwasherCapacityLocal, setSelectedDishwasherCapacityLocal] = useState('');

  // Air Conditioner
  const [isAcTypeSelectorOpen, setIsAcTypeSelectorOpen] = useState(false);
  const [selectedAcTypeLocal, setSelectedAcTypeLocal] = useState('');
  const [isBtuSelectorOpen, setIsBtuSelectorOpen] = useState(false);
  const [selectedBtuLocal, setSelectedBtuLocal] = useState('');
  const [isAreaCoverageSelectorOpen, setIsAreaCoverageSelectorOpen] = useState(false);
  const [selectedAreaCoverageLocal, setSelectedAreaCoverageLocal] = useState('');

  // Vacuum Cleaner
  const [isVacuumTypeSelectorOpen, setIsVacuumTypeSelectorOpen] = useState(false);
  const [selectedVacuumTypeLocal, setSelectedVacuumTypeLocal] = useState('');
  const [isVacuumPowerSelectorOpen, setIsVacuumPowerSelectorOpen] = useState(false);
  const [selectedVacuumPowerLocal, setSelectedVacuumPowerLocal] = useState('');
  const [isBagTypeSelectorOpen, setIsBagTypeSelectorOpen] = useState(false);
  const [selectedBagTypeLocal, setSelectedBagTypeLocal] = useState('');

  // Microwave
  const [isMicrowaveTypeSelectorOpen, setIsMicrowaveTypeSelectorOpen] = useState(false);
  const [selectedMicrowaveTypeLocal, setSelectedMicrowaveTypeLocal] = useState('');
  const [isMicrowaveCapacitySelectorOpen, setIsMicrowaveCapacitySelectorOpen] = useState(false);
  const [selectedMicrowaveCapacityLocal, setSelectedMicrowaveCapacityLocal] = useState('');
  const [isMicrowavePowerSelectorOpen, setIsMicrowavePowerSelectorOpen] = useState(false);
  const [selectedMicrowavePowerLocal, setSelectedMicrowavePowerLocal] = useState('');

  // Small Kitchen Appliances
  const [isSmallApplianceTypeSelectorOpen, setIsSmallApplianceTypeSelectorOpen] = useState(false);
  const [selectedSmallApplianceTypeLocal, setSelectedSmallApplianceTypeLocal] = useState('');
  const [isSmallAppliancePowerSelectorOpen, setIsSmallAppliancePowerSelectorOpen] = useState(false);
  const [selectedSmallAppliancePowerLocal, setSelectedSmallAppliancePowerLocal] = useState('');

  const [isListingTypeSelectorOpen, setIsListingTypeSelectorOpen] = useState(false);
  const [selectedListingTypeLocal, setSelectedListingTypeLocal] = useState('');
  const [isLocationTypeSelectorOpen, setIsLocationTypeSelectorOpen] = useState(false);
  const [selectedLocationTypeLocal, setSelectedLocationTypeLocal] = useState('');
  const [isRoomCountSelectorOpen, setIsRoomCountSelectorOpen] = useState(false);
  const [selectedRoomCountLocal, setSelectedRoomCountLocal] = useState('');
  const [isAreaRangeSelectorOpen, setIsAreaRangeSelectorOpen] = useState(false);
  const [selectedAreaRangeLocal, setSelectedAreaRangeLocal] = useState('');
  const [isFloorRangeSelectorOpen, setIsFloorRangeSelectorOpen] = useState(false);
  const [selectedFloorRangeLocal, setSelectedFloorRangeLocal] = useState('');
  const [isTotalFloorsRangeSelectorOpen, setIsTotalFloorsRangeSelectorOpen] = useState(false);
  const [selectedTotalFloorsRangeLocal, setSelectedTotalFloorsRangeLocal] = useState('');
  const [isRepairStatusSelectorOpen, setIsRepairStatusSelectorOpen] = useState(false);
  const [selectedRepairStatusLocal, setSelectedRepairStatusLocal] = useState('');
  const [isApartmentFeaturesSelectorOpen, setIsApartmentFeaturesSelectorOpen] = useState(false);
  const [selectedApartmentFeaturesLocal, setSelectedApartmentFeaturesLocal] = useState('');
  const [isVillaAreaRangeSelectorOpen, setIsVillaAreaRangeSelectorOpen] = useState(false);
  const [selectedVillaAreaRangeLocal, setSelectedVillaAreaRangeLocal] = useState('');
  const [isLandAreaRangeSelectorOpen, setIsLandAreaRangeSelectorOpen] = useState(false);
  const [selectedLandAreaRangeLocal, setSelectedLandAreaRangeLocal] = useState('');
  const [isVillaRoomCountSelectorOpen, setIsVillaRoomCountSelectorOpen] = useState(false);
  const [selectedVillaRoomCountLocal, setSelectedVillaRoomCountLocal] = useState('');
  const [isVillaFeaturesSelectorOpen, setIsVillaFeaturesSelectorOpen] = useState(false);
  const [selectedVillaFeaturesLocal, setSelectedVillaFeaturesLocal] = useState('');
  const [isObjectAreaRangeSelectorOpen, setIsObjectAreaRangeSelectorOpen] = useState(false);
  const [selectedObjectAreaRangeLocal, setSelectedObjectAreaRangeLocal] = useState('');
  const [isPropertyTypeSelectorOpen, setIsPropertyTypeSelectorOpen] = useState(false);
  const [selectedPropertyTypeLocal, setSelectedPropertyTypeLocal] = useState('');
  const [isObjectFeaturesSelectorOpen, setIsObjectFeaturesSelectorOpen] = useState(false);
  const [selectedObjectFeaturesLocal, setSelectedObjectFeaturesLocal] = useState('');
  const [isLandOnlyAreaRangeSelectorOpen, setIsLandOnlyAreaRangeSelectorOpen] = useState(false);
  const [selectedLandOnlyAreaRangeLocal, setSelectedLandOnlyAreaRangeLocal] = useState('');
  const [isLandPurposeSelectorOpen, setIsLandPurposeSelectorOpen] = useState(false);
  const [selectedLandPurposeLocal, setSelectedLandPurposeLocal] = useState('');
  const [isDocumentsSelectorOpen, setIsDocumentsSelectorOpen] = useState(false);
  const [selectedDocumentsLocal, setSelectedDocumentsLocal] = useState('');
  const [isGarageAreaRangeSelectorOpen, setIsGarageAreaRangeSelectorOpen] = useState(false);
  const [selectedGarageAreaRangeLocal, setSelectedGarageAreaRangeLocal] = useState('');
  const [isGarageTypeSelectorOpen, setIsGarageTypeSelectorOpen] = useState(false);
  const [selectedGarageTypeLocal, setSelectedGarageTypeLocal] = useState('');
  const [isRealEstateConditionSelectorOpen, setIsRealEstateConditionSelectorOpen] = useState(false);
  const [selectedRealEstateConditionLocal, setSelectedRealEstateConditionLocal] = useState('');
  const [isOwnerInfoSelectorOpen, setIsOwnerInfoSelectorOpen] = useState(false);
  const [selectedOwnerInfoLocal, setSelectedOwnerInfoLocal] = useState('');
  const [isScreenSizeSelectorOpen, setIsScreenSizeSelectorOpen] = useState(false);
  const [selectedScreenSizeLocal, setSelectedScreenSizeLocal] = useState('');
  const [isResolutionSelectorOpen, setIsResolutionSelectorOpen] = useState(false);
  const [selectedResolutionLocal, setSelectedResolutionLocal] = useState('');
  const [isSmartTvSelectorOpen, setIsSmartTvSelectorOpen] = useState(false);
  const [selectedSmartTvLocal, setSelectedSmartTvLocal] = useState('');
  const [isAudioTypeSelectorOpen, setIsAudioTypeSelectorOpen] = useState(false);
  const [selectedAudioTypeLocal, setSelectedAudioTypeLocal] = useState('');
  const [isConnectionSelectorOpen, setIsConnectionSelectorOpen] = useState(false);
  const [selectedConnectionLocal, setSelectedConnectionLocal] = useState('');
  const [isPowerSelectorOpen, setIsPowerSelectorOpen] = useState(false);
  const [selectedPowerLocal, setSelectedPowerLocal] = useState('');
  const [isDeviceTypeSelectorOpen, setIsDeviceTypeSelectorOpen] = useState(false);
  const [selectedDeviceTypeLocal, setSelectedDeviceTypeLocal] = useState('');

  const persistDraft = () => {
    onSaveDraft?.({
      editingId: draftListing?.editingId ?? null,
      category,
      price,
      city,
      description,
      images: draftListing?.images ?? [],
      platforms,
      carDetails: category.includes('Avtomobillər') ? carDetails : null,
      motorcycleDetails: null,
      vehiclePartDetails: null,
    });
  };

  const handleNext = () => {
    if (category.includes('Avtomobillər') && !carDetails.brand) {
      setShowCarValidation(true);
      return;
    }

    persistDraft();
    onNavigate('imageUpload');
  };

  const currentLevelData = categoryPath.reduce((acc, key) => acc?.[key], categoryData);
  const parentLevelPath = categoryPath.length > 1 ? categoryPath.slice(0, -1) : categoryPath;
  const parentLevelData = parentLevelPath.reduce((acc, key) => acc?.[key], categoryData);
  const panelPath = currentLevelData === null ? parentLevelPath : categoryPath;
  const panelLevelData = currentLevelData === null ? parentLevelData : currentLevelData;
  const panelIsArray = Array.isArray(panelLevelData);
  const hasPanelOptions = panelLevelData && (panelIsArray ? panelLevelData.length > 0 : Object.keys(panelLevelData).length > 0);
  const isRootFallback = !hasPanelOptions && Boolean(categoryPath[0] && categoryData[categoryPath[0]]);
  const panelOptions = hasPanelOptions
    ? panelIsArray
      ? panelLevelData
      : Object.keys(panelLevelData)
    : categoryPath[0] && categoryData[categoryPath[0]]
      ? Object.keys(categoryData[categoryPath[0]])
      : [];
  const handleCategoryOptionClick = (option: string) => {
    const basePath = isRootFallback ? [categoryPath[0]] : panelPath;
    const hasChildren = !panelIsArray && panelLevelData?.[option] !== null;
    const nextPath = [...basePath, option];

    if (panelIsArray) {
      if (option === 'Digər model') {
        setIsCustomModelMode(true);
        return;
      }

      setCategoryPath(nextPath);

      if (isStorageDeviceFlow) {
        setIsStorageMode(true);
      } else if (isTvFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsScreenSizeSelectorOpen(true), 300);
      } else if (isAudioFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsAudioTypeSelectorOpen(true), 300);
      } else if (isGamingFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsConnectionSelectorOpen(true), 300);
      } else if (isCameraFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsDeviceTypeSelectorOpen(true), 300);
      } else if (isRefrigeratorFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsRefrigeratorTypeSelectorOpen(true), 300);
      } else if (isWashingMachineFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsWashingMachineCapacitySelectorOpen(true), 300);
      } else if (isDishwasherFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsDishwasherCapacitySelectorOpen(true), 300);
      } else if (isAcFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsBtuSelectorOpen(true), 300);
      } else if (isVacuumFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsVacuumTypeSelectorOpen(true), 300);
      } else if (isMicrowaveFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsMicrowaveCapacitySelectorOpen(true), 300);
      } else if (isSmallApplianceFlow) {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
        setTimeout(() => setIsSmallApplianceTypeSelectorOpen(true), 300);
      } else {
        setCategory(nextPath.join(' → '));
        setIsCategorySelectorOpen(false);
      }

      return;
    }

    if (option === 'Digər marka' || option === 'Digər') {
      setIsCustomBrandMode(true);
    } else if (hasChildren) {
      setCategoryPath(nextPath);
    } else {
      setCategory(nextPath.join(' → '));
      setIsCategorySelectorOpen(false);
      if (basePath.includes('Daşınmaz əmlak') || option === 'Daşınmaz əmlak') {
        setTimeout(() => setIsLocationTypeSelectorOpen(true), 300);
      }
    }
  };

  const handleOpenSelector = () => {
    setIsCategorySelectorOpen(true);
    setShowCarValidation(false);
    setCategoryPath(['Elektronika']);
    setIsCustomBrandMode(false);
    setCustomBrand('');
    setIsCustomModelMode(false);
    setCustomModel('');
    setIsStorageMode(false);
  };

  const handleBack = () => {
    if (isStorageMode) {
      setIsStorageMode(false);
      if (isCustomModelMode) {
        setIsCustomModelMode(true);
      } else {
        setCategoryPath(categoryPath.slice(0, -1));
      }
    } else if (isCustomModelMode) {
      if (isCustomBrandMode) {
        setIsCustomModelMode(false);
      } else {
        setIsCustomModelMode(false);
      }
    } else if (isCustomBrandMode) {
      setIsCustomBrandMode(false);
    } else if (categoryPath.length > 1) {
      setCategoryPath(categoryPath.slice(0, -1));
    }
  };

  const isSmartphoneFlow = categoryPath.includes('Smartfonlar');
  const isCarFlow = categoryPath.includes('Avtomobillər') || category.includes('Avtomobillər');
  const isTabletFlow = categoryPath.includes('Planşetlər');
  const isLaptopFlow = categoryPath.includes('Noutbuklar');
  const isTabletOrLaptopFlow = isTabletFlow || isLaptopFlow;
  const isStorageDeviceFlow = isSmartphoneFlow || isTabletOrLaptopFlow;
  const isTvFlow = categoryPath.includes('Televizorlar');
  const isAudioFlow = categoryPath.includes('Audio sistemlər və dinamiklər');
  const isGamingFlow = categoryPath.includes('Oyun konsolları və oyun aksesuarları') || category.includes('Oyun konsolları və oyun aksesuarları');
  const isCameraFlow = categoryPath.includes('Fotoaparatlar və videokameralar') || category.includes('Fotoaparatlar və videokameralar');
  const isWearableFlow = categoryPath.includes('Smart saatlar və qolbaqlar') || category.includes('Smart saatlar və qolbaqlar');
  const isHeadphoneFlow = categoryPath.includes('Qulaqlıqlar') || category.includes('Qulaqlıqlar');
  const isFeaturePhoneFlow = categoryPath.includes('Düyməli telefonlar') || category.includes('Düyməli telefonlar');
  const isRefrigeratorFlow = categoryPath.includes('Soyuducular') || category.includes('Soyuducular');
  const isWashingMachineFlow = categoryPath.includes('Paltaryuyan maşınlar') || category.includes('Paltaryuyan maşınlar');
  const isDishwasherFlow = categoryPath.includes('Qabyuyan maşınlar') || category.includes('Qabyuyan maşınlar');
  const isAcFlow = categoryPath.includes('Kondisionerlər') || category.includes('Kondisionerlər');
  const isVacuumFlow = categoryPath.includes('Tozsoranlar') || category.includes('Tozsoranlar');
  const isMicrowaveFlow = categoryPath.includes('Mikrodalğalı sobalar') || category.includes('Mikrodalğalı sobalar');
  const isSmallApplianceFlow = categoryPath.includes('Kiçik mətbəx texnikası') || category.includes('Kiçik mətbəx texnikası');
  
  

  

  
  const isApartmentFlow = categoryPath.includes('Mənzillər') || category.includes('Mənzillər');
  const isVillaFlow = categoryPath.includes('Villalar, bağ evləri') || category.includes('Villalar, bağ evləri');
  const isObjectFlow = categoryPath.includes('Obyektlər və ofislər') || category.includes('Obyektlər və ofislər');
  const isLandFlow = categoryPath.includes('Torpaq') || category.includes('Torpaq');
  const isGarageFlow = categoryPath.includes('Qarajlar') || category.includes('Qarajlar');
  const continueRealEstateAfterLocation = () => {
    if (isApartmentFlow) setIsRoomCountSelectorOpen(true);
    else if (isVillaFlow) setIsVillaAreaRangeSelectorOpen(true);
    else if (isObjectFlow) setIsObjectAreaRangeSelectorOpen(true);
    else if (isLandFlow) setIsLandOnlyAreaRangeSelectorOpen(true);
    else if (isGarageFlow) setIsGarageAreaRangeSelectorOpen(true);
  };

  const handleLocationSelection = (value: string) => {
    setSelectedLocationTypeLocal(value);
    setTimeout(() => {
      setCategory(prev => `${prev} → ${value}`);
      setIsLocationTypeSelectorOpen(false);
      setSelectedLocationTypeLocal('');
      setTimeout(() => {
        continueRealEstateAfterLocation();
      }, 300);
    }, 150);
  };
  const isRealEstateFlow = isApartmentFlow || isVillaFlow || isObjectFlow || isLandFlow || isGarageFlow;

  const isDeviceFlow = isStorageDeviceFlow || isTvFlow || isAudioFlow || isGamingFlow || isCameraFlow || isWearableFlow || isHeadphoneFlow || isFeaturePhoneFlow || isRefrigeratorFlow || isWashingMachineFlow || isDishwasherFlow || isAcFlow || isVacuumFlow || isMicrowaveFlow || isSmallApplianceFlow;

  const renderCategoryDisplay = () => {
    if (!category) {
      return <span className="flex-1 pr-6 truncate text-[#9CA3AF]">{t('select_category')}</span>;
    }

    return (
      <span className="flex-1 pr-6 truncate text-[#111827]">
        {localizeListingPath(category, language)}
      </span>
    );
  };

  useEffect(() => {
    if (language === 'az' || !rootRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue?.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          const parent = node.parentElement;
          if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let current = walker.nextNode();
      while (current) {
        const next = walker.nextNode();
        const textNode = current as Text;
        const source = textNode.nodeValue ?? '';
        const trimmed = source.trim();
        const localized = localizeDomText(trimmed, language);
        if (trimmed && localized !== trimmed) {
          textNode.nodeValue = source.replace(trimmed, localized);
        }
        current = next;
      }

      root.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach((element) => {
        ['placeholder', 'aria-label', 'title', 'alt'].forEach((attribute) => {
          const value = element.getAttribute(attribute);
          if (!value) {
            return;
          }

          const localized = localizeDomText(value, language);
          if (localized !== value) {
            element.setAttribute(attribute, localized);
          }
        });
      });
    });

    return () => window.cancelAnimationFrame(frame);
  });

  return (
    <div ref={rootRef} className="h-screen flex flex-col bg-[#F7F8FC] relative overflow-hidden">
      <div className="px-4 pt-5 pb-4 bg-white flex items-center gap-4 z-10 relative border-b border-[#E5E7EB]">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[#E5E7EB] shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
        >
          <ChevronLeft size={24} className="text-[#111827]" />
        </button>
        <h1 className="text-[24px] font-semibold text-[#111827]">{t('create_new_listing')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        {!isCarFlow && (
          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('category')}</label>
            <div className="relative" onClick={handleOpenSelector}>
              <div className={`flex items-center min-h-[52px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3 text-[16px] transition-colors cursor-pointer ${!category ? 'text-[#9CA3AF]' : 'text-[#111827]'}`}>
                {renderCategoryDisplay()}
              </div>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]" size={20} />
            </div>
          </div>
        )}

        {isCarFlow && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#111827]">{t('category')}</label>
              <button
                type="button"
                onClick={() => setIsCarBrandSelectorOpen(true)}
                className="flex min-h-[52px] w-full items-center justify-between rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3 text-left text-[16px] text-[#111827] transition-colors hover:bg-[#F9FAFB]"
              >
                <span className="truncate pr-4">{tx('Avtomobillər')}</span>
                <ChevronRight size={20} className="shrink-0 text-[#6B7280]" />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#111827]">
                {tx('Marka')} <span className="text-[#2563EB]">*</span>
              </label>
              <SelectionPanelField
                value={carDetails.brand}
                placeholder={t('select_brand')}
                options={[
                  'Toyota',
                  'BMW',
                  'Mercedes-Benz',
                  'Hyundai',
                  'Kia',
                  'Chevrolet',
                  'Nissan',
                  'Volkswagen',
                  'Ford',
                  'Honda',
                  'Audi',
                  'Lexus',
                  'Land Rover',
                  'Porsche',
                  'Mitsubishi',
                  'Opel',
                  'Digər',
                ]}
                panelTitle={tx('Marka')}
                modalTitle={tx('Marka')}
                contentLabel={t('select_brand')}
                showSearch
                searchPlaceholder={t('search_brand')}
                variant="plain"
                open={isCarBrandSelectorOpen}
                onOpenChange={setIsCarBrandSelectorOpen}
                invalid={showCarValidation && !carDetails.brand}
                required={false}
                triggerClassName="h-[52px]"
                getOptionLabel={tx}
                onSelect={(nextValue) => {
                  setCarDetails((current) => ({
                    ...current,
                    category: 'Avtomobillər',
                    brand: nextValue,
                  }));
                  setShowCarValidation(false);
                }}
              />
              {showCarValidation && !carDetails.brand ? (
                <p className="mt-2 text-[12px] font-medium text-[#DC2626]">{t('brand_required')}</p>
              ) : null}
            </div>
          </div>
        )}

        <div>
          <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('price')}</label>
          <div className="relative">
            <input 
              placeholder="0.00" 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-[52px] rounded-[14px] border border-[#E5E7EB] bg-white px-4 pr-12 text-[16px] focus:border-[#5B5CFF] focus:outline-none text-[#111827]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] font-medium">AZN</span>
          </div>
        </div>

        <div>
          <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('city')}</label>
          <div className="relative">
            <select 
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
              }}
              className={`w-full h-[52px] rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[16px] appearance-none focus:border-[#5B5CFF] focus:outline-none ${!city ? 'text-[#9CA3AF]' : 'text-[#111827]'}`}
            >
              <option value="" disabled>{t('select_city')}</option>
              {AZERBAIJAN_CITY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {localizeCityCode(option.code, language)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" size={20} />
          </div>
        </div>

        <div>
          <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('description')}</label>
          <textarea 
            placeholder={t('describe_item')} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-[120px] rounded-[14px] border border-[#E5E7EB] p-4 text-[16px] bg-white focus:border-[#5B5CFF] focus:outline-none resize-none text-[#111827] placeholder:text-[#9CA3AF]"
          />
        </div>

        <div>
          <label className="block text-[14px] font-medium text-[#111827] mb-2">{t('images_upload')}</label>
          <div
            onClick={() => {
              persistDraft();
              onNavigate('imageUpload');
            }}
            className="w-full h-[120px] rounded-[14px] border-2 border-dashed border-[#E5E7EB] bg-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#EEF0FF] flex items-center justify-center">
              <Camera size={20} className="text-[#5B5CFF]" />
            </div>
            <span className="text-[14px] font-medium text-[#5B5CFF]">{t('add_photos')}</span>
          </div>
        </div>

        <div>
          <label className="block text-[14px] font-medium text-[#111827] mb-3">{t('share_platforms')}</label>
          <div className="flex flex-wrap items-center gap-6">
            {sharePlatformOptions.map((platform) => {
              const isSelected = platforms.includes(platform);

              return (
                <label key={platform} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`relative flex items-center justify-center w-6 h-6 rounded-[6px] border bg-white transition-colors ${isSelected ? 'border-[#5B5CFF]' : 'border-[#E5E7EB] group-hover:border-[#5B5CFF]'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => {
                        setPlatforms((current) =>
                          current.includes(platform)
                            ? current.filter((item) => item !== platform)
                            : [...current, platform]
                        );
                      }}
                    />
                    {isSelected ? <div className="w-3 h-3 rounded-[2px] bg-[#5B5CFF]"></div> : null}
                  </div>
                  <span className="text-[15px] text-[#111827] font-medium">{platform}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-[#E5E7EB] z-10">
        <Button 
          onClick={handleNext} 
          className="w-full max-w-[382px] mx-auto h-[52px] rounded-[14px] text-[16px] font-medium"
          disabled={
            !category ||
            !price ||
            !city ||
            !description
          }
        >
          {t('publish_listing')}
        </Button>
      </div>

      {/* Category Selector Modal */}
      <AnimatePresence>
        {isCategorySelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsCategorySelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[85vh] rounded-t-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleBack} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] truncate max-w-[200px] ml-2">
                    {isStorageMode ? t('storage') : isCustomModelMode ? t('enter_model') : isCustomBrandMode ? t('enter_brand') : (categoryPath.length > 1 ? localizedCategoryPath[localizedCategoryPath.length - 1] : t('select_category'))}
                  </h2>
                </div>
                <button onClick={() => setIsCategorySelectorOpen(false)} className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Main Categories (Hide when in storage mode) */}
                {!isStorageMode && (
                  <div className="w-[40%] bg-[#F7F8FC] overflow-y-auto shrink-0">
                    {Object.keys(categoryData).map(mainCat => {
                      const isActive = categoryPath[0] === mainCat;
                      return (
                        <button
                          key={mainCat}
                          onClick={() => {
                            setCategoryPath([mainCat]);
                            setIsCustomBrandMode(false);
                            setIsCustomModelMode(false);
                            setIsStorageMode(false);
                          }}
                          className={`w-full h-[52px] px-4 flex items-center gap-3 transition-colors ${
                            isActive 
                              ? 'bg-white border-l-4 border-l-[#5B5CFF] text-[#111827]' 
                              : 'bg-transparent border-l-4 border-l-transparent text-[#6B7280]'
                          }`}
                        >
                          <span className={isActive ? 'text-[#5B5CFF]' : 'text-[#6B7280]'}>
                            {categoryIcons[mainCat]}
                          </span>
                          <span className="text-[14px] font-medium text-left truncate">
                            {tx(mainCat)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Right Panel - Subcategories & Deeper Levels */}
                <div className={`${isStorageMode ? 'w-full' : 'w-[60%]'} bg-white overflow-y-auto p-2 relative`}>
                  {isStorageMode ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="storage"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 flex flex-col h-full min-h-[300px]"
                      >
                        <h3 className="text-[16px] font-medium text-[#111827] mb-4">{t('storage')}</h3>
                        <div className="flex flex-wrap gap-3 mb-6">
                          {storageOptions.map(storage => (
                            <button
                              key={storage}
                              onClick={() => {
                                setSelectedStorageLocal(storage);
                                setTimeout(() => {
                                  let finalPath = '';
                                  if (isCustomBrandMode) {
                                    finalPath = [...categoryPath, customBrand.trim(), customModel.trim(), storage].join(' → ');
                                  } else if (isCustomModelMode) {
                                    finalPath = [...categoryPath, customModel.trim(), storage].join(' → ');
                                  } else {
                                    finalPath = [...categoryPath, storage].join(' → ');
                                  }
                                  setCategory(finalPath);
                                  setIsCategorySelectorOpen(false);
                                  setTimeout(() => setIsRamSelectorOpen(true), 300);
                                  setSelectedStorageLocal('');
                                }, 150);
                              }}
                              className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                                selectedStorageLocal === storage
                                  ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]'
                                  : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                              }`}
                            >
                              {storage}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : isCustomModelMode ? (
                    <div className="p-4 flex flex-col gap-4">
                      <label className="text-[14px] font-medium text-[#111827]">{t('model_name')}</label>
                      <Input 
                        placeholder={t('enter_model')} 
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        autoFocus
                      />
                      <Button 
                        disabled={!customModel.trim()}
                        onClick={() => {
                          if (isStorageDeviceFlow) {
                            setIsStorageMode(true);
                          } else if (isTvFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsScreenSizeSelectorOpen(true), 300);
                          } else if (isAudioFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsAudioTypeSelectorOpen(true), 300);
                          } else if (isGamingFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsConnectionSelectorOpen(true), 300);
                          } else if (isCameraFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsDeviceTypeSelectorOpen(true), 300);
                          } else if (isWearableFlow || isHeadphoneFlow || isFeaturePhoneFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsColorSelectorOpen(true), 300);
                          } else if (isRefrigeratorFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsRefrigeratorTypeSelectorOpen(true), 300);
                          } else if (isWashingMachineFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsWashingMachineTypeSelectorOpen(true), 300);
                          } else if (isDishwasherFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsDishwasherTypeSelectorOpen(true), 300);
                          } else if (isAcFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsAcTypeSelectorOpen(true), 300);
                          } else if (isVacuumFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsVacuumTypeSelectorOpen(true), 300);
                          } else if (isMicrowaveFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsMicrowaveTypeSelectorOpen(true), 300);
                          } else if (isSmallApplianceFlow) {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                            setTimeout(() => setIsSmallApplianceTypeSelectorOpen(true), 300);
                          } else {
                            if (isCustomBrandMode) {
                              setCategory([...categoryPath, customBrand.trim(), customModel.trim()].join(' → '));
                            } else {
                              setCategory([...categoryPath, customModel.trim()].join(' → '));
                            }
                            setIsCategorySelectorOpen(false);
                          }
                        }}
                      >
                        {isDeviceFlow ? t('next') : t('confirm')}
                      </Button>
                    </div>
                  ) : isCustomBrandMode ? (
                    <div className="p-4 flex flex-col gap-4">
                      <label className="text-[14px] font-medium text-[#111827]">{t('brand_name')}</label>
                      <Input 
                        placeholder={t('enter_brand')} 
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        autoFocus
                      />
                      <Button 
                        disabled={!customBrand.trim()}
                        onClick={() => {
                          setIsCustomModelMode(true);
                        }}
                      >
                        {t('next')}
                      </Button>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={categoryPath.join('-')}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col"
                      >
                        {panelOptions.map(option => {
                          const hasChildren = !panelIsArray && panelLevelData?.[option] !== null;
                          const isActiveRow =
                            categoryPath[panelPath.length] === option ||
                            (currentLevelData === null && categoryPath[categoryPath.length - 1] === option);
                          return (
                            <button
                              key={option}
                              onClick={() => handleCategoryOptionClick(option)}
                              className={`group flex h-[52px] w-full items-center justify-between border-b border-[#EEF2F7] px-4 text-left transition-colors last:border-b-0 ${
                                isActiveRow ? 'bg-[#F3F6FF]' : 'bg-white hover:bg-[#F8FAFF]'
                              }`}
                            >
                              <span className={`truncate pr-3 text-[14px] font-medium ${isActiveRow ? 'text-[#345CFF]' : 'text-[#111827]'}`}>
                                {tx(option)}
                              </span>
                              <ChevronRight
                                size={16}
                                className={`shrink-0 ${isActiveRow ? 'text-[#345CFF]' : 'text-[#9CA3AF] group-hover:text-[#5B5CFF]'}`}
                              />
                            </button>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RAM Selector Bottom Sheet */}
      <AnimatePresence>
        {isRamSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsRamSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsRamSelectorOpen(false);
                      setTimeout(() => setIsCategorySelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">{t('ram')}</h2>
                </div>
                <button 
                  onClick={() => setIsRamSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {ramOptions.map(ram => (
                    <button
                      key={ram}
                      onClick={() => {
                        setSelectedRamLocal(ram);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${ram}`);
                          setIsRamSelectorOpen(false);
                          setSelectedRamLocal('');
                          setTimeout(() => setIsColorSelectorOpen(true), 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedRamLocal === ram 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {ram}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery Selector Bottom Sheet */}
      <AnimatePresence>
        {isDeliverySelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsDeliverySelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsDeliverySelectorOpen(false);
                      setTimeout(() => {
                        if (isTabletOrLaptopFlow || isTvFlow || isAudioFlow || isCameraFlow || isRefrigeratorFlow || isWashingMachineFlow || isDishwasherFlow || isAcFlow || isVacuumFlow || isMicrowaveFlow || isSmallApplianceFlow) {
                          setIsColorSelectorOpen(true);
                        } else {
                          setIsConditionSelectorOpen(true);
                        }
                      }, 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">{t('delivery')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setTimeout(() => {
                        setCategory(prev => `${prev} → `);
                        setIsDeliverySelectorOpen(false);
                      }, 150);
                    }}
                    className="text-[14px] font-medium text-[#2563EB] hover:bg-[#2563EB]/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Keç
                  </button>
                  <button 
                    onClick={() => setIsDeliverySelectorOpen(false)} 
                    className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {[t('available'), t('not_available')].map(delivery => (
                    <button
                      key={delivery}
                      onClick={() => {
                        setSelectedDeliveryLocal(delivery);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${delivery}`);
                          setIsDeliverySelectorOpen(false);
                          setSelectedDeliveryLocal('');
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedDeliveryLocal === delivery 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {delivery}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      {/* WashingMachineType Selector Bottom Sheet */}
      <AnimatePresence>
        {isWashingMachineTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsWashingMachineTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsWashingMachineTypeSelectorOpen(false);
                    setTimeout(() => { setIsSpinSpeedSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Növ</h3>
                <button 
                  onClick={() => setIsWashingMachineTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['?n y?kl?m?li', '�std?n y?kl?m?li', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedWashingMachineTypeLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsWashingMachineTypeSelectorOpen(false);
                          setSelectedWashingMachineTypeLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedWashingMachineTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedWashingMachineTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedWashingMachineTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WashingMachineCapacity Selector Bottom Sheet */}
      <AnimatePresence>
        {isWashingMachineCapacitySelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsWashingMachineCapacitySelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsWashingMachineCapacitySelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Tutum</h3>
                <button 
                  onClick={() => setIsWashingMachineCapacitySelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['3�5 kq', '5�7 kq', '7�9 kq', '9+ kq'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedWashingMachineCapacityLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsWashingMachineCapacitySelectorOpen(false);
                          setSelectedWashingMachineCapacityLocal('');
                          setTimeout(() => { setIsSpinSpeedSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedWashingMachineCapacityLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedWashingMachineCapacityLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedWashingMachineCapacityLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SpinSpeed Selector Bottom Sheet */}
      <AnimatePresence>
        {isSpinSpeedSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSpinSpeedSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsSpinSpeedSelectorOpen(false);
                    setTimeout(() => { setIsWashingMachineCapacitySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Sıxma sürəti</h3>
                <button 
                  onClick={() => setIsSpinSpeedSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['800 rpm', '1000 rpm', '1200 rpm', '1400+ rpm'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedSpinSpeedLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsSpinSpeedSelectorOpen(false);
                          setSelectedSpinSpeedLocal('');
                          setTimeout(() => { setIsWashingMachineTypeSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedSpinSpeedLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedSpinSpeedLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedSpinSpeedLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DishwasherType Selector Bottom Sheet */}
      <AnimatePresence>
        {isDishwasherTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDishwasherTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsDishwasherTypeSelectorOpen(false);
                    setTimeout(() => { setIsDishwasherCapacitySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Növ</h3>
                <button 
                  onClick={() => setIsDishwasherTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Qurasdirilan', 'Ayri dayanan', 'Stol?st?', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedDishwasherTypeLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsDishwasherTypeSelectorOpen(false);
                          setSelectedDishwasherTypeLocal('');
                          setTimeout(() => { setIsEnergyClassSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedDishwasherTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedDishwasherTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedDishwasherTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DishwasherCapacity Selector Bottom Sheet */}
      <AnimatePresence>
        {isDishwasherCapacitySelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDishwasherCapacitySelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsDishwasherCapacitySelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Tutum (komplekt)</h3>
                <button 
                  onClick={() => setIsDishwasherCapacitySelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['6�8', '9�11', '12�14', '15+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedDishwasherCapacityLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsDishwasherCapacitySelectorOpen(false);
                          setSelectedDishwasherCapacityLocal('');
                          setTimeout(() => { setIsDishwasherTypeSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedDishwasherCapacityLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedDishwasherCapacityLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedDishwasherCapacityLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AcType Selector Bottom Sheet */}
      <AnimatePresence>
        {isAcTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsAcTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsAcTypeSelectorOpen(false);
                    setTimeout(() => { setIsAreaCoverageSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Növ</h3>
                <button 
                  onClick={() => setIsAcTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Split sistem', 'Mobil', 'P?nc?r?', 'Kaset', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedAcTypeLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsAcTypeSelectorOpen(false);
                          setSelectedAcTypeLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedAcTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedAcTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedAcTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Btu Selector Bottom Sheet */}
      <AnimatePresence>
        {isBtuSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsBtuSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsBtuSelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">BTU</h3>
                <button 
                  onClick={() => setIsBtuSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['7000', '9000', '12000', '18000', '24000+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedBtuLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsBtuSelectorOpen(false);
                          setSelectedBtuLocal('');
                          setTimeout(() => { setIsAreaCoverageSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedBtuLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedBtuLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedBtuLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AreaCoverage Selector Bottom Sheet */}
      <AnimatePresence>
        {isAreaCoverageSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsAreaCoverageSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsAreaCoverageSelectorOpen(false);
                    setTimeout(() => { setIsBtuSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Sahə (m²)</h3>
                <button 
                  onClick={() => setIsAreaCoverageSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['20-y? q?d?r', '20?30', '30?50', '50?70', '70+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedAreaCoverageLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsAreaCoverageSelectorOpen(false);
                          setSelectedAreaCoverageLocal('');
                          setTimeout(() => { setIsAcTypeSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedAreaCoverageLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedAreaCoverageLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedAreaCoverageLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VacuumType Selector Bottom Sheet */}
      <AnimatePresence>
        {isVacuumTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsVacuumTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsVacuumTypeSelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Növ</h3>
                <button 
                  onClick={() => setIsVacuumTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Torbali', 'Konteynerli', 'Robot', 'Saquli', 'Yuyucu'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedVacuumTypeLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsVacuumTypeSelectorOpen(false);
                          setSelectedVacuumTypeLocal('');
                          setTimeout(() => { setIsVacuumPowerSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedVacuumTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedVacuumTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedVacuumTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VacuumPower Selector Bottom Sheet */}
      <AnimatePresence>
        {isVacuumPowerSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsVacuumPowerSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsVacuumPowerSelectorOpen(false);
                    setTimeout(() => { setIsVacuumTypeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Güc (W)</h3>
                <button 
                  onClick={() => setIsVacuumPowerSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['1000-? q?d?r', '1000?1500', '1500?2000', '2000+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedVacuumPowerLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsVacuumPowerSelectorOpen(false);
                          setSelectedVacuumPowerLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedVacuumPowerLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedVacuumPowerLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedVacuumPowerLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BagType Selector Bottom Sheet */}
      <AnimatePresence>
        {isBagTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsBagTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsBagTypeSelectorOpen(false);
                    setTimeout(() => { setIsVacuumPowerSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Toz toplayıcı</h3>
                <button 
                  onClick={() => setIsBagTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Kis?li', 'Konteynerli', 'Akvafiltrli', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedBagTypeLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsBagTypeSelectorOpen(false);
                          setSelectedBagTypeLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedBagTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedBagTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedBagTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MicrowaveType Selector Bottom Sheet */}
      <AnimatePresence>
        {isMicrowaveTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMicrowaveTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsMicrowaveTypeSelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Növ</h3>
                <button 
                  onClick={() => setIsMicrowaveTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Sade', 'Qril il?', 'Konveksiyali', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedMicrowaveTypeLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsMicrowaveTypeSelectorOpen(false);
                          setSelectedMicrowaveTypeLocal('');
                          setTimeout(() => { setIsMicrowaveCapacitySelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedMicrowaveTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedMicrowaveTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedMicrowaveTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MicrowaveCapacity Selector Bottom Sheet */}
      <AnimatePresence>
        {isMicrowaveCapacitySelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMicrowaveCapacitySelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsMicrowaveCapacitySelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Həcm (L)</h3>
                <button 
                  onClick={() => setIsMicrowaveCapacitySelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['20-y? q?d?r', '20?25', '25?30', '30+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedMicrowaveCapacityLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsMicrowaveCapacitySelectorOpen(false);
                          setSelectedMicrowaveCapacityLocal('');
                          setTimeout(() => { setIsMicrowavePowerSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedMicrowaveCapacityLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedMicrowaveCapacityLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedMicrowaveCapacityLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MicrowavePower Selector Bottom Sheet */}
      <AnimatePresence>
        {isMicrowavePowerSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMicrowavePowerSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsMicrowavePowerSelectorOpen(false);
                    setTimeout(() => { setIsMicrowaveCapacitySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Güc (W)</h3>
                <button 
                  onClick={() => setIsMicrowavePowerSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['700-? q?d?r', '700?900', '900?1000', '1000+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedMicrowavePowerLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsMicrowavePowerSelectorOpen(false);
                          setSelectedMicrowavePowerLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedMicrowavePowerLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedMicrowavePowerLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedMicrowavePowerLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SmallApplianceType Selector Bottom Sheet */}
      <AnimatePresence>
        {isSmallApplianceTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSmallApplianceTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsSmallApplianceTypeSelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Növ</h3>
                <button 
                  onClick={() => setIsSmallApplianceTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['?aydan', 'Blender', 'Toster', '?t??k?n masin', 'Mikser', 'Q?hv?bisir?n', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedSmallApplianceTypeLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsSmallApplianceTypeSelectorOpen(false);
                          setSelectedSmallApplianceTypeLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedSmallApplianceTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedSmallApplianceTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedSmallApplianceTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SmallAppliancePower Selector Bottom Sheet */}
      <AnimatePresence>
        {isSmallAppliancePowerSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSmallAppliancePowerSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsSmallAppliancePowerSelectorOpen(false);
                    setTimeout(() => { setIsSmallApplianceTypeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Güc (W)</h3>
                <button 
                  onClick={() => setIsSmallAppliancePowerSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['500-? q?d?r', '500?1000', '1000?1500', '1500+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedSmallAppliancePowerLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsSmallAppliancePowerSelectorOpen(false);
                          setSelectedSmallAppliancePowerLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedSmallAppliancePowerLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedSmallAppliancePowerLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedSmallAppliancePowerLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      
      
      {/* ListingType Selector Bottom Sheet */}
      <AnimatePresence>
        {isListingTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsListingTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsListingTypeSelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Elanın növü</h3>
                <button 
                  onClick={() => setIsListingTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Satilir', 'Kiray? (uzunm?dd?tli)'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedListingTypeLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsListingTypeSelectorOpen(false);
                            setSelectedListingTypeLocal('');
                            setTimeout(() => { setIsLocationTypeSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedListingTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedListingTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedListingTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedListingTypeLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsListingTypeSelectorOpen(false);
                          setSelectedListingTypeLocal('');
                          setTimeout(() => { setIsLocationTypeSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsListingTypeSelectorOpen(false);
                          setSelectedListingTypeLocal('');
                          setTimeout(() => { setIsLocationTypeSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LocationType Selector Bottom Sheet */}
      <AnimatePresence>
        {isLocationTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsLocationTypeSelectorOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsLocationTypeSelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Yerləşmə</h3>
                <button
                  onClick={() => setIsLocationTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Yerləşməni daxil edin
                    </label>
                    <input
                      type="text"
                      value={selectedLocationTypeLocal}
                      placeholder="Şəhər, rayon və ya ünvan yazın"
                      autoFocus
                      onChange={(e) => setSelectedLocationTypeLocal(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedLocationTypeLocal.trim()) {
                          handleLocationSelection(selectedLocationTypeLocal.trim());
                        }
                      }}
                      className="w-full h-[52px] px-4 rounded-xl border border-gray-300 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (selectedLocationTypeLocal.trim()) {
                        handleLocationSelection(selectedLocationTypeLocal.trim());
                      }
                    }}
                    className="w-full h-[52px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedLocationTypeLocal.trim()}
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* RoomCount Selector Bottom Sheet */}
      <AnimatePresence>
        {isRoomCountSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsRoomCountSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsRoomCountSelectorOpen(false);
                    setTimeout(() => { setIsLocationTypeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Otaq sayı</h3>
                <button 
                  onClick={() => setIsRoomCountSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['1 otaqli', '2 otaqli', '3 otaqli', '4 otaqli', '5+ otaqli'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedRoomCountLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsRoomCountSelectorOpen(false);
                            setSelectedRoomCountLocal('');
                            setTimeout(() => { setIsAreaRangeSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedRoomCountLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedRoomCountLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedRoomCountLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedRoomCountLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsRoomCountSelectorOpen(false);
                          setSelectedRoomCountLocal('');
                          setTimeout(() => { setIsAreaRangeSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsRoomCountSelectorOpen(false);
                          setSelectedRoomCountLocal('');
                          setTimeout(() => { setIsAreaRangeSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AreaRange Selector Bottom Sheet */}
      <AnimatePresence>
        {isAreaRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsAreaRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsAreaRangeSelectorOpen(false);
                    setTimeout(() => { setIsRoomCountSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Sahə (m²)</h3>
                <button 
                  onClick={() => setIsAreaRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                  <input
                    type="number"
                    placeholder="Sahəni daxil edin (m²)"
                    className="w-full h-[48px] px-4 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setCategory(prev => `${prev} → ${val} m²`);
                          setIsAreaRangeSelectorOpen(false);
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value.trim()) {
                        const val = input.value.trim();
                        setCategory(prev => `${prev} → ${val} m²`);
                        setIsAreaRangeSelectorOpen(false);
                        setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[48px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors"
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FloorRange Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isFloorRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFloorRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsFloorRangeSelectorOpen(false);
                    setTimeout(() => { setIsAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Mərtəbə</h3>
                <button 
                  onClick={() => setIsFloorRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['1�5', '5�10', '10+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedFloorRangeLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsFloorRangeSelectorOpen(false);
                            setSelectedFloorRangeLocal('');
                            setTimeout(() => { setIsTotalFloorsRangeSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedFloorRangeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedFloorRangeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedFloorRangeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedFloorRangeLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsFloorRangeSelectorOpen(false);
                          setSelectedFloorRangeLocal('');
                          setTimeout(() => { setIsTotalFloorsRangeSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsFloorRangeSelectorOpen(false);
                          setSelectedFloorRangeLocal('');
                          setTimeout(() => { setIsTotalFloorsRangeSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TotalFloorsRange Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isTotalFloorsRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsTotalFloorsRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsTotalFloorsRangeSelectorOpen(false);
                    setTimeout(() => { setIsAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Mərtəbə sayı</h3>
                <button 
                  onClick={() => setIsTotalFloorsRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['1�5', '5�10', '10+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedTotalFloorsRangeLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsTotalFloorsRangeSelectorOpen(false);
                            setSelectedTotalFloorsRangeLocal('');
                            setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedTotalFloorsRangeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedTotalFloorsRangeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedTotalFloorsRangeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedTotalFloorsRangeLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsTotalFloorsRangeSelectorOpen(false);
                          setSelectedTotalFloorsRangeLocal('');
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsTotalFloorsRangeSelectorOpen(false);
                          setSelectedTotalFloorsRangeLocal('');
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RepairStatus Selector Bottom Sheet */}
      <AnimatePresence>
        {isRepairStatusSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsRepairStatusSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsRepairStatusSelectorOpen(false);
                    setTimeout(() => { setIsRealEstateConditionSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Təmir</h3>
                <button 
                  onClick={() => setIsRepairStatusSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Təmirli', 'Təmirsiz'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedRepairStatusLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsRepairStatusSelectorOpen(false);
                            setSelectedRepairStatusLocal('');
                            setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedRepairStatusLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedRepairStatusLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedRepairStatusLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedRepairStatusLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsRepairStatusSelectorOpen(false);
                          setSelectedRepairStatusLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsRepairStatusSelectorOpen(false);
                          setSelectedRepairStatusLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ApartmentFeatures Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isApartmentFeaturesSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsApartmentFeaturesSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsApartmentFeaturesSelectorOpen(false);
                    setTimeout(() => { setIsRepairStatusSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Əlavə</h3>
                <button 
                  onClick={() => setIsApartmentFeaturesSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Lift', 'Balkon', 'Kombi', '?syali', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedApartmentFeaturesLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsApartmentFeaturesSelectorOpen(false);
                            setSelectedApartmentFeaturesLocal('');
                            setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedApartmentFeaturesLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedApartmentFeaturesLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedApartmentFeaturesLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedApartmentFeaturesLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsApartmentFeaturesSelectorOpen(false);
                          setSelectedApartmentFeaturesLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsApartmentFeaturesSelectorOpen(false);
                          setSelectedApartmentFeaturesLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VillaAreaRange Selector Bottom Sheet */}
      <AnimatePresence>
        {isVillaAreaRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsVillaAreaRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsVillaAreaRangeSelectorOpen(false);
                    setTimeout(() => { setIsLocationTypeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Sahə (m²)</h3>
                <button 
                  onClick={() => setIsVillaAreaRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Sahəni daxil edin
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={selectedVillaAreaRangeLocal}
                        placeholder=""
                        autoFocus
                        onChange={(e) => setSelectedVillaAreaRangeLocal(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && selectedVillaAreaRangeLocal.trim()) {
                            const val = selectedVillaAreaRangeLocal.trim();
                            setCategory(prev => `${prev} → ${val} m²`);
                            setIsVillaAreaRangeSelectorOpen(false);
                            setSelectedVillaAreaRangeLocal('');
                            setTimeout(() => { setIsLandAreaRangeSelectorOpen(true) }, 300);
                          }
                        }}
                        className="w-full h-[52px] rounded-xl border border-gray-300 bg-white px-4 pr-16 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        m²
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedVillaAreaRangeLocal.trim()) {
                        const val = selectedVillaAreaRangeLocal.trim();
                        setCategory(prev => `${prev} → ${val} m²`);
                        setIsVillaAreaRangeSelectorOpen(false);
                        setSelectedVillaAreaRangeLocal('');
                        setTimeout(() => { setIsLandAreaRangeSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[52px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedVillaAreaRangeLocal.trim()}
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LandAreaRange Selector Bottom Sheet */}
      <AnimatePresence>
        {isLandAreaRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsLandAreaRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsLandAreaRangeSelectorOpen(false);
                    setTimeout(() => { setIsVillaAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Torpaq sahəsi</h3>
                <button 
                  onClick={() => setIsLandAreaRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Torpaq sahəsini daxil edin
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={selectedLandAreaRangeLocal}
                        placeholder=""
                        autoFocus
                        onChange={(e) => setSelectedLandAreaRangeLocal(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && selectedLandAreaRangeLocal.trim()) {
                            const val = selectedLandAreaRangeLocal.trim();
                            setCategory(prev => `${prev} → ${val} sot`);
                            setIsLandAreaRangeSelectorOpen(false);
                            setSelectedLandAreaRangeLocal('');
                            setTimeout(() => { setIsVillaRoomCountSelectorOpen(true) }, 300);
                          }
                        }}
                        className="w-full h-[52px] rounded-xl border border-gray-300 bg-white px-4 pr-16 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        sot
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedLandAreaRangeLocal.trim()) {
                        const val = selectedLandAreaRangeLocal.trim();
                        setCategory(prev => `${prev} → ${val} sot`);
                        setIsLandAreaRangeSelectorOpen(false);
                        setSelectedLandAreaRangeLocal('');
                        setTimeout(() => { setIsVillaRoomCountSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[52px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedLandAreaRangeLocal.trim()}
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VillaRoomCount Selector Bottom Sheet */}
      <AnimatePresence>
        {isVillaRoomCountSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsVillaRoomCountSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsVillaRoomCountSelectorOpen(false);
                    setTimeout(() => { setIsLandAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Otaq sayı</h3>
                <button 
                  onClick={() => setIsVillaRoomCountSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Otaq sayını daxil edin
                    </label>
                    <input
                      type="number"
                      value={selectedVillaRoomCountLocal}
                      placeholder=""
                      autoFocus
                      onChange={(e) => setSelectedVillaRoomCountLocal(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedVillaRoomCountLocal.trim()) {
                          const val = selectedVillaRoomCountLocal.trim();
                          setCategory(prev => `${prev} → ${val} otaq`);
                          setIsVillaRoomCountSelectorOpen(false);
                          setSelectedVillaRoomCountLocal('');
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full h-[52px] rounded-xl border border-gray-300 bg-white px-4 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (selectedVillaRoomCountLocal.trim()) {
                        const val = selectedVillaRoomCountLocal.trim();
                        setCategory(prev => `${prev} → ${val} otaq`);
                        setIsVillaRoomCountSelectorOpen(false);
                        setSelectedVillaRoomCountLocal('');
                        setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[52px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedVillaRoomCountLocal.trim()}
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VillaFeatures Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isVillaFeaturesSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsVillaFeaturesSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsVillaFeaturesSelectorOpen(false);
                    setTimeout(() => { setIsRealEstateConditionSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Əlavə</h3>
                <button 
                  onClick={() => setIsVillaFeaturesSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['H?y?t', 'Hovuz', 'Qaraj', 'Kup?a', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedVillaFeaturesLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsVillaFeaturesSelectorOpen(false);
                            setSelectedVillaFeaturesLocal('');
                            setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedVillaFeaturesLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedVillaFeaturesLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedVillaFeaturesLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedVillaFeaturesLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsVillaFeaturesSelectorOpen(false);
                          setSelectedVillaFeaturesLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsVillaFeaturesSelectorOpen(false);
                          setSelectedVillaFeaturesLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ObjectAreaRange Selector Bottom Sheet */}
      <AnimatePresence>
        {isObjectAreaRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsObjectAreaRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsObjectAreaRangeSelectorOpen(false);
                    setTimeout(() => { setIsLocationTypeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Sahə (m²)</h3>
                <button 
                  onClick={() => setIsObjectAreaRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Sahəni daxil edin
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={selectedObjectAreaRangeLocal}
                        placeholder=""
                        autoFocus
                        onChange={(e) => setSelectedObjectAreaRangeLocal(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && selectedObjectAreaRangeLocal.trim()) {
                            const val = selectedObjectAreaRangeLocal.trim();
                            setCategory(prev => `${prev} → ${val} m²`);
                            setIsObjectAreaRangeSelectorOpen(false);
                            setSelectedObjectAreaRangeLocal('');
                            setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                          }
                        }}
                        className="w-full h-[52px] rounded-xl border border-gray-300 bg-white px-4 pr-16 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        m²
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedObjectAreaRangeLocal.trim()) {
                        const val = selectedObjectAreaRangeLocal.trim();
                        setCategory(prev => `${prev} → ${val} m²`);
                        setIsObjectAreaRangeSelectorOpen(false);
                        setSelectedObjectAreaRangeLocal('');
                        setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[52px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedObjectAreaRangeLocal.trim()}
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PropertyType Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isPropertyTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsPropertyTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsPropertyTypeSelectorOpen(false);
                    setTimeout(() => { setIsObjectAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Obyektin növü</h3>
                <button 
                  onClick={() => setIsPropertyTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Ofis', 'Magaza', 'Restoran', 'Anbar', 'Dig?r'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedPropertyTypeLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsPropertyTypeSelectorOpen(false);
                            setSelectedPropertyTypeLocal('');
                            setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedPropertyTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedPropertyTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedPropertyTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedPropertyTypeLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsPropertyTypeSelectorOpen(false);
                          setSelectedPropertyTypeLocal('');
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsPropertyTypeSelectorOpen(false);
                          setSelectedPropertyTypeLocal('');
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ObjectFeatures Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isObjectFeaturesSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsObjectFeaturesSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsObjectFeaturesSelectorOpen(false);
                    setTimeout(() => { setIsRealEstateConditionSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Əlavə</h3>
                <button 
                  onClick={() => setIsObjectFeaturesSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Kupça', 'Təmirli', 'Yol kənarı', 'Digər'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedObjectFeaturesLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsObjectFeaturesSelectorOpen(false);
                            setSelectedObjectFeaturesLocal('');
                            setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedObjectFeaturesLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedObjectFeaturesLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedObjectFeaturesLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedObjectFeaturesLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsObjectFeaturesSelectorOpen(false);
                          setSelectedObjectFeaturesLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsObjectFeaturesSelectorOpen(false);
                          setSelectedObjectFeaturesLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LandOnlyAreaRange Selector Bottom Sheet */}
      <AnimatePresence>
        {isLandOnlyAreaRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsLandOnlyAreaRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsLandOnlyAreaRangeSelectorOpen(false);
                    setTimeout(() => { setIsLocationTypeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Torpaq sahəsi</h3>
                <button 
                  onClick={() => setIsLandOnlyAreaRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Torpaq sahəsini daxil edin
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={selectedLandOnlyAreaRangeLocal}
                        placeholder=""
                        autoFocus
                        onChange={(e) => setSelectedLandOnlyAreaRangeLocal(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && selectedLandOnlyAreaRangeLocal.trim()) {
                            const val = selectedLandOnlyAreaRangeLocal.trim();
                            setCategory(prev => `${prev} → ${val} sot`);
                            setIsLandOnlyAreaRangeSelectorOpen(false);
                            setSelectedLandOnlyAreaRangeLocal('');
                          }
                        }}
                        className="w-full h-[52px] rounded-xl border border-gray-300 bg-white px-4 pr-16 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        sot
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedLandOnlyAreaRangeLocal.trim()) {
                        const val = selectedLandOnlyAreaRangeLocal.trim();
                        setCategory(prev => `${prev} → ${val} sot`);
                        setIsLandOnlyAreaRangeSelectorOpen(false);
                        setSelectedLandOnlyAreaRangeLocal('');
                      }
                    }}
                    className="w-full h-[52px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedLandOnlyAreaRangeLocal.trim()}
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LandPurpose Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isLandPurposeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsLandPurposeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsLandPurposeSelectorOpen(false);
                    setTimeout(() => { setIsLandOnlyAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Təyinatı</h3>
                <button 
                  onClick={() => setIsLandPurposeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Yasayis', 'Kommersiya', 'K?nd t?s?rr?fati'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedLandPurposeLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsLandPurposeSelectorOpen(false);
                            setSelectedLandPurposeLocal('');
                            setTimeout(() => { setIsDocumentsSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedLandPurposeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedLandPurposeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedLandPurposeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedLandPurposeLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsLandPurposeSelectorOpen(false);
                          setSelectedLandPurposeLocal('');
                          setTimeout(() => { setIsDocumentsSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsLandPurposeSelectorOpen(false);
                          setSelectedLandPurposeLocal('');
                          setTimeout(() => { setIsDocumentsSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Documents Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isDocumentsSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDocumentsSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsDocumentsSelectorOpen(false);
                    setTimeout(() => { setIsLandOnlyAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Sənədlər</h3>
                <button 
                  onClick={() => setIsDocumentsSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Kup�a var', 'Kup�a yoxdur'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedDocumentsLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsDocumentsSelectorOpen(false);
                            setSelectedDocumentsLocal('');
                            setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedDocumentsLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedDocumentsLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedDocumentsLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedDocumentsLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsDocumentsSelectorOpen(false);
                          setSelectedDocumentsLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsDocumentsSelectorOpen(false);
                          setSelectedDocumentsLocal('');
                          setTimeout(() => { setIsOwnerInfoSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GarageAreaRange Selector Bottom Sheet */}
      <AnimatePresence>
        {isGarageAreaRangeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsGarageAreaRangeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsGarageAreaRangeSelectorOpen(false);
                    setTimeout(() => { setIsLocationTypeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Sahə (m²)</h3>
                <button 
                  onClick={() => setIsGarageAreaRangeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Sahəni daxil edin
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={selectedGarageAreaRangeLocal}
                        placeholder=""
                        autoFocus
                        onChange={(e) => setSelectedGarageAreaRangeLocal(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && selectedGarageAreaRangeLocal.trim()) {
                            const val = selectedGarageAreaRangeLocal.trim();
                            setCategory(prev => `${prev} → ${val} m²`);
                            setIsGarageAreaRangeSelectorOpen(false);
                            setSelectedGarageAreaRangeLocal('');
                            setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                          }
                        }}
                        className="w-full h-[52px] rounded-xl border border-gray-300 bg-white px-4 pr-16 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        m²
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedGarageAreaRangeLocal.trim()) {
                        const val = selectedGarageAreaRangeLocal.trim();
                        setCategory(prev => `${prev} → ${val} m²`);
                        setIsGarageAreaRangeSelectorOpen(false);
                        setSelectedGarageAreaRangeLocal('');
                        setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[52px] bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedGarageAreaRangeLocal.trim()}
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GarageType Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isGarageTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsGarageTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsGarageTypeSelectorOpen(false);
                    setTimeout(() => { setIsGarageAreaRangeSelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Növü</h3>
                <button 
                  onClick={() => setIsGarageTypeSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['A�iq', 'Qapali', 'Yeralti'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedGarageTypeLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsGarageTypeSelectorOpen(false);
                            setSelectedGarageTypeLocal('');
                            setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedGarageTypeLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedGarageTypeLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedGarageTypeLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedGarageTypeLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsGarageTypeSelectorOpen(false);
                          setSelectedGarageTypeLocal('');
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsGarageTypeSelectorOpen(false);
                          setSelectedGarageTypeLocal('');
                          setTimeout(() => { setIsRealEstateConditionSelectorOpen(true) }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RealEstateCondition Selector Bottom Sheet */}
      <AnimatePresence>
        {isRealEstateConditionSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsRealEstateConditionSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsRealEstateConditionSelectorOpen(false);
                    setTimeout(() => { 
      if (isApartmentFlow) setIsAreaRangeSelectorOpen(true);
      else if (isVillaFlow) setIsVillaRoomCountSelectorOpen(true);
      else if (isObjectFlow) setIsObjectAreaRangeSelectorOpen(true);
      else if (isGarageFlow) setIsGarageAreaRangeSelectorOpen(true);
    ; }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Vəziyyəti</h3>
                <button 
                  onClick={() => setIsRealEstateConditionSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Yeni tikili', 'Köhnə tikili'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedRealEstateConditionLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsRealEstateConditionSelectorOpen(false);
                            setSelectedRealEstateConditionLocal('');
                            setTimeout(() => { 
      if (isApartmentFlow) setIsRepairStatusSelectorOpen(true);
      else if (isVillaFlow) setIsOwnerInfoSelectorOpen(true);
      else if (isObjectFlow) setIsOwnerInfoSelectorOpen(true);
      else setIsOwnerInfoSelectorOpen(true);
     }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedRealEstateConditionLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedRealEstateConditionLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedRealEstateConditionLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedRealEstateConditionLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsRealEstateConditionSelectorOpen(false);
                          setSelectedRealEstateConditionLocal('');
                          setTimeout(() => { 
      if (isApartmentFlow) setIsRepairStatusSelectorOpen(true);
      else if (isVillaFlow) setIsOwnerInfoSelectorOpen(true);
      else if (isObjectFlow) setIsOwnerInfoSelectorOpen(true);
      else setIsOwnerInfoSelectorOpen(true);
     }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsRealEstateConditionSelectorOpen(false);
                          setSelectedRealEstateConditionLocal('');
                          setTimeout(() => { 
      if (isApartmentFlow) setIsRepairStatusSelectorOpen(true);
      else if (isVillaFlow) setIsOwnerInfoSelectorOpen(true);
      else if (isObjectFlow) setIsOwnerInfoSelectorOpen(true);
      else setIsOwnerInfoSelectorOpen(true);
     }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OwnerInfo Selector Bottom Sheet */}
      <AnimatePresence>
        {false && isOwnerInfoSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOwnerInfoSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsOwnerInfoSelectorOpen(false);
                    setTimeout(() => { 
      if (isApartmentFlow) setIsApartmentFeaturesSelectorOpen(true);
      else if (isVillaFlow) setIsOwnerInfoSelectorOpen(true);
      else if (isObjectFlow) setIsOwnerInfoSelectorOpen(true);
      else if (isLandFlow) setIsLandOnlyAreaRangeSelectorOpen(true);
      else if (isGarageFlow) setIsRealEstateConditionSelectorOpen(true);
    ; }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Mülkiyyətçi</h3>
                <button 
                  onClick={() => setIsOwnerInfoSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['?z?m', 'Vasit??i (Agentlik)'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedOwnerInfoLocal(option);
                        if (option !== 'Dig?r') {
                          setTimeout(() => {
                            setCategory(prev => `${prev} → ${option}`);
                            setIsOwnerInfoSelectorOpen(false);
                            setSelectedOwnerInfoLocal('');
                            setTimeout(() => {  }, 300);
                          }, 150);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedOwnerInfoLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedOwnerInfoLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedOwnerInfoLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedOwnerInfoLocal === 'Digər' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <input
                      type="text"
                      placeholder="Daxil edin..."
                      autoFocus
                      className="w-full h-[48px] px-4 rounded-lg border border-gray-300 focus:border-[#2563EB] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsOwnerInfoSelectorOpen(false);
                          setSelectedOwnerInfoLocal('');
                          setTimeout(() => {  }, 300);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          const val = input.value.trim();
                          setCategory(prev => `${prev} → ${val}`);
                          setIsOwnerInfoSelectorOpen(false);
                          setSelectedOwnerInfoLocal('');
                          setTimeout(() => {  }, 300);
                        }
                      }}
                      className="w-full mt-3 h-[48px] bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Təsdiqlə
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Screen Size Selector Bottom Sheet */}
      <AnimatePresence>
        {isScreenSizeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsScreenSizeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsScreenSizeSelectorOpen(false);
                      setTimeout(() => setIsCategorySelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Ekran ölçüsü</h2>
                </div>
                <button 
                  onClick={() => setIsScreenSizeSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {['24"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"'].map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedScreenSizeLocal(size);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${size}`);
                          setIsScreenSizeSelectorOpen(false);
                          setSelectedScreenSizeLocal('');
                          setTimeout(() => setIsResolutionSelectorOpen(true), 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedScreenSizeLocal === size 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resolution Selector Bottom Sheet */}
      <AnimatePresence>
        {isResolutionSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsResolutionSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsResolutionSelectorOpen(false);
                      setTimeout(() => {
                        if (isCameraFlow) {
                          setIsDeviceTypeSelectorOpen(true);
                        } else {
                          setIsScreenSizeSelectorOpen(true);
                        }
                      }, 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">İcazə</h2>
                </div>
                <button 
                  onClick={() => setIsResolutionSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {(isCameraFlow ? ['HD', 'Full HD', '2.7K', '4K', '5K', '6K', '8K'] : ['HD', 'Full HD', '4K', '8K']).map(resolution => (
                    <button
                      key={resolution}
                      onClick={() => {
                        setSelectedResolutionLocal(resolution);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${resolution}`);
                          setIsResolutionSelectorOpen(false);
                          setSelectedResolutionLocal('');
                          setTimeout(() => {
                            if (isCameraFlow) {
                              setIsConditionSelectorOpen(true);
                            } else {
                              setIsSmartTvSelectorOpen(true);
                            }
                          }, 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedResolutionLocal === resolution 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {resolution}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart TV Selector Bottom Sheet */}
      <AnimatePresence>
        {isSmartTvSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsSmartTvSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsSmartTvSelectorOpen(false);
                      setTimeout(() => setIsResolutionSelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Smart TV</h2>
                </div>
                <button 
                  onClick={() => setIsSmartTvSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {['B?li', 'Xeyr'].map(smartTv => (
                    <button
                      key={smartTv}
                      onClick={() => {
                        setSelectedSmartTvLocal(smartTv);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${smartTv}`);
                          setIsSmartTvSelectorOpen(false);
                          setSelectedSmartTvLocal('');
                          setTimeout(() => setIsColorSelectorOpen(true), 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedSmartTvLocal === smartTv 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {smartTv}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refrigerator Type Selector Bottom Sheet */}
      <AnimatePresence>
        {isRefrigeratorTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsRefrigeratorTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white rounded-t-[24px] w-full max-w-md mx-auto flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsRefrigeratorTypeSelectorOpen(false);
                      setTimeout(() => setIsCategorySelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Soyuducu növü</h2>
                </div>
                <button 
                  onClick={() => setIsRefrigeratorTypeSelectorOpen(false)} 
                  className="p-2 -mr-2 text-[#9CA3AF] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-2">
                  {['T?k qapili', 'Iki qapili', 'Side-by-side', 'Mini soyuducu', 'Dig?r'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedRefrigeratorTypeLocal(type);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${type}`);
                          setIsRefrigeratorTypeSelectorOpen(false);
                          setSelectedRefrigeratorTypeLocal('');
                          setTimeout(() => setIsCapacitySelectorOpen(true), 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedRefrigeratorTypeLocal === type 
                          ? 'bg-[#111827] text-white border-[#111827]' 
                          : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Capacity Selector Bottom Sheet */}
      <AnimatePresence>
        {isCapacitySelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsCapacitySelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white rounded-t-[24px] w-full max-w-md mx-auto flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsCapacitySelectorOpen(false);
                      setTimeout(() => setIsRefrigeratorTypeSelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Həcm</h2>
                </div>
                <button 
                  onClick={() => setIsCapacitySelectorOpen(false)} 
                  className="p-2 -mr-2 text-[#9CA3AF] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-2">
                  {['0�100 L', '100�200 L', '200�300 L', '300�400 L', '400+ L'].map((capacity) => (
                    <button
                      key={capacity}
                      onClick={() => {
                        setSelectedCapacityLocal(capacity);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${capacity}`);
                          setIsCapacitySelectorOpen(false);
                          setSelectedCapacityLocal('');
                          setTimeout(() => {
                          if (isRefrigeratorFlow) {
                            setIsNoFrostSelectorOpen(true);
                          } else {
                            setIsEnergyClassSelectorOpen(true);
                          }
                        }, 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedCapacityLocal === capacity 
                          ? 'bg-[#111827] text-white border-[#111827]' 
                          : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      {capacity}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Energy Class Selector Bottom Sheet */}
      <AnimatePresence>
        {isEnergyClassSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsEnergyClassSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white rounded-t-[24px] w-full max-w-md mx-auto flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsEnergyClassSelectorOpen(false);
                      setTimeout(() => setIsCapacitySelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Enerji sinfi</h2>
                </div>
                <button 
                  onClick={() => setIsEnergyClassSelectorOpen(false)} 
                  className="p-2 -mr-2 text-[#9CA3AF] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-2">
                  {['A', 'A+', 'A++', 'A+++', 'Dig?r'].map((energy) => (
                    <button
                      key={energy}
                      onClick={() => {
                        setSelectedEnergyClassLocal(energy);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${energy}`);
                          setIsEnergyClassSelectorOpen(false);
                          setSelectedEnergyClassLocal('');
                          setTimeout(() => setIsConditionSelectorOpen(true), 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedEnergyClassLocal === energy 
                          ? 'bg-[#111827] text-white border-[#111827]' 
                          : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      {energy}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Device Type Selector Bottom Sheet */}
      <AnimatePresence>
        {isDeviceTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsDeviceTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsDeviceTypeSelectorOpen(false);
                      setTimeout(() => setIsCategorySelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">{t('type')}</h2>
                </div>
                <button 
                  onClick={() => setIsDeviceTypeSelectorOpen(false)} 
                  className="p-2 -mr-2 text-[#9CA3AF] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {['Fotoaparat', 'Videokamera', 'Action kamera', 'Vlog kamera', '360 kamera', 'Dig?r'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedDeviceTypeLocal(type);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${type}`);
                          setIsDeviceTypeSelectorOpen(false);
                          setSelectedDeviceTypeLocal('');
                          setTimeout(() => {
                            if (isCameraFlow) {
                              setIsResolutionSelectorOpen(true);
                            }
                          }, 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedDeviceTypeLocal === type 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio Type Selector Bottom Sheet */}
      <AnimatePresence>
        {isAudioTypeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsAudioTypeSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsAudioTypeSelectorOpen(false);
                      setTimeout(() => setIsCategorySelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Növ</h2>
                </div>
                <button 
                  onClick={() => setIsAudioTypeSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {['Bluetooth speaker', 'Home speaker', 'Soundbar', 'Subwoofer', 'Headphones', 'Earbuds', 'Microphone', 'Dig?r'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedAudioTypeLocal(type);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${type}`);
                          setIsAudioTypeSelectorOpen(false);
                          setSelectedAudioTypeLocal('');
                          setTimeout(() => setIsConnectionSelectorOpen(true), 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedAudioTypeLocal === type 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Connection Selector Bottom Sheet */}
      <AnimatePresence>
        {isConnectionSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsConnectionSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsConnectionSelectorOpen(false);
                      setTimeout(() => {
                        if (isGamingFlow) {
                          setIsCategorySelectorOpen(true);
                        } else {
                          setIsAudioTypeSelectorOpen(true);
                        }
                      }, 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Qoşulma</h2>
                </div>
                <button 
                  onClick={() => setIsConnectionSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {(isGamingFlow ? ['Wired', 'Wireless', 'Bluetooth', 'USB', '2.4 GHz', 'Multiple'] : ['Bluetooth', 'Wired', 'Wi-Fi', 'USB', 'AUX', 'Multiple']).map(conn => (
                    <button
                      key={conn}
                      onClick={() => {
                        setSelectedConnectionLocal(conn);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${conn}`);
                          setIsConnectionSelectorOpen(false);
                          setSelectedConnectionLocal('');
                          setTimeout(() => {
                            if (isGamingFlow) {
                              setIsColorSelectorOpen(true);
                            } else {
                              setIsPowerSelectorOpen(true);
                            }
                          }, 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedConnectionLocal === conn 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {conn}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Power Selector Bottom Sheet */}
      <AnimatePresence>
        {isPowerSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsPowerSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsPowerSelectorOpen(false);
                      setTimeout(() => setIsConnectionSelectorOpen(true), 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">Güc / Çıxış</h2>
                </div>
                <button 
                  onClick={() => setIsPowerSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {['0�20 W', '20�50 W', '50�100 W', '100+ W'].map(power => (
                    <button
                      key={power}
                      onClick={() => {
                        setSelectedPowerLocal(power);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${power}`);
                          setIsPowerSelectorOpen(false);
                          setSelectedPowerLocal('');
                          setTimeout(() => setIsColorSelectorOpen(true), 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedPowerLocal === power 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {power}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Color Selector Bottom Sheet */}
      <AnimatePresence>
        {isColorSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsColorSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsColorSelectorOpen(false);
                      setTimeout(() => {
                        if (isGamingFlow) {
                          setIsConnectionSelectorOpen(true);
                        } else if (isTvFlow) {
                          setIsSmartTvSelectorOpen(true);
                        } else if (isAudioFlow) {
                          setIsPowerSelectorOpen(true);
                        } else if (isCameraFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isRefrigeratorFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isWashingMachineFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isDishwasherFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isAcFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isVacuumFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isMicrowaveFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isSmallApplianceFlow) {
                          setIsConditionSelectorOpen(true);
                        } else if (isWearableFlow || isHeadphoneFlow || isFeaturePhoneFlow) {
                          setIsCategorySelectorOpen(true);
                        } else {
                          setIsRamSelectorOpen(true);
                        }
                      }, 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">{t('color')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setTimeout(() => {
                        setCategory(prev => `${prev} → `);
                        setIsColorSelectorOpen(false);
                        setTimeout(() => {
                          if (isTabletOrLaptopFlow || isTvFlow || isAudioFlow || isCameraFlow || isRefrigeratorFlow || isWashingMachineFlow || isDishwasherFlow || isAcFlow || isVacuumFlow || isMicrowaveFlow || isSmallApplianceFlow) {
                            setIsDeliverySelectorOpen(true);
                          } else {
                            setIsConditionSelectorOpen(true);
                          }
                        }, 300);
                      }, 150);
                    }}
                    className="text-[14px] font-medium text-[#2563EB] hover:bg-[#2563EB]/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Keç
                  </button>
                  <button 
                    onClick={() => setIsColorSelectorOpen(false)} 
                    className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {(isGamingFlow ? [t('black'), t('white'), t('gray'), t('blue'), t('red'), t('green'), t('other')] : isTvFlow ? [t('black'), t('silver'), t('white'), t('other')] : isAudioFlow ? [t('black'), t('white'), t('silver'), t('gray'), t('other')] : isCameraFlow ? [t('black'), t('white'), t('silver'), t('gray'), t('other')] : [t('black'), t('white'), t('silver'), t('gold'), t('blue'), t('red'), t('green'), t('gray'), t('other')]).map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColorLocal(color);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${color}`);
                          setIsColorSelectorOpen(false);
                          setSelectedColorLocal('');
                          setTimeout(() => {
                            if (isTabletOrLaptopFlow || isTvFlow || isAudioFlow || isCameraFlow || isRefrigeratorFlow || isWashingMachineFlow || isDishwasherFlow || isAcFlow || isVacuumFlow || isMicrowaveFlow || isSmallApplianceFlow) {
                              setIsDeliverySelectorOpen(true);
                            } else {
                              setIsConditionSelectorOpen(true);
                            }
                          }, 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedColorLocal === color 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      {/* No-frost Selector Bottom Sheet */}
      <AnimatePresence>
        {isNoFrostSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsNoFrostSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => {
                    setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                    setIsNoFrostSelectorOpen(false);
                    setTimeout(() => { setIsCapacitySelectorOpen(true); }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">No-frost</h3>
                <button 
                  onClick={() => setIsNoFrostSelectorOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {['Var', 'Yoxdur'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedNoFrostLocal(option);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${option}`);
                          setIsNoFrostSelectorOpen(false);
                          setSelectedNoFrostLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedNoFrostLocal === option 
                          ? 'border-[#2563EB] bg-[#2563EB]/5' 
                          : 'border-gray-100 hover:border-[#2563EB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-medium ${
                        selectedNoFrostLocal === option ? 'text-[#2563EB]' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                      {selectedNoFrostLocal === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Condition Selector Bottom Sheet */}
      <AnimatePresence>
        {isConditionSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsConditionSelectorOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full h-[50vh] rounded-t-[20px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setCategory(prev => prev.split(' → ').slice(0, -1).join(' → '));
                      setIsConditionSelectorOpen(false);
                      setTimeout(() => {
                        if (isCameraFlow) {
                          setIsResolutionSelectorOpen(true);
                        } else if (isRefrigeratorFlow) {
                          setIsNoFrostSelectorOpen(true);
                        } else if (isWashingMachineFlow) {
                          setIsWashingMachineTypeSelectorOpen(true);
                        } else if (isDishwasherFlow) {
                          setIsEnergyClassSelectorOpen(true);
                        } else if (isAcFlow) {
                          setIsAcTypeSelectorOpen(true);
                        } else if (isVacuumFlow) {
                          setIsVacuumPowerSelectorOpen(true);
                        } else if (isMicrowaveFlow) {
                          setIsMicrowavePowerSelectorOpen(true);
                        } else if (isSmallApplianceFlow) {
                          setIsSmallApplianceTypeSelectorOpen(true);
                        } else {
                          setIsColorSelectorOpen(true);
                        }
                      }, 300);
                    }} 
                    className="p-2 -ml-2 text-[#111827] hover:bg-[#F7F8FC] rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-[18px] font-semibold text-[#111827] ml-2">{t('condition')}</h2>
                </div>
                <button 
                  onClick={() => setIsConditionSelectorOpen(false)} 
                  className="p-2 text-[#6B7280] hover:bg-[#F7F8FC] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  {[t('new'), t('used')].map(condition => (
                    <button
                      key={condition}
                      onClick={() => {
                        setSelectedConditionLocal(condition);
                        setTimeout(() => {
                          setCategory(prev => `${prev} → ${condition}`);
                          setIsConditionSelectorOpen(false);
                          setSelectedConditionLocal('');
                          setTimeout(() => {
                            if (isCameraFlow || isRefrigeratorFlow || isWashingMachineFlow || isDishwasherFlow || isAcFlow || isVacuumFlow || isMicrowaveFlow || isSmallApplianceFlow) {
                              setIsColorSelectorOpen(true);
                            } else {
                              setIsDeliverySelectorOpen(true);
                            }
                          }, 300);
                        }, 150);
                      }}
                      className={`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center ${
                        selectedConditionLocal === condition 
                          ? 'border-[#5B5CFF] bg-[#EEF0FF] text-[#5B5CFF]' 
                          : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#EEF0FF] hover:border-[#5B5CFF] hover:text-[#5B5CFF]'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
