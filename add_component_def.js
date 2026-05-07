const fs = require('fs');
const filePath = 'components/screens/CreateListingScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const insertString = `
const CreateListingScreen = ({ onNavigate }: CreateListingScreenProps) => {
  const { t } = useLanguage();
`;

content = content.replace('  const [category, setCategory] = useState(\'\');', insertString + '\n  const [category, setCategory] = useState(\'\');');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added CreateListingScreen definition back!');
