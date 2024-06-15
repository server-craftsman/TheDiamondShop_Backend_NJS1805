const { config } = require("dotenv");
const dbConfig = require("../../config/dbconfig");
const sql = require('mssql');

// Function to get bonus points and account details
function getBonusPointAndAccountDetails() {
  return sql.connect(dbConfig)
    .then(pool => {
      return pool.request()
        .query(`
          SELECT R.RoleName, R.BonusPoints, A.firstName, A.LastName, A.Gender, A.Birthday, A.Email
          FROM BonusPoint AS R
          JOIN Account AS A ON R.RoleID = A.RoleID
        `);
    })
    .then(result => {
      return result.recordset; // Return the data
    })
    .catch(err => {
      console.error('Failed to get BonusPoint and Account details:', err);
      throw err; // Propagate error to the caller
    });
}

// Function to get Schedule Appointment
async function getScheduleAppointment() {
  try {
    let pool = await sql.connect(config);
    let results = await pool.request().query("SELECT * FROM ScheduleAppointment");
    return results.recordsets;
  } catch (error) {
    console.error("SQL error", error);
    throw error;
  }
}
// Function to get Access Order
async function getAccessOrder(){
  try{
      let pool = await sql.connect(config);
      let order = await pool.request()
      .query(`SELECT o.OrderID, o.Orderdate, a.Firstname, a.Lastname, o.Quantity, o.TotalPrice, o.OrderStatus 
      FROM Orders o JOIN Account a ON o.AccountID = a.AccountID`);
      return order.recordsets;
  } catch (error) {
      console.error('Connection SQL error:', error);
      throw error;
  }
}

//Funciton to get Schedule of delivery
async function getScheduleOfDelivery(){
  try{
    let pool = await sql.connect(config);
    let results = await pool.request()
    .query(`SELECT 
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
    OrderDetails od ON o.OrderID = od.OrderID`)
    return results.recordsets;
  }catch (error) {
    console.error('Connection SQL error:', error);
    throw error;
}
}

module.exports = {
  getBonusPointAndAccountDetails,
  getScheduleAppointment,
  getAccessOrder,
  getScheduleOfDelivery,
};
