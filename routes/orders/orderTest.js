const express = require('express');
const router = express.Router();
const { createOrder } = require('../../dao/orders/testOrderFinal'); 
// const { createOrder } = require('../../dao/orders/testRelationshipOrder'); 



const verifyToken = require('../../dao/authentication/middleWare');
// router.use = verifyToken;
// Define routes related to orders

// Define routes related to orders
router.post('/create', verifyToken, async (req, res) => {
  const { orderData } = req.body;
  const accountID = req.user.accountId; // Extracted from the token by the verifyToken middleware

  try {
    console.log('AccountID:', accountID); // Debugging line
    const result = await createOrder(orderData, accountID);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;