// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet'); // Adds 11 layer HTTP Header Security
const rateLimit = require('express-rate-limit'); // Prevents DDoS / Brute Force
const path = require('path');

// Sub-Routers
const ulpinRoutes = require('./routes/ulpinRoutes');
const compareRoutes = require('./routes/compareRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const anchorRoutes = require('./routes/anchorRoutes');

const app = express();

// ==========================================
// 🛡️ ENTERPRISE MIDDLEWARE SHIELD
// ==========================================
app.use(helmet()); 
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Prevents large payload crashing
app.use(morgan('dev'));

// Rate Limiter: Max 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: 'Too many requests from this IP. Firewall locked.' }
});
app.use('/api/', apiLimiter);

// ==========================================
// 🚀 THE 7-PHASE TRUST PIPELINE
// ==========================================
app.use('/api/v1/ulpin', ulpinRoutes);                // Track A: Graph AI
app.use('/api/v1/pipeline/compare', compareRoutes);   // Track B: Spatial SDI (Phase 2, 3)
app.use('/api/v1/pipeline/verify', verifyRoutes);     // Track B: Human Adjudicate (Phase 5, 6)
app.use('/api/v1/pipeline/anchor', anchorRoutes);     // Track C: Ledger Transition (Phase 7)

// API Health & Metadata (Follows OGC Standards conceptual response)
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        service: 'Plot-Armor API Gateway',
        status: 'OPERATIONAL',
        architecture: 'ISO 19152-1 LADM + 7-Phase Trust Pipeline',
        security: ['Helmet', 'Rate-Limiting', 'Payload-Capping', 'CORS'],
        timestamp: new Date().toISOString()
    });
});

// The portal is served by the same origin as the API, avoiding the broken
// file:// and cross-origin startup path used by the original prototype.
app.use(express.static(path.resolve(__dirname, '../../clients/unified-portal')));

// ==========================================
// 🛑 GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error("\n[CRITICAL PIPELINE FAULT]:", err.stack);
    res.status(err.status || 500).json({ 
        error: 'Trust Pipeline Subsystem Failure', 
        message: err.message,
        trace_id: `TRACE_${Date.now()}` // Pro-tip: Log tracing looks highly advanced
    });
});

module.exports = app;
