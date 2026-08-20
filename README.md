# 🛡️ Plot-Armor: 7-Phase Trust Pipeline for Land Redressal

**A verifiable, math-driven architecture resolving India's DILRMP Spatial Geometry disputes.**

[![Architecture: 7-Phase State Machine](https://img.shields.io/badge/Architecture-State_Machine-blue)](#)
[![Data Model: ISO 19152-1 LADM](https://img.shields.io/badge/Standard-ISO_19152--1_LADM-green)](#)
[![Math Engine: Turf.js / Jaccard Index](https://img.shields.io/badge/Spatial-Turf.js%20%7C%20Jaccard_Index-red)](#)

---

## 📌 Executive Summary

While India has successfully digitized **~95%** of textual land records under the DILRMP, the digitization of spatial cadastral maps remains severely fragmented. Merely converting inaccurate paper maps to digital polygons creates a **Digitization Paradox**: high-precision freezing of historical errors. This directly causes F-Line (boundary) disputes and clogs the legal system.

**Plot-Armor** is an Enterprise MVP resolving this gap by moving away from "presumptive title" logic to a rigorous mathematical **Trust Pipeline**. It ensures that uncertain heterogeneous field evidence goes through a controlled transition into a verified legal state.

---

## 🏗️ Architectural Innovation: The Trust Pipeline

Unlike standard CRUD web applications, Plot-Armor treats land-boundary verification as a strictly gated State-Machine traversing 7 distinct phases.

**The Verification Flowchart:**
*   📱 **[VeriApp Mobile Edge (Surveyor)]**
    *   ⬇️ *(Phase 1: Observe) — Cryptographic GNSS Evidence*
*   ⚙️ **[Core API Gateway / Node.js]**
    *   🔍 *(Phase 2: Compare) — SDI Spatial Engine*
    *   📊 *(Phase 3: Classify) — Jaccard Index Thresholding*
    *   ⬇️ *System forks based on risk threshold:*
        *   🔴 **Path A (>5% Risk):** *(Phase 5: Human Verify)* ➔ 🏛️ **[Tahsildar Portal]**
        *   🟢 **Path B (<5% Risk):** *(Phase 7: DLT Anchor)* ➔ 🛡️ **[Trusted State]**

### 1. ISO 19152-1 Database Layer (SQLite MVP)
The data layer rigorously adheres to the **Land Administration Domain Model (LADM)**. Instead of a flat table, it explicitly tracks:
*   **Physical Spatial Units:** The actual land parcel.
*   **Temporal Human Rights:** Current and historical ownership.
*   **Field Evidence:** Spatial observations and GNSS coordinates.
*   **Mathematical Decision-States:** Verification and risk outcomes.

### 2. The Spatial SDI Engine (Math over Maps)
Comparing pure parcel area is mathematically flawed (e.g., a 1-acre plot can shift 50 meters into a neighbor's property and remain 1-acre, masking a false boundary). Plot-Armor mitigates this using the **Spatial Discrepancy Index (SDI)** driven by:
*   **Intersection over Union (Jaccard Index / IoU)**
*   **Centroid Displacement Vectors**
*   **Area Ratios & Hausdorff Distance Approximations**

**The Logic:** If the mathematical risk exceeds a **5%** threshold, the pipeline denies automatic registration and escalates to a Class II dispute. 

$Risk\_Score = (1 - IoU) \times 100$

### 3. Distributed Edge Clients

| Client | Type | Core Function |
| :--- | :--- | :--- |
| **VeriApp** | Offline-First Mobile Terminal | Utilizes simulated Secure Enclaves (TEE) to sign payloads, strictly binding surveyor identity to GNSS collection and eliminating "desk surveys" or GPS spoofing. |
| **Officer-UI** | Administrative Dashboard | A high-speed interface for State Revenue officers to intercept mathematically disputed F-Line boundaries and dictate state transitions. |

---

## 🚀 Execution & Setup (Hackathon MVP)

To execute the Trust Pipeline locally for evaluation, follow these two steps:

### Step 1: Initialize the Core Backend
The API Gateway will launch on `http://localhost:8080`, automatically migrating the ISO LADM SQLite Schema. Navigate to your backend folder and run your node commands:
*   `npm install`
*   `npm start`

### Step 2: Launch Client Terminals (No build required)
Because Plot-Armor prioritizes deployment simplicity at the edge, the UI clients utilize native web technologies (Tailwind CDN, Leaflet.js). Simply open the files directly in your browser:
*   **The Surveyor Field UI:** Open `clients/veriapp-mobile/index.html` 
*   **The Revenue Officer Dashboard:** Open `clients/officer-ui/index.html` 

---

## 🔮 Scalability & Future Roadmap

| Upgrade Vector | Current MVP Implementation | Future Production Target |
| :--- | :--- | :--- |
| **Database Expansion** | SQLite | **PostgreSQL + PostGIS cluster** to allow in-database OGC spatial geometry executions at a national scale. |
| **Silicon Biometrics** | Simulated TEE Hook | **FIDO2/WebAuthn APIs** to force native iOS Secure Enclave / Android TrustZone hardware to generate asymmetric keys, digitally signing GNSS payloads on the silicon layer. |
| **Ledger Infrastructure**| Local SHA-256 state anchors | **Hyperledger Fabric** permissioned network to enable cross-departmental data consensus. |
