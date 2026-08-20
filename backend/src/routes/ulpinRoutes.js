// backend/src/routes/ulpinRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { evaluateEvidenceGraph } = require('../engines/graphEngine');
const { runDERE } = require('../engines/dereEngine');
const { getDB } = require('../db/database');

// These profiles power the synthetic MVP's record sources. The graph itself is
// constructed from the selected, registered parcel so the UI does not present
// an unrelated batch-test result as a real assessment.
const EVIDENCE_PROFILES = {
    ULPIN_AP_90210: 'DISPUTE_SUSPECTED',
    ULPIN_AP_90211: 'INCONSISTENT',
    ULPIN_AP_90212: 'VERIFIED',
    ULPIN_MH_40110: 'INCONSISTENT',
    ULPIN_MH_40111: 'DISPUTE_SUSPECTED',
    ULPIN_MH_40112: 'VERIFIED',
    ULPIN_KA_56010: 'VERIFIED',
    ULPIN_KA_56011: 'INCONSISTENT',
    ULPIN_KA_56012: 'PROVISIONALLY_VERIFIED',
    ULPIN_UP_22601: 'FORMALLY_DISPUTED',
    ULPIN_UP_22602: 'DISPUTE_SUSPECTED',
    ULPIN_UP_22603: 'VERIFIED',
    ULPIN_GJ_38001: 'PROVISIONALLY_VERIFIED',
    ULPIN_GJ_38002: 'FORMALLY_DISPUTED',
    ULPIN_GJ_38003: 'VERIFIED'
,
    ULPIN_NEW_1001: 'INCONSISTENT',
    ULPIN_NEW_1002: 'VERIFIED',
    ULPIN_NEW_1003: 'PROVISIONALLY_VERIFIED',
    ULPIN_NEW_1004: 'FORMALLY_DISPUTED',
    ULPIN_NEW_1005: 'DISPUTE_SUSPECTED',
    ULPIN_NEW_1006: 'INCONSISTENT',
    ULPIN_NEW_1007: 'VERIFIED',
    ULPIN_NEW_1008: 'PROVISIONALLY_VERIFIED',
    ULPIN_NEW_1009: 'FORMALLY_DISPUTED',
    ULPIN_NEW_1010: 'DISPUTE_SUSPECTED',
    ULPIN_NEW_1011: 'INCONSISTENT',
    ULPIN_NEW_1012: 'VERIFIED',
    ULPIN_NEW_1013: 'PROVISIONALLY_VERIFIED',
    ULPIN_NEW_1014: 'FORMALLY_DISPUTED',
    ULPIN_NEW_1015: 'DISPUTE_SUSPECTED',
    ULPIN_NEW_1016: 'INCONSISTENT',
    ULPIN_NEW_1017: 'VERIFIED',
    ULPIN_NEW_1018: 'PROVISIONALLY_VERIFIED',
    ULPIN_NEW_1019: 'FORMALLY_DISPUTED',
    ULPIN_NEW_1020: 'DISPUTE_SUSPECTED'
};

function makeNode(id, type, authority, confidence, attributes = {}) {
    return {
        id,
        type,
        source_authority: authority,
        timestamp: '2026-08-21T00:00:00.000Z',
        version: 1,
        confidence,
        attributes
    };
}

function buildEvidenceGraph(parcel, profile) {
    const area = parcel.area;
    const deed = makeNode('DEED', 'Sale_Deed', 'Sub-Registrar Office', 0.98, { textual_area_sqm: area });
    const ror = makeNode('ROR', 'RoR', 'Revenue Department', 0.95, { textual_area_sqm: area });
    const cadastre = makeNode('CADASTRE', 'Cadastral_Polygon', 'Survey Department', 0.93, { spatial_extent: JSON.parse(parcel.geometry) });

    if (profile === 'PROVISIONALLY_VERIFIED') {
        return {
            nodes: [
                makeNode('INHERITANCE', 'Inheritance', 'Village Revenue Office', 0.62, { textual_area_sqm: area }),
                ror,
                cadastre
            ],
            edges: [
                { source: 'INHERITANCE', target: 'ROR', relation: 'TRIGGERS_MUTATION' },
                { source: 'ROR', target: 'CADASTRE', relation: 'CLAIMS_GEOMETRY' }
            ]
        };
    }

    if (profile === 'INCONSISTENT') {
        ror.attributes.textual_area_sqm = Number((area * 1.1).toFixed(2));
        return {
            nodes: [deed, ror, cadastre],
            edges: [
                { source: 'DEED', target: 'ROR', relation: 'CONTRADICTS_AREA' },
                { source: 'ROR', target: 'CADASTRE', relation: 'CLAIMS_GEOMETRY' }
            ]
        };
    }

    if (profile === 'DISPUTE_SUSPECTED') {
        const conflictingDeed = makeNode('DEED_CONFLICT', 'Sale_Deed', 'Sub-Registrar Office', 0.91, { textual_area_sqm: area });
        return {
            nodes: [deed, conflictingDeed, ror, cadastre],
            edges: [
                { source: 'DEED', target: 'ROR', relation: 'CONFLICTING_CLAIMS' },
                { source: 'DEED_CONFLICT', target: 'ROR', relation: 'CONFLICTING_CLAIMS' },
                { source: 'DEED', target: 'DEED_CONFLICT', relation: 'DUPLICATE_REGISTRATION' },
                { source: 'ROR', target: 'CADASTRE', relation: 'CLAIMS_GEOMETRY' }
            ]
        };
    }

    if (profile === 'FORMALLY_DISPUTED') {
        const courtCase = makeNode('COURT_ORDER', 'Court_Case', 'Civil Court', 1, { status: 'ACTIVE_INJUNCTION' });
        return {
            nodes: [deed, ror, cadastre, courtCase],
            edges: [
                { source: 'DEED', target: 'ROR', relation: 'TRIGGERS_MUTATION' },
                { source: 'ROR', target: 'CADASTRE', relation: 'CLAIMS_GEOMETRY' },
                { source: 'COURT_ORDER', target: 'ROR', relation: 'INJUNCTION_AGAINST_TITLE' }
            ]
        };
    }

    return {
        nodes: [deed, ror, cadastre],
        edges: [
            { source: 'DEED', target: 'ROR', relation: 'TRIGGERS_MUTATION' },
            { source: 'ROR', target: 'CADASTRE', relation: 'CLAIMS_GEOMETRY' }
        ]
    };
}

// Registry data for the portal's ULPIN picker.
router.get('/parcels', async (req, res) => {
    try {
        const db = getDB();
        const parcels = await db.all(
            `SELECT parcel_id, ulpin, area, source, version, status, geometry FROM parcel ORDER BY ulpin`
        );
        res.status(200).json({
            count: parcels.length,
            items: parcels.map(parcel => ({ ...parcel, geometry: JSON.parse(parcel.geometry) }))
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load registered parcels.', details: err.message });
    }
});

// Track A assessment for one real synthetic-registry parcel.
router.get('/assessment/:ulpin', async (req, res) => {
    try {
        const db = getDB();
        const parcel = await db.get(`SELECT * FROM parcel WHERE ulpin = ?`, [req.params.ulpin]);
        if (!parcel) {
            return res.status(404).json({ error: 'ULPIN not found in the national synthetic registry.' });
        }

        const graph = buildEvidenceGraph(parcel, EVIDENCE_PROFILES[parcel.ulpin] || 'VERIFIED');
        const evaluation = evaluateEvidenceGraph(graph);
        const routing = runDERE(null, evaluation);

        res.status(200).json({
            parcel: { ...parcel, geometry: JSON.parse(parcel.geometry) },
            graph,
            evaluation,
            routing
        });
    } catch (err) {
        res.status(500).json({ error: 'Evidence graph assessment failed.', details: err.message });
    }
});

// [BATCH TEST RUNNER] Reads the 20-case JSON file and grades them using the AI Graph Engine
router.get('/batch-evaluate', (req, res) => {
    try {
        const dataPath = path.join(__dirname, '../../../data/evidence_graphs.json');
        
        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ error: "evidence_graphs.json not found. Run the generator script first." });
        }

        const rawData = fs.readFileSync(dataPath, 'utf8');
        const parsedData = JSON.parse(rawData);

        const results = parsedData.datasets.map(dataset => {
            const evaluation = evaluateEvidenceGraph(dataset.evidence_graph);
            
            return {
                ulpin: dataset.ulpin,
                expected_state: dataset.verification_state_expected,
                calculated_state: evaluation.state,
                confidence_score: `${(evaluation.confidence * 100).toFixed(1)}%`,
                accuracy: (dataset.verification_state_expected === evaluation.state) ? "PASS ✅" : "FAIL ❌",
                flags: evaluation.flags
            };
        });

        res.status(200).json({
            module: "Temporal Custody Graph (TCG) Evaluator",
            total_cases_evaluated: results.length,
            accuracy: results.filter(r => r.accuracy === "PASS ✅").length / results.length * 100 + "%",
            report: results
        });

    } catch (err) {
        console.error("Batch Eval Error:", err);
        res.status(500).json({ error: "Graph Evaluator Engine Failed", details: err.message });
    }
});

module.exports = router;
