const { config } = require("dotenv");
const dbConfig = require("../../config/dbconfig");
const sql = require("mssql");
const poolPromise = new sql.ConnectionPool(dbConfig).connect();

// Function to get bonus points and account details
function getBonusPointAndAccountDetails() {
  return sql
    .connect(dbConfig)
    .then((pool) => {
      return pool.request().query(`
          SELECT R.RoleName, R.BonusPoints, A.firstName, A.LastName, A.Gender, A.Birthday, A.Email
          FROM BonusPoint AS R
          JOIN Account AS A ON R.RoleID = A.RoleID
        `);
    })
    .then((result) => {
      return result.recordset; // Return the data
    })
    .catch((err) => {
      console.error("Failed to get BonusPoint and Account details:", err);
      throw err; // Propagate error to the caller
    });
}

// Function to get Access Order
async function getAccessOrder() {
  try {
    let pool = await sql.connect(dbConfig);
    let order = await pool.request()
      .query(`SELECT o.OrderID, o.Orderdate, a.Firstname, a.Lastname, o.Quantity, o.TotalPrice, o.OrderStatus 
      FROM Orders o JOIN Account a ON o.AccountID = a.AccountID WHERE o.OrderStatus = 'Pending'`);
    return order.recordsets;
  } catch (error) {
    console.error("Connection SQL error:", error);
    throw error;
  }
}
//View Order Status Confirm
async function getAccessOrderConfirm(){
  try{
      let pool = await sql.connect(dbConfig);
      let order = await pool.request()
      .query(`SELECT o.OrderID, 
       o.Orderdate, 
       a.Firstname, 
       a.Lastname, 
       o.Quantity, 
       o.TotalPrice, 
       o.OrderStatus 
FROM Orders o 
JOIN Account a ON o.AccountID = a.AccountID 
WHERE o.OrderStatus = 'Confirm'`);
      return order.recordsets;
  } catch (error) {
      console.error('Connection SQL error:', error);
      throw error;
  }
}

//Funciton to get Schedule of delivery
async function getScheduleOfDelivery() {
  try {
    let pool = await sql.connect(dbConfig);
    let results = await pool.request().query(`SELECT 
    r.RoleName, 
    a.LastName, 
    a.FirstName, 
    a.PhoneNumber, 
    o.OrderDate, 
    o.Quantity, 
    o.OrderStatus, 
    o.TotalPrice, 
    od.AttachedAccessories, 
    od.Shipping, 
    od.DeliveryAddress
FROM 
    Roles r
JOIN
	Account a ON r.RoleID = a.RoleID
JOIN 
    Orders o ON a.AccountID = o.AccountID
JOIN 
    OrderDetails od ON o.OrderID = od.OrderID`);
    return results.recordsets;
  } catch (error) {
    console.error("Connection SQL error:", error);
    throw error;
  }
}

// View to get orderstatus of delivery
async function getOrderStatusOfDelivery() {
  try {
    let pool = await sql.connect(dbConfig)
    let results = await pool.request().query(`SELECT
      o.OrderID,
     a.LastName, 
    a.FirstName, 
    a.PhoneNumber, 
    o.OrderDate, 
    o.Quantity, 
    o.OrderStatus, 
    o.TotalPrice, 
    od.AttachedAccessories, 
    od.Shipping, 
    od.DeliveryAddress
FROM 
    Roles r
JOIN
	Account a ON r.RoleID = a.RoleID
JOIN 
    Orders o ON a.AccountID = o.AccountID
JOIN 
    OrderDetails od ON o.OrderID = od.OrderID
WHERE o.OrderStatus IN ('Confirm')`);
return results.recordsets;
} catch (error) {
  console.error("Connection SQL error:", error);
  throw error;
}
}

//View Delivery ('Shipping')
async function getDeliveryShipping() {
  try {
    let pool = await sql.connect(dbConfig)
    let results = await pool.request().query(`SELECT
      o.OrderID,
     a.LastName, 
    a.FirstName, 
    a.PhoneNumber, 
    o.OrderDate, 
    o.Quantity, 
    o.OrderStatus, 
    o.TotalPrice, 
    od.AttachedAccessories, 
    od.Shipping, 
    od.DeliveryAddress
FROM 
    Roles r
JOIN
	Account a ON r.RoleID = a.RoleID
JOIN 
    Orders o ON a.AccountID = o.AccountID
JOIN 
    OrderDetails od ON o.OrderID = od.OrderID
WHERE o.OrderStatus IN ('Shipping')`);
return results.recordsets;
} catch (error) {
  console.error("Connection SQL error:", error);
  throw error;
}
}

//View Delivery ('Complete')
async function getDeliveryCompleted() {
  try {
    let pool = await sql.connect(dbConfig)
    let results = await pool.request().query(`SELECT
      o.OrderID,
     a.LastName, 
    a.FirstName, 
    a.PhoneNumber, 
    o.OrderDate, 
    o.Quantity, 
    o.OrderStatus, 
    o.TotalPrice, 
    od.AttachedAccessories, 
    od.Shipping, 
    od.DeliveryAddress
FROM 
    Roles r
JOIN
	Account a ON r.RoleID = a.RoleID
JOIN 
    Orders o ON a.AccountID = o.AccountID
JOIN 
    OrderDetails od ON o.OrderID = od.OrderID
WHERE o.OrderStatus IN ('Completed')`);
return results.recordsets;
} catch (error) {
  console.error("Connection SQL error:", error);
  throw error;
}
}

//View Order by ID
const getOrderById = async (id, callback) => {
  try {
    // Establish the connection
    let pool = await sql.connect(dbConfig);

    // Prepare the query
    let result = await pool.request().input("id", sql.Int, id).query(`
          SELECT
            o.OrderID,
            a.LastName,
            a.FirstName,
            a.PhoneNumber,
            o.OrderDate,
            d.DiamondOrigin,
            d.Color,
            d.Clarity,
            d.Cut,
            d.Price,
            d.StockNumber,
            d.Color,
            d.CaratWeight,
            d.Shape,
            dr.RingStyle,
            dr.NameRings,
            dr.Category,
            dr.BrandName,
            br.NameBridal,
            t.NameTimepieces,
			      rs.RingSize,
			      m.MaterialName,
            o.Quantity,
            o.OrderStatus,
            o.TotalPrice,
            od.AttachedAccessories,
            od.Shipping,
            w.ReportNo,
            od.DeliveryAddress
          FROM 
            Orders o
          JOIN 
            Account a ON o.AccountID = a.AccountID
          JOIN 
            OrderDetails od ON o.OrderID = od.OrderID
		      JOIN 
           WarrantyReceipt w ON od.OrderDetailID = w.OrderDetailID
          LEFT JOIN
            Diamond d ON od.DiamondID = d.DiamondID 
          LEFT JOIN
            DiamondRings dr ON od.DiamondRingsID = dr.DiamondRingsID
          LEFT JOIN
            Bridal br ON od.BridalID = br.BridalID
          LEFT JOIN
            DiamondTimepieces t ON od.DiamondTimepiecesID = t.DiamondTimepiecesID
			    LEFT JOIN
			      RingSize rs ON od.RingSizeID = rs.RingSizeID
			    LEFT JOIN
			      Material m ON od.MaterialID = m.MaterialID
          WHERE 
            o.OrderID = @id;
      `);

    // Return the result
    callback(null, result.recordsets[0]);
  } catch (err) {
    callback(err, null);
  } finally {
    // Close the connection
    sql.close();
  }
};

//===========Transaction===========

async function getTransaction(accountId) {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query('SELECT t.PaymentID, t.OrderID, t.PaymentAmount, t.Method, t.PaymentDate FROM Transactions t JOIN Orders o ON t.OrderID = o.OrderID JOIN Account a ON a.AccountID = o.AccountID WHERE a.AccountID = @AccountID');
    return result.recordset[0];
  } catch (err) {
    console.error('SQL error', err);
    throw new Error('Database query error');
  }
}


//==========end Transaction

//=========Schedule Appointments============

// Utility function to execute SQL queries
// Function to execute SQL queries
async function executeQuery(query, params) {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    // Add parameters to the request
    for (let paramName in params) {
      request.input(paramName, params[paramName]);
    }
    
    // Execute the query
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    throw new Error(error.message);
  }
}
// DAO function to get all schedule appointments
async function getAllScheduleAppointments() {
  const query = "SELECT * FROM ScheduleAppointment";
  return await executeQuery(query);
}

// DAO function to get schedule appointment by ID
async function getScheduleAppointmentById(scheduleId) {
  const query = `SELECT * FROM ScheduleAppointment WHERE NoSchedule = ${scheduleId}`;
  return await executeQuery(query);
}

// DAO function to create a new schedule appointment
async function createScheduleAppointment(appointmentData) {
  const {
    FirstName,
    LastName,
    Email,
    PhoneNumber,
    DesiredDay,
    DesiredTime,
    Message,
    DiamondID,
    BridalID,
    DiamondRingsID,
    DiamondTimepiecesID,
    AccountID,
  } = appointmentData;
  const query = `
      INSERT INTO ScheduleAppointment (FirstName, LastName, Email, PhoneNumber, DesiredDay, DesiredTime, Message, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID, AccountID)
      VALUES ('${FirstName}', '${LastName}', '${Email}', '${PhoneNumber}', '${DesiredDay}', '${DesiredTime}', '${Message}', ${DiamondID}, ${BridalID}, ${DiamondRingsID}, ${DiamondTimepiecesID}, ${AccountID});
      SELECT SCOPE_IDENTITY() AS NewScheduleAppointmentID;
  `;
  const result = await executeQuery(query);
  return result;
}

// DAO function to update schedule appointment by ID
async function updateScheduleAppointment(scheduleId, updatedData) {
  const {
    FirstName,
    LastName,
    Email,
    PhoneNumber,
    DesiredDay,
    DesiredTime,
    Message,
    DiamondID,
    BridalID,
    DiamondRingsID,
    DiamondTimepiecesID,
    AccountID,
  } = updatedData;
  const query = `
      UPDATE ScheduleAppointment
      SET FirstName = '${FirstName}', LastName = '${LastName}', Email = '${Email}', PhoneNumber = '${PhoneNumber}', 
          DesiredDay = '${DesiredDay}', DesiredTime = '${DesiredTime}', Message = '${Message}', DiamondID = ${DiamondID}, 
          BridalID = ${BridalID}, DiamondRingsID = ${DiamondRingsID}, DiamondTimepiecesID = ${DiamondTimepiecesID}, AccountID = ${AccountID}
      WHERE NoSchedule = ${scheduleId};
  `;
  await executeQuery(query);
  return true; // Assuming successful update
}

// DAO function to delete schedule appointment by ID
async function deleteScheduleAppointment(scheduleId) {
  const query = `DELETE FROM ScheduleAppointment WHERE NoSchedule = ${scheduleId}`;
  await executeQuery(query);
  return true; // Assuming successful deletion
}
//============================

//============Manage Feedback==========
// Function to get all feedbacks for a given product ID
// Function to get all feedbacks for a specific product type and ID
async function getAllFeedbacksByProductID(productType, productID) {
  try {
    let query = `
      SELECT
          Feedback.*,
          Account.FirstName,
          Account.LastName,
          Account.Image,
          Roles.RoleName
      FROM
          Feedback
          INNER JOIN Account ON Feedback.AccountID = Account.AccountID
          INNER JOIN Roles ON Account.RoleID = Roles.RoleID
      WHERE
    `;

    switch (productType) {
      case "Diamond":
        query += `Feedback.DiamondID = @productID`;
        break;
      case "Bridal":
        query += `Feedback.BridalID = @productID`;
        break;
      case "DiamondRings":
        query += `Feedback.DiamondRingsID = @productID`;
        break;
      case "DiamondTimepieces":
        query += `Feedback.DiamondTimepiecesID = @productID`;
        break;
      default:
        throw new Error("Invalid product type specified");
    }

    const feedbacks = await executeQuery(query, { productID });
    return feedbacks;
  } catch (error) {
    console.error("DAO error", error);
    throw error;
  }
}

// Function to create a new feedback
async function createFeedback(accountID, orderDetailID, feedbackContent, rating, diamondId, bridalId, diamondRingsId, diamondTimepiecesId) {
  try {
    let pool = await sql.connect(config);
    const query = `
      INSERT INTO Feedback (AccountID, OrderDetailID, Content, Rating, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID)
      VALUES (@accountID, @orderDetailID, @feedbackContent, @rating, @diamondId, @bridalId, @diamondRingsId, @diamondTimepiecesId);
    `;

    const request = pool.request()
      .input('accountID', sql.Int, accountID)
      .input('orderDetailID', sql.Int, orderDetailID)
      .input('feedbackContent', sql.NVarChar, feedbackContent || null)
      .input('rating', sql.Int, rating)
      .input('diamondId', sql.Int, diamondId || null)
      .input('bridalId', sql.Int, bridalId || null)
      .input('diamondRingsId', sql.Int, diamondRingsId || null)
      .input('diamondTimepiecesId', sql.Int, diamondTimepiecesId || null);

    const result = await request.query(query);
    return result;
  } catch (error) {
    throw new Error(`Error creating feedback: ${error.message}`);
  }
}




// Update feedback
async function updateFeedback(feedbackID, feedbackContent, rating) {
  try {
    let pool = await sql.connect(config);
    const query = `
      UPDATE Feedback
      SET Content = @content, Rating = @rating
      WHERE FeedbackID = @feedbackID;
    `;

    const result = await pool.request()
      .input('feedbackID', sql.Int, feedbackID)
      .input('content', sql.NVarChar, feedbackContent)
      .input('rating', sql.Int, rating)
      .query(query);

    return result;
  } catch (error) {
    throw new Error(`Error updating feedback: ${error.message}`);
  }
}

async function deleteFeedback(feedbackID) {
  try {
    let pool = await sql.connect(config);
    const query = `
      DELETE FROM Feedback
      WHERE FeedbackID = @feedbackID;
    `;

    const result = await pool.request()
      .input('feedbackID', sql.Int, feedbackID)
      .query(query);

    return result.rowsAffected;
  } catch (error) {
    throw new Error(`Error deleting feedback: ${error.message}`);
  }
}


//=============================

module.exports = {
  getBonusPointAndAccountDetails,
  getAccessOrder,
  getAccessOrderConfirm,
  getScheduleOfDelivery,
  getOrderStatusOfDelivery,
  getDeliveryCompleted,
  getDeliveryShipping,
  getOrderById,
  //schedule for customer and sale, manger
  getAllScheduleAppointments,
  getScheduleAppointmentById,
  createScheduleAppointment,
  updateScheduleAppointment,
  //==========end schedule===============
  //==========Transaction===========
  getTransaction,
  //==========END Transaction
  //============Manage Feedback==========
  getAllFeedbacksByProductID,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  //============end Manage Feedback==========
};
