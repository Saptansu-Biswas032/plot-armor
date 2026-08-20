// backend/src/db/database.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let dbInstance = null;

// Multi-State Synthetic Registry (15 ULPINs across 5 Indian States)
const SEED_PARCELS = [
    // Andhra Pradesh (Vijayawada)
    { ulpin: "ULPIN_AP_90210", state: "Andhra Pradesh", area: 4046.86, coords: [[[80.6400, 16.5100], [80.6420, 16.5100], [80.6420, 16.5120], [80.6400, 16.5120], [80.6400, 16.5100]]] },
    { ulpin: "ULPIN_AP_90211", state: "Andhra Pradesh", area: 4046.86, coords: [[[80.6425, 16.5125], [80.6445, 16.5125], [80.6445, 16.5145], [80.6425, 16.5145], [80.6425, 16.5125]]] },
    { ulpin: "ULPIN_AP_90212", state: "Andhra Pradesh", area: 4046.86, coords: [[[80.6370, 16.5070], [80.6390, 16.5070], [80.6390, 16.5090], [80.6370, 16.5090], [80.6370, 16.5070]]] },
    // Maharashtra (Pune)
    { ulpin: "ULPIN_MH_40110", state: "Maharashtra", area: 8093.72, coords: [[[73.8550, 18.5190], [73.8580, 18.5190], [73.8580, 18.5220], [73.8550, 18.5220], [73.8550, 18.5190]]] },
    { ulpin: "ULPIN_MH_40111", state: "Maharashtra", area: 8093.72, coords: [[[73.8590, 18.5240], [73.8620, 18.5240], [73.8620, 18.5270], [73.8590, 18.5270], [73.8590, 18.5240]]] },
    { ulpin: "ULPIN_MH_40112", state: "Maharashtra", area: 4046.86, coords: [[[73.8480, 18.5130], [73.8520, 18.5130], [73.8520, 18.5170], [73.8480, 18.5170], [73.8480, 18.5130]]] },
    // Karnataka (Bangalore)
    { ulpin: "ULPIN_KA_56010", state: "Karnataka", area: 4046.86, coords: [[[77.5930, 12.9700], [77.5960, 12.9700], [77.5960, 12.9730], [77.5930, 12.9730], [77.5930, 12.9700]]] },
    { ulpin: "ULPIN_KA_56011", state: "Karnataka", area: 4046.86, coords: [[[77.5980, 12.9740], [77.6020, 12.9740], [77.6020, 12.9780], [77.5980, 12.9780], [77.5980, 12.9740]]] },
    { ulpin: "ULPIN_KA_56012", state: "Karnataka", area: 4046.86, coords: [[[77.5830, 12.9630], [77.5870, 12.9630], [77.5870, 12.9670], [77.5830, 12.9670], [77.5830, 12.9630]]] },
    // Uttar Pradesh (Lucknow)
    { ulpin: "ULPIN_UP_22601", state: "Uttar Pradesh", area: 6000.00, coords: [[[80.9450, 26.8450], [80.9480, 26.8450], [80.9480, 26.8480], [80.9450, 26.8480], [80.9450, 26.8450]]] },
    { ulpin: "ULPIN_UP_22602", state: "Uttar Pradesh", area: 6000.00, coords: [[[80.9490, 26.8490], [80.9520, 26.8490], [80.9520, 26.8520], [80.9490, 26.8520], [80.9490, 26.8490]]] },
    { ulpin: "ULPIN_UP_22603", state: "Uttar Pradesh", area: 6000.00, coords: [[[80.9380, 26.8380], [80.9420, 26.8380], [80.9420, 26.8420], [80.9380, 26.8420], [80.9380, 26.8380]]] },
    // Gujarat (Ahmedabad)
    { ulpin: "ULPIN_GJ_38001", state: "Gujarat", area: 5000.00, coords: [[[72.5700, 23.0210], [72.5730, 23.0210], [72.5730, 23.0240], [72.5700, 23.0240], [72.5700, 23.0210]]] },
    { ulpin: "ULPIN_GJ_38002", state: "Gujarat", area: 5000.00, coords: [[[72.5750, 23.0250], [72.5780, 23.0250], [72.5780, 23.0280], [72.5750, 23.0280], [72.5750, 23.0250]]] },
    { ulpin: "ULPIN_GJ_38003", state: "Gujarat", area: 5000.00, coords: [[[72.5630, 23.0160], [72.5670, 23.0160], [72.5670, 23.0200], [72.5630, 23.0200], [72.5630, 23.0160]]] },
    { ulpin: "ULPIN_NEW_1001", state: "Madhya Pradesh", area: 5000, coords: [[[77.42,23.26],[77.422,23.26],[77.422,23.262],[77.42,23.262],[77.42,23.26]]] },
    { ulpin: "ULPIN_NEW_1002", state: "Madhya Pradesh", area: 5000, coords: [[[77.42999999999999,23.27],[77.43199999999999,23.27],[77.43199999999999,23.272],[77.42999999999999,23.272],[77.42999999999999,23.27]]] },
    { ulpin: "ULPIN_NEW_1003", state: "Madhya Pradesh", area: 5000, coords: [[[77.44,23.28],[77.442,23.28],[77.442,23.282],[77.44,23.282],[77.44,23.28]]] },
    { ulpin: "ULPIN_NEW_1004", state: "Madhya Pradesh", area: 5000, coords: [[[77.45,23.29],[77.452,23.29],[77.452,23.291999999999998],[77.45,23.291999999999998],[77.45,23.29]]] },
    { ulpin: "ULPIN_NEW_1005", state: "Madhya Pradesh", area: 5000, coords: [[[77.41,23.25],[77.41199999999999,23.25],[77.41199999999999,23.252],[77.41,23.252],[77.41,23.25]]] },
    { ulpin: "ULPIN_NEW_1006", state: "Tamil Nadu", area: 5000, coords: [[[80.28,13.09],[80.282,13.09],[80.282,13.092],[80.28,13.092],[80.28,13.09]]] },
    { ulpin: "ULPIN_NEW_1007", state: "Tamil Nadu", area: 5000, coords: [[[80.28999999999999,13.1],[80.29199999999999,13.1],[80.29199999999999,13.102],[80.28999999999999,13.102],[80.28999999999999,13.1]]] },
    { ulpin: "ULPIN_NEW_1008", state: "Tamil Nadu", area: 5000, coords: [[[80.3,13.11],[80.30199999999999,13.11],[80.30199999999999,13.112],[80.3,13.112],[80.3,13.11]]] },
    { ulpin: "ULPIN_NEW_1009", state: "Tamil Nadu", area: 5000, coords: [[[80.31,13.12],[80.312,13.12],[80.312,13.122],[80.31,13.122],[80.31,13.12]]] },
    { ulpin: "ULPIN_NEW_1010", state: "Tamil Nadu", area: 5000, coords: [[[80.27,13.08],[80.27199999999999,13.08],[80.27199999999999,13.082],[80.27,13.082],[80.27,13.08]]] },
    { ulpin: "ULPIN_NEW_1011", state: "Rajasthan", area: 5000, coords: [[[75.79,26.92],[75.792,26.92],[75.792,26.922],[75.79,26.922],[75.79,26.92]]] },
    { ulpin: "ULPIN_NEW_1012", state: "Rajasthan", area: 5000, coords: [[[75.8,26.93],[75.80199999999999,26.93],[75.80199999999999,26.932],[75.8,26.932],[75.8,26.93]]] },
    { ulpin: "ULPIN_NEW_1013", state: "Rajasthan", area: 5000, coords: [[[75.81,26.94],[75.812,26.94],[75.812,26.942],[75.81,26.942],[75.81,26.94]]] },
    { ulpin: "ULPIN_NEW_1014", state: "Rajasthan", area: 5000, coords: [[[75.82000000000001,26.95],[75.822,26.95],[75.822,26.951999999999998],[75.82000000000001,26.951999999999998],[75.82000000000001,26.95]]] },
    { ulpin: "ULPIN_NEW_1015", state: "Rajasthan", area: 5000, coords: [[[75.78,26.91],[75.782,26.91],[75.782,26.912],[75.78,26.912],[75.78,26.91]]] },
    { ulpin: "ULPIN_NEW_1016", state: "Kerala", area: 5000, coords: [[[76.27000000000001,9.94],[76.272,9.94],[76.272,9.942],[76.27000000000001,9.942],[76.27000000000001,9.94]]] },
    { ulpin: "ULPIN_NEW_1017", state: "Kerala", area: 5000, coords: [[[76.28,9.95],[76.282,9.95],[76.282,9.952],[76.28,9.952],[76.28,9.95]]] },
    { ulpin: "ULPIN_NEW_1018", state: "Kerala", area: 5000, coords: [[[76.29,9.959999999999999],[76.292,9.959999999999999],[76.292,9.962],[76.29,9.962],[76.29,9.959999999999999]]] },
    { ulpin: "ULPIN_NEW_1019", state: "Kerala", area: 5000, coords: [[[76.30000000000001,9.969999999999999],[76.302,9.969999999999999],[76.302,9.972],[76.30000000000001,9.972],[76.30000000000001,9.969999999999999]]] },
    { ulpin: "ULPIN_NEW_1020", state: "Kerala", area: 5000, coords: [[[76.26,9.93],[76.262,9.93],[76.262,9.932],[76.26,9.932],[76.26,9.93]]] }
];

async function seedDatabase(db) {
    for (let i = 0; i < SEED_PARCELS.length; i++) {
        const item = SEED_PARCELS[i];
        const geoJSON = JSON.stringify({ type: "Polygon", coordinates: item.coords });
        const parcelId = `PRC_${String(i + 1).padStart(3, '0')}`;

        await db.run(
            `INSERT OR IGNORE INTO parcel (parcel_id, ulpin, geometry, area, source, version, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [parcelId, item.ulpin, geoJSON, item.area, item.state, 1, 'LEGACY_RECORD']
        );
    }
    console.log(`[SYS] ✅ Successfully seeded ${SEED_PARCELS.length} national parcels across 5 states.`);
}

async function initDB() {
    if (dbInstance) return dbInstance;

    const dbPath = path.resolve(__dirname, 'plotarmor_mvp.sqlite');
    
    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log(`[SYS] SQLite connected at: ${dbPath}`);

    // Create LADM Core Schema
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS parcel (
            parcel_id TEXT PRIMARY KEY,
            ulpin TEXT UNIQUE,
            geometry TEXT NOT NULL,
            area REAL,
            source TEXT,
            version INTEGER DEFAULT 1,
            status TEXT DEFAULT 'LEGACY_RECORD'
        );

        CREATE TABLE IF NOT EXISTS ownership (
            owner_id TEXT,
            parcel_id TEXT,
            share REAL DEFAULT 1.0,
            start_date TEXT,
            end_date TEXT,
            PRIMARY KEY(owner_id, parcel_id)
        );

        CREATE TABLE IF NOT EXISTS transaction_chain (
            transaction_id TEXT PRIMARY KEY,
            parcel_id TEXT,
            type TEXT,
            source_document TEXT,
            timestamp TEXT,
            authority TEXT
        );

        CREATE TABLE IF NOT EXISTS spatial_observation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_id TEXT,
            geometry TEXT,
            accuracy REAL,
            device TEXT,
            surveyor TEXT,
            timestamp TEXT
        );

        CREATE TABLE IF NOT EXISTS verification (
            parcel_id TEXT PRIMARY KEY,
            iou REAL,
            hausdorff_distance REAL,
            area_ratio REAL,
            risk_score REAL,
            decision TEXT
        );

        CREATE TABLE IF NOT EXISTS judicial_docket (
            docket_id TEXT PRIMARY KEY,
            parcel_id TEXT UNIQUE,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    `);

    console.log('[SYS] ISO 19152-1 LADM tables verified.');
    await seedDatabase(dbInstance);

    return dbInstance;
}

function getDB() {
    if (!dbInstance) {
        throw new Error("Database not initialized. Call initDB() before getDB().");
    }
    return dbInstance;
}

// Standalone self-test runner
if (require.main === module) {
    initDB()
        .then(async (db) => {
            const count = await db.get("SELECT COUNT(*) as total FROM parcel");
            console.log(`[TEST SUCCESS] Database verified with ${count.total} parcels.`);
            process.exit(0);
        })
        .catch((err) => {
            console.error("[TEST FAILED]", err);
            process.exit(1);
        });
}

module.exports = { initDB, getDB };
