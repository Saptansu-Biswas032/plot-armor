const fs = require('fs');

const states = [
  { state: "Andhra Pradesh", district: "Krishna", village: "Gollapudi", lat: 16.51, lng: 80.64 },
  { state: "Maharashtra", district: "Pune", village: "Haveli", lat: 18.52, lng: 73.85 },
  { state: "Karnataka", district: "Bengaluru", village: "Devanahalli", lat: 12.97, lng: 77.59 },
  { state: "Uttar Pradesh", district: "Lucknow", village: "Bakshi Ka Talab", lat: 26.84, lng: 80.94 },
  { state: "Gujarat", district: "Ahmedabad", village: "Daskroi", lat: 23.02, lng: 72.57 }
];

const firstNames = ["Aarav", "Priya", "Ramesh", "Sanjay", "Vikram", "Neha", "Rahul", "Anjali", "Amit", "Kiran", "Suresh", "Manoj", "Kavita", "Pooja", "Arjun", "Ravi", "Sneha", "Karan", "Vishal", "Riya", "Raj", "Sunil", "Anita", "Divya", "Gaurav", "Nitin", "Nisha", "Swati", "Manoj", "Dinesh", "Preeti", "Alok", "Akash", "Tanya", "Vivek", "Meera", "Rohit", "Jyoti", "Deepak", "Asha", "Tarun", "Shikha", "Ashok", "Suman", "Vikas", "Lata", "Naveen", "Gita", "Yogesh", "Rekha"];
const lastNames = ["Sharma", "Patel", "Gowda", "Verma", "Desai", "Singh", "Kumar", "Gupta", "Rao", "Reddy", "Nair", "Iyer", "Joshi", "Bansal", "Mehta", "Chauhan", "Das", "Yadav", "Tiwari", "Pandey"];

let seedParcels = [];
let seedCitizens = [];

for (let i = 0; i < 50; i++) {
  const loc = states[i % states.length];
  const aadhaar = Array.from({length: 12}, () => Math.floor(Math.random()*10)).join('');
  const name = firstNames[i] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
  const numParcels = 2 + Math.floor(Math.random() * 2); // 2 or 3
  
  let ulpins = [];
  for (let j = 0; j < numParcels; j++) {
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;
    const pLat = loc.lat + latOffset;
    const pLng = loc.lng + lngOffset;
    
    // Create a square approx 50x50m roughly
    const boxSize = 0.0005;
    const coords = [[
      [pLng, pLat],
      [pLng + boxSize, pLat],
      [pLng + boxSize, pLat + boxSize],
      [pLng, pLat + boxSize],
      [pLng, pLat]
    ]];
    
    const ulpin = `ULPIN_${loc.state.substring(0,2).toUpperCase()}_${10000 + (i*10 + j)}`;
    ulpins.push(ulpin);
    seedParcels.push({
      ulpin,
      state: loc.state,
      area: 4000 + Math.floor(Math.random() * 2000),
      coords
    });
  }
  
  seedCitizens.push({
    aadhaar,
    name,
    phone: "+91 " + Array.from({length: 10}, () => Math.floor(Math.random()*10)).join(''),
    state: loc.state,
    district: loc.district,
    village: loc.village,
    khata_number: `KT-${loc.state.substring(0,2).toUpperCase()}-${4000 + i}`,
    ulpins
  });
}

fs.writeFileSync('scratch_db.json', JSON.stringify({seedParcels, seedCitizens}, null, 2));
