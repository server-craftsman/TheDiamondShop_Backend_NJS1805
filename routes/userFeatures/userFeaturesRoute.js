const express = require('express');
const router = express.Router();
const { getBonusPointAndAccountDetails, getScheduleAppointment, getAccessOrder, getScheduleOfDelivery } = require('../../dao/userFeatures/userFeatures');
const dbConfig = require('../../config/dbconfig');
const sql = require('mssql');
const {UpdateAccount} = require('../../dao/userFeatures/UpdateAccount');
const bodyParser = require("body-parser");
const app = express();
const pool = new sql.ConnectionPool(dbConfig);
// Middleware to parse JSON bodies
app.use(bodyParser.json()); // Ensure JSON body parsing

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

// view history order
router.get('/history-order', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: false, message: 'Please input CustomerID to Query' });
  }
  try {
    const db = await sql.connect(dbConfig);
    //check account
    const checkaccount = await db.request()
      .input("Email", sql.NVarChar, email)
      .query("SELECT * From Account a JOIN Roles r ON a.RoleID = r.RoleID WHERE a.Email = @Email AND r.RoleName = 'Customer'");
    if (checkaccount.recordset.length === 0) {
      return res.status(400).json({ status: false, message: 'Customer Not Found' })
    }

    const historyOrder = await db.request()
      .input("Email", sql.NVarChar, email)
      .query("SELECT a.FirstName, a.LastName, a.Email, a.PhoneNumber, o.OrderDate, o.Quantity, od.AttachedAccessories, od.Shipping, od.ReportNo, od.DeliveryAddress, o.OrderStatus, o.TotalPrice FROM Orders o JOIN Account a ON o.AccountID = a.AccountID JOIN OrderDetails od ON o.OrderID = od.OrderID WHERE a.Email = @Email");

    if (historyOrder.recordset.length > 0) {
      return res.status(200).json({ status: true, message: 'History Order Found', HistoryOrder: historyOrder.recordset });
    } else {
      return res.status(200).json({ status: true, message: 'History Order is Empty. Buy something luxurious to fill it up' });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ status: false, message: 'An error occurred', error: error.message });
  }
});

// View Schedule Appointment
router.get('/schedule-appointment', (req, res) => {
  getScheduleAppointment().then(result => {
    res.json(result);
  }).catch(err => {
    console.error('Failed to get schedule of delivery:', err);
    res.status(500).send('Failed to get schedule of delivery');
  });
});

// View Order
router.get('/view-order', (req, res) => {
  getAccessOrder().then(result => {
    res.json(result);
  }).catch(err => {
    console.error('Failed to get view order:', err);
    res.status(500).send('Failed to get order');
  });
});

//Edit order status
router.put('/verify-order', async (req, res) => {
  const { orderID, orderStatus } = req.body;
  let poolConnect;
  let transaction;

  try {
    // Connect to the database
    poolConnect = await pool.connect();

    // Begin transaction
    transaction = new sql.Transaction(poolConnect);
    await transaction.begin();

    // Update order status
    const request = new sql.Request(transaction);
    await request.input('OrderID', sql.Int, orderID)
                 .input('OrderStatus', sql.VarChar, orderStatus)
                 .query('UPDATE Orders SET OrderStatus = @OrderStatus WHERE OrderID = @OrderID');

    // Update order detail status
    await request.query('UPDATE OrderDetails SET OrderStatus = @OrderStatus WHERE OrderID = @OrderID');

    // Commit transaction
    await transaction.commit();

    res.status(200).send({ message: 'Order status and order detail status updated successfully!' });
  } catch (error) {
    console.error('Error updating order status:', error);

    // Rollback transaction if an error occurs
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).send({ message: 'Internal Server Error' });
  } finally {
    // Release the connection
    if (poolConnect) {
      poolConnect.release();
    }
  }
});

//View Delivery
router.get('/schedule-delivery', (req, res) => {
  getScheduleOfDelivery().then(result => {
    res.json(result);
  }).catch(err => {
    console.error('Failed to get view Schedule Of Delivery:', err);
    res.status(500).send('Failed to get view Schedule Of Delivery');
  });
});

module.exports = router;