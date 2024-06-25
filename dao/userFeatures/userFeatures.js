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
    let pool = await sql.connect(config);
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
      let pool = await sql.connect(config);
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
    let pool = await sql.connect(config);
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
    let pool = await sql.connect(config)
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
WHERE o.OrderStatus IN ('Confirm', 'Shipped')`);
return results.recordsets;
} catch (error) {
  console.error("Connection SQL error:", error);
  throw error;
}
}

//View Delivery ('Shipping')
async function getDeliveryShipping() {
  try {
    let pool = await sql.connect(config)
    let results = await pool.request().query(`SELECT o.OrderID, 
       o.Orderdate, 
       a.Firstname, 
       a.Lastname, 
       o.Quantity, 
       o.TotalPrice, 
       o.OrderStatus 
FROM Orders o 
JOIN Account a ON o.AccountID = a.AccountID 
WHERE o.OrderStatus = 'Shipped'`);
return results.recordsets;
} catch (error) {
  console.error("Connection SQL error:", error);
  throw error;
}
}

//View Delivery ('Complete')
async function getDeliveryCompleted() {
  try {
    let pool = await sql.connect(config)
    let results = await pool.request().query(`SELECT o.OrderID, 
       o.Orderdate, 
       a.Firstname, 
       a.Lastname, 
       o.Quantity, 
       o.TotalPrice, 
       o.OrderStatus 
FROM Orders o 
JOIN Account a ON o.AccountID = a.AccountID 
WHERE o.OrderStatus = 'Completed'`);
return results.recordsets;
} catch (error) {
  console.error("Connection SQL error:", error);
  throw error;
}
}

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
    let query = "";
    switch (productType) {
      case "Diamond":
        query = `SELECT * FROM Feedback WHERE DiamondID = @productID`;
        break;
      case "Bridal":
        query = `SELECT * FROM Feedback WHERE BridalID = @productID`;
        break;
      case "DiamondRings":
        query = `SELECT * FROM Feedback WHERE DiamondRingsID = @productID`;
        break;
      case "DiamondTimepieces":
        query = `SELECT * FROM Feedback WHERE DiamondTimepiecesID = @productID`;
        break;
      default:
        throw new Error("Invalid product type specified");
    }

    const feedbacks = await executeQuery(query, { productID });
    return feedbacks;
  } catch (error) {
    console.error("SQL error", error);
    throw error;
  }
}

// Function to create a new feedback
async function createFeedback(
  accountID,
  diamondID,
  bridalID,
  diamondRingsID,
  diamondTimepiecesID,
  content,
  rating
) {
  try {
    const pool = await poolPromise;
    const query = `
      INSERT INTO Feedback (AccountID, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID, Content, Rating)
      VALUES (@accountID, @diamondID, @bridalID, @diamondRingsID, @diamondTimepiecesID, @content, @rating)
    `;
    const result = await pool
      .request()
      .input("accountID", accountID)
      .input("diamondID", diamondID)
      .input("bridalID", bridalID)
      .input("diamondRingsID", diamondRingsID)
      .input("diamondTimepiecesID", diamondTimepiecesID)
      .input("content", content)
      .input("rating", rating)
      .query(query);

    return result.rowsAffected[0] === 1;
  } catch (error) {
    console.error("SQL error", error);
    throw error;
  }
}

// Function to update a feedback by feedback ID
async function updateFeedback(feedbackID, content, rating, roleName) {
  try {
    const pool = await poolPromise;
    const query = `
      UPDATE Feedback
      SET Content = @content, Rating = @rating
      WHERE FeebackID = @feedbackID
      AND EXISTS (
          SELECT 1 FROM Account a
          JOIN Roles r ON a.RoleID = r.RoleID
          WHERE a.AccountID = Feedback.AccountID
          AND r.RoleName = 'Customer'
      )
    `;
    const result = await pool
      .request()
      .input("feedbackID", feedbackID)
      .input("content", content)
      .input("rating", rating)
      .input("roleName", roleName)
      .query(query);

    return result.rowsAffected[0] === 1;
  } catch (error) {
    console.error("SQL error", error);
    throw error;
  }
}

// Function to delete a feedback by feedback ID
async function deleteFeedback(feedbackID, roleName) {
  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      DELETE FROM Feedback
      WHERE FeedbackID = @feedbackID
      AND (
          @roleName = 'Manager' OR
          EXISTS (
              SELECT 1 FROM Account a
              JOIN Roles r ON a.RoleID = r.RoleID
              WHERE a.AccountID = Feedback.AccountID
              AND r.RoleName = @roleName
          )
      )
    `;
    const result = await pool
      .request()
      .input("feedbackID", feedbackID)
      .input("roleName", roleName)
      .query(query);

    return result.rowsAffected[0] === 1;s
  } catch (error) {
    console.error("SQL Error:", error);
    throw error; // Throwing the error for further handling
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
  //schedule for customer and sale, manger
  getAllScheduleAppointments,
  getScheduleAppointmentById,
  createScheduleAppointment,
  updateScheduleAppointment,
  //==========end schedule===============
  //============Manage Feedback==========
  getAllFeedbacksByProductID,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  //============end Manage Feedback==========
};
