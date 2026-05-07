const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Change Microwave flow start
content = content.replace(
  /\} else if \(isMicrowaveFlow\) \{\s*setCategory\(\[\.\.\.categoryPath, option\]\.join\(' → '\)\);\s*setIsCategorySelectorOpen\(false\);\s*setTimeout\(\(\) => setIsMicrowaveTypeSelectorOpen\(true\), 300\);/g,
  `} else if (isMicrowaveFlow) {
                                      setCategory([...categoryPath, option].join(' → '));
                                      setIsCategorySelectorOpen(false);
                                      setTimeout(() => setIsMicrowaveCapacitySelectorOpen(true), 300);`
);

// 2. Change Capacity back to Category
content = content.replace(
  /setIsMicrowaveCapacitySelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsMicrowaveTypeSelectorOpen\(true\); \}, 300\);/g,
  `setIsMicrowaveCapacitySelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated Microwave flow');
