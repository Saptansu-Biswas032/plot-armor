// backend/src/routes/verifyRoutes.js
const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// 1. Fetch the Tahsildar Inbox (Pending Grievances)
router.get('/pending', async (req, res) => {
    try {
        const db = getDB();
        
        // Only open verification states belong in the revenue queue. Final
        // certification and court escalation must not reappear as pending work.
        const pendingQueue = await db.all(
            `SELECT verification.*, parcel.ulpin, parcel.source
             FROM verification
             JOIN parcel ON parcel.parcel_id = verification.parcel_id
             WHERE verification.decision IN ('UNCERTAIN', 'DISPUTED')
             ORDER BY verification.risk_score DESC`
        );

        res.status(200).json({
            queue_count: pendingQueue.length,
            items: pendingQueue
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch verification queue', details: err.message });
    }
});

// 2. Phase 6 (Certify) - Tahsildar manual override (Approve / Reject)
router.post('/certify', async (req, res) => {
    try {
        const { parcel_id, officer_action, officer_id } = req.body;
        const db = getDB();

        if (!['CERTIFIED_CLEAR', 'COURT_ESCALATION'].includes(officer_action)) {
            return res.status(400).json({ error: 'Unsupported officer action.' });
        }

        const parcel = await db.get(`SELECT parcel_id, ulpin FROM parcel WHERE parcel_id = ?`, [parcel_id]);
        if (!parcel) {
            return res.status(404).json({ error: 'Parcel not found.' });
        }

        // Update the verification decision based on Human-in-the-loop override
        await db.run(
            `UPDATE verification SET decision = ? WHERE parcel_id = ?`,
            [officer_action, parcel_id]
        );

        let docket = null;
        if (officer_action === 'COURT_ESCALATION') {
            const now = new Date().toISOString();
            docket = {
                docket_id: `CIVIL-${new Date().getFullYear()}-${parcel_id.replace('PRC_', '')}`,
                parcel_id,
                status: 'FROZEN_FOR_LITIGATION',
                created_at: now,
                updated_at: now
            };
            await db.run(
                `INSERT INTO judicial_docket (docket_id, parcel_id, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(parcel_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
                [docket.docket_id, docket.parcel_id, docket.status, docket.created_at, docket.updated_at]
            );
            docket.ulpin = parcel.ulpin;
        }

        res.status(200).json({
            status: "STATE_UPDATED",
            parcel_id: parcel_id,
            new_state: officer_action,
            docket,
            message: `Officer ${officer_id || 'TAHSILDAR'} finalized certification. Ready for Phase 7 (Anchor).`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to certify land state', details: err.message });
    }
});

// Tribunal view: judicial work is persisted independently of the client session.
router.get('/dockets', async (req, res) => {
    try {
        const db = getDB();
        const dockets = await db.all(
            `SELECT judicial_docket.*, parcel.ulpin, parcel.source
             FROM judicial_docket
             JOIN parcel ON parcel.parcel_id = judicial_docket.parcel_id
             ORDER BY judicial_docket.updated_at DESC`
        );
        res.status(200).json({ docket_count: dockets.length, items: dockets });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch judicial dockets', details: err.message });
    }
});

module.exports = router;
