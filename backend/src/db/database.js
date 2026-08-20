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
    { ulpin: "ULPIN_GJ_38003", state: "Gujarat", area: 5000.00, coords: [[[72.5630, 23.0160], [72.5670, 23.0160], [72.5670, 23.0200], [72.5630, 23.0200], [72.5630, 23.0160]]] }
,
    { ulpin: "ULPIN_NEW_1001", state: "New Region", area: 5000, coords: [[[78.01,20.01],[78.012,20.01],[78.012,20.012],[78.01,20.012],[78.01,20.01]]] },
    { ulpin: "ULPIN_NEW_1002", state: "New Region", area: 5000, coords: [[[78.02,20.02],[78.02199999999999,20.02],[78.02199999999999,20.022],[78.02,20.022],[78.02,20.02]]] },
    { ulpin: "ULPIN_NEW_1003", state: "New Region", area: 5000, coords: [[[78.03,20.03],[78.032,20.03],[78.032,20.032],[78.03,20.032],[78.03,20.03]]] },
    { ulpin: "ULPIN_NEW_1004", state: "New Region", area: 5000, coords: [[[78.04,20.04],[78.042,20.04],[78.042,20.041999999999998],[78.04,20.041999999999998],[78.04,20.04]]] },
    { ulpin: "ULPIN_NEW_1005", state: "New Region", area: 5000, coords: [[[78.05,20.05],[78.05199999999999,20.05],[78.05199999999999,20.052],[78.05,20.052],[78.05,20.05]]] },
    { ulpin: "ULPIN_NEW_1006", state: "New Region", area: 5000, coords: [[[78.06,20.06],[78.062,20.06],[78.062,20.061999999999998],[78.06,20.061999999999998],[78.06,20.06]]] },
    { ulpin: "ULPIN_NEW_1007", state: "New Region", area: 5000, coords: [[[78.07,20.07],[78.07199999999999,20.07],[78.07199999999999,20.072],[78.07,20.072],[78.07,20.07]]] },
    { ulpin: "ULPIN_NEW_1008", state: "New Region", area: 5000, coords: [[[78.08,20.08],[78.082,20.08],[78.082,20.081999999999997],[78.08,20.081999999999997],[78.08,20.08]]] },
    { ulpin: "ULPIN_NEW_1009", state: "New Region", area: 5000, coords: [[[78.09,20.09],[78.092,20.09],[78.092,20.092],[78.09,20.092],[78.09,20.09]]] },
    { ulpin: "ULPIN_NEW_1010", state: "New Region", area: 5000, coords: [[[78.1,20.1],[78.10199999999999,20.1],[78.10199999999999,20.102],[78.1,20.102],[78.1,20.1]]] },
    { ulpin: "ULPIN_NEW_1011", state: "New Region", area: 5000, coords: [[[78.11,20.11],[78.112,20.11],[78.112,20.112],[78.11,20.112],[78.11,20.11]]] },
    { ulpin: "ULPIN_NEW_1012", state: "New Region", area: 5000, coords: [[[78.12,20.12],[78.122,20.12],[78.122,20.122],[78.12,20.122],[78.12,20.12]]] },
    { ulpin: "ULPIN_NEW_1013", state: "New Region", area: 5000, coords: [[[78.13,20.13],[78.13199999999999,20.13],[78.13199999999999,20.131999999999998],[78.13,20.131999999999998],[78.13,20.13]]] },
    { ulpin: "ULPIN_NEW_1014", state: "New Region", area: 5000, coords: [[[78.14,20.14],[78.142,20.14],[78.142,20.142],[78.14,20.142],[78.14,20.14]]] },
    { ulpin: "ULPIN_NEW_1015", state: "New Region", area: 5000, coords: [[[78.15,20.15],[78.152,20.15],[78.152,20.151999999999997],[78.15,20.151999999999997],[78.15,20.15]]] },
    { ulpin: "ULPIN_NEW_1016", state: "New Region", area: 5000, coords: [[[78.16,20.16],[78.16199999999999,20.16],[78.16199999999999,20.162],[78.16,20.162],[78.16,20.16]]] },
    { ulpin: "ULPIN_NEW_1017", state: "New Region", area: 5000, coords: [[[78.17,20.17],[78.172,20.17],[78.172,20.172],[78.17,20.172],[78.17,20.17]]] },
    { ulpin: "ULPIN_NEW_1018", state: "New Region", area: 5000, coords: [[[78.18,20.18],[78.182,20.18],[78.182,20.182],[78.18,20.182],[78.18,20.18]]] },
    { ulpin: "ULPIN_NEW_1019", state: "New Region", area: 5000, coords: [[[78.19,20.19],[78.192,20.19],[78.192,20.192],[78.19,20.192],[78.19,20.19]]] },
    { ulpin: "ULPIN_NEW_1020", state: "New Region", area: 5000, coords: [[[78.2,20.2],[78.202,20.2],[78.202,20.201999999999998],[78.2,20.201999999999998],[78.2,20.2]]] }
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
