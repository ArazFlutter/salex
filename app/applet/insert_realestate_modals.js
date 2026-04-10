const fs = require('fs');

const modals = [
  { name: 'ListingType', title: 'Elanın növü', options: ['Satılır', 'Kirayə (uzunmüddətli)', 'Kirayə (günlük)'], prev: 'Category' },
  { name: 'LocationType', title: 'Yerləşmə', options: ['Şəhər', 'Rayon', 'Qəsəbə / Metro'], prev: 'ListingType' },
  
  // Mənzillər
  { name: 'RoomCount', title: 'Otaq sayı', options: ['1 otaqlı', '2 otaqlı', '3 otaqlı', '4 otaqlı', '5+ otaqlı'], prev: 'LocationType' },
  { name: 'AreaRange', title: 'Sahə (m²)', options: ['0–50 m²', '50–100 m²', '100–150 m²', '150+ m²'], prev: 'RoomCount' },
  { name: 'FloorRange', title: 'Mərtəbə', options: ['1–5', '5–10', '10+'], prev: 'AreaRange' },
  { name: 'TotalFloorsRange', title: 'Mərtəbə sayı', options: ['1–5', '5–10', '10+'], prev: 'FloorRange' },
  { name: 'RepairStatus', title: 'Təmir', options: ['Təmirli', 'Təmirsiz'], prev: 'RealEstateCondition' },
  { name: 'ApartmentFeatures', title: 'Əlavə', options: ['Lift', 'Balkon', 'Kupça', 'Kombi', 'Əşyalı', 'Digər'], prev: 'RepairStatus' },

  // Villalar, bağ evləri
  { name: 'VillaAreaRange', title: 'Sahə (m²)', options: ['0–100 m²', '100–200 m²', '200–300 m²', '300+ m²'], prev: 'LocationType' },
  { name: 'LandAreaRange', title: 'Torpaq sahəsi', options: ['1–3 sot', '3–6 sot', '6–10 sot', '10+ sot'], prev: 'VillaAreaRange' },
  { name: 'VillaRoomCount', title: 'Otaq sayı', options: ['1–3 otaqlı', '4–6 otaqlı', '7+ otaqlı'], prev: 'LandAreaRange' },
  { name: 'VillaFeatures', title: 'Əlavə', options: ['Həyət', 'Hovuz', 'Qaraj', 'Kupça', 'Digər'], prev: 'RealEstateCondition' },

  // Obyektlər və ofislər
  { name: 'ObjectAreaRange', title: 'Sahə (m²)', options: ['0–50 m²', '50–100 m²', '100–200 m²', '200+ m²'], prev: 'LocationType' },
  { name: 'PropertyType', title: 'Obyektin növü', options: ['Ofis', 'Mağaza', 'Restoran', 'Anbar', 'Digər'], prev: 'ObjectAreaRange' },
  { name: 'ObjectFeatures', title: 'Əlavə', options: ['Kupça', 'Təmirli', 'Yol kənarı', 'Digər'], prev: 'RealEstateCondition' },

  // Torpaq
  { name: 'LandOnlyAreaRange', title: 'Torpaq sahəsi', options: ['1–5 sot', '5–10 sot', '10–20 sot', '20+ sot'], prev: 'LocationType' },
  { name: 'LandPurpose', title: 'Təyinatı', options: ['Yaşayış', 'Kommersiya', 'Kənd təsərrüfatı'], prev: 'LandOnlyAreaRange' },
  { name: 'Documents', title: 'Sənədlər', options: ['Kupça var', 'Kupça yoxdur'], prev: 'LandPurpose' },

  // Qarajlar
  { name: 'GarageAreaRange', title: 'Sahə (m²)', options: ['10–20 m²', '20–30 m²', '30+ m²'], prev: 'LocationType' },
  { name: 'GarageType', title: 'Növü', options: ['Açıq', 'Qapalı', 'Yeraltı'], prev: 'GarageAreaRange' },

  // Common
  { name: 'RealEstateCondition', title: 'Vəziyyəti', options: ['Yeni tikili', 'Köhnə tikili'], prev: 'TotalFloorsRange' } // Prev is dynamic
];

let output = '';

modals.forEach(modal => {
  const stateName = `is${modal.name}SelectorOpen`;
  const selectedState = `selected${modal.name}Local`;
  const setOpen = `setIs${modal.name}SelectorOpen`;
  const setSelected = `setSelected${modal.name}Local`;
  
  let prevAction = '';
  if (modal.prev === 'Category') {
    prevAction = `setIsCategorySelectorOpen(true)`;
  } else if (modal.name === 'RealEstateCondition') {
    prevAction = `
      if (isApartmentFlow) setIsTotalFloorsRangeSelectorOpen(true);
      else if (isVillaFlow) setIsVillaRoomCountSelectorOpen(true);
      else if (isObjectFlow) setIsPropertyTypeSelectorOpen(true);
      else if (isGarageFlow) setIsGarageTypeSelectorOpen(true);
    `;
  } else {
    prevAction = `setIs${modal.prev}SelectorOpen(true)`;
  }

  // Determine next action based on the flow
  let nextAction = '';
  if (modal.name === 'LocationType') {
    nextAction = `
      if (isApartmentFlow) setIsRoomCountSelectorOpen(true);
      else if (isVillaFlow) setIsVillaAreaRangeSelectorOpen(true);
      else if (isObjectFlow) setIsObjectAreaRangeSelectorOpen(true);
      else if (isLandFlow) setIsLandOnlyAreaRangeSelectorOpen(true);
      else if (isGarageFlow) setIsGarageAreaRangeSelectorOpen(true);
    `;
  } else if (modal.name === 'TotalFloorsRange' || modal.name === 'VillaRoomCount' || modal.name === 'PropertyType' || modal.name === 'GarageType') {
    nextAction = `setIsRealEstateConditionSelectorOpen(true)`;
  } else if (modal.name === 'ApartmentFeatures' || modal.name === 'VillaFeatures' || modal.name === 'ObjectFeatures' || modal.name === 'Documents') {
    nextAction = `setIsDeliverySelectorOpen(true)`; // Or finish flow
  } else if (modal.name === 'ListingType') {
    nextAction = `setIsLocationTypeSelectorOpen(true)`;
  } else if (modal.name === 'RoomCount') {
    nextAction = `setIsAreaRangeSelectorOpen(true)`;
  } else if (modal.name === 'AreaRange') {
    nextAction = `setIsFloorRangeSelectorOpen(true)`;
  } else if (modal.name === 'FloorRange') {
    nextAction = `setIsTotalFloorsRangeSelectorOpen(true)`;
  } else if (modal.name === 'RepairStatus') {
    nextAction = `setIsApartmentFeaturesSelectorOpen(true)`;
  } else if (modal.name === 'VillaAreaRange') {
    nextAction = `setIsLandAreaRangeSelectorOpen(true)`;
  } else if (modal.name === 'LandAreaRange') {
    nextAction = `setIsVillaRoomCountSelectorOpen(true)`;
  } else if (modal.name === 'ObjectAreaRange') {
    nextAction = `setIsPropertyTypeSelectorOpen(true)`;
  } else if (modal.name === 'LandOnlyAreaRange') {
    nextAction = `setIsLandPurposeSelectorOpen(true)`;
  } else if (modal.name === 'LandPurpose') {
    nextAction = `setIsDocumentsSelectorOpen(true)`;
  } else if (modal.name === 'GarageAreaRange') {
    nextAction = `setIsGarageTypeSelectorOpen(true)`;
  } else if (modal.name === 'RealEstateCondition') {
    nextAction = `
      if (isApartmentFlow) setIsRepairStatusSelectorOpen(true);
      else if (isVillaFlow) setIsVillaFeaturesSelectorOpen(true);
      else if (isObjectFlow) setIsObjectFeaturesSelectorOpen(true);
      else setIsDeliverySelectorOpen(true);
    `;
  }

  output += `
      {/* ${modal.name} Selector Bottom Sheet */}
      <AnimatePresence>
        {${stateName} && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => ${setOpen}(false)}
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
                    ${setOpen}(false);
                    setTimeout(() => { ${prevAction}; }, 300);
                  }}
                  className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">${modal.title}</h3>
                <button 
                  onClick={() => ${setOpen}(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {[${modal.options.map(o => `'${o}'`).join(', ')}].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        ${setSelected}(option);
                        setTimeout(() => {
                          setCategory(prev => \`\${prev} → \${option}\`);
                          ${setOpen}(false);
                          ${setSelected}('');
                          setTimeout(() => { ${nextAction} }, 300);
                        }, 150);
                      }}
                      className={\`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 \${
                        ${selectedState} === option 
                          ? 'border-[#FF4F00] bg-[#FF4F00]/5' 
                          : 'border-gray-100 hover:border-[#FF4F00]/30 hover:bg-gray-50'
                      }\`}
                    >
                      <span className={\`text-base font-medium \${
                        ${selectedState} === option ? 'text-[#FF4F00]' : 'text-gray-700'
                      }\`}>
                        {option}
                      </span>
                      {${selectedState} === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-[#FF4F00] flex items-center justify-center"
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
`;
});

const file = 'components/screens/CreateListingScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('{/* Screen Size Selector Bottom Sheet */}', output + '\n      {/* Screen Size Selector Bottom Sheet */}');

// Add state variables
const stateVars = modals.map(m => `  const [is${m.name}SelectorOpen, setIs${m.name}SelectorOpen] = useState(false);\n  const [selected${m.name}Local, setSelected${m.name}Local] = useState('');`).join('\n');
content = content.replace('const [isScreenSizeSelectorOpen, setIsScreenSizeSelectorOpen] = useState(false);', stateVars + '\n  const [isScreenSizeSelectorOpen, setIsScreenSizeSelectorOpen] = useState(false);');

// Add flow booleans
const flowBooleans = `
  const isApartmentFlow = categoryPath.includes('Mənzillər') || category.includes('Mənzillər');
  const isVillaFlow = categoryPath.includes('Villalar, bağ evləri') || category.includes('Villalar, bağ evləri');
  const isObjectFlow = categoryPath.includes('Obyektlər və ofislər') || category.includes('Obyektlər və ofislər');
  const isLandFlow = categoryPath.includes('Torpaq') || category.includes('Torpaq');
  const isGarageFlow = categoryPath.includes('Qarajlar') || category.includes('Qarajlar');
  const isRealEstateFlow = isApartmentFlow || isVillaFlow || isObjectFlow || isLandFlow || isGarageFlow;
`;
content = content.replace('const isDeviceFlow =', flowBooleans + '\n  const isDeviceFlow =');

fs.writeFileSync(file, content);
