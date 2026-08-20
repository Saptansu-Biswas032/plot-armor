// backend/src/routes/verifyRoutes.js
const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// 1. Fetch the Tahsildar Inbox (Pending Grievances)
router.get('/pending', async (req, res) => {
    try {
        const db = getDB();
        
        // Fetch parcels that are not CLEAR. (UNCERTAIN or DISPUTED)
        const pendingQueue = await db.all(
            `SELECT * FROM verification WHERE decision != 'CLEAR'`
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
        const { parcel_id, officer_action, officer_id } = req.body; // action: 'CERTIFIED_CLEAR' or 'REJECTED_COURT'
        const db = getDB();

        // Update the verification decision based on Human-in-the-loop override
        await db.run(
            `UPDATE verification SET decision = ? WHERE parcel_id = ?`,
            [officer_action, parcel_id]
        );

        res.status(200).json({
            status: "STATE_UPDATED",
            parcel_id: parcel_id,
            new_state: officer_action,
            message: `Officer ${officer_id || 'TAHSILDAR'} finalized certification. Ready for Phase 7 (Anchor).`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to certify land state', details: err.message });
    }
});

module.exports = router;