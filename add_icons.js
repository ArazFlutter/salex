const fs = require('fs');
const filePath = 'components/screens/CreateListingScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const insertString = `
const categoryIcons: Record<string, React.ReactNode> = {
  'Elektronika': <Smartphone size={24} />,
  'Məişət texnikası': <Home size={24} />,
  'Daşınmaz əmlak': <Building size={24} />,
  'Nəqliyyat': <Car size={24} />,
  'Şəxsi əşyalar': <Smartphone size={24} />,
  'Ev və bağ': <Home size={24} />,
  'Uşaq aləmi': <Smartphone size={24} />,
  'Hobbi və asudə vaxt': <Camera size={24} />,
  'Heyvanlar': <Home size={24} />,
  'Xidmətlər və biznes': <Building size={24} />
};

export const CreateListingScreen = ({ onNavigate }: CreateListingScreenProps) => {`;

content = content.replace('export const CreateListingScreen = ({ onNavigate }: CreateListingScreenProps) => {', insertString);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added categoryIcons!');
