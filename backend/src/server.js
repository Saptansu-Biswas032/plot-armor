// backend/src/server.js
const app = require('./app');
const { initDB } = require('./db/database');

const PORT = process.env.PORT || 8080;

async function bootSystem() {
    console.log(`\n======================================================`);
    console.log(` 🛡️  PLOT-ARMOR TRUST PIPELINE | HACKATHON MVP `);
    console.log(`======================================================`);
    
    try {
        await initDB();
        
        app.listen(PORT, () => {
            console.log(`[GATEWAY] Active on Port: ${PORT}`);
            console.log(`[ROUTER]  7-Phase Workflow API mounted.`);
            console.log(`[READY]   Awaiting evidence ingestion...`);
            console.log(`======================================================\n`);
        });
    } catch (err) {
        console.error("CRITICAL FAILURE DURING BOOT SEQUENCE:", err);
        process.exit(1);
    }
}

bootSystem();