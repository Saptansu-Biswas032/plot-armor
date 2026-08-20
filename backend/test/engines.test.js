const test = require('node:test');
const assert = require('node:assert/strict');
const { runSpatialVerification } = require('../src/engines/spatialEngine');
const { evaluateEvidenceGraph } = require('../src/engines/graphEngine');

const officialPolygon = {
    type: 'Polygon',
    coordinates: [[[80.6, 16.5], [80.601, 16.5], [80.601, 16.501], [80.6, 16.501], [80.6, 16.5]]]
};

test('spatial engine clears an identical survey polygon', () => {
    const result = runSpatialVerification(officialPolygon, officialPolygon);
    assert.equal(result.decision, 'CLEAR');
    assert.equal(result.iou, 1);
    assert.equal(result.centroid_displacement_m, 0);
});

test('spatial engine flags a materially shifted survey polygon', () => {
    const shiftedPolygon = {
        type: 'Polygon',
        coordinates: [[[80.6007, 16.5007], [80.6017, 16.5007], [80.6017, 16.5017], [80.6007, 16.5017], [80.6007, 16.5007]]]
    };
    const result = runSpatialVerification(officialPolygon, shiftedPolygon);
    assert.equal(result.decision, 'DISPUTED');
    assert.ok(result.iou < 0.2);
});

test('evidence graph prioritises an active court injunction', () => {
    const result = evaluateEvidenceGraph({
        nodes: [{ type: 'Court_Case', attributes: { status: 'ACTIVE_INJUNCTION' }, confidence: 1 }],
        edges: []
    });
    assert.equal(result.state, 'FORMALLY DISPUTED');
    assert.equal(result.confidence, 0);
});
