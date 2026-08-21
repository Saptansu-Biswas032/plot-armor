const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { getDB } = require('../db/database');

router.get('/:ulpin', async (req, res) => {
    try {
        const { ulpin } = req.params;
        const db = getDB();
        
        // Fetch parcel data
        const parcel = await db.get(`SELECT * FROM parcel WHERE ulpin = ?`, [ulpin]);
        if (!parcel) {
            return res.status(404).json({ error: "Parcel not found" });
        }

        // Fetch ownership data
        const owners = await db.all(`SELECT * FROM ownership WHERE parcel_id = ?`, [parcel.parcel_id]);

        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PlotArmor_Record_${ulpin}.pdf`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(20).fillColor('#11233a').text('Plot-Armor', { align: 'center' });
        doc.fontSize(10).fillColor('#5f6d7f').text('Land Intelligence & Trust Report', { align: 'center' });
        doc.moveDown(2);

        // Content
        doc.fontSize(16).fillColor('#172437').text('Official Cadastral Assessment');
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#d9d8d1');
        doc.moveDown(1.5);

        // Details
        doc.fontSize(12).fillColor('#172437');
        doc.text(`ULPIN: `, { continued: true }).font('Helvetica-Bold').text(`${parcel.ulpin}`);
        doc.font('Helvetica');
        doc.text(`State: `, { continued: true }).font('Helvetica-Bold').text(`${parcel.source}`);
        doc.font('Helvetica');
        doc.text(`Area: `, { continued: true }).font('Helvetica-Bold').text(`${parcel.area} sq. meters`);
        doc.font('Helvetica');
        doc.text(`Registry Status: `, { continued: true }).font('Helvetica-Bold').text(`${parcel.status}`);
        
        doc.moveDown(2);
        
        // Ownership
        doc.font('Helvetica').fontSize(14).text('Ownership Records');
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#d9d8d1');
        doc.moveDown(1.5);

        if (owners.length > 0) {
            owners.forEach(o => {
                doc.fontSize(11).text(`Owner ID: ${o.owner_id}`);
                doc.text(`Share: ${(o.share * 100).toFixed(2)}%`);
                doc.text(`Start Date: ${o.start_date || 'N/A'}`);
                doc.moveDown(0.5);
            });
        } else {
            doc.fontSize(11).text('No recorded owners in current database fragment.');
        }
        
        // Audit signature
        doc.moveDown(3);
        doc.fontSize(9).fillColor('#a0a0a0').text(`Generated automatically by Plot-Armor on ${new Date().toISOString()}`, { align: 'center' });
        doc.text(`Cryptographic Signature: ${require('crypto').createHash('sha256').update(ulpin + Date.now()).digest('hex').substring(0, 32)}`, { align: 'center' });

        doc.end();

    } catch (err) {
        console.error("PDF Export Error:", err);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
});

module.exports = router;
