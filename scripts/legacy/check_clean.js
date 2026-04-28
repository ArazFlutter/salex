const fs = require('fs');
const text = fs.readFileSync('fix_category_data.js', 'utf8');
const match = text.match(/const cleanCategoryData = \`([\s\S]*?)\`;/);
const cleanCategoryData = match[1];

let depth = 0;
for (let i = 0; i < cleanCategoryData.length; i++) {
  if (cleanCategoryData[i] === '{') depth++;
  if (cleanCategoryData[i] === '}') depth--;
}
console.log('cleanCategoryData depth:', depth);
