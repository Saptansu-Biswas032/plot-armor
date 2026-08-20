// plot-armor/data/generateEvidenceGraph.js
const fs = require('fs');

// Helper to generate coordinates (simplified 1 Acre squares for MVP)
const getPoly = (lat, lon) => ({
    type: "Polygon",
    coordinates: [[[lon, lat], [lon + 0.001, lat], [lon + 0.001, lat + 0.001], [lon, lat + 0.001], [lon, lat]]]
});

// The 5 Systemic Typologies (4 Cases Each = 20 Total Parcels)
const datasets = [];

for (let i = 1; i <= 20; i++) {
    let caseType = i % 5;
    let ulpin = `ULPIN_2026_${1000 + i}`;
    let graph = { nodes: [], edges: [] };
    let expectedState = "";

    if (caseType === 1) {
        // TYPOLOGY 1: PERFECT MATCH (VERIFIED)
        expectedState = "VERIFIED";
        graph.nodes.push(
            { id: `DEED_A${i}`, type: "Sale_Deed", source_authority: "SRO", timestamp: "2022-01-15T00:00:00Z", version: 1, confidence: 1.0, attributes: { textual_area_sqm: 4046.86, owner_id: `UID_${i}` } },
            { id: `ROR_B${i}`, type: "RoR", source_authority: "Revenue", timestamp: "2022-02-01T00:00:00Z", version: 1, confidence: 0.95, attributes: { textual_area_sqm: 4046.86, owner_id: `UID_${i}` } },
            { id: `CAD_C${i}`, type: "Cadastral_Polygon", source_authority: "Survey", timestamp: "2022-03-01T00:00:00Z", version: 1, confidence: 0.90, attributes: { spatial_extent: getPoly(16.0 + i, 80.0) } }
        );
        graph.edges.push(
            { source: `DEED_A${i}`, target: `ROR_B${i}`, relation: "TRIGGERS_MUTATION" },
            { source: `ROR_B${i}`, target: `CAD_C${i}`, relation: "CLAIMS_GEOMETRY" }
        );
    } 
    else if (caseType === 2) {
        // TYPOLOGY 2: LEGACY INHERITANCE / MISSING DEED (PROVISIONALLY VERIFIED)
        expectedState = "PROVISIONALLY VERIFIED";
        graph.nodes.push(
            { id: `INHERIT_A${i}`, type: "Inheritance", source_authority: "Panchayat", timestamp: "1995-05-20T00:00:00Z", version: 1, confidence: 0.60, attributes: { textual_area_sqm: 8093.72, owner_id: `UID_${i}` } },
            { id: `ROR_B${i}`, type: "RoR", source_authority: "Revenue", timestamp: "1995-06-10T00:00:00Z", version: 2, confidence: 0.90, attributes: { textual_area_sqm: 8093.72, owner_id: `UID_${i}` } }
        );
        graph.edges.push({ source: `INHERIT_A${i}`, target: `ROR_B${i}`, relation: "TRIGGERS_MUTATION" });
    }
    else if (caseType === 3) {
        // TYPOLOGY 3: CLERICAL TYPO / AREA MISMATCH (INCONSISTENT)
        expectedState = "INCONSISTENT";
        graph.nodes.push(
            { id: `DEED_A${i}`, type: "Sale_Deed", source_authority: "SRO", timestamp: "2023-01-10T00:00:00Z", version: 1, confidence: 0.99, attributes: { textual_area_sqm: 4046.86, owner_id: `UID_${i}` } },
            // Notice the Typo: 40468.6 instead of 4046.86
            { id: `ROR_B${i}`, type: "RoR", source_authority: "Revenue", timestamp: "2023-02-15T00:00:00Z", version: 1, confidence: 0.85, attributes: { textual_area_sqm: 40468.6, owner_id: `UID_${i}` } }
        );
        graph.edges.push({ source: `DEED_A${i}`, target: `ROR_B${i}`, relation: "CONTRADICTS_AREA" });
    }
    else if (caseType === 4) {
        // TYPOLOGY 4: TITLE FRAUD / DOUBLE REGISTRATION (DISPUTE SUSPECTED)
        expectedState = "DISPUTE SUSPECTED";
        graph.nodes.push(
            { id: `ROR_A${i}`, type: "RoR", source_authority: "Revenue", timestamp: "2010-01-01T00:00:00Z", version: 1, confidence: 0.90, attributes: { textual_area_sqm: 2000.0, owner_id: `UID_OLD_${i}` } },
            { id: `DEED_B${i}`, type: "Sale_Deed", source_authority: "SRO", timestamp: "2023-08-01T00:00:00Z", version: 1, confidence: 0.95, attributes: { textual_area_sqm: 2000.0, owner_id: `UID_THIEF_${i}` } },
            { id: `DEED_C${i}`, type: "Sale_Deed", source_authority: "SRO", timestamp: "2023-08-15T00:00:00Z", version: 1, confidence: 0.95, attributes: { textual_area_sqm: 2000.0, owner_id: `UID_BUYER_${i}` } }
        );
        graph.edges.push(
            { source: `DEED_B${i}`, target: `ROR_A${i}`, relation: "CONFLICTING_CLAIMS" },
            { source: `DEED_C${i}`, target: `ROR_A${i}`, relation: "CONFLICTING_CLAIMS" },
            { source: `DEED_B${i}`, target: `DEED_C${i}`, relation: "DUPLICATE_REGISTRATION" }
        );
    }
    else {
        // TYPOLOGY 5: ACTIVE LITIGATION (FORMALLY DISPUTED)
        expectedState = "FORMALLY DISPUTED";
        graph.nodes.push(
            { id: `DEED_A${i}`, type: "Sale_Deed", source_authority: "SRO", timestamp: "2020-05-12T00:00:00Z", version: 1, confidence: 0.98, attributes: { textual_area_sqm: 5000.0, owner_id: `UID_${i}` } },
            { id: `ROR_B${i}`, type: "RoR", source_authority: "Revenue", timestamp: "2020-06-01T00:00:00Z", version: 1, confidence: 0.90, attributes: { textual_area_sqm: 5000.0, owner_id: `UID_${i}` } },
            { id: `COURT_C${i}`, type: "Court_Case", source_authority: "Civil_Court", timestamp: "2021-04-10T00:00:00Z", version: 1, confidence: 1.0, attributes: { status: "ACTIVE_INJUNCTION" } }
        );
        graph.edges.push(
            { source: `DEED_A${i}`, target: `ROR_B${i}`, relation: "TRIGGERS_MUTATION" },
            { source: `COURT_C${i}`, target: `ROR_B${i}`, relation: "INJUNCTION_AGAINST_TITLE" }
        );
    }

    datasets.push({ ulpin, verification_state_expected: expectedState, evidence_graph: graph });
}

// Write the dataset to disk
fs.writeFileSync('data/evidence_graphs.json', JSON.stringify({ datasets }, null, 2));
console.log(`[SYS] Generated 20 complex parcel evidence graphs at data/evidence_graphs.json`);