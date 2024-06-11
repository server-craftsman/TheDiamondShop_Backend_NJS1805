const express = require('express');
const router = express.Router();
const {getBonusPointAndAccountDetails} = require('../../dao/userFeatures/userFeatures');
const dbConfig = require('../../config/dbconfig');
const {UpdateAccount} = require('../../dao/userFeatures/UpdateAccount');

router.get('/bonus-account-details', (req, res) => {
  getBonusPointAndAccountDetails(dbConfig).then(result => {
    res.json(result);
  }).catch(err => {
    console.error('Failed to get BonusPoint and Account details:', err);
    res.status(500).send('Failed to get BonusPoint and Account details');
  });
});

// Update Account
router.put('/update-account', (req, res) => {
  const userData = req.body;

  // Call the updateAccount function with the userData
  UpdateAccount(userData).then(response => {
    // Send the response back to the client
    res.json(response);
  }).catch(err => {
    console.error('Error:', err);
    res.status(500).send('Server Error');
  });
});

module.exports = router;