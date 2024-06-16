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

//=========Schedule Appointments============

// Utility function to execute SQL queries
async function executeQuery(query) {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request().query(query);
    return result.recordset;
  } catch (error) {
    throw new Error(error.message);
  }
}

// DAO function to get all schedule appointments
async function getAllScheduleAppointments() {
  const query = 'SELECT * FROM ScheduleAppointment';
  return await executeQuery(query);
}

// DAO function to get schedule appointment by ID
async function getScheduleAppointmentById(scheduleId) {
  const query = `SELECT * FROM ScheduleAppointment WHERE NoSchedule = ${scheduleId}`;
  return await executeQuery(query);
}

// DAO function to create a new schedule appointment
async function createScheduleAppointment(appointmentData) {
  const { FirstName, LastName, Email, PhoneNumber, DesiredDay, DesiredTime, Message, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID, AccountID } = appointmentData;
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
  const { FirstName, LastName, Email, PhoneNumber, DesiredDay, DesiredTime, Message, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID, AccountID } = updatedData;
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

module.exports = {
  getBonusPointAndAccountDetails,
  getAccessOrder,
  getScheduleOfDelivery,
  //schedule for customer and sale, manger
  getAllScheduleAppointments,
  getScheduleAppointmentById,
  createScheduleAppointment,
  updateScheduleAppointment,
  //==========end schedule===============
};
