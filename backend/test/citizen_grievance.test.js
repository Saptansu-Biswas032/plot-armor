// backend/test/citizen_grievance.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { initDB, getDB } = require('../src/db/database');

test('Citizen & Grievance Lifecycle Suite', async (t) => {
    let db;
    let targetCitizen;

    await t.test('1. Database initializes with seeded citizens and grievances', async () => {
        db = await initDB();
        const citizens = await db.all('SELECT * FROM citizens');
        assert.ok(citizens.length >= 50, 'Should have at least 50 seeded citizens');
        
        targetCitizen = citizens[0];
        assert.ok(targetCitizen, 'First citizen should exist in database');
    });

    await t.test('2. Citizen holdings are correctly linked and mapped', async () => {
        const rows = await db.all(`
            SELECT p.*, cp.share_percent
            FROM citizen_parcels cp
            JOIN parcel p ON cp.ulpin = p.ulpin
            WHERE cp.aadhaar = ?
        `, [targetCitizen.aadhaar]);
        assert.ok(rows.length >= 2, `${targetCitizen.name} should own at least 2 parcels`);
        targetCitizen.ulpin = rows[0].ulpin; // store for next test
    });

    await t.test('3. Grievance creation and status transitions work correctly', async () => {
        const testGrievanceId = `GRV-TEST-${Date.now()}`;
        const now = new Date().toISOString();

        await db.run(`
            INSERT INTO grievances (grievance_id, citizen_aadhaar, citizen_name, ulpin, category, title, description, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?)
        `, [testGrievanceId, targetCitizen.aadhaar, targetCitizen.name, targetCitizen.ulpin, 'BOUNDARY_ENCROACHMENT', 'Test Encroachment', 'Discrepancy observed.', now, now]);

        let record = await db.get('SELECT * FROM grievances WHERE grievance_id = ?', [testGrievanceId]);
        assert.equal(record.status, 'SUBMITTED');

        // Transition to FIELD_SURVEY_DISPATCHED
        await db.run(`
            UPDATE grievances SET status = 'FIELD_SURVEY_DISPATCHED', officer_action = 'Survey Rover Dispatched' WHERE grievance_id = ?
        `, [testGrievanceId]);

        record = await db.get('SELECT * FROM grievances WHERE grievance_id = ?', [testGrievanceId]);
        assert.equal(record.status, 'FIELD_SURVEY_DISPATCHED');

        // Transition to RESOLVED with blockchain hash
        const fakeHash = '0xabcdef1234567890';
        await db.run(`
            UPDATE grievances SET status = 'RESOLVED', resolution_hash = ? WHERE grievance_id = ?
        `, [fakeHash, testGrievanceId]);

        record = await db.get('SELECT * FROM grievances WHERE grievance_id = ?', [testGrievanceId]);
        assert.equal(record.status, 'RESOLVED');
        assert.equal(record.resolution_hash, fakeHash);
    });
});
