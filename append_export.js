const fs = require('fs');
fs.appendFileSync('components/screens/CreateListingScreen.tsx', '\nexport default CreateListingScreen;\n');
console.log('Appended export default CreateListingScreen;');
