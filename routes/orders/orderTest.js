const express = require('express');
const router = express.Router();
const { createOrder } = require('../../dao/orders/orderTestDAO'); // Replace with the actual path to your DAO file

// Define routes related to orders
router.post('/create', async (req, res) => {
  const { orderData, accountID } = req.body;

  try {
    const result = await createOrder(orderData, accountID);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
