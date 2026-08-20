const fs = require('fs');

const dbPath = 'backend/src/db/database.js';
let dbCode = fs.readFileSync(dbPath, 'utf8');

const start = dbCode.indexOf('const SEED_PARCELS = [');
const end = dbCode.indexOf('];', start);
let seedParcelsString = dbCode.substring(start, end + 2);

const states = [
  { name: 'Madhya Pradesh', baseLon: 77.41, baseLat: 23.25 },
  { name: 'Tamil Nadu', baseLon: 80.27, baseLat: 13.08 },
  { name: 'Rajasthan', baseLon: 75.78, baseLat: 26.91 },
  { name: 'Kerala', baseLon: 76.26, baseLat: 9.93 }
];

const newParcels = [];
for(let i = 1; i <= 20; i++) {
  const ulpin = 'ULPIN_NEW_' + (1000 + i);
  const stateInfo = states[Math.floor((i - 1) / 5)];
  const lat = stateInfo.baseLat + ((i % 5) * 0.01);
  const lon = stateInfo.baseLon + ((i % 5) * 0.01);
  const coords = [[[lon, lat], [lon + 0.002, lat], [lon + 0.002, lat + 0.002], [lon, lat + 0.002], [lon, lat]]];
  newParcels.push('    { ulpin: "' + ulpin + '", state: "' + stateInfo.name + '", area: 5000, coords: ' + JSON.stringify(coords) + ' }');
}

const original15End = seedParcelsString.indexOf('ULPIN_NEW_1001') - 18;
const newSeedParcelsString = seedParcelsString.substring(0, original15End) + ',\n' + newParcels.join(',\n') + '\n];';

dbCode = dbCode.replace(seedParcelsString, newSeedParcelsString);
fs.writeFileSync(dbPath, dbCode);

console.log('Fixed ULPIN regions and coordinates.');
