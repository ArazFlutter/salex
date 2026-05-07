const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Add Skip button to Color Selector
const colorSkipButton = `
                <button 
                  onClick={() => {
                    setTimeout(() => {
                      setCategory(prev => \`\${prev} → \`);
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
                  className="text-[14px] font-medium text-[#FF4F00] hover:bg-[#FF4F00]/10 px-4 py-2 rounded-xl transition-colors"
                >
                  Keç
                </button>
              </div>`;

content = content.replace(
  /<\/button>\s*<\/div>\s*<div className="p-6 overflow-y-auto flex-1">/g,
  (match, offset, string) => {
    // Only replace the one in Color Selector and Delivery Selector
    return match;
  }
);

// Actually, let's use a more precise replacement.
// Find the header of Color Selector:
content = content.replace(
  /<h2 className="text-\[18px\] font-semibold text-\[#111827\] ml-2">\{t\('color'\)\}<\/h2>\s*<\/div>\s*<button\s*onClick=\{\(\) => setIsColorSelectorOpen\(false\)\}\s*className="p-2 text-\[#6B7280\] hover:bg-\[#F7F8FC\] rounded-full transition-colors"\s*>\s*<X size=\{24\} \/>\s*<\/button>\s*<\/div>/g,
  `<h2 className="text-[18px] font-semibold text-[#111827] ml-2">{t('color')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setTimeout(() => {
                        setCategory(prev => \`\${prev} → \`);
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
                    className="text-[14px] font-medium text-[#FF4F00] hover:bg-[#FF4F00]/10 px-3 py-1.5 rounded-lg transition-colors"
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
              </div>`
);

// Find the header of Delivery Selector:
content = content.replace(
  /<h2 className="text-\[18px\] font-semibold text-\[#111827\] ml-2">\{t\('delivery'\)\}<\/h2>\s*<\/div>\s*<button\s*onClick=\{\(\) => setIsDeliverySelectorOpen\(false\)\}\s*className="p-2 text-\[#6B7280\] hover:bg-\[#F7F8FC\] rounded-full transition-colors"\s*>\s*<X size=\{24\} \/>\s*<\/button>\s*<\/div>/g,
  `<h2 className="text-[18px] font-semibold text-[#111827] ml-2">{t('delivery')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setTimeout(() => {
                        setCategory(prev => \`\${prev} → \`);
                        setIsDeliverySelectorOpen(false);
                      }, 150);
                    }}
                    className="text-[14px] font-medium text-[#FF4F00] hover:bg-[#FF4F00]/10 px-3 py-1.5 rounded-lg transition-colors"
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
              </div>`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Added Skip buttons to Color and Delivery');
