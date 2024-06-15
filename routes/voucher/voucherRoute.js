// routes.js
const express = require('express');
const router = express.Router();
const voucherDAO = require('../../dao/voucher/voucherDAO');

router.get('/vouchers', async (req, res) => {
    try {
        const vouchers = await voucherDAO.getVouchers();
        res.json(vouchers);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/vouchers/:voucherName', async (req, res) => {
    try {
        const voucher = await voucherDAO.getVoucherByName(req.params.voucherName);
        res.json(voucher);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/vouchers', async (req, res) => {
    try {
        const voucher = req.body;
        const result = await voucherDAO.createVoucher(voucher);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.put('/vouchers/:id', async (req, res) => {
    try {
        const voucher = req.body;
        const result = await voucherDAO.updateVoucher(req.params.id, voucher);
        res.json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;