const express = require('express');
const router = express.Router();
const {getBonusPointAndAccountDetails} = require('../../dao/userFeatures/userFeatures');
const dbConfig = require('../../config/dbconfig');
const sql = require('mssql');
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


module.exports = router;