const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Update SmallAppliance Type options
content = content.replace(
  /\['Blender', 'Mikser', 'Ətçəkən', 'Çaydan', 'Toster', 'Multibişirici', 'Digər'\]/g,
  `['Blender', 'Mikser', 'Ətçəkən', 'Çaydan', 'Toster', 'Multibişirici', 'Fritür', 'Digər']`
);

// 2. Change Type next to Condition
content = content.replace(
  /setIsSmallApplianceTypeSelectorOpen\(false\);\s*setSelectedSmallApplianceTypeLocal\(''\);\s*setTimeout\(\(\) => \{ setIsSmallAppliancePowerSelectorOpen\(true\); \}, 300\);/g,
  `setIsSmallApplianceTypeSelectorOpen(false);
                          setSelectedSmallApplianceTypeLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);`
);

// 3. Change Condition back to Type
content = content.replace(
  /\} else if \(isSmallApplianceFlow\) \{\s*setIsSmallAppliancePowerSelectorOpen\(true\);/g,
  `} else if (isSmallApplianceFlow) {
                          setIsSmallApplianceTypeSelectorOpen(true);`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated Small Appliance flow');
