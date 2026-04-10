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
  if (line.includes('return (')) {
    console.log('Depth at return statement (line ' + (i + 1) + '):', depth);
  }
}
