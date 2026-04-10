const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

const newAppliancesData = `    'Soyuducular': {
      'Samsung': ['Bespoke', 'Family Hub', 'SpaceMax', 'RB7300', 'RT6000', 'RS8000', 'Digər model'],
      'LG': ['InstaView', 'Door-in-Door', 'NatureFresh', 'ThinQ', 'GC-B', 'GR-X', 'Digər model'],
      'Beko': ['NeoFrost', 'EverFresh+', 'HarvestFresh', 'RCNE', 'RDNE', 'Digər model'],
      'Bosch': ['Serie 2', 'Serie 4', 'Serie 6', 'Serie 8', 'VarioStyle', 'VitaFresh', 'Digər model'],
      'Hoffmann': ['HFF', 'HFR', 'Digər model'],
      'Gorenje': ['Retro', 'NoFrost Plus', 'Digər model'],
      'Haier': ['Cube', 'French Door', 'Digər model'],
      'Digər marka': []
    },
    'Paltaryuyan maşınlar': {
      'Samsung': ['EcoBubble', 'AddWash', 'QuickDrive', 'AI Control', 'WW90', 'WW80', 'Digər model'],
      'LG': ['AI DD', 'TwinWash', 'Steam', 'F4', 'F2', 'Digər model'],
      'Beko': ['ProSmart', 'AquaWave', 'SteamCure', 'WUE', 'WTV', 'Digər model'],
      'Bosch': ['Serie 2', 'Serie 4', 'Serie 6', 'Serie 8', 'HomeProfessional', 'i-DOS', 'Digər model'],
      'Hoffmann': ['HWM', 'Digər model'],
      'Indesit': ['Innex', 'EcoTime', 'Digər model'],
      'Hotpoint': ['ActiveCare', 'Digər model'],
      'Digər marka': []
    },
    'Qabyuyan maşınlar': {
      'Samsung': ['WaterWall', 'StormWash', 'DW60', 'Digər model'],
      'Beko': ['CornerIntense', 'AutoDose', 'DFN', 'DIN', 'Digər model'],
      'Bosch': ['Serie 2', 'Serie 4', 'Serie 6', 'Serie 8', 'PerfectDry', 'Digər model'],
      'LG': ['QuadWash', 'TrueSteam', 'Digər model'],
      'Hoffmann': ['HDW', 'Digər model'],
      'Digər marka': []
    },
    'Kondisionerlər': {
      'Samsung': ['WindFree', 'AR9500T', 'AR7500', 'Digər model'],
      'LG': ['Dual Inverter', 'Artcool', 'Sirius', 'Digər model'],
      'Gree': ['Bora', 'Fairy', 'Amber', 'Lomo', 'Digər model'],
      'Midea': ['Blanc', 'Mission', 'Xtreme Save', 'Oasis Plus', 'Digər model'],
      'Mitsubishi': ['Heavy Industries', 'Electric', 'Digər model'],
      'Daikin': ['Ururu Sarara', 'Emura', 'Sensira', 'Digər model'],
      'Aux': ['Freedom', 'J-Smart', 'Digər model'],
      'Digər marka': []
    },
    'Tozsoranlar': {
      'Samsung': ['Jet', 'Bespoke Jet', 'CycloneForce', 'Digər model'],
      'LG': ['CordZero', 'Kompressor', 'Cyking', 'Digər model'],
      'Bosch': ['Athlet', 'Flexxo', 'Unlimited', 'ProAnimal', 'Digər model'],
      'Dyson': ['V8', 'V10', 'V11', 'V12', 'V15', 'Gen5detect', 'Cinetic Big Ball', 'Digər model'],
      'Karcher': ['WD 3', 'WD 4', 'WD 5', 'VC 3', 'DS 6', 'Digər model'],
      'Philips': ['SpeedPro', 'PowerPro', 'Performer', 'Digər model'],
      'Digər marka': []
    },
    'Mikrodalğalı sobalar': {
      'Samsung': ['Bespoke', 'Smart Oven', 'Solo', 'Grill', 'Digər model'],
      'LG': ['NeoChef', 'Smart Inverter', 'Digər model'],
      'Panasonic': ['Inverter', 'Digər model'],
      'Bosch': ['Serie 2', 'Serie 4', 'Serie 6', 'Serie 8', 'Digər model'],
      'Beko': ['MGF', 'MOC', 'Digər model'],
      'Digər marka': []
    },
    'Kiçik mətbəx texnikası': {
      'Philips': ['Airfryer', 'Viva Collection', 'Avance Collection', 'Digər model'],
      'Bosch': ['OptiMUM', 'ErgoMixx', 'CleverMixx', 'Digər model'],
      'Tefal': ['OptiGrill', 'ActiFry', 'Digər model'],
      'Braun': ['Multiquick', 'PurEase', 'Digər model'],
      'Kenwood': ['Chef', 'kMix', 'Prospero', 'Digər model'],
      'Delonghi': ['Magnifica', 'Dedica', 'Dinamica', 'Digər model'],
      'Moulinex': ['Masterchef', 'Subito', 'Digər model'],
      'Digər marka': []
    }`;

const startIndex = content.indexOf("'Soyuducular': {");
const endIndex = content.indexOf("'Digər': null");

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  content = before + newAppliancesData + ',\n    ' + after;
  fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
  console.log('Updated categoryData');
} else {
  console.log('Could not find indices');
}
