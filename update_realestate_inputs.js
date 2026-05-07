const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// Replace Area Range Selector
content = content.replace(
  /<div className="flex-1 overflow-y-auto p-4">\s*<div className="space-y-2">\s*\{\['0–50 m²', '50–100 m²', '100–150 m²', '150\+ m²'\]\.map\(\(option\) => \([\s\S]*?<\/button>\s*\)\)\}\s*<\/div>\s*\{selectedAreaRangeLocal === 'Digər' && \(\s*<motion\.div[\s\S]*?<\/motion\.div>\s*\)\}\s*<\/div>/,
  `<div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                  <input
                    type="number"
                    placeholder="Sahəni daxil edin (m²)"
                    className="w-full h-[48px] px-4 rounded-xl border border-gray-200 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setCategory(prev => \`\${prev} → \${val} m²\`);
                          setIsAreaRangeSelectorOpen(false);
                          setTimeout(() => { setIsFloorRangeSelectorOpen(true) }, 300);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling;
                      if (input.value.trim()) {
                        const val = input.value.trim();
                        setCategory(prev => \`\${prev} → \${val} m²\`);
                        setIsAreaRangeSelectorOpen(false);
                        setTimeout(() => { setIsFloorRangeSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[48px] bg-[#FF4F00] text-white rounded-xl font-medium hover:bg-[#E64600] transition-colors"
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>`
);

// Replace Floor Range Selector
content = content.replace(
  /<div className="flex-1 overflow-y-auto p-4">\s*<div className="space-y-2">\s*\{\['1–5', '6–10', '11–15', '16\+'\]\.map\(\(option\) => \([\s\S]*?<\/button>\s*\)\)\}\s*<\/div>\s*\{selectedFloorRangeLocal === 'Digər' && \(\s*<motion\.div[\s\S]*?<\/motion\.div>\s*\)\}\s*<\/div>/,
  `<div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                  <input
                    type="number"
                    placeholder="Mərtəbəni daxil edin"
                    className="w-full h-[48px] px-4 rounded-xl border border-gray-200 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setCategory(prev => \`\${prev} → \${val} mərtəbə\`);
                          setIsFloorRangeSelectorOpen(false);
                          setTimeout(() => { setIsTotalFloorRangeSelectorOpen(true) }, 300);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling;
                      if (input.value.trim()) {
                        const val = input.value.trim();
                        setCategory(prev => \`\${prev} → \${val} mərtəbə\`);
                        setIsFloorRangeSelectorOpen(false);
                        setTimeout(() => { setIsTotalFloorRangeSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[48px] bg-[#FF4F00] text-white rounded-xl font-medium hover:bg-[#E64600] transition-colors"
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>`
);

// Replace Total Floor Range Selector
content = content.replace(
  /<div className="flex-1 overflow-y-auto p-4">\s*<div className="space-y-2">\s*\{\['1–5', '6–10', '11–15', '16\+'\]\.map\(\(option\) => \([\s\S]*?<\/button>\s*\)\)\}\s*<\/div>\s*\{selectedTotalFloorRangeLocal === 'Digər' && \(\s*<motion\.div[\s\S]*?<\/motion\.div>\s*\)\}\s*<\/div>/,
  `<div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                  <input
                    type="number"
                    placeholder="Ümumi mərtəbə sayını daxil edin"
                    className="w-full h-[48px] px-4 rounded-xl border border-gray-200 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setCategory(prev => \`\${prev} → \${val} ümumi mərtəbə\`);
                          setIsTotalFloorRangeSelectorOpen(false);
                          setTimeout(() => { setIsRepairStatusSelectorOpen(true) }, 300);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling;
                      if (input.value.trim()) {
                        const val = input.value.trim();
                        setCategory(prev => \`\${prev} → \${val} ümumi mərtəbə\`);
                        setIsTotalFloorRangeSelectorOpen(false);
                        setTimeout(() => { setIsRepairStatusSelectorOpen(true) }, 300);
                      }
                    }}
                    className="w-full h-[48px] bg-[#FF4F00] text-white rounded-xl font-medium hover:bg-[#E64600] transition-colors"
                  >
                    Təsdiqlə
                  </button>
                </div>
              </div>`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated real estate input modals');
