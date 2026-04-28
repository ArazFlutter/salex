const fs = require('fs');
const filePath = 'components/screens/CreateListingScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('const CreateListingScreen = ({ onNavigate }: CreateListingScreenProps) => {', 'export const CreateListingScreen = ({ onNavigate }: CreateListingScreenProps) => {');
content = content.replace('export default CreateListingScreen;', '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed export!');
