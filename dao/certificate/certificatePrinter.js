const fs = require('fs');
const pdf = require('pdf-creator-node');
const path = require('path');
const certificateDAO = require('../certificate/certificateDAO');
const options = require('../certificate/view/option');

const certView = (req, res, next) => {
    res.render('home');
}

const generatePdf = async (req, res, next) => {
    const html = fs.readFileSync(path.join(__dirname, '../certificate/view/certificate.ejs'), 'utf-8');
    const filename = 'Certificate_' + Math.random() + '.pdf';

    // Fetch certificate data from the database
    const GIAReportNumber = req.body.GIAReportNumber; // Assuming the GIAReportNumber is sent in the request body
    let certificateData;
    try {
        certificateData = await certificateDAO.getCertificateByGIAReportNumber(GIAReportNumber);
    } catch (err) {
        console.error('Error fetching certificate data:', err);
        return res.status(500).send('Error fetching certificate data');
    }

    if (!certificateData) {
        return res.status(404).send('Certificate not found');
    }

    const prod = {
        CertificateID: certificateData.CertificateID,
        InspectionDate: certificateData.InspectionDate,
        ClarityGrade: certificateData.ClarityGrade,
        ShapeAndCuttingStyle: certificateData.ShapeAndCuttingStyle,
        ColorGrade: certificateData.ColorGrade,
        Fluorescence: certificateData.Fluorescence,
        SymmetryGrade: certificateData.SymmetryGrade,
        PolishGrade: certificateData.PolishGrade,
        CutGrade: certificateData.CutGrade,
        Measurements: certificateData.Measurements,
        GIAReportNumber: certificateData.GIAReportNumber
    };

    const document = {
        html: html,
        data: {
            certificates: [prod] // Assuming the template expects an array of certificates
        },
        path: path.join(__dirname, '../../doc/certificate_' + filename)
    };

    try {
        await pdf.create(document, options);
        res.status(200).send('PDF generated successfully');
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send('Error generating PDF');
    }
}

module.exports = {
    certView,
    generatePdf
}
