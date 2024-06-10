const express = require('express');
const router = express.Router();
const { getBonusPointAndAccountDetails } = require('../../dao/userFeatures/userFeatures');
const dbConfig = require('../../config/dbconfig');

router.get('/bonus-account-details', (req, res) => {
  getBonusPointAndAccountDetails(dbConfig).then(result => {
    res.json(result);
  }).catch(err => {
    console.error('Failed to get BonusPoint and Account details:', err);
    res.status(500).send('Failed to get BonusPoint and Account details');
  });
});

module.exports = router;