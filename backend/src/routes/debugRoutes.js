const express = require('express');
const router = express.Router();
const { initDB } = require('../db/database');
const fs = require('fs');
const path = require('path');

router.post('/reset-db', async (req, res) => {
    try {
        const dbPath = path.resolve(__dirname, '../db/plotarmor_mvp.sqlite');
        
        // Wait, initDB() will open it. If it's already open, it might be locked.
        // But sqlite allows deletion if we close it, or we can just drop tables and reseed.
        // A safer way is to just delete the rows from the dynamic tables!
        
        const { getDB } = require('../db/database');
        const db = getDB();
        
        // Clear dynamic transaction data:
        await db.run('DELETE FROM grievances');
        // We do not delete citizens or parcels because they are seed data.
        // Just clearing the grievances resets the demo state!
        
        // Let's also clear any dockets if they exist (though they are not implemented in sqlite yet)
        
        res.json({ success: true, message: "Database state successfully reset." });
    } catch (err) {
        console.error("DB Reset Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
