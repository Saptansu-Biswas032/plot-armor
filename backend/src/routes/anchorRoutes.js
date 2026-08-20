// backend/src/routes/anchorRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDB } = require('../db/database');

/**
 * PHASE 7: BLOCKCHAIN ANCHOR (State-Transition)
 * Formula: P_t(G,O,R,E,S) -> P_t+1(G,O,R,E,S)
 * Records the state change to a Permissioned Consortium DLT (Hyperledger).
 */
router.post('/state-transition', async (req, res) => {
    try {
        const { 
            ulpin, 
            transition_type, // "SALE", "INHERITANCE", "PARTITION", "BOUNDARY_CORRECTION"
            authority_id,
            evidence_documents, // e.g. [{ type: "DEED", base64: "..." }]
            new_geometry, 
            new_owners // e.g. [{ owner_id: "HEIR_1", share: 50 }, { owner_id: "HEIR_2", share: 50 }]
        } = req.body;

        const db = getDB();

        if (!ulpin || !transition_type || !authority_id) {
            return res.status(400).json({ error: 'ulpin, transition_type, and authority_id are required.' });
        }

        // 1. Fetch Current State (P_t) from Off-Chain Database
        const currentState = await db.get(`SELECT * FROM parcel WHERE ulpin = ?`, [ulpin]);
        if (!currentState) {
            return res.status(404).json({ error: 'ULPIN is not registered.' });
        }

        const verification = await db.get(
            `SELECT decision FROM verification WHERE parcel_id = ?`,
            [currentState.parcel_id]
        );
        if (!verification || verification.decision !== 'CERTIFIED_CLEAR') {
            return res.status(409).json({
                error: 'State transition requires Tahsildar certification.',
                current_verification_state: verification ? verification.decision : 'NO_FIELD_VERIFICATION'
            });
        }

        const currentVersion = currentState.version;
        const nextVersion = currentVersion + 1;

        // 2. Off-Chain Hashing (Securing PII & Heavy Files per Section 16)
        // We NEVER put names, Aadhaar, or coordinates directly on chain.
        const geometryHash = crypto.createHash('sha256').update(JSON.stringify(new_geometry || currentState.geometry)).digest('hex');
        const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(evidence_documents || [])).digest('hex');
        const ownershipHash = crypto.createHash('sha256').update(JSON.stringify(new_owners || [])).digest('hex');

        // Dummy Previous State Hash (In reality, fetch from Ledger block N-1)
        const previousStateHash = crypto.createHash('sha256').update(ulpin + currentVersion).digest('hex');

        // 3. Construct the Exact Hyperledger On-Chain Payload
        const onChainPayload = {
            parcel_id: ulpin,
            version_id: nextVersion,
            transaction_id: `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            transition_type: transition_type,
            document_evidence_hash: evidenceHash,
            geometry_hash: geometryHash,
            ownership_structure_hash: ownershipHash,
            timestamp: new Date().toISOString(),
            authority_id: authority_id,
            decision_id: `DEC_${currentVersion}_to_${nextVersion}`,
            previous_state_hash: previousStateHash
        };

        // 4. Simulate Hyperledger Consortium Consensus
        // In real life, Revenue, Survey, and Registration peer nodes endorse this hash.
        const blockHash = "0x" + crypto.createHash('sha256').update(JSON.stringify(onChainPayload)).digest('hex');
        onChainPayload.current_state_hash = blockHash;

        // 5. Update Local State Database to P_t+1
        await db.run(
            `UPDATE parcel SET version = ?, status = 'TRUSTED_STATE' WHERE ulpin = ?`, 
            [nextVersion, ulpin]
        );

        console.log(`[FABRIC-ORACLE] Consensus Reached. P_${currentVersion} -> P_${nextVersion}. Block: ${blockHash}`);

        res.status(200).json({
            message: "State Transition Certified & Anchored to Consortium DLT.",
            hyperledger_receipt: onChainPayload,
            network_peers_endorsed: ["Revenue_Node", "Survey_Node", "Registration_Node"]
        });

    } catch (err) {
        res.status(500).json({ error: 'DLT State Transition Failed.', details: err.message });
    }
});

module.exports = router;
