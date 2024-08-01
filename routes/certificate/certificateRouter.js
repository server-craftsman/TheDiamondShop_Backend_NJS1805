const express = require('express');
const router = express.Router();
const certificateDAO = require('../../dao/certificate/certificateDAO');
const ejs = require('ejs');
const path = require('path');
const certificatePrinter = require('../../dao/certificate/certificatePrinter');
const sql = require("mssql");
const config = require("../../config/dbconfig");

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

// router.put('/add', async (req, res) => {
//     try {
//         const cert = req.body;
//         const addcert = await certificateDAO.addCertificate(cert);
//         res.status(201).json(addcert);
//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// });

router.post('/add', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {
            InspectionDate, ClarityGrade, ShapeAndCuttingStyle, GIAReportNumber, Measurements, CaratWeight,
            ColorGrade, SymmetryGrade, CutGrade, PolishGrade, Fluorescence, ImageLogoCertificate,
            BridalID, DiamondTimepiecesID, DiamondRingsID, DiamondID
        } = req.body;

        // Validate that exactly one of the unique ID fields is provided
        const uniqueFields = [BridalID, DiamondTimepiecesID, DiamondRingsID, DiamondID];
        const providedUniqueFields = uniqueFields.filter(field => field !== null && field !== undefined);

        if (providedUniqueFields.length !== 1) {
            return res.status(400).send({ message: 'Exactly one of BridalID, DiamondTimepiecesID, DiamondRingsID, or DiamondID must be provided.' });
        }

        // Construct the check query dynamically based on the provided IDs
        const checkConditions = [];
        const checkRequest = pool.request();

        if (BridalID) {
            checkConditions.push('BridalID = @BridalID');
            checkRequest.input('BridalID', sql.Int, BridalID);
        }
        if (DiamondTimepiecesID) {
            checkConditions.push('DiamondTimepiecesID = @DiamondTimepiecesID');
            checkRequest.input('DiamondTimepiecesID', sql.Int, DiamondTimepiecesID);
        }
        if (DiamondRingsID) {
            checkConditions.push('DiamondRingsID = @DiamondRingsID');
            checkRequest.input('DiamondRingsID', sql.Int, DiamondRingsID);
        }
        if (DiamondID) {
            checkConditions.push('DiamondID = @DiamondID');
            checkRequest.input('DiamondID', sql.Int, DiamondID);
        }

        const checkQuery = `SELECT * FROM Certificate WHERE ${checkConditions.join(' OR ')}`;
        const checkResult = await checkRequest.query(checkQuery);

        if (checkResult.recordset.length > 0) {
            return res.status(400).send({ message: 'A certificate already exists for one of the provided IDs.' });
        }

        // Construct the insert query dynamically based on the provided IDs
        const insertColumns = [
            'InspectionDate', 'ClarityGrade', 'ShapeAndCuttingStyle', 'GIAReportNumber', 'Measurements', 'CaratWeight',
            'ColorGrade', 'SymmetryGrade', 'CutGrade', 'PolishGrade', 'Fluorescence', 'ImageLogoCertificate'
        ];
        const insertValues = [
            '@InspectionDate', '@ClarityGrade', '@ShapeAndCuttingStyle', '@GIAReportNumber', '@Measurements', '@CaratWeight',
            '@ColorGrade', '@SymmetryGrade', '@CutGrade', '@PolishGrade', '@Fluorescence', '@ImageLogoCertificate'
        ];

        if (BridalID) {
            insertColumns.push('BridalID');
            insertValues.push('@BridalID');
        }
        if (DiamondTimepiecesID) {
            insertColumns.push('DiamondTimepiecesID');
            insertValues.push('@DiamondTimepiecesID');
        }
        if (DiamondRingsID) {
            insertColumns.push('DiamondRingsID');
            insertValues.push('@DiamondRingsID');
        }
        if (DiamondID) {
            insertColumns.push('DiamondID');
            insertValues.push('@DiamondID');
        }

        const insertQuery = `
            INSERT INTO Certificate (${insertColumns.join(', ')})
            VALUES (${insertValues.join(', ')})`;

        const insertRequest = pool.request()
            .input('InspectionDate', sql.Date, InspectionDate)
            .input('ClarityGrade', sql.VarChar(50), ClarityGrade)
            .input('ShapeAndCuttingStyle', sql.VarChar(50), ShapeAndCuttingStyle)
            .input('GIAReportNumber', sql.VarChar(50), GIAReportNumber)
            .input('Measurements', sql.VarChar(100), Measurements)
            .input('CaratWeight', sql.Decimal(5, 2), CaratWeight)
            .input('ColorGrade', sql.VarChar(50), ColorGrade)
            .input('SymmetryGrade', sql.VarChar(50), SymmetryGrade)
            .input('CutGrade', sql.VarChar(50), CutGrade)
            .input('PolishGrade', sql.VarChar(50), PolishGrade)
            .input('Fluorescence', sql.VarChar(50), Fluorescence)
            .input('ImageLogoCertificate', sql.VarChar(sql.MAX), ImageLogoCertificate);

        if (BridalID) {
            insertRequest.input('BridalID', sql.Int, BridalID);
        }
        if (DiamondTimepiecesID) {
            insertRequest.input('DiamondTimepiecesID', sql.Int, DiamondTimepiecesID);
        }
        if (DiamondRingsID) {
            insertRequest.input('DiamondRingsID', sql.Int, DiamondRingsID);
        }
        if (DiamondID) {
            insertRequest.input('DiamondID', sql.Int, DiamondID);
        }

        const result = await insertRequest.query(insertQuery);

        res.status(201).send({ message: 'Certificate added successfully', data: result.recordset });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'An error occurred while adding the certificate', error });
    }
});

// Route to fetch products that are not in the Certificate table
router.get('/fetch-products', async (req, res) => {
    try {
        const pool = await poolPromise;

        // Define queries to fetch products without associated Certificate records
        const diamondQuery = `
        SELECT d.*
        FROM Diamond d
        LEFT JOIN Certificate c ON d.DiamondID = c.DiamondID
        WHERE c.DiamondID IS NULL
        `;
        const bridalQuery = `
        SELECT b.*
        FROM Bridal b
        LEFT JOIN Certificate c ON b.BridalID = c.BridalID
        WHERE c.BridalID IS NULL
        `;
        const diamondRingsQuery = `
        SELECT r.*
        FROM DiamondRings r
        LEFT JOIN Certificate c ON r.DiamondRingsID = c.DiamondRingsID
        WHERE c.DiamondRingsID IS NULL
        `;
        const diamondTimepiecesQuery = `
        SELECT t.*
        FROM DiamondTimepieces t
        LEFT JOIN Certificate c ON t.DiamondTimepiecesID = c.DiamondTimepiecesID
        WHERE c.DiamondTimepiecesID IS NULL
        `;

        // Execute all queries
        const [diamonds, bridals, diamondRings, diamondTimepieces] = await Promise.all([
            pool.request().query(diamondQuery),
            pool.request().query(bridalQuery),
            pool.request().query(diamondRingsQuery),
            pool.request().query(diamondTimepiecesQuery)
        ]);

        // Respond with filtered products
        res.json({
            diamonds: diamonds.recordset,
            bridals: bridals.recordset,
            diamondRings: diamondRings.recordset,
            diamondTimepieces: diamondTimepieces.recordset
        });
    } catch (err) {
        console.error('Error fetching products:', err.message); // Log specific error message
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/lookup", async (req, response) => {
    certificateDAO.getCertificate()
        .then((result) => {
            response.json(result[0]);
        })
        .catch((error) => {
            console.error("Error fetching certificate: ", error);
            response.status(500).send("Error fetching certificate");
        });
});

router.get('/:CertificateID', async (req, res) => {
    const CertificateID = req.params.CertificateID;

    try {
        const certificate = await certificateDAO.getCertificateByCertificateID(CertificateID);
        if (certificate) {
            res.json(certificate);
        } else {
            res.status(404).send('Certificate not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/update-cert/:CertificateID', async (req, res) => {
    try {
        const cert = req.body;
        const updatecert = await certificateDAO.updatecert(req.params.CertificateID, cert);
        res.json(updatecert);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/print-certificate', async (req, res) => {
    try {
        await certificatePrinter.generatePdf(req, res);
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).send('Internal server error');
    }
});

router.put('/edit-certificate/:id', async (req, res) => {
    const certificateID = req.params.id;
    const { inspectionDate, clarityGrade, shapeAndCuttingStyle, GIAReportNumber, measurements, caratWeight, colorGrade, symmetryGrade, cutGrade, polishGrade, fluorescence, imageLogoCertificate, bridalID, diamondTimepiecesID, diamondRingsID, diamondID } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('CertificateID', sql.Int, certificateID)
            .input('InspectionDate', sql.Date, inspectionDate)
            .input('ClarityGrade', sql.VarChar(50), clarityGrade)
            .input('ShapeAndCuttingStyle', sql.VarChar(50), shapeAndCuttingStyle)
            .input('GIAReportNumber', sql.VarChar(50), GIAReportNumber)
            .input('Measurements', sql.VarChar(100), measurements)
            .input('CaratWeight', sql.Decimal(5, 2), caratWeight)
            .input('ColorGrade', sql.VarChar(50), colorGrade)
            .input('SymmetryGrade', sql.VarChar(50), symmetryGrade)
            .input('CutGrade', sql.VarChar(50), cutGrade)
            .input('PolishGrade', sql.VarChar(50), polishGrade)
            .input('Fluorescence', sql.VarChar(50), fluorescence)
            .input('ImageLogoCertificate', sql.NVarChar(sql.MAX), imageLogoCertificate)
            .input('BridalID', sql.Int, bridalID)
            .input('DiamondTimepiecesID', sql.Int, diamondTimepiecesID)
            .input('DiamondRingsID', sql.Int, diamondRingsID)
            .input('DiamondID', sql.Int, diamondID)
            .query(`
                UPDATE Certificate
                SET InspectionDate = @InspectionDate,
                    ClarityGrade = @ClarityGrade,
                    ShapeAndCuttingStyle = @ShapeAndCuttingStyle,
                    GIAReportNumber = @GIAReportNumber,
                    Measurements = @Measurements,
                    CaratWeight = @CaratWeight,
                    ColorGrade = @ColorGrade,
                    SymmetryGrade = @SymmetryGrade,
                    CutGrade = @CutGrade,
                    PolishGrade = @PolishGrade,
                    Fluorescence = @Fluorescence,
                    ImageLogoCertificate = @ImageLogoCertificate,
                    BridalID = @BridalID,
                    DiamondTimepiecesID = @DiamondTimepiecesID,
                    DiamondRingsID = @DiamondRingsID,
                    DiamondID = @DiamondID
                WHERE CertificateID = @CertificateID
            `);

        res.status(200).send('Certificate updated successfully');
    } catch (err) {
        console.error('Error updating certificate:', err);
        res.status(500).send('Error updating certificate');
    }
});

module.exports = router;