const sql = require('mssql');
const config = require('../../config/dbconfig');
const { v4: uuidv4 } = require('uuid'); // For generating UUIDs

let pool = null;

async function connectDB() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
    }
  } catch (err) {
    console.error('Error connecting to database:', err.message);
    throw err;
  }
}

async function insertNewRoleAndGuestAccount(guestData) {
  try {
    await connectDB();

    // Start a transaction
    let transaction = await new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if the email already exists in Account table
      let checkEmailQuery = `
        SELECT COUNT(*) AS CountEmail
        FROM Account
        WHERE Email = @Email
      `;
      let emailCheckResult = await transaction.request()
        .input('Email', sql.VarChar(100), guestData.Email)
        .query(checkEmailQuery);

      if (emailCheckResult.recordset[0].CountEmail > 0) {
        throw new Error('Email already exists.');
      }

      // Insert a new role into Roles table and get the generated RoleID
      let insertRoleQuery = `
        INSERT INTO Roles (RoleName, Transportation, BonusPoints, NumberOfOrdersDelivered, Rank)
        OUTPUT INSERTED.RoleID
        VALUES ('Customer', '', 0, 0, '');
      `;
      let roleResult = await transaction.request()
        .query(insertRoleQuery);

      // Retrieve the generated RoleID
      let newRoleId = roleResult.recordset[0].RoleID;

      // Generate a token for the guest
      const token = uuidv4();

      // Insert guest data into the Account table with the new RoleID
      let insertAccountQuery = `
        INSERT INTO Account (FirstName, LastName, Gender, Birthday, Password, Email, PhoneNumber, Address,
          Country, City, Province, PostalCode, RoleID, Status, Image, Token)
        VALUES (@FirstName, @LastName, @Gender, @Birthday, @Password, @Email, @PhoneNumber, @Address,
          @Country, @City, @Province, @PostalCode, @RoleID, @Status, @Image, @Token);
      `;

      await transaction.request()
        .input('FirstName', sql.NVarChar(50), guestData.FirstName)
        .input('LastName', sql.NVarChar(50), guestData.LastName)
        .input('Gender', sql.NVarChar(10), guestData.Gender)
        .input('Birthday', sql.Date, guestData.Birthday)
        .input('Password', sql.VarChar(100), guestData.Password)
        .input('Email', sql.VarChar(100), guestData.Email)
        .input('PhoneNumber', sql.VarChar(20), guestData.PhoneNumber)
        .input('Address', sql.NVarChar(sql.MAX), guestData.Address)
        .input('Country', sql.NVarChar(50), guestData.Country)
        .input('City', sql.NVarChar(50), guestData.City)
        .input('Province', sql.NVarChar(50), guestData.Province)
        .input('PostalCode', sql.VarChar(50), guestData.PostalCode)
        .input('RoleID', sql.Int, newRoleId)
        .input('Status', sql.VarChar(50), guestData.Status)
        .input('Image', sql.VarChar(sql.MAX), guestData.Image)
        .input('Token', sql.VarChar(sql.MAX), token)
        .query(insertAccountQuery);

      // Commit the transaction
      await transaction.commit();

      return token; // Return the generated token
    } catch (err) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error registering guest:', err.message);
      throw { error: 'Failed to register guest' }; // Throw a custom error message
    }
  } catch (err) {
    console.error('Error registering guest:', err.message);
    throw { error: 'Failed to register guest' }; // Throw a custom error message
  }
}

module.exports = {
  insertNewRoleAndGuestAccount
};