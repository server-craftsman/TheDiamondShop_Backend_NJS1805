const express = require("express");
const router = express.Router();
const { createOrder, cancelOrder, checkOrderForCancellation, savePayment } = require("../../dao/orders/manageOrdersDAO");

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

//====About Save Information of Transaction
// Route to process PayPal payment
router.post('/paypal-payment/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
      // Assuming paymentAmount is sent in the request body, pass it to savePayment
      const { paymentAmount } = req.body;
      
      // Save payment details in Transactions table using TotalPrice from createOrder
      const result = await savePayment(orderId, paymentAmount, 'PayPal');
      if (result) {
          res.status(200).json({ message: 'Payment processed successfully.' });
      } else {
          res.status(500).json({ error: 'Failed to save payment details.' });
      }
  } catch (error) {
      console.error('Error processing PayPal payment:', error);
      res.status(500).json({ error: 'An error occurred while processing the payment.' });
  }
});

// Route to process Cash payment
router.post('/cash-payment/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
      // Assuming paymentAmount is sent in the request body, pass it to savePayment
      const { paymentAmount } = req.body;
      
      // Save payment details in Transactions table using TotalPrice from createOrder
      const result = await savePayment(orderId, paymentAmount, 'Cash');
      if (result) {
          res.status(200).json({ message: 'Payment processed successfully.' });
      } else {
          res.status(500).json({ error: 'Failed to save payment details.' });
      }
  } catch (error) {
      console.error('Error processing Cash payment:', error);
      res.status(500).json({ error: 'An error occurred while processing the payment.' });
  }
});

module.exports = router;
