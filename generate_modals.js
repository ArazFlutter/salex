const fs = require('fs');

const modals = [
  { name: 'WashingMachineType', title: 'Növ', options: ['Ön yükləməli', 'Üstdən yükləməli', 'Digər'], next: 'WashingMachineCapacity', prev: 'Category' },
  { name: 'WashingMachineCapacity', title: 'Tutum', options: ['3–5 kq', '5–7 kq', '7–9 kq', '9+ kq'], next: 'SpinSpeed', prev: 'WashingMachineType' },
  { name: 'SpinSpeed', title: 'Sıxma sürəti', options: ['800 rpm', '1000 rpm', '1200 rpm', '1400+ rpm'], next: 'Condition', prev: 'WashingMachineCapacity' },
  { name: 'DishwasherType', title: 'Növ', options: ['Quraşdırılan', 'Ayrı dayanan', 'Stolüstü', 'Digər'], next: 'DishwasherCapacity', prev: 'Category' },
  { name: 'DishwasherCapacity', title: 'Tutum (komplekt)', options: ['6–8', '9–11', '12–14', '15+'], next: 'EnergyClass', prev: 'DishwasherType' },
  { name: 'AcType', title: 'Növ', options: ['Split sistem', 'Mobil', 'Pəncərə', 'Kaset', 'Digər'], next: 'Btu', prev: 'Category' },
  { name: 'Btu', title: 'BTU', options: ['7000', '9000', '12000', '18000', '24000+'], next: 'AreaCoverage', prev: 'AcType' },
  { name: 'AreaCoverage', title: 'Sahə (m²)', options: ['20-yə qədər', '20–30', '30–50', '50–70', '70+'], next: 'Condition', prev: 'Btu' },
  { name: 'VacuumType', title: 'Növ', options: ['Klassik', 'Şaquli (simsiz)', 'Robot', 'Yuyucu', 'Digər'], next: 'VacuumPower', prev: 'Category' },
  { name: 'VacuumPower', title: 'Güc (W)', options: ['1000-ə qədər', '1000–1500', '1500–2000', '2000+'], next: 'BagType', prev: 'VacuumType' },
  { name: 'BagType', title: 'Toz toplayıcı', options: ['Kisəli', 'Konteynerli', 'Akvafiltrli', 'Digər'], next: 'Condition', prev: 'VacuumPower' },
  { name: 'MicrowaveType', title: 'Növ', options: ['Sade', 'Qril ilə', 'Konveksiyalı', 'Digər'], next: 'MicrowaveCapacity', prev: 'Category' },
  { name: 'MicrowaveCapacity', title: 'Həcm (L)', options: ['20-yə qədər', '20–25', '25–30', '30+'], next: 'MicrowavePower', prev: 'MicrowaveType' },
  { name: 'MicrowavePower', title: 'Güc (W)', options: ['700-ə qədər', '700–900', '900–1000', '1000+'], next: 'Condition', prev: 'MicrowaveCapacity' },
  { name: 'SmallApplianceType', title: 'Növ', options: ['Çaydan', 'Blender', 'Toster', 'Ətçəkən maşın', 'Mikser', 'Qəhvəbişirən', 'Digər'], next: 'SmallAppliancePower', prev: 'Category' },
  { name: 'SmallAppliancePower', title: 'Güc (W)', options: ['500-ə qədər', '500–1000', '1000–1500', '1500+'], next: 'Condition', prev: 'SmallApplianceType' }
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
  } else {
    prevAction = `setIs${modal.prev}SelectorOpen(true)`;
  }

  let nextAction = '';
  if (modal.next === 'Condition') {
    nextAction = `setIsConditionSelectorOpen(true)`;
  } else if (modal.next === 'EnergyClass') {
    nextAction = `setIsEnergyClassSelectorOpen(true)`;
  } else {
    nextAction = `setIs${modal.next}SelectorOpen(true)`;
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
                    setTimeout(() => ${prevAction}, 300);
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
                          setTimeout(() => ${nextAction}, 300);
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

fs.writeFileSync('modals.jsx', output);
