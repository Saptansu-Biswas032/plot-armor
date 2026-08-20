const fs = require('fs');

const dbPath = 'backend/src/db/database.js';
let dbCode = fs.readFileSync(dbPath, 'utf8');

const newParcels = [];
for(let i = 1; i <= 20; i++) {
  const ulpin = 'ULPIN_NEW_' + (1000 + i);
  const lat = 20.0 + (i * 0.01);
  const lon = 78.0 + (i * 0.01);
  const coords = [[[lon, lat], [lon + 0.002, lat], [lon + 0.002, lat + 0.002], [lon, lat + 0.002], [lon, lat]]];
  newParcels.push('    { ulpin: "' + ulpin + '", state: "New Region", area: 5000, coords: ' + JSON.stringify(coords) + ' }');
}
const dbReplacement = newParcels.join(',\n') + '\n];\n\nasync function seedDatabase';
dbCode = dbCode.replace(/\];\s*async function seedDatabase/, ',\n' + dbReplacement);
fs.writeFileSync(dbPath, dbCode);

const routesPath = 'backend/src/routes/ulpinRoutes.js';
let routesCode = fs.readFileSync(routesPath, 'utf8');

const newProfiles = [];
const statuses = ['DISPUTE_SUSPECTED', 'INCONSISTENT', 'VERIFIED', 'PROVISIONALLY_VERIFIED', 'FORMALLY_DISPUTED'];
for(let i = 1; i <= 20; i++) {
  const ulpin = 'ULPIN_NEW_' + (1000 + i);
  const status = statuses[i % statuses.length];
  newProfiles.push('    ' + ulpin + ': \'' + status + '\'');
}
const routesReplacement = newProfiles.join(',\n') + '\n};\n\nfunction makeNode';
routesCode = routesCode.replace(/\};\s*function makeNode/, ',\n' + routesReplacement);
fs.writeFileSync(routesPath, routesCode);

console.log('Added 20 new ULPINs.');
