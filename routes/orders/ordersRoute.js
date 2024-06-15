const express = require("express");
const router = express.Router();
const { createOrder, cancelOrder, checkOrderForCancellation } = require("../../dao/orders/manageOrdersDAO");

// Route to create an order
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

// Route to cancel an order
router.put('/cancel-order/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
      const canCancel = await checkOrderForCancellation(orderId);

      if (canCancel) {
          await cancelOrder(orderId);
          res.status(200).json({ message: `Order with ID ${orderId} successfully cancelled.` });
      } else {
          res.status(400).json({ error: `Cannot cancel order with OrderID ${orderId}. Either it does not exist, is not pending, or has already been paid.` });
      }
  } catch (error) {
      console.error('Error in cancel-order route:', error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

module.exports = router;
