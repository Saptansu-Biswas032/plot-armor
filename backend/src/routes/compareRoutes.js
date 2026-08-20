// backend/src/routes/compareRoutes.js
const express = require('express');
const router = express.Router();
const { runSpatialVerification } = require('../engines/spatialEngine');

// [PRODUCTION ENDPOINT] - Accepts actual data from VeriApp
// Add this at the top of compareRoutes.js, just under the other imports:
const { getDB } = require('../db/database');

// Replace the old /execute route with this database-connected version
router.post('/execute', async (req, res) => {
    try {
        const { parcel_id, legacyPolygon, surveyPolygon, surveyorId } = req.body;
        
        if (!legacyPolygon || !surveyPolygon || !parcel_id) {
            return res.status(400).json({ error: "Missing required geospatial payload or parcel_id" });
        }

        const db = getDB();

        const parcel = await db.get(
            `SELECT parcel_id, ulpin FROM parcel WHERE parcel_id = ?`,
            [parcel_id]
        );
        if (!parcel) {
            return res.status(404).json({ error: 'Unknown parcel_id. Select a registered ULPIN before submitting evidence.' });
        }

        // 1. Run the Math Brain
        const verificationResult = runSpatialVerification(legacyPolygon, surveyPolygon);

        // 2. [LADM: Spatial Observation] Store what the VeriApp surveyor collected
        await db.run(
            `INSERT INTO spatial_observation (parcel_id, geometry, surveyor, timestamp) VALUES (?, ?, ?, ?)`,
            [parcel_id, JSON.stringify(surveyPolygon), surveyorId || 'SYSTEM_VERIAPP', new Date().toISOString()]
        );

        // 3. [LADM: Verification] Store the Math Engine's Decision Matrix
        // We use INSERT OR REPLACE in case this parcel was checked multiple times
        await db.run(
            `INSERT OR REPLACE INTO verification 
            (parcel_id, iou, hausdorff_distance, area_ratio, risk_score, decision) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                parcel_id, 
                verificationResult.iou, 
                verificationResult.hausdorff_distance, 
                verificationResult.area_ratio, 
                verificationResult.risk_score, 
                verificationResult.decision
            ]
        );

        // 4. Send response to VeriApp Edge Client
        res.status(200).json({
            message: "Pipeline Phase 2-4 Complete. Evidence locked.",
            parcel: { parcel_id: parcel.parcel_id, ulpin: parcel.ulpin },
            state: verificationResult.decision,
            metrics: verificationResult
        });

    } catch (err) {
        console.error("Execute Engine Error:", err);
        res.status(422).json({ error: 'Spatial Math / Database Pipeline Failed', details: err.message });
    }
});

// [HACKATHON DEMO ENDPOINT] - Instantly runs the two MVP Test Cases
router.get('/test-cases', (req, res) => {
    try {
        // Master Legacy Polygon (A perfectly square 1-Acre rural plot)
        const legacyPlot = {
            "type": "Polygon",
            "coordinates": [[[80.600, 16.500], [80.601, 16.500], [80.601, 16.501], [80.600, 16.501], [80.600, 16.500]]]
        };

        // Test Case A (Undisputed / Clear) -> Surveyor draws almost exactly the same boundary
        const surveyUndisputed = {
            "type": "Polygon",
            "coordinates": [[[80.600, 16.500], [80.6009, 16.500], [80.6009, 16.501], [80.600, 16.501], [80.600, 16.500]]]
        };

        // Test Case B (Disputed / Boundary Shift) -> Surveyor maps it shifted halfway into the neighbor's land
        const surveyDisputed = {
            "type": "Polygon",
            "coordinates": [[[80.6005, 16.5005], [80.6015, 16.5005], [80.6015, 16.5015], [80.6005, 16.5015], [80.6005, 16.5005]]]
        };

        // Run the Engine
        const resultA = runSpatialVerification(legacyPlot, surveyUndisputed);
        const resultB = runSpatialVerification(legacyPlot, surveyDisputed);

        // Send results back to the dashboard/browser
        res.json({
            status: "SUCCESS",
            test_case_a: {
                description: "Undisputed Plot (Near perfect overlap)",
                metrics: resultA
            },
            test_case_b: {
                description: "Disputed Plot (50% shift into neighboring land)",
                metrics: resultB
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Demo Engine Failed", details: err.message });
    }
});

module.exports = router;
