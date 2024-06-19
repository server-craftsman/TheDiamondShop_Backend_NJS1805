const express = require('express');
const router = express.Router();
const certificateDAO = require('../../dao/certificate/certificateDAO');

router.put('/add', async (req, res) => {
    try {
        const cert = req.body;
        const addcert = await certificateDAO.addCertificate(cert);
        res.status(201).json(addcert);
    } catch (error) {
        res.status(500).send(error.message);
    }
});
router.get('/lookup', async (req, res) => {
    try {
        const reportNO = req.body;
        const cert = await certificateDAO.getcertByNum(reportNO);
        res.json(cert);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.put('/update-event/:ReportNumber', async (req, res) => {
    try {
        const cert = req.body;
        const updatecert = await certificateDAO.updatecert(req.params.ReportNumber, cert);
        res.json(updatecert);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;