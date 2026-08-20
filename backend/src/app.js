// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compareRoutes = require('./routes/compareRoutes');
const verifyRoutes = require('./routes/verifyRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// === THE 7-PHASE TRUST PIPELINE API GATEWAY ===
// Note: We define empty route handlers inline for the scaffold. We will flesh them out via Engines next.

// PHASE 1: Observe (Sync local encrypted DB from VeriApp)
app.post('/api/v1/pipeline/observe', (req, res) => {
    res.json({ phase: 1, action: "Collect GNSS observations & signatures", status: "PENDING" });
});

// PHASE 2: Compare (Run Spatial SDI & Historical consistency)
app.use('/api/v1/pipeline/compare', compareRoutes);

// PHASE 3 & 4: Classify & Recommend (Dispute classifier: Clear, Uncertain, Disputed)
app.post('/api/v1/pipeline/classify', (req, res) => {
    res.json({ phase: 3, action: "Generate system confidence & classification", status: "PENDING" });
});

// PHASE 5 & 6: Human Verify & Certify (Tahsildar Portal Integration)
app.use('/api/v1/pipeline/verify', verifyRoutes);

// PHASE 7: Anchor (Cryptographic DLT State Transition)
app.post('/api/v1/pipeline/anchor', (req, res) => {
    res.json({ phase: 7, action: "Hash and finalize state on immutable ledger", status: "PENDING" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("[PIPELINE HALT]:", err.message);
    res.status(500).json({ error: 'Trust Pipeline Failure', details: err.message });
});

module.exports = app;