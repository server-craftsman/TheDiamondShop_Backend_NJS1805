const express = require("express");
const router = express.Router();
const { createOrder } = require("../../dao/orders/manageOrdersDAO");

// router.post('/create-order', async (req, res) => {
//     try {
//         const orderData = req.body;
//         const orderID = await orderDAO.createOrder(orderData);
//         res.status(201).json({ orderID });
//     } catch (err) {
//         console.error('Error creating order:', err);
//         if (err.code === 'ORDER_NOT_VALID') {
//             res.status(400).json({ error: err.message });
//         } else if (err.code === 'DATABASE_ERROR') {
//             res.status(500).json({ error: 'Database error' });
//         } else {
//             res.status(500).json({ error: 'Internal server error' });
//         }
//     }
// });

router.post("/create-order", async (req, res) => {
  try {
    const orderData = req.body; // Assuming order data is sent in the request body
    const result = await createOrder(orderData);
    res.status(201).json(result); // Return success message and order details
  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ error: "Error creating order" }); // Handle error
  }
});
module.exports = router;
