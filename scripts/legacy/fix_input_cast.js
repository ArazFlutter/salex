const fs = require('fs');
const filePath = 'components/screens/CreateListingScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/const input = e\.currentTarget\.previousElementSibling;/g, 'const input = e.currentTarget.previousElementSibling as HTMLInputElement;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed input casting!');
