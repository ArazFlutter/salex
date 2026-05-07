const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// 1. Change AC flow start
content = content.replace(
  /\} else if \(isAcFlow\) \{\s*setCategory\(\[\.\.\.categoryPath, option\]\.join\(' → '\)\);\s*setIsCategorySelectorOpen\(false\);\s*setTimeout\(\(\) => setIsAcTypeSelectorOpen\(true\), 300\);/g,
  `} else if (isAcFlow) {
                                      setCategory([...categoryPath, option].join(' → '));
                                      setIsCategorySelectorOpen(false);
                                      setTimeout(() => setIsBtuSelectorOpen(true), 300);`
);

// 2. Change BTU next to Area
content = content.replace(
  /setIsBtuSelectorOpen\(false\);\s*setSelectedBtuLocal\(''\);\s*setTimeout\(\(\) => \{ setIsAreaCoverageSelectorOpen\(true\); \}, 300\);/g,
  `setIsBtuSelectorOpen(false);
                          setSelectedBtuLocal('');
                          setTimeout(() => { setIsAreaCoverageSelectorOpen(true); }, 300);`
);

// 3. Change BTU back to Category
content = content.replace(
  /setIsBtuSelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsAcTypeSelectorOpen\(true\); \}, 300\);/g,
  `setIsBtuSelectorOpen(false);
                    setTimeout(() => { setIsCategorySelectorOpen(true); }, 300);`
);

// 4. Change Area next to Type
content = content.replace(
  /setIsAreaCoverageSelectorOpen\(false\);\s*setSelectedAreaCoverageLocal\(''\);\s*setTimeout\(\(\) => \{ setIsConditionSelectorOpen\(true\); \}, 300\);/g,
  `setIsAreaCoverageSelectorOpen(false);
                          setSelectedAreaCoverageLocal('');
                          setTimeout(() => { setIsAcTypeSelectorOpen(true); }, 300);`
);

// 5. Change Area back to BTU
content = content.replace(
  /setIsAreaCoverageSelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsBtuSelectorOpen\(true\); \}, 300\);/g,
  `setIsAreaCoverageSelectorOpen(false);
                    setTimeout(() => { setIsBtuSelectorOpen(true); }, 300);`
);

// 6. Change Type next to Condition
content = content.replace(
  /setIsAcTypeSelectorOpen\(false\);\s*setSelectedAcTypeLocal\(''\);\s*setTimeout\(\(\) => \{ setIsBtuSelectorOpen\(true\); \}, 300\);/g,
  `setIsAcTypeSelectorOpen(false);
                          setSelectedAcTypeLocal('');
                          setTimeout(() => { setIsConditionSelectorOpen(true); }, 300);`
);

// 7. Change Type back to Area
content = content.replace(
  /setIsAcTypeSelectorOpen\(false\);\s*setTimeout\(\(\) => \{ setIsCategorySelectorOpen\(true\); \}, 300\);/g,
  `setIsAcTypeSelectorOpen(false);
                    setTimeout(() => { setIsAreaCoverageSelectorOpen(true); }, 300);`
);

// 8. Change Condition back to Type
content = content.replace(
  /\} else if \(isAcFlow\) \{\s*setIsAreaCoverageSelectorOpen\(true\);/g,
  `} else if (isAcFlow) {
                          setIsAcTypeSelectorOpen(true);`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated AC flow');
