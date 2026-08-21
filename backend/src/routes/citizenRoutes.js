// backend/src/routes/citizenRoutes.js
const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const realtimeEngine = require('../engines/realtimeEngine');

/**
 * GET /api/v1/citizen/auth/profiles
 * Returns list of demo citizens for 1-click fast login during presentations
 */
router.get('/auth/profiles', async (req, res) => {
    try {
        const db = getDB();
        const citizens = await db.all('SELECT * FROM citizens');
        res.json({ count: citizens.length, profiles: citizens });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v1/citizen/auth/request-otp
 * Simulates sending an OTP to the citizen's Aadhaar-linked mobile
 */
router.post('/auth/request-otp', async (req, res) => {
    try {
        const { aadhaar } = req.body;
        const db = getDB();
        const cleanAadhaar = String(aadhaar).replace(/\s+/g, '');
        const citizen = await db.get('SELECT * FROM citizens WHERE aadhaar = ?', [cleanAadhaar]);

        if (!citizen) {
            return res.status(404).json({ error: "No citizen profile registered with this Aadhaar number." });
        }

        // Demo deterministic OTP for presentation reliability
        const simulatedOtp = "482910";
        res.json({
            success: true,
            message: `OTP sent to ${citizen.phone.replace(/(\+91 \d{2})\d{4}(\d{4})/, '$1 •••• $2')}`,
            simulatedOtp: simulatedOtp,
            citizen: citizen
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v1/citizen/auth/verify-otp
 * Validates Aadhaar OTP and logs citizen into Bhoomi portal
 */
router.post('/auth/verify-otp', async (req, res) => {
    try {
        const { aadhaar, otp } = req.body;
        const cleanAadhaar = String(aadhaar).replace(/\s+/g, '');
        const db = getDB();
        const citizen = await db.get('SELECT * FROM citizens WHERE aadhaar = ?', [cleanAadhaar]);

        if (!citizen) {
            return res.status(404).json({ error: "Citizen profile not found." });
        }

        // Accept demo OTP or any 6-digit number in demo mode
        if (otp !== "482910" && otp !== "123456" && (!otp || otp.length < 4)) {
            return res.status(400).json({ error: "Invalid OTP. Use 482910 for demo login." });
        }

        res.json({
            success: true,
            message: `Welcome, ${citizen.name}`,
            citizen: citizen,
            authToken: `AADH_JWT_${cleanAadhaar}_${Date.now()}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/citizen/holdings/:aadhaar
 * Returns all land parcels and digital RoR passbook records owned by the citizen
 */
router.get('/holdings/:aadhaar', async (req, res) => {
    try {
        const { aadhaar } = req.params;
        const cleanAadhaar = String(aadhaar).replace(/\s+/g, '');
        const db = getDB();

        const citizen = await db.get('SELECT * FROM citizens WHERE aadhaar = ?', [cleanAadhaar]);
        if (!citizen) return res.status(404).json({ error: "Citizen not found." });

        const rows = await db.all(`
            SELECT p.*, cp.share_percent
            FROM citizen_parcels cp
            JOIN parcel p ON cp.ulpin = p.ulpin
            WHERE cp.aadhaar = ?
        `, [cleanAadhaar]);

        const holdings = rows.map(r => ({
            ...r,
            geometry: JSON.parse(r.geometry),
            area_acres: (r.area / 4046.86).toFixed(2),
            area_sqm: r.area,
            khata_number: citizen.khata_number,
            village: citizen.village,
            district: citizen.district,
            state: citizen.state,
            title_status: r.status,
            mutation_version: `v${r.version}`
        }));

        res.json({
            citizen: citizen,
            holdings_count: holdings.length,
            holdings: holdings
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v1/citizen/grievance/create
 * Books a new land grievance and broadcasts to Revenue Officer in real-time
 */
router.post('/grievance/create', async (req, res) => {
    try {
        const { aadhaar, ulpin, category, title, description, disputed_coords } = req.body;
        const cleanAadhaar = String(aadhaar).replace(/\s+/g, '');
        const db = getDB();

        const citizen = await db.get('SELECT * FROM citizens WHERE aadhaar = ?', [cleanAadhaar]);
        if (!citizen) return res.status(404).json({ error: "Citizen profile not found." });

        const grievanceId = `GRV-${citizen.state.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const now = new Date().toISOString();

        await db.run(`
            INSERT INTO grievances (grievance_id, citizen_aadhaar, citizen_name, ulpin, category, title, description, disputed_coords, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?)
        `, [
            grievanceId,
            cleanAadhaar,
            citizen.name,
            ulpin,
            category || 'BOUNDARY_ENCROACHMENT',
            title,
            description,
            disputed_coords ? JSON.stringify(disputed_coords) : null,
            now,
            now
        ]);

        const createdGrievance = {
            grievance_id: grievanceId,
            citizen_aadhaar: cleanAadhaar,
            citizen_name: citizen.name,
            citizen_phone: citizen.phone,
            state: citizen.state,
            district: citizen.district,
            ulpin: ulpin,
            category: category,
            title: title,
            description: description,
            disputed_coords: disputed_coords,
            status: 'SUBMITTED',
            created_at: now,
            updated_at: now
        };

        // ⚡ REAL-TIME BROADCAST TO REVENUE OFFICER DESK
        realtimeEngine.broadcast('GRIEVANCE_CREATED', createdGrievance);

        res.status(201).json({
            success: true,
            message: `Grievance ${grievanceId} booked successfully. Dispatched to Revenue Officer desk.`,
            grievance: createdGrievance
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/citizen/grievances/:aadhaar
 * Returns all active and historic grievances for the logged-in citizen
 */
router.get('/grievances/:aadhaar', async (req, res) => {
    try {
        const { aadhaar } = req.params;
        const cleanAadhaar = String(aadhaar).replace(/\s+/g, '');
        const db = getDB();

        const grievances = await db.all(`
            SELECT g.*, p.source as state, p.area
            FROM grievances g
            LEFT JOIN parcel p ON g.ulpin = p.ulpin
            WHERE g.citizen_aadhaar = ?
            ORDER BY g.created_at DESC
        `, [cleanAadhaar]);

        res.json({
            count: grievances.length,
            items: grievances
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
