const fs = require('fs');

let content = fs.readFileSync('components/screens/CreateListingScreen.tsx', 'utf8');

// Find the start of categoryData
const startIndex = content.indexOf('const categoryData: any = {');

// Find the end of categoryData. It ends right before `const [category, setCategory] = useState('');`
const endIndex = content.indexOf('  const [category, setCategory] = useState(\'\');');

if (startIndex !== -1 && endIndex !== -1) {
  const cleanCategoryData = `const categoryData: any = {
  'Elektronika': {
    'Telefonlar və aksesuarlar': {
      'Smartfonlar': {
        'Apple': [
          'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 15 Plus',
          'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 14 Plus',
          'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
          'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
          'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
          'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
          'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
          'iPhone SE (2022)', 'iPhone SE (2020)', 'Digər model'
        ],
        'Samsung': [
          'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
          'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
          'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
          'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21',
          'Galaxy A73', 'Galaxy A72', 'Galaxy A71',
          'Galaxy A54', 'Galaxy A53', 'Galaxy A52', 'Galaxy A51',
          'Galaxy A34', 'Galaxy A33', 'Galaxy A32', 'Galaxy A31',
          'Galaxy Z Fold', 'Galaxy Z Flip',
          'Galaxy Note 20', 'Galaxy Note 10', 'Digər model'
        ],
        'Xiaomi': [
          'Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Xiaomi 13',
          'Xiaomi 12 Pro', 'Xiaomi 12', 'Mi 11', 'Mi 10',
          'Xiaomi Poco F5', 'Xiaomi Poco F4', 'Xiaomi Poco F3', 'Digər model'
        ],
        'Redmi': [
          'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro', 'Redmi Note 12',
          'Redmi Note 11 Pro', 'Redmi Note 11', 'Redmi Note 10 Pro', 'Redmi Note 10',
          'Redmi 13', 'Redmi 12', 'Redmi 11', 'Redmi 10', 'Digər model'
        ],
        'Huawei': [
          'Huawei P60 Pro', 'Huawei P50 Pro', 'Huawei P40 Pro', 'Huawei P30 Pro',
          'Huawei Mate 50', 'Huawei Mate 40', 'Huawei Mate 30',
          'Huawei Nova 11', 'Huawei Nova 10', 'Huawei Nova 9', 'Huawei Nova 8', 'Digər model'
        ],
        'Honor': [
          'Honor Magic 6', 'Honor Magic 5', 'Honor Magic 4',
          'Honor 90', 'Honor 80', 'Honor 70',
          'Honor X9', 'Honor X8', 'Honor X7', 'Digər model'
        ],
        'Oppo': [
          'Oppo Find X7', 'Oppo Find X6', 'Oppo Find X5',
          'Oppo Reno 10', 'Oppo Reno 9', 'Oppo Reno 8',
          'Oppo A78', 'Oppo A77', 'Oppo A76', 'Digər model'
        ],
        'Realme': [
          'Realme GT 5', 'Realme GT 3', 'Realme GT Neo',
          'Realme 11 Pro', 'Realme 10 Pro', 'Realme 9 Pro',
          'Realme C55', 'Realme C53', 'Realme C51', 'Digər model'
        ],
        'Vivo': [
          'Vivo X100', 'Vivo X90', 'Vivo X80',
          'Vivo V29', 'Vivo V27', 'Vivo V25',
          'Vivo Y36', 'Vivo Y35', 'Vivo Y33', 'Digər model'
        ],
        'OnePlus': [
          'OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro',
          'OnePlus 9 Pro', 'OnePlus 9',
          'OnePlus Nord 3', 'OnePlus Nord 2', 'Digər model'
        ],
        'Google Pixel': [
          'Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7',
          'Pixel 6 Pro', 'Pixel 6', 'Pixel 5', 'Digər model'
        ],
        'Sony': [
          'Sony Xperia 1 V', 'Sony Xperia 1 IV',
          'Sony Xperia 5 V', 'Sony Xperia 5 IV',
          'Sony Xperia 10', 'Digər model'
        ],
        'Nokia': [
          'Nokia G60', 'Nokia G50', 'Nokia G21',
          'Nokia X30', 'Nokia X20',
          'Nokia C32', 'Nokia C21', 'Digər model'
        ],
        'Motorola': [
          'Motorola Edge 40', 'Motorola Edge 30',
          'Moto G73', 'Moto G72', 'Moto G71',
          'Moto E40', 'Moto E32', 'Digər model'
        ],
        'Asus': [
          'Asus ROG Phone 8', 'Asus ROG Phone 7', 'Asus ROG Phone 6',
          'Asus Zenfone 11', 'Asus Zenfone 10', 'Digər model'
        ],
        'Digər marka': []
      },
      'Düyməli telefonlar': {
        'Nokia': ['3310', '105', '110', '150', 'Digər model'],
        'Samsung': ['B310E', 'E1200', 'Digər model'],
        'Alcatel': ['1066D', '2019G', 'Digər model'],
        'Panasonic': ['KX-TU150', 'Digər model'],
        'Digər marka': []
      },
      'Smart saatlar və qolbaqlar': {
        'Apple': ['Watch Ultra 2', 'Watch Ultra', 'Watch Series 9', 'Watch Series 8', 'Watch SE', 'Digər model'],
        'Samsung': ['Galaxy Watch6 Classic', 'Galaxy Watch6', 'Galaxy Watch5 Pro', 'Galaxy Watch5', 'Digər model'],
        'Xiaomi': ['Watch S3', 'Watch 2 Pro', 'Smart Band 8', 'Smart Band 7', 'Digər model'],
        'Huawei': ['Watch GT 4', 'Watch 4 Pro', 'Watch Ultimate', 'Band 8', 'Digər model'],
        'Garmin': ['Fenix 7', 'Epix Gen 2', 'Forerunner 965', 'Digər model'],
        'Digər marka': []
      },
      'Qulaqlıqlar': {
        'Apple': ['AirPods Pro 2', 'AirPods 3', 'AirPods 2', 'AirPods Max', 'Digər model'],
        'Samsung': ['Galaxy Buds2 Pro', 'Galaxy Buds2', 'Galaxy Buds FE', 'Galaxy Buds Live', 'Digər model'],
        'Xiaomi': ['Redmi Buds 4 Pro', 'Redmi Buds 4 Active', 'Xiaomi Buds 4 Pro', 'Digər model'],
        'JBL': ['Tune 510BT', 'Wave Buds', 'Live Pro 2', 'Digər model'],
        'Sony': ['WH-1000XM5', 'WF-1000XM5', 'WH-CH720N', 'Digər model'],
        'Marshall': ['Major IV', 'Minor III', 'Motif II', 'Digər model'],
        'Digər marka': []
      },
      'Telefon aksesuarları': ['Qablar və qoruyucular', 'Şarj cihazları və kabellər', 'Powerbank', 'Digər aksesuar'],
      'Digər': null
    },
    'Planşetlər': {
      'Apple': ['iPad Pro', 'iPad Air', 'iPad mini', 'iPad', 'Digər model'],
      'Samsung': ['Galaxy Tab S9', 'Galaxy Tab S8', 'Galaxy Tab A8', 'Galaxy Tab A7', 'Digər model'],
      'Lenovo': ['Tab P12', 'Tab P11', 'Tab M10', 'Tab M9', 'Digər model'],
      'Huawei': ['MatePad Pro', 'MatePad 11', 'MatePad SE', 'Digər model'],
      'Xiaomi': ['Pad 6', 'Pad 5', 'Redmi Pad', 'Digər model'],
      'Digər': null
    },
    'Noutbuklar': {
      'Apple': ['MacBook Air', 'MacBook Pro', 'Digər model'],
      'HP': ['Pavilion', 'Envy', 'Spectre', 'Omen', 'Victus', 'Digər model'],
      'Dell': ['XPS', 'Inspiron', 'Latitude', 'Alienware', 'Digər model'],
      'Lenovo': ['ThinkPad', 'IdeaPad', 'Legion', 'Yoga', 'Digər model'],
      'Asus': ['ZenBook', 'VivoBook', 'ROG', 'TUF', 'Digər model'],
      'Acer': ['Swift', 'Aspire', 'Predator', 'Nitro', 'Digər model'],
      'MSI': ['Katana', 'Stealth', 'Raider', 'Titan', 'Digər model'],
      'Huawei': ['MateBook X', 'MateBook D', 'MateBook 14', 'Digər model'],
      'Samsung': ['Galaxy Book3', 'Galaxy Book2', 'Galaxy Book Pro', 'Digər model'],
      'Digər': null
    },
    'Televizorlar': {
      'Samsung': ['QLED', 'OLED', 'Crystal UHD', 'Neo QLED', 'The Frame', 'Digər model'],
      'LG': ['OLED', 'QNED', 'NanoCell', 'UHD', 'Digər model'],
      'Sony': ['Bravia XR', 'Bravia OLED', 'Bravia LED', 'Digər model'],
      'TCL': ['Mini LED', 'QLED', 'UHD', 'Digər model'],
      'Xiaomi': ['Mi TV Q1', 'Mi TV P1', 'Mi TV A2', 'Digər model'],
      'Hisense': ['ULED', 'QLED', 'UHD', 'Digər model'],
      'Philips': ['OLED+', 'The One', 'Ambilight', 'Digər model'],
      'Toshiba': ['OLED', 'QLED', 'UHD', 'Digər model'],
      'Hoffmann': ['Smart TV', 'UHD', 'Digər model'],
      'Digər': null
    },
    'Audio sistemlər və dinamiklər': {
      'JBL': ['Charge 5', 'Flip 6', 'Boombox 3', 'Xtreme 3', 'Digər model'],
      'Sony': ['SRS-XB43', 'SRS-XG500', 'HT-A7000', 'Digər model'],
      'Bose': ['SoundLink Revolve+', 'QuietComfort Earbuds II', 'Smart Soundbar 900', 'Digər model'],
      'Marshall': ['Stanmore II', 'Emberton', 'Kilburn II', 'Digər model'],
      'LG': ['XBOOM Go', 'Soundbar S95QR', 'Digər model'],
      'Samsung': ['Sound Tower', 'HW-Q990C', 'Digər model'],
      'Xiaomi': ['Mi Smart Speaker', 'Redmi Buds 4 Pro', 'Digər model'],
      'Huawei': ['Sound Joy', 'FreeBuds Pro 2', 'Digər model'],
      'Beats': ['Studio Buds', 'Fit Pro', 'Pill+', 'Digər model'],
      'Digər': null
    },
    'Oyun konsolları və oyun aksesuarları': {
      'Sony': {
        'Controller': ['DualSense', 'DualShock 4', 'Digər model'],
        'Headset': ['Pulse 3D', 'Digər model'],
        'VR accessory': ['PS VR2 Sense', 'Digər model'],
        'Charging dock': ['DualSense Charging Station', 'Digər model'],
        'Digər': null
      },
      'Microsoft': {
        'Controller': ['Xbox Wireless Controller', 'Xbox Elite Series 2', 'Digər model'],
        'Headset': ['Xbox Wireless Headset', 'Digər model'],
        'Digər': null
      },
      'Nintendo': {
        'Controller': ['Joy-Con', 'Pro Controller', 'Digər model'],
        'Digər': null
      },
      'Logitech': {
        'Racing wheel': ['G923', 'G29', 'G920', 'Digər model'],
        'Mouse': ['G Pro X Superlight', 'G502', 'Digər model'],
        'Keyboard': ['G915', 'G Pro X', 'Digər model'],
        'Headset': ['G Pro X', 'G733', 'Digər model'],
        'Digər': null
      },
      'Razer': {
        'Mouse': ['DeathAdder V3 Pro', 'Viper V2 Pro', 'Digər model'],
        'Keyboard': ['Huntsman V2', 'BlackWidow V3', 'Digər model'],
        'Headset': ['BlackShark V2', 'Kraken V3', 'Digər model'],
        'Digər': null
      },
      'SteelSeries': {
        'Headset': ['Arctis Nova Pro', 'Arctis 7', 'Digər model'],
        'Mouse': ['Aerox 3', 'Prime', 'Digər model'],
        'Keyboard': ['Apex Pro', 'Apex 7', 'Digər model'],
        'Digər': null
      },
      'HyperX': {
        'Headset': ['Cloud II', 'Cloud Alpha', 'Digər model'],
        'Keyboard': ['Alloy Origins', 'Digər model'],
        'Mouse': ['Pulsefire Dart', 'Digər model'],
        'Digər': null
      },
      'ASUS': {
        'Mouse': ['ROG Gladius III', 'ROG Chakram', 'Digər model'],
        'Keyboard': ['ROG Strix Scope', 'ROG Claymore II', 'Digər model'],
        'Headset': ['ROG Delta S', 'ROG Cetra', 'Digər model'],
        'Digər': null
      },
      'MSI': {
        'Mouse': ['Clutch GM41', 'Digər model'],
        'Keyboard': ['Vigor GK71', 'Digər model'],
        'Headset': ['Immerse GH50', 'Digər model'],
        'Digər': null
      },
      'Digər': null
    },
    'Fotoaparatlar və videokameralar': {
      'Canon': ['EOS R5', 'EOS R6', 'EOS 5D Mark IV', 'EOS 90D', 'Digər model'],
      'Nikon': ['Z9', 'Z7 II', 'Z6 II', 'D850', 'D780', 'Digər model'],
      'Sony': ['A7 IV', 'A7S III', 'A7R V', 'FX3', 'A6700', 'Digər model'],
      'Panasonic': ['Lumix GH6', 'Lumix S5 II', 'Lumix G9', 'Digər model'],
      'Fujifilm': ['X-T5', 'X-H2S', 'X100V', 'GFX 100S', 'Digər model'],
      'GoPro': ['Hero 12 Black', 'Hero 11 Black', 'Hero 10 Black', 'Max', 'Digər model'],
      'DJI': ['Osmo Action 4', 'Osmo Pocket 3', 'Ronin 4D', 'Digər model'],
      'Insta360': ['X3', 'One RS', 'Go 3', 'Digər model'],
      'Blackmagic': ['Pocket Cinema Camera 4K', 'Pocket Cinema Camera 6K', 'URSA Mini Pro', 'Digər model'],
      'Digər': null
    }
  },
  'Məişət texnikası': {
    'Soyuducular': {
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
    },
    'Digər': null
  },
  'Daşınmaz əmlak': {
    'Mənzillər': {
      'Satılır': null,
      'Kirayə (uzunmüddətli)': null,
      'Kirayə (günlük)': null
    },
    'Villalar, bağ evləri': {
      'Satılır': null,
      'Kirayə (uzunmüddətli)': null,
      'Kirayə (günlük)': null
    },
    'Torpaq': {
      'Satılır': null,
      'Kirayə': null
    },
    'Obyektlər və ofislər': {
      'Satılır': null,
      'Kirayə': null
    },
    'Qarajlar': {
      'Satılır': null,
      'Kirayə': null
    },
    'Digər': null
  },
  'Nəqliyyat': {
    'Avtomobillər': null,
    'Motosikletlər və mopedlər': null,
    'Velosipedlər': null,
    'Ehtiyat hissələri və aksesuarlar': null,
    'Su nəqliyyatı': null,
    'Digər': null
  },
  'Şəxsi əşyalar': {
    'Geyim və ayaqqabılar': null,
    'Saat və zinət əşyaları': null,
    'Aksesuarlar': null,
    'Sağlamlıq və gözəllik': null,
    'Digər': null
  },
  'Ev və bağ': {
    'Mebel': null,
    'Təmir və tikinti': null,
    'Qab-qacaq və mətbəx əşyaları': null,
    'Ev tekstili': null,
    'Bitkilər': null,
    'Digər': null
  },
  'Uşaq aləmi': {
    'Uşaq geyimləri': null,
    'Oyuncaqlar': null,
    'Uşaq arabaları və oturacaqlar': null,
    'Məktəb ləvazimatları': null,
    'Digər': null
  },
  'Hobbi və asudə vaxt': {
    'İdman və fitnes': null,
    'Musiqi alətləri': null,
    'Kitab və jurnallar': null,
    'Kolleksiya': null,
    'Biletlər və səyahət': null,
    'Digər': null
  },
  'Heyvanlar': {
    'İtlər': null,
    'Pişiklər': null,
    'Quşlar': null,
    'Akvarium və balıqlar': null,
    'Heyvanlar üçün məhsullar': null,
    'Digər': null
  },
  'Xidmətlər və biznes': {
    'Təmir və tikinti xidmətləri': null,
    'Təmizlik xidmətləri': null,
    'Nəqliyyat və logistika': null,
    'Təhsil və kurslar': null,
    'Gözəllik və sağlamlıq xidmətləri': null,
    'Digər': null
  }
};
`;

  content = content.substring(0, startIndex) + cleanCategoryData + '\n' + content.substring(endIndex);
  fs.writeFileSync('components/screens/CreateListingScreen.tsx', content);
  console.log('Fixed categoryData');
} else {
  console.log('Could not find indices');
}
