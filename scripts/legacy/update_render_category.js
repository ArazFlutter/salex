const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// Update Vacuum
content = content.replace(
  /\} else if \(isVacuumFlow\) \{\s*const brand = parts\[2\];\s*const model = parts\[3\];\s*const type = parts\[4\];\s*const power = parts\[5\];\s*const bagType = parts\[6\];\s*const condition = parts\[7\];\s*const color = parts\[8\];\s*const delivery = parts\[9\];\s*const specs = \[type, power, bagType, condition, color, delivery \? \`\$\{t\('delivery'\)\}: \$\{delivery\}\` : ''\]\.filter\(Boolean\)\.join\(' • '\);/g,
  `} else if (isVacuumFlow) {
      const brand = parts[2];
      const model = parts[3];
      const type = parts[4];
      const power = parts[5];
      const condition = parts[6];
      const color = parts[7];
      const delivery = parts[8];
      
      const specs = [type, power, condition, color, delivery ? \`\${t('delivery')}: \${delivery}\` : ''].filter(Boolean).join(' • ');`
);

// Update Microwave
content = content.replace(
  /\} else if \(isMicrowaveFlow\) \{\s*const brand = parts\[2\];\s*const model = parts\[3\];\s*const type = parts\[4\];\s*const capacity = parts\[5\];\s*const power = parts\[6\];\s*const condition = parts\[7\];\s*const color = parts\[8\];\s*const delivery = parts\[9\];\s*const specs = \[type, capacity, power, condition, color, delivery \? \`\$\{t\('delivery'\)\}: \$\{delivery\}\` : ''\]\.filter\(Boolean\)\.join\(' • '\);/g,
  `} else if (isMicrowaveFlow) {
      const brand = parts[2];
      const model = parts[3];
      const capacity = parts[4];
      const power = parts[5];
      const condition = parts[6];
      const color = parts[7];
      const delivery = parts[8];
      
      const specs = [capacity, power, condition, color, delivery ? \`\${t('delivery')}: \${delivery}\` : ''].filter(Boolean).join(' • ');`
);

// Update Small Appliance
content = content.replace(
  /\} else if \(isSmallApplianceFlow\) \{\s*const brand = parts\[2\];\s*const model = parts\[3\];\s*const type = parts\[4\];\s*const power = parts\[5\];\s*const condition = parts\[6\];\s*const color = parts\[7\];\s*const delivery = parts\[8\];\s*const specs = \[type, power, condition, color, delivery \? \`\$\{t\('delivery'\)\}: \$\{delivery\}\` : ''\]\.filter\(Boolean\)\.join\(' • '\);/g,
  `} else if (isSmallApplianceFlow) {
      const brand = parts[2];
      const model = parts[3];
      const type = parts[4];
      const condition = parts[5];
      const color = parts[6];
      const delivery = parts[7];
      
      const specs = [type, condition, color, delivery ? \`\${t('delivery')}: \${delivery}\` : ''].filter(Boolean).join(' • ');`
);

fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
console.log('Updated renderCategoryDisplay for Vacuum, Microwave, Small Appliance');
