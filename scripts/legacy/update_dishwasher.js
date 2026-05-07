const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Change Dishwasher flow start
content = content.replace(
  /\} else if \(isDishwasherFlow\) \{\s*setCategory\(\[\.\.\.categoryPath, option\]\.join\(' → '\)\);\s*setIsCategorySelectorOpen\(false\);\s*setTimeout\(\(\) => setIsDishwasherTypeSelectorOpen\(true\), 300\);/g,
  `} else if (isDishwasherFlow) {
                                      setCategory([...categoryPath, option].join(' → '));
                                      setIsCategorySelectorOpen(false);
                                      setTimeout(() => setIsDishwasherCapacitySelectorOpen(true), 300);`
);

// 2. Change Capacity next to Type
content = content.replace(
  /setIsDishwasherCapacitySelectorOpen\(false\);\s*setSelectedDishwasherCapacityLocal\(''\);\s*setTimeout\(\(\) => \{ setIsEnergyClassSelectorOpen\(true\); \}, 300\);/g,
  `setIsDishwasherCapacitySelectorOpen(false);
                          setSelectedDishwasherCapacityLocal('');
                          setTimeout(() => { setIsDishwasherTypeSelectorOpen(true); }, 300);`
);

// 3. Change Capacity back to Category
content = content.replace(
  /setIsDishwasherCapacitySelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsDishwasherTypeSelectorOpen\(true\); \}, 300\);/g,
  `setIsDishwasherCapacitySelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);`
);

// 4. Change Type next to Energy Class
content = content.replace(
  /setIsDishwasherTypeSelectorOpen\(false\);\s*setSelectedDishwasherTypeLocal\(''\);\s*setTimeout\(\(\) => \{ setIsDishwasherCapacitySelectorOpen\(true\); \}, 300\);/g,
  `setIsDishwasherTypeSelectorOpen(false);
                          setSelectedDishwasherTypeLocal('');
                          setTimeout(() => { setIsEnergyClassSelectorOpen(true); }, 300);`
);

// 5. Change Type back to Capacity
content = content.replace(
  /setIsDishwasherTypeSelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsCategorySelectorOpen\(true\); \}, 300\);/g,
  `setIsDishwasherTypeSelectorOpen(false);
                    setTimeout(() => { setIsDishwasherCapacitySelectorOpen(true); }, 300);`
);

// 6. Change Energy Class back to Type
content = content.replace(
  /\} else if \(isDishwasherFlow\) \{\s*setIsDishwasherCapacitySelectorOpen\(true\);/g,
  `} else if (isDishwasherFlow) {
                          setIsDishwasherTypeSelectorOpen(true);`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated Dishwasher flow');
