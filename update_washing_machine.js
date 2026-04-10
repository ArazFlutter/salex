const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Change WashingMachine flow start
content = content.replace(
  /\} else if \(isWashingMachineFlow\) \{\s*setCategory\(\[\.\.\.categoryPath, option\]\.join\(' → '\)\);\s*setIsCategorySelectorOpen\(false\);\s*setTimeout\(\(\) => setIsWashingMachineTypeSelectorOpen\(true\), 300\);/g,
  `} else if (isWashingMachineFlow) {
                                      setCategory([...categoryPath, option].join(' → '));
                                      setIsCategorySelectorOpen(false);
                                      setTimeout(() => setIsWashingMachineCapacitySelectorOpen(true), 300);`
);

// 2. Change Capacity next to Spin
content = content.replace(
  /setIsWashingMachineCapacitySelectorOpen\(false\);\s*setSelectedWashingMachineCapacityLocal\(''\);\s*setTimeout\(\(\) => \{ setIsSpinSpeedSelectorOpen\(true\); \}, 300\);/g,
  `setIsWashingMachineCapacitySelectorOpen(false);
                          setSelectedWashingMachineCapacityLocal('');
                          setTimeout(() => { setIsSpinSpeedSelectorOpen(true); }, 300);`
);

// 3. Change Capacity back to Category
content = content.replace(
  /setIsWashingMachineCapacitySelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsWashingMachineTypeSelectorOpen\(true\); \}, 300\);/g,
  `setIsWashingMachineCapacitySelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);`
);

// 4. Change Spin next to Type
content = content.replace(
  /setIsSpinSpeedSelectorOpen\(false\);\s*setSelectedSpinSpeedLocal\(''\);\s*setTimeout\(\(\) => \{ setIsConditionSelectorOpen\(true\); \}, 300\);/g,
  `setIsSpinSpeedSelectorOpen(false);
                          setSelectedSpinSpeedLocal('');
                          setTimeout(() => { setIsWashingMachineTypeSelectorOpen(true); }, 300);`
);

// 5. Change Spin back to Capacity
content = content.replace(
  /setIsSpinSpeedSelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsWashingMachineCapacitySelectorOpen\(true\); \}, 300\);/g,
  `setIsSpinSpeedSelectorOpen(false);
                    setTimeout(() => { setIsWashingMachineCapacitySelectorOpen(true); }, 300);`
);

// 6. Change Type next to Condition
content = content.replace(
  /setIsWashingMachineTypeSelectorOpen\(false\);\s*setSelectedWashingMachineTypeLocal\(''\);\s*setTimeout\(\(\) => \{ setIsWashingMachineCapacitySelectorOpen\(true\); \}, 300\);/g,
  `setIsWashingMachineTypeSelectorOpen(false);
                          setSelectedWashingMachineTypeLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);`
);

// 7. Change Type back to Spin
content = content.replace(
  /setIsWashingMachineTypeSelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsCategorySelectorOpen\(true\); \}, 300\);/g,
  `setIsWashingMachineTypeSelectorOpen(false);
                    setTimeout(() => { setIsSpinSpeedSelectorOpen(true); }, 300);`
);

// 8. Change Condition back to Type
content = content.replace(
  /\} else if \(isWashingMachineFlow\) \{\s*setIsSpinSpeedSelectorOpen\(true\);/g,
  `} else if (isWashingMachineFlow) {
                          setIsWashingMachineTypeSelectorOpen(true);`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated WashingMachine flow');
