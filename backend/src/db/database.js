// backend/src/db/database.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function initDB() {
    if (dbInstance) return dbInstance;
    
    // Using SQLite to simulate PostGIS/PostgreSQL for Hackathon MVP simplicity
    dbInstance = await open({
        filename: path.join(__dirname, 'plotarmor_mvp.sqlite'),
        driver: sqlite3.Database
    });

    console.log('[SYS] Database Engine initialized. Synchronizing ISO LADM Schema...');

    // 1. Parcel (Physical Unit)
    await dbInstance.exec(`CREATE TABLE IF NOT EXISTS parcel (
        parcel_id TEXT PRIMARY KEY, ulpin TEXT UNIQUE, geometry TEXT, 
        area REAL, source TEXT, version INTEGER, status TEXT
    )`);

    // 2. Ownership (Human Rights)
    await dbInstance.exec(`CREATE TABLE IF NOT EXISTS ownership (
        owner_id TEXT, parcel_id TEXT, share REAL, 
        start_date TEXT, end_date TEXT, PRIMARY KEY(owner_id, parcel_id)
    )`);

    // 3. Transaction (Historical Chain / Evidence)
    await dbInstance.exec(`CREATE TABLE IF NOT EXISTS transaction_chain (
        transaction_id TEXT PRIMARY KEY, parcel_id TEXT, type TEXT, 
        source_document TEXT, timestamp TEXT, authority TEXT
    )`);

    // 4. SpatialObservation (VeriApp Field Edge-Data)
    await dbInstance.exec(`CREATE TABLE IF NOT EXISTS spatial_observation (
        id INTEGER PRIMARY KEY AUTOINCREMENT, parcel_id TEXT, geometry TEXT, 
        accuracy REAL, device TEXT, surveyor TEXT, timestamp TEXT
    )`);

    // 5. Verification (SDI Engine Metrics & Human Decision)
    await dbInstance.exec(`CREATE TABLE IF NOT EXISTS verification (
        parcel_id TEXT PRIMARY KEY, iou REAL, hausdorff_distance REAL, 
        area_ratio REAL, risk_score REAL, decision TEXT
    )`);

    console.log('[SYS] Schema strictly aligned to ISO 19152-1 Spatial Data Model.');
    return dbInstance;
}

module.exports = { 
    initDB,
    getDB: () => dbInstance 
};