const fs = require('fs');
const text = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

let depth = 0;
let lines = text.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') depth--;
  }
  if (i >= 599 && i <= 905) {
    if (depth <= 0) {
      console.log('Depth <= 0 at line ' + (i + 1) + ':', depth, line);
    }
  }
}
