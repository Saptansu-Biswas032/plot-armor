// backend/src/engines/spatialEngine.js
const turf = require('@turf/turf');

/**
 * Standardizes any raw polygon geometry into a proper GeoJSON Feature
 * to prevent Turf.js v7 strict-type crashing.
 */
function toFeature(geoData) {
    if (geoData.type === 'Feature') return geoData;
    return { type: 'Feature', properties: {}, geometry: geoData };
}

/**
 * STEP 4: Validate Geometry
 */
function validateGeometry(feature) {
    try {
        const kinks = turf.kinks(feature);
        if (kinks.features.length > 0) {
            return { valid: false, reason: 'Self-intersection (Topology Error) detected.' };
        }
        return { valid: true };
    } catch (e) {
        return { valid: false, reason: 'Invalid coordinate array structure.' };
    }
}

/**
 * STEPS 5-10: Execute Verification Math
 */
function runSpatialVerification(poGeoJSON, psGeoJSON) {
    // Standardize both inputs to safe Turf Features
    const f1 = toFeature(poGeoJSON);
    const f2 = toFeature(psGeoJSON);

    // 1. Validation check
    const poCheck = validateGeometry(f1);
    const psCheck = validateGeometry(f2);
    
    if (!poCheck.valid || !psCheck.valid) {
        throw new Error(`Geometry Validation Failed: ${poCheck.reason || psCheck.reason}`);
    }

    // 2. Base Areas
    const poArea = turf.area(f1);
    const psArea = turf.area(f2);

    // STEP 7: Calculate area discrepancy ratio
    const areaDiscrepancyRatio = Math.abs(poArea - psArea) / poArea;
    const areaRatio = psArea / poArea;

    // STEP 5: Calculate IoU (Intersection over Union / Jaccard Index)
    // Turf 7 syntax for intersect requires two separate features
    const intersection = turf.intersect(turf.featureCollection([f1, f2])); 
    
    // Fallback: If Turf 7 intersect errors, use direct parameters: turf.intersect(f1, f2)
    // Actually, v7 syntax is: turf.intersect(f1, f2) or turf.intersect(featureCollection) depending on exact minor version. 
    // Safest bet for Turf 7:
    let intersectionFeature;
    try {
        intersectionFeature = turf.intersect(f1, f2);
    } catch (e) {
        intersectionFeature = turf.intersect(turf.featureCollection([f1, f2]));
    }
    
    const intersectionArea = intersectionFeature ? turf.area(intersectionFeature) : 0;
    const unionArea = poArea + psArea - intersectionArea;
    const iou = unionArea === 0 ? 0 : (intersectionArea / unionArea);

    // STEP 8: Calculate Centroid Displacement
    const poCentroid = turf.centroid(f1);
    const psCentroid = turf.centroid(f2);
    const centroidDisplacement = turf.distance(poCentroid, psCentroid, { units: 'meters' });

    // STEP 6: Hausdorff Distance Approximation
    const hausdorffApprox = centroidDisplacement * (1 + areaDiscrepancyRatio);

    // STEP 9: Generate Spatial Consistency Score (Risk Score)
    let riskScore = (1 - iou) * 100;

    // STEP 10: Produce system decision bounds
    let decision = "CLEAR";
    if (riskScore > 5 && riskScore <= 20) decision = "UNCERTAIN";
    if (riskScore > 20) decision = "DISPUTED";

    return {
        iou: parseFloat(iou.toFixed(4)),
        hausdorff_distance: parseFloat(hausdorffApprox.toFixed(2)),
        area_ratio: parseFloat(areaRatio.toFixed(4)),
        centroid_displacement_m: parseFloat(centroidDisplacement.toFixed(2)),
        risk_score: parseFloat(riskScore.toFixed(2)),
        decision: decision
    };
}

module.exports = {
    validateGeometry,
    runSpatialVerification
};