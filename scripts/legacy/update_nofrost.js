const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Add state variable
if (!content.includes('isNoFrostSelectorOpen')) {
  const stateVarStr = `  const [isNoFrostSelectorOpen, setIsNoFrostSelectorOpen] = useState(false);
  const [selectedNoFrostLocal, setSelectedNoFrostLocal] = useState('');`;
  
  content = content.replace(
    "const [isEnergyClassSelectorOpen, setIsEnergyClassSelectorOpen] = useState(false);",
    "const [isEnergyClassSelectorOpen, setIsEnergyClassSelectorOpen] = useState(false);\n" + stateVarStr
  );
}

// 2. Add Modal
if (!content.includes('No-frost Selector Bottom Sheet')) {
  const modalStr = `
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
                          setCategory(prev => \`\${prev} → \${option}\`);
                          setIsNoFrostSelectorOpen(false);
                          setSelectedNoFrostLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);
                        }, 150);
                      }}
                      className={\`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 \${
                        selectedNoFrostLocal === option 
                          ? 'border-[#FF4F00] bg-[#FF4F00]/5' 
                          : 'border-gray-100 hover:border-[#FF4F00]/30 hover:bg-gray-50'
                      }\`}
                    >
                      <span className={\`text-base font-medium \${
                        selectedNoFrostLocal === option ? 'text-[#FF4F00]' : 'text-gray-700'
                      }\`}>
                        {option}
                      </span>
                      {selectedNoFrostLocal === option && (
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
  
  content = content.replace(
    "{/* Condition Selector Bottom Sheet */}",
    modalStr + "\n      {/* Condition Selector Bottom Sheet */}"
  );
}

// 3. Update Refrigerator Capacity to go to NoFrost instead of EnergyClass
content = content.replace(
  /setTimeout\(\(\) => setIsEnergyClassSelectorOpen\(true\), 300\);\s*\}, 150\);\s*\}\}\s*className=\{\`h-\[44px\] px-4 rounded-\[12px\] border text-\[14px\] font-medium transition-colors flex items-center justify-center \$\{/g,
  `setTimeout(() => {
                          if (isRefrigeratorFlow) {
                            setIsNoFrostSelectorOpen(true);
                          } else {
                            setIsEnergyClassSelectorOpen(true);
                          }
                        }, 300);
                        }, 150);
                      }}
                      className={\`h-[44px] px-4 rounded-[12px] border text-[14px] font-medium transition-colors flex items-center justify-center \${`
);

// 4. Update Condition back button to go to NoFrost for Refrigerator
content = content.replace(
  /\} else if \(isRefrigeratorFlow\) \{\s*setIsEnergyClassSelectorOpen\(true\);/g,
  `} else if (isRefrigeratorFlow) {
                          setIsNoFrostSelectorOpen(true);`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated No-frost modal');
