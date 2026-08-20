// backend/src/engines/graphEngine.js

/**
 * Problem Track A Engine: The Parcel Evidence Graph Evaluator
 * Evaluates the topological and attribute consistency of an ULPIN's history.
 */
function evaluateEvidenceGraph(evidenceGraph) {
    const { nodes, edges } = evidenceGraph;
    let state = "VERIFIED";
    let flags = [];
    
    // 1. Check for Active Litigation (FORMALLY DISPUTED)
    const hasCourtCase = nodes.find(n => n.type === "Court_Case" && n.attributes?.status === "ACTIVE_INJUNCTION");
    const hasInjunctionEdge = edges.find(e => e.relation === "INJUNCTION_AGAINST_TITLE");
    
    if (hasCourtCase || hasInjunctionEdge) {
        return {
            state: "FORMALLY DISPUTED",
            confidence: 0.0,
            flags: ["Active judicial injunction or court case detected in custody chain."]
        };
    }

    // 2. Check for Title Fraud / Overlapping Claims (DISPUTE SUSPECTED)
    const hasDuplicateReg = edges.find(e => e.relation === "DUPLICATE_REGISTRATION" || e.relation === "CONFLICTING_CLAIMS");
    const multipleDeedsSimultaneous = edges.filter(e => e.target.includes("ROR_") && e.source.includes("DEED_")).length > 1; // Basic anomaly heuristic

    if (hasDuplicateReg || multipleDeedsSimultaneous) {
        return {
            state: "DISPUTE SUSPECTED",
            confidence: 0.2,
            flags: ["Topological Anomaly: Conflicting chain of titles or duplicate registration detected."]
        };
    }

    // 3. Check for Data Integrity / Clerical Typos (INCONSISTENT)
    // Find edges indicating contradiction or manually check node area mappings.
    const hasAreaContradiction = edges.find(e => e.relation === "CONTRADICTS_AREA");
    
    let areaInconsistency = false;
    const deeds = nodes.filter(n => n.type === "Sale_Deed");
    const rors = nodes.filter(n => n.type === "RoR");
    
    // Check if the area passed from Deed to RoR accidentally shifted a decimal
    if (deeds.length > 0 && rors.length > 0) {
        if (deeds[0].attributes.textual_area_sqm !== rors[0].attributes.textual_area_sqm) {
            areaInconsistency = true;
            flags.push(`Area Mismatch: Deed says ${deeds[0].attributes.textual_area_sqm} sqm, but RoR says ${rors[0].attributes.textual_area_sqm} sqm.`);
        }
    }

    if (hasAreaContradiction || areaInconsistency) {
        return {
            state: "INCONSISTENT",
            confidence: 0.5,
            flags: flags.length > 0 ? flags : ["Clerical Inconsistency: Metric properties do not map 1:1 across official nodes."]
        };
    }

    // 4. Check for Broken Chain of Custody (PROVISIONALLY VERIFIED)
    // E.g., Inheritance claim without a preceding registered deed, causing low overall trust
    const averageConfidence = nodes.reduce((sum, n) => sum + n.confidence, 0) / nodes.length;
    const missingDeed = deeds.length === 0 && rors.length > 0; // Has RoR but no base deed
    
    if (missingDeed || averageConfidence < 0.85) {
        flags.push(`Graph Confidence Score Low (${(averageConfidence * 100).toFixed(1)}%). Missing origin deed, relying on presumptive lineage.`);
        return {
            state: "PROVISIONALLY VERIFIED",
            confidence: averageConfidence,
            flags: flags
        };
    }

    // 5. Golden Path (VERIFIED)
    return {
        state: "VERIFIED",
        confidence: averageConfidence,
        flags: ["Graph harmonious. Sale Deed, RoR, and Cadastral attributes align both topologically and mathematically."]
    };
}

module.exports = { evaluateEvidenceGraph };