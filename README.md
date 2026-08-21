# 🛡️ Plot-Armor: 7-Phase Trust Pipeline for Land Redressal

**A verifiable, math-driven architecture resolving India's DILRMP spatial boundary disputes.**

[![Architecture: 7-Phase State Machine](https://img.shields.io/badge/Architecture-7--Phase_State_Machine-blue)](#)
[![Data Model: ISO 19152-1 LADM](https://img.shields.io/badge/Standard-ISO_19152--1_LADM-green)](#)
[![Spatial Engine: Turf.js / Jaccard Index](https://img.shields.io/badge/Spatial-Turf.js%20%7C%20Jaccard_Index-red)](#)
[![Graph AI: Custody Evaluator](https://img.shields.io/badge/Graph_AI-Temporal_Custody_Graph-purple)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](#)

---

## 📌 Executive Summary

While India has successfully digitized **~95%** of textual land records under the **Digital India Land Records Modernization Programme (DILRMP)**, the digitization of spatial cadastral maps remains severely fragmented. Merely vectorizing historical paper maps creates a **Digitization Paradox**: freezing century-old colonial measurement errors with high-precision digital coordinates. This causes widespread F-Line (Field Measurement Book) boundary disputes and overwhelms the revenue and judicial systems.

**Plot-Armor** replaces traditional "presumptive title" CRUD databases with a rigorous mathematical **7-Phase Trust Pipeline**. It ensures that uncertain heterogeneous field evidence transitions into a verified, immutable legal state through deterministic spatial geometry checks, temporal custody graph AI, and transparent judicial holds.

---

## 🔐 7 Principles of Trust (Derived from TEE)

Plot-Armor is heavily inspired by hardware **Trusted Execution Environments (TEE)**. We abstract physical silicon guarantees into a software-defined architecture to secure the nation's critical land infrastructure:

1. **Confidentiality (Data in Use Protection):** PII and sensitive ownership attributes are stripped before processing. Only cryptographically hashed identifiers traverse external layers and consortium states.
2. **Execution Integrity:** The Spatial Data Integrity (SDI) and Dispute Evidence Routing Engine (DERE) execute deterministically; the same geometries and inputs mathematically guarantee the same Risk Score and routing output.
3. **Authenticity & Attestation:** Field verifications demand hardware-signed GNSS payloads. The system enforces cryptographic attestation mapping Surveyor UID, Device IMEI, and GNSS accuracy parameters to every spatial observation.
4. **Isolation:** The 7-Phase State Machine prevents arbitrary execution paths. A phase transition (e.g., from Revenue Desk to Consortium Ledger) cannot occur without clearing the preceding gating metrics and judicial holds.
5. **Non-repudiation:** Every revenue certification generates an immutable receipt. A Tahsildar cannot retrospectively deny their approval of a disputed boundary once anchored.
6. **State Continuity (Anti-Rollback):** Strict monotonic version control ($P_v \rightarrow P_{v+1}$) prevents malicious rollback of an ULPIN state to a previous contested boundary.
7. **Auditability:** Complete cryptographic trails of mathematical metrics (IoU, Centroid Delta) are anchored alongside the decision, making the exact justification for boundary approval or rejection mathematically verifiable.

---

## 🏗️ Core Architectural Innovation

Unlike standard web applications that permit un-gated database modifications (`POST /update-land`), Plot-Armor treats land record mutation as a strictly governed **Gated State Machine**:

```
                               THE 7-PHASE TRUST PIPELINE
                               
  +-----------------------------------------------------------------------------------+
  | Track A: Temporal Custody Graph (TCG) AI                                          |
  | [Phase 0: Ingest ULPIN] ---> [Phase 1A: Construct Heterogeneous Evidence Graph]    |
  |                              ---> [Graph AI Evaluator: Detect Injunctions/Fraud]   |
  +-----------------------------------------------------------------------------------+
                                            |
                                            v
  +-----------------------------------------------------------------------------------+
  | Track B: Spatial Data Integrity (SDI) Engine                                      |
  | [Phase 1B: Hardware GNSS Field Observation] ---> [Phase 2: Topology Validation]    |
  | ---> [Phase 3: Spatial SDI Math (IoU, Hausdorff, Centroid)]                        |
  | ---> [Phase 4: Compute Risk Score & Classify Bounds]                              |
  +-----------------------------------------------------------------------------------+
                                            |
                                            v
                  +---------------------------------------------------+
                  |      Dispute Evidence & Routing Engine (DERE)     |
                  |             D = f(S, T, L, E, H)                  |
                  +---------------------------------------------------+
                     /                      |                       \
        Risk <= 5%  /          Risk 5-20%   |            Risk > 20%  \
       Clean Graph /       Transactional Gap|        Court Injunction \
                  v                         v                          v
       +--------------------+     +-------------------+      +--------------------+
       | Fast-Track Approve |     | Phase 5: Revenue  |      | Phase 6B: Tribunal |
       |                    |     | Adjudication Desk |      | Judicial Hold      |
       +--------------------+     +-------------------+      +--------------------+
                  |                         |                          |
                  |               [Phase 6A: Certify]                  |
                  |                         |                          |
                  +----------------> [Phase 7] <-----------------------+
                                        | (Asset Frozen if Disputed)
                                        v
                          [Consortium DLT State Anchor]
                          [P_t(G,O,R,E,S) -> P_t+1]
```

---

## 🔬 Subsystem & Algorithmic Engines

### 1. Spatial SDI Engine (`backend/src/engines/spatialEngine.js`)
Resolves the **Equal Area Paradox** (where an encroached plot shifted 30m into a neighbor's property retains identical flat surface area):
* **Topology Validation:** Runs `turf.kinks()` to block self-intersecting polygon anomalies.
* **Intersection over Union (IoU / Jaccard Index):**
  $$\text{IoU} = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)} = \frac{\text{Area}(A \cap B)}{\text{Area}(A) + \text{Area}(B) - \text{Area}(A \cap B)}$$
* **Centroid Displacement Vector:** Geodesic distance between polygon centers ($C_A, C_B$) over WGS84.
* **Hausdorff Approximation:** Boundary distortion quantification:
  $$H_{\text{approx}} = D_{\text{centroid}} \times \left(1 + \frac{|\text{Area}(A) - \text{Area}(B)|}{\text{Area}(A)}\right)$$
* **Mathematical Risk Score:**
  $$\text{Risk\_Score} = (1 - \text{IoU}) \times 100$$
  * $\le 5\% \implies \mathbf{CLEAR}$ (Automated Fast-Track)
  * $5\% \text{ to } 20\% \implies \mathbf{UNCERTAIN}$ (Revenue Officer Review)
  * $> 20\% \implies \mathbf{DISPUTED}$ (Escalate / Asset Freeze)

### 2. Temporal Custody Graph (TCG) AI (`backend/src/engines/graphEngine.js`)
* Evaluates multi-source institutional record linkages across Sub-Registrar Offices (Deeds), Revenue Departments (RoR), Survey Departments (Cadastre), and Civil Courts.
* Flags active injunctions, title fraud / duplicate registrations, clerical area mismatches, and broken inheritance chains.

### 3. Dispute Evidence & Routing Engine (`backend/src/engines/dereEngine.js`)
* Implements the multi-variable administrative routing function $\mathcal{D} = f(\mathcal{S}, \mathcal{T}, \mathcal{L}, \mathcal{E}, \mathcal{H})$ routing cases to **Gram Panchayat**, **Survey & Settlement Dept**, **Tahsildar Revenue Office**, or the **District Civil Court**.

### 4. Consortium DLT State Transition (`backend/src/routes/anchorRoutes.js`)
* Executes state transition $P_t(G, O, R, E, S) \longrightarrow P_{t+1}(G, O, R, E, S)$.
* **Privacy-Preserving Hashing:** In compliance with DPDP Act 2023 and Section 16 directives, **zero PII or raw coordinates are placed on-chain**. Only irreversible SHA-256 digests (`geometry_hash`, `evidence_hash`, `ownership_structure_hash`) are anchored.

---

## 🏛️ ISO 19152-1 LADM Schema Architecture

The persistent database layer (`backend/src/db/database.js`) strictly mirrors the international **Land Administration Domain Model**:

| LADM Core Package | LADM Class | Database Table | Description |
| :--- | :--- | :--- | :--- |
| **Spatial Unit Package** | `LA_SpatialUnit` | `parcel` | Physical parcel geometry (GeoJSON), area, version, status |
| **Party Package** | `LA_Party` / `LA_RRR` | `ownership` | Fractional rights, owner IDs, valid temporal date intervals |
| **Administrative Package** | `LA_BAUnit` | `transaction_chain` | Deed and mutation transactions, authority references |
| **Surveying Package** | `LA_SpatialSource` | `spatial_observation` | Field GNSS captures, device telemetry, surveyor signatures |
| **Audit Package** | Custom Extension | `verification` & `judicial_docket` | Mathematical metrics, decision matrix, active court holds |

---

## 💻 Unified 4-Persona Workspace

The zero-build edge frontend (`clients/unified-portal/`) provides an accessible, ultra-lightweight interface for all stakeholders:

```
+-------------------------------------------------------------------------------------+
|                           PLOT-ARMOR UNIFIED PORTAL                                 |
+-------------------------------------------------------------------------------------+
|  [01] Record Assessment  | Ingests 35 ULPINs across 9 States; builds visual         |
|       (Track A)          | evidence graphs & exports audit PDF reports.             |
+--------------------------+----------------------------------------------------------+
|  [02] Field Verification | Hardware GNSS selector (RTK ±2cm, DGPS ±50cm, Handheld),  |
|       (Track B)          | cryptographic device signing & live spatial SVG overlay. |
+--------------------------+----------------------------------------------------------+
|  [03] Revenue Desk       | Real-time searchable queue for Tahsildars to certify     |
|       (Phase 5-7)        | clear parcels or escalate disputes; generates DLT receipt.|
+--------------------------+----------------------------------------------------------+
|  [04] Tribunal Docket    | Judicial hold dashboard; locks disputed titles and       |
|       (Phase 6B)         | dispatches legal summonses.                              |
+-------------------------------------------------------------------------------------+
```

---

## 🚀 Quickstart & Setup

### Prerequisites
* **Node.js** (v18+ recommended)
* **npm** (v9+)

### Step 1: Install & Launch Backend Gateway
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Initialize and seed the ISO LADM database (35 multi-state parcels)
npm run seed

# Start API Gateway on http://localhost:8080
npm start
```

### Step 2: Open the Unified Portal
Once the backend server is running, simply open your browser and navigate to:
```
http://localhost:8080
```
*(The portal is served directly by the backend gateway, preventing cross-origin and file:// path issues).*

### Step 3: Execute Algorithmic Test Suite
```bash
# Run unit tests validating spatial math and graph evaluation engines
node --test backend/test/engines.test.js
```

---

## 📂 Project Repository Structure

```
plot-armor/
├── CODE_REVIEW.md                   # Complete 5-page enterprise architectural review & auditor Q&A
├── README.md                        # Comprehensive system documentation & quickstart
├── package.json                     # Root configuration
├── backend/
│   ├── package.json                 # Backend dependencies (Express, Turf.js, SQLite3, Helmet)
│   ├── src/
│   │   ├── app.js                   # Express application & defensive middleware shield
│   │   ├── server.js                # Server entrypoint (Port 8080)
│   │   ├── db/
│   │   │   ├── database.js          # ISO 19152-1 LADM SQLite schema & 35-parcel seeder
│   │   │   └── plotarmor_mvp.sqlite # Active local database instance
│   │   ├── engines/
│   │   │   ├── spatialEngine.js     # Spatial SDI Engine (IoU, Hausdorff, Centroid shift)
│   │   │   ├── graphEngine.js       # Temporal Custody Graph (TCG) AI Evaluator
│   │   │   └── dereEngine.js        # Dispute Evidence & Routing Engine (DERE)
│   │   └── routes/
│   │       ├── ulpinRoutes.js       # Track A: ULPIN registry & graph assessment routes
│   │       ├── compareRoutes.js     # Track B: Spatial observation comparison routes
│   │       ├── verifyRoutes.js      # Phase 5-6: Revenue adjudication & judicial dockets
│   │       └── anchorRoutes.js      # Phase 7: DLT consortium state transition anchoring
│   └── test/
│       └── engines.test.js          # Native automated test suite for math & graph engines
├── clients/
│   └── unified-portal/
│       ├── index.html               # 4-Persona Unified Portal shell (Zero-build HTML5)
│       ├── styles.css               # Responsive design system & custom SVG cadastral styling
│       └── app.js                   # Client-side state manager, API bridge & workflow engine
└── data/
    ├── evidence_graphs.json         # Synthetic test suite of 20 edge-case custody graphs
    └── generateEvidenceGraphs.js    # Graph dataset generation utility
```

---

## 🔮 Production Hardening Roadmap

| Vector | Hackathon MVP | Production Target |
| :--- | :--- | :--- |
| **Spatial Engine** | In-Memory Turf.js | **PostgreSQL 16 + PostGIS cluster** (`ST_Intersection`, `ST_HausdorffDistance`, R-Tree spatial indexes). |
| **Silicon Security** | Simulated device signature | **FIDO2 / WebAuthn standard** utilizing Android StrongBox / iOS Secure Enclave hardware chips. |
| **Distributed Ledger** | SHA-256 Consortium simulation | **Hyperledger Fabric 2.5 channel** with RAFT consensus across Revenue, Survey, and Registration nodes. |
| **Document Ingestion** | Synthetic graph generator | **Indic OCR + fine-tuned NER models** for automated vernacular deed extraction (7/12, Patta, Chitta). |

---

## 📜 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

*Plot-Armor: Bringing mathematical certainty, institutional accountability, and legal defensibility to land records.*
