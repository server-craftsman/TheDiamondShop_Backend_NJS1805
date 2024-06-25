const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require("../../config/dbconfig");
const bodyParser = require("body-parser");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET; // Replace with your own secret key
const jwt = require('jsonwebtoken');

const {
  getBonusPointAndAccountDetails,
  getAccessOrder,
  getAccessOrderConfirm,
  getScheduleOfDelivery,
  getDeliveryCompleted,
  getDeliveryShipping,
  getOrderStatusOfDelivery,
  getAllScheduleAppointments,
  getScheduleAppointmentById,
  createScheduleAppointment,
  updateScheduleAppointment,
  getAllFeedbacksByProductID,
  createFeedback,
  updateFeedback,
  deleteFeedback
} = require("../../dao/userFeatures/userFeatures");

const { UpdateAccount, accountStatus } = require("../../dao/userFeatures/UpdateAccount");

const app = express();
const pool = new sql.ConnectionPool(dbConfig);

// Middleware to parse JSON bodies
app.use(bodyParser.json());


// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: false, message: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ status: false, message: 'Forbidden' });
    }
    req.accountId = decoded.accountId; // Attach accountId to request object
    next();
  });
}

// Route to get bonus points and account details
router.get("/bonus-account-details", (req, res) => {
  getBonusPointAndAccountDetails(dbConfig)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.error("Failed to get BonusPoint and Account details:", err);
      res.status(500).send("Failed to get BonusPoint and Account details");
    });
});

// Route to update account
router.put("/update-account", (req, res) => {
  const userData = req.body;
  UpdateAccount(userData)
    .then((response) => {
      res.json(response);
    })
    .catch((err) => {
      console.error("Error:", err);
      res.status(500).send("Server Error");
    });
});

// Route to view history orders for a customer
router.get("/history-order", async (req, res) => {
  const { email } = req.query; // Using query instead of body for GET requests

  if (!email) {
    return res.status(400).json({ status: false, message: "Please provide an email to query history orders" });
  }

  try {
    const poolConnect = await pool.connect();
    const checkaccount = await poolConnect
      .request()
      .input("Email", sql.NVarChar, email)
      .query(
        "SELECT * From Account a JOIN Roles r ON a.RoleID = r.RoleID WHERE a.Email = @Email AND r.RoleName = 'Customer'"
      );

    if (checkaccount.recordset.length === 0) {
      return res.status(400).json({ status: false, message: "Customer not found" });
    }

    const historyOrder = await poolConnect
      .request()
      .input("Email", sql.NVarChar, email)
      .query(
        "SELECT a.FirstName, a.LastName, a.Email, a.PhoneNumber, o.OrderID, o.OrderDate, o.Quantity, od.AttachedAccessories, od.Shipping, od.ReportNo, od.DeliveryAddress, o.OrderStatus, o.TotalPrice FROM Orders o JOIN Account a ON o.AccountID = a.AccountID JOIN OrderDetails od ON o.OrderID = od.OrderID WHERE a.Email = @Email"
      );

    poolConnect.close();

    if (historyOrder.recordset.length > 0) {
      res.status(200).json({
        status: true,
        message: "History orders found",
        historyOrder: historyOrder.recordset,
      });
    } else {
      res.status(200).json({
        status: true,
        message: "No history orders found. Buy something luxurious to fill it up.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: false, message: "An error occurred", error: error.message });
  }
});

// Route to change delivery address (Allowed only for pending orders)
router.put("/change-locate", async (req, res) => {
  const { Email, OrderID, DeliveryAddress } = req.body;

  if (!Email || !OrderID || !DeliveryAddress) {
    return res.status(400).json({
      status: false,
      message: "Email, OrderID, and DeliveryAddress are required",
    });
  }

  try {
    const poolConnect = await pool.connect();

    const chkStatus = await poolConnect
      .request()
      .input("Email", sql.NVarChar, Email)
      .input("OrderID", sql.Int, OrderID)
      .query(
        "SELECT o.OrderStatus FROM OrderDetails od JOIN Orders o ON od.OrderID = o.OrderID JOIN Account a ON o.AccountID = a.AccountID WHERE a.Email = @Email AND o.OrderID = @OrderID"
      );

    if (chkStatus.recordset.length === 0) {
      poolConnect.close();
      return res.status(404).json({ status: false, message: "Order not found" });
    }

    const orderStatus = chkStatus.recordset[0].OrderStatus;

    if (orderStatus === "Pending") {
      const updateLocate = await poolConnect
        .request()
        .input("Email", sql.NVarChar, Email)
        .input("OrderID", sql.Int, OrderID)
        .input("DeliveryAddress", sql.NVarChar, DeliveryAddress)
        .query(
          "UPDATE od SET od.DeliveryAddress = @DeliveryAddress FROM OrderDetails od JOIN Orders o ON od.OrderID = o.OrderID JOIN Account a ON o.AccountID = a.AccountID WHERE a.Email = @Email AND o.OrderID = @OrderID "
        );

      poolConnect.close();

      if (updateLocate.rowsAffected[0] > 0) {
        console.log("Update successful");
        return res.json({ status: true, message: "Update successful" });
      } else {
        console.log("Update failed");
        return res.status(500).json({ status: false, message: "Update failed" });
      }
    } else {
      poolConnect.close();
      return res.status(400).json({
        status: false,
        message: "Order is processing and you cannot change the location",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// Route to update account status (Activate/Deactivate)
router.put("/update-status", async (req, res) => {
  const account = req.body;
  accountStatus(account)
    .then((response) => {
      res.json(response);
    })
    .catch((err) => {
      console.error("Error:", err);
      res.status(500).send("Server Error");
    });
});

// View Order
router.get("/view-order", async (req, response) => {
  getAccessOrder().then(result =>{
    response.json(result[0]);
  }).catch(error => {
    console.error('Error fetching order: ', error);
    response.status(500).send('Error fetching order');
  });
});

//View Order Status Confirm
router.get("/view-order-confirm", async (req, response) => {
  getAccessOrderConfirm().then(result =>{
    response.json(result[0]);
  }).catch(error => {
    console.error('Error fetching order: ', error);
    response.status(500).send('Error fetching order');
  });
});

// View Delivery Completed
router.get("/view-order-conpleted", async (req, response) => {
  getDeliveryCompleted().then(result =>{
    response.json(result[0]);
  }).catch(error => {
    console.error('Error fetching order: ', error);
    response.status(500).send('Error fetching order');
  });
});

// View Delivery Shipping
router.get("/view-order-shipping", async (req, response) => {
  getDeliveryShipping().then(result =>{
    response.json(result[0]);
  }).catch(error => {
    console.error('Error fetching order: ', error);
    response.status(500).send('Error fetching order');
  });
});

// Route to edit order status
router.put("/verify-order", async (req, res) => {
  const { orderID, orderStatus } = req.body;
  let poolConnect;
  let transaction;

  try {
    poolConnect = await pool.connect();
    transaction = new sql.Transaction(poolConnect);
    await transaction.begin();

    const request = new sql.Request(transaction);
    await request
      .input("OrderID", sql.Int, orderID)
      .input("OrderStatus", sql.VarChar, orderStatus)
      .query(
        "UPDATE Orders SET OrderStatus = @OrderStatus WHERE OrderID = @OrderID"
      );

    await request.query(
      "UPDATE OrderDetails SET OrderStatus = @OrderStatus WHERE OrderID = @OrderID"
    );

    await transaction.commit();

    res.status(200).send({
      message: "Order status and order detail status updated successfully!",
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).send({ message: "Internal Server Error" });
  } finally {
    if (poolConnect) {
      poolConnect.release();
    }
  }
});

// Route to view schedule of delivery
router.get("/schedule-delivery", (req, res) => {
  getScheduleOfDelivery()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.error("Failed to get view Schedule Of Delivery:", err);
      res.status(500).send("Failed to get view Schedule Of Delivery");
    });
});

// Route to update order status to 'Confirm' (for sale)
router.put("/update-order-status-sale", async (req, res) => {
  const { orderID } = req.body;
  let poolConnect;
  let transaction;

  try {
    poolConnect = await pool.connect();
    transaction = new sql.Transaction(poolConnect);
    await transaction.begin();

    const request = new sql.Request(transaction);
    await request
      .input("OrderID", sql.Int, orderID)
      .query(
        "UPDATE Orders SET OrderStatus = 'Confirm' WHERE OrderID = @OrderID"
      );

    await request.query(
      "UPDATE OrderDetails SET OrderStatus = 'Confirm' WHERE OrderID = @OrderID"
    );

    await transaction.commit();

    res.status(200).send({
      message: "Order status and order detail status updated successfully!",
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).send({     message: "Internal Server Error"
  });
  } finally {
    if (poolConnect) {
      poolConnect.release();
    }
  }
});

//Route to get orderstatus of delivery
router.get("/orderstatus-delivery", async(req, res) => {
  try {
    const orderstatusdelivery = await getOrderStatusOfDelivery();
    res.status(200).send(orderstatusdelivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})
//Route to update order statu to 'Shipped' and 'Complete' (for delivery)
router.put("/update-order-status-delivery", async (req, res) => {
  const { orderID, orderStatus } = req.body;
  const validStatuses = ["Shipped", "Completed"];
  
  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).send({ message: "Order status must be Shipping and Completed" });
  }
  
  let poolConnect;
  let transaction;

  try {
    poolConnect = await pool.connect();
    transaction = new sql.Transaction(poolConnect);
    await transaction.begin();

    const request = new sql.Request(transaction);
    await request
      .input("OrderID", sql.Int, orderID)
      .input("OrderStatus", sql.VarChar, orderStatus)
      .query(
        "UPDATE Orders SET OrderStatus = @OrderStatus WHERE OrderID = @OrderID"
      );

    await request
      .query(
        "UPDATE OrderDetails SET OrderStatus = @OrderStatus WHERE OrderID = @OrderID"
      );

    await transaction.commit();

    res.status(200).send({
      message: "Order status and order detail status updated successfully!",
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).send({
      message: "Internal Server Error"
    });
  } finally {
    if (poolConnect) {
      poolConnect.release();
    }
  }
});

// Route to get all schedule appointments
router.get("/schedule-appointments", async (req, res) => {
  try {
    const appointments = await getAllScheduleAppointments();
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get schedule appointment by ID
router.get("/schedule-appointments/:id", async (req, res) => {
  const scheduleId = req.params.id;
  try {
    const appointment = await getScheduleAppointmentById(scheduleId);
    if (appointment.length > 0) {
      res.status(200).json(appointment);
    } else {
      res.status(404).json({ message: "Schedule appointment not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to create a new schedule appointment
router.post("/schedule-appointments", async (req, res) => {
  const appointmentData = req.body;
  try {
    const newAppointment = await createScheduleAppointment(appointmentData);
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to update schedule appointment by ID
router.put("/schedule-appointments/:id", async (req, res) => {
  const scheduleId = req.params.id;
  const updatedData = req.body;
  try {
    const success = await updateScheduleAppointment(scheduleId, updatedData);
    if (success) {
      res.status(200).json({ message: "Schedule appointment updated successfully" });
    } else {
      res.status(404).json({ message: "Schedule appointment not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//===========Manage Feedback===========
// Route to get feedbacks by product type and ID
router.get("/feedback/:productType/:productID", async (req, res) => {
  const { productType, productID } = req.params;

  try {
    const feedbacks = await getAllFeedbacksByProductID(
      productType,
      productID
    );
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Route to create a new feedback
router.post('/feedback', async (req, res) => {
  const { accountID, diamondID, bridalID, diamondRingsID, diamondTimepiecesID, content, rating } = req.body;
  try {
    const success = await createFeedback(accountID, diamondID, bridalID, diamondRingsID, diamondTimepiecesID, content, rating);
    if (success) {
      res.sendStatus(201); // Created
    } else {
      res.sendStatus(500); // Internal Server Error
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to update a feedback by feedback ID
router.put('/feedback/:feedbackID', async (req, res) => {
  const { feedbackID } = req.params;
  const { content, rating } = req.body;
  try {
    const success = await updateFeedback(feedbackID, content, rating);
    if (success) {
      res.sendStatus(200); // OK
    } else {
      res.sendStatus(403); // Forbidden if role doesn't match
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to delete feedback by ID
router.delete('/feedback/:feedbackID', async (req, res) => {
  const { feedbackID } = req.params;
  const { roleName } = req.body; // roleName được truyền qua body từ client

  try {
    const result = await deleteFeedback(feedbackID, roleName);
    if (result) {
      res.status(200).json({ success: true, message: 'Phản hồi đã được xóa thành công' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy phản hồi hoặc bạn không có quyền xóa nó' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa phản hồi:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
});

module.exports = router;
