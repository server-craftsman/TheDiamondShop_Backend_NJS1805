const express = require('express');
const router = express.Router();
const certificateDAO = require('../../dao/certificate/certificateDAO');
const ejs = require('ejs');
const path = require('path');
const certificatePrinter = require('../../dao/certificate/certificatePrinter');

router.put('/add', async (req, res) => {
    try {
        const cert = req.body;
        const addcert = await certificateDAO.addCertificate(cert);
        res.status(201).json(addcert);
    } catch (error) {
        res.status(500).send(error.message);
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
router.get('/:GIAReportNumber', async (req, res) => {
    const GIAReportNumber = req.params.GIAReportNumber;
  
    try {
        const certificate = await certificateDAO.getCertificateByGIAReportNumber(GIAReportNumber);
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

router.put('/update-cert/:ReportNumber', async (req, res) => {
    try {
        const cert = req.body;
        const updatecert = await certificateDAO.updatecert(req.params.ReportNumber, cert);
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

module.exports = router;