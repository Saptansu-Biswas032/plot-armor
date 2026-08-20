// backend/src/engines/dereEngine.js

/**
 * Dispute Evidence & Routing Engine (DERE)
 * Computes Dispute Severity and routes to the correct Legal/Revenue Authority.
 * Formula: D = f(S, T, L, E, H)
 */
function runDERE(spatialMetrics, graphEvaluation) {
    // 1. Extract Variables
    const S_iou = spatialMetrics ? spatialMetrics.iou : 1.0; 
    const S_shift = spatialMetrics ? spatialMetrics.centroid_displacement_m : 0;
    
    const state = graphEvaluation.state;
    const flags = graphEvaluation.flags || [];

    // 2. Initialize Routing Object
    let route = {
        classification: "LOW",
        dispute_classes: [],
        evidence_gaps: [],
        responsible_authority: "Gram_Panchayat",
        next_action: "None",
        summary_log: []
    };

    // 3. Assess (S)patial Inconsistency
    if (S_iou < 0.95 || S_shift > 5) {
        route.dispute_classes.push("Spatial Mismatch");
        route.evidence_gaps.push("Physical GNSS Ground Truth vs Official Polygon");
        route.summary_log.push(`Boundary displacement: ${S_shift}m (IoU: ${S_iou})`);
        
        route.classification = "MEDIUM";
        route.responsible_authority = "Survey_Settlement_Department";
        route.next_action = "Deploy VeriApp for mandatory F-Line field verification.";
    }

    // 4. Assess (T)ransactional & (E)vidence / (H)istorical (RoR vs Deed / Mutation Gaps)
    if (state === "INCONSISTENT" || state === "PROVISIONALLY VERIFIED") {
        route.dispute_classes.push("Transactional Mismatch / Mutation Gap");
        
        flags.forEach(f => route.summary_log.push(f));
        route.evidence_gaps.push("Deed to RoR mutation traceability");
        
        route.classification = route.classification === "LOW" ? "MEDIUM" : "HIGH";
        route.responsible_authority = "Tahsildar_Revenue_Office";
        route.next_action = "Summon landowners for hearing & mutation-chain validation.";
    }

    // 5. Assess (L)egal / Fraud Status (Court Injunctions / Title Fraud)
    if (state === "FORMALLY DISPUTED" || state === "DISPUTE SUSPECTED") {
        route.dispute_classes.push(state === "FORMALLY DISPUTED" ? "Court Dispute" : "Fraud Anomaly");
        flags.forEach(f => route.summary_log.push(f));
        route.evidence_gaps.push("Judicial Clearance / Title Validation");
        
        route.classification = "CRITICAL";
        route.responsible_authority = "Civil_Court_District";
        route.next_action = "Freeze ledger actions pending judicial/civil court decree.";
    }

    // 6. Return standard undisputed if clean
    if (route.dispute_classes.length === 0) {
        return {
            classification: "NONE",
            dispute_classes: ["Clean"],
            evidence_gaps: ["None"],
            responsible_authority: "Automated_Title_Registry",
            next_action: "State Guarantee Certification & Blockchain Anchor",
            summary_log: ["Parcel checks cleared."]
        };
    }

    return route;
}

module.exports = { runDERE };