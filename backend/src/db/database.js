// backend/src/db/database.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let dbInstance = null;

const seedData = require('./seed_data.json');
const SEED_PARCELS = seedData.seedParcels;
const SEED_CITIZENS = seedData.seedCitizens;

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

        CREATE TABLE IF NOT EXISTS citizens (
            aadhaar TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            state TEXT,
            district TEXT,
            village TEXT,
            khata_number TEXT,
            avatar TEXT
        );

        CREATE TABLE IF NOT EXISTS citizen_parcels (
            aadhaar TEXT,
            ulpin TEXT,
            share_percent REAL DEFAULT 100.0,
            PRIMARY KEY(aadhaar, ulpin)
        );

        CREATE TABLE IF NOT EXISTS grievances (
            grievance_id TEXT PRIMARY KEY,
            citizen_aadhaar TEXT NOT NULL,
            citizen_name TEXT,
            ulpin TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            disputed_coords TEXT,
            status TEXT DEFAULT 'SUBMITTED',
            officer_action TEXT,
            resolution_hash TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    `);

    console.log('[SYS] ISO 19152-1 LADM & Grievance tables verified.');
    await seedDatabase(dbInstance);
    await seedCitizensAndGrievances(dbInstance);

    return dbInstance;
}

async function seedCitizensAndGrievances(db) {
    for (const citizen of SEED_CITIZENS) {
        await db.run(
            `INSERT OR REPLACE INTO citizens (aadhaar, name, phone, state, district, village, khata_number)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [citizen.aadhaar, citizen.name, citizen.phone, citizen.state, citizen.district, citizen.village, citizen.khata_number]
        );

        for (const ulpin of citizen.ulpins) {
            await db.run(
                `INSERT OR IGNORE INTO citizen_parcels (aadhaar, ulpin, share_percent)
                 VALUES (?, ?, ?)`,
                [citizen.aadhaar, ulpin, 100.0]
            );
        }
    }
    // Note: No initial grievances seeded, to start with a blank desk as requested.
    console.log(`[SYS] ✅ Successfully seeded ${SEED_CITIZENS.length} citizens. Desk is clear.`);
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
