const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Update Vacuum Type options
content = content.replace(
  /\['Klassik', 'Şaquli \(simsiz\)', 'Robot', 'Yuyucu', 'Digər'\]/g,
  `['Torbalı', 'Konteynerli', 'Robot', 'Şaquli', 'Yuyucu']`
);

// 2. Change Vacuum Power next to Condition (skip BagType)
content = content.replace(
  /setIsVacuumPowerSelectorOpen\(false\);\s*setSelectedVacuumPowerLocal\(''\);\s*setTimeout\(\(\) => \{ setIsBagTypeSelectorOpen\(true\); \}, 300\);/g,
  `setIsVacuumPowerSelectorOpen(false);
                          setSelectedVacuumPowerLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);`
);

// 3. Change Condition back to Vacuum Power (for Vacuum flow)
content = content.replace(
  /\} else if \(isVacuumFlow\) \{\s*setIsBagTypeSelectorOpen\(true\);/g,
  `} else if (isVacuumFlow) {
                          setIsVacuumPowerSelectorOpen(true);`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated Vacuum flow');
