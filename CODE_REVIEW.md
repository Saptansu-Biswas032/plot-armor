# 🔬 Plot-Armor: Architectural Code Review

## Executive Philosophy
The Plot-Armor codebase avoids monolithic anti-patterns. Rather than creating a singular "smart app," the logic is aggressively decoupled into a micro-architecture enforcing a strict 7-phase State Machine. Code decisions heavily favored domain accuracy (ISO 19152-1 standard) and explicit spatial mathematics over speculative GUI features. 

---

## Component Breakdown: The "What" and the "Why"

### 1. Database Entity Modeling (`backend/src/db/database.js`)
*   **What it does:** Initializes an SQLite data store consisting of explicit tables: `parcel`, `ownership`, `transaction_chain`, `spatial_observation`, and `verification`. 
*   **Why we wrote it this way:** Many land applications use a flattened `Properties` table. This fails in the real world. By adhering to the **ISO 19152-1 Land Administration Domain Model (LADM)**, we explicitly separate the *physical land* (Polygon) from the *human right* (Title). This is foundational to modeling temporal chains (inheritance) cleanly in the future.

### 2. The Math Brain (`backend/src/engines/spatialEngine.js`)
*   **What it does:** Standardizes ingested coordinates into GeoJSON, runs Turf.js spatial logic, and derives the Spatial Discrepancy Index (SDI) utilizing the Jaccard Index (IoU), centroid displacement, and bounding geometries.
*   **Why we wrote it this way:** The DILRMP currently suffers from the "Area Paradox." Legacy systems calculate `Area_A == Area_B`. Our SDI engine proves that overlapping topology matters just as much as flat area. Outputting an explicit `Risk_Score` completely objectifies land boundaries, converting legal ambiguity into actionable mathematics.

### 3. The Trust Pipeline Router (`backend/src/app.js` & `routes/`)
*   **What it does:** Orchestrates HTTP traffic based on chronological system phases (Phase 1 Observe ➔ Phase 2 Compare ➔ Phase 5 Verify ➔ Phase 7 Anchor).
*   **Why we wrote it this way:** By gating the actions behind pipeline phases rather than basic CRUD endpoints (`POST /update-land`), we prevent state corruption. A surveyor edge-device mathematically *cannot* finalize a boundary (Phase 7) without passing through the Compare Engine (Phase 2) threshold.

### 4. Zero-Build Edge Clients (`clients/veriapp-mobile` & `clients/officer-ui`)
*   **What it does:** Provides the Human-in-the-Loop visualization. Utilizes direct-link HTML, CDN Tailwind, and Leaflet.js.
*   **Why we wrote it this way:** Field edge applications cannot assume continuous broadband connectivity or high compute capabilities. The zero-build HTML approach emulates a Progressive Web App (PWA) methodology—making it highly accessible, effortlessly cacheable offline, and free from heavy framework bloat (like un-optimized React DOM trees).

---

## 📈 Scalability: Upgrading the MVP

The current codebase is a proven Hackathon MVP. To evolve into a Production National Framework, the following architectural upgrades are required:

1.  **Transition to PostGIS:** 
    *   *The Limit:* Turf.js computes in-memory using JavaScript (V8 Engine single-thread constraint).
    *   *The Fix:* Migrate SQLite to PostgreSQL + PostGIS. PostGIS handles spatial queries (like `ST_Intersection`) natively in optimized C code at the database level, handling millions of plots concurrently.
2.  **WebAuthn (True TEE Integration):** 
    *   *The Limit:* The MVP mimics a Trusted Execution Environment (TEE) authorization using a UI timeout.
    *   *The Fix:* Integrate standard FIDO2 APIs. Surveyors must trigger iOS FaceID / Android Fingerprint to unlock an asymmetric private key stored on the device hardware, attaching an unforgeable cryptographic signature to every GNSS payload array.
3.  **Distributed Smart Contracts:** 
    *   *The Limit:* Hashes are currently processed linearly in the Node application context. 
    *   *The Fix:* Transition Phase 7 (Anchor) to a Hyperledger Fabric Node. Verified plot coordinates (and the Officer's digital approval cert) will trigger a fractional ownership Smart Contract transition to preserve verifiable inheritance custody.
