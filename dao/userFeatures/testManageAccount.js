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

async function createAccount(accountData, roleName = 'Customer') {
  try {
    await connectDB();

    // Start a transaction
    let transaction = await new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if the email already exists in the Account table
      let checkEmailQuery = `
        SELECT COUNT(*) AS CountEmail
        FROM Account
        WHERE Email = @Email
      `;
      let emailCheckResult = await transaction.request()
        .input('Email', sql.VarChar(100), accountData.Email)
        .query(checkEmailQuery);

      if (emailCheckResult.recordset[0].CountEmail > 0) {
        throw new Error('Email already exists.');
      }

      // Insert a new role into Roles table and get the generated RoleID
      let insertRoleQuery = `
        INSERT INTO Roles (RoleName, Transportation, BonusPoints, NumberOfOrdersDelivered, Rank)
        OUTPUT INSERTED.RoleID
        VALUES (@RoleName, '', 0, 0, '');
      `;
      let roleResult = await transaction.request()
        .input('RoleName', sql.VarChar(50), roleName)
        .query(insertRoleQuery);

      // Retrieve the generated RoleID
      let newRoleId = roleResult.recordset[0].RoleID;

      // Generate a token for the account
      const token = uuidv4();

      // Insert account data into the Account table with the new RoleID
      let insertAccountQuery = `
        INSERT INTO Account (FirstName, LastName, Gender, Birthday, Password, Email, PhoneNumber, Address,
          Country, City, Province, PostalCode, RoleID, Status, Image, Token)
        VALUES (@FirstName, @LastName, @Gender, @Birthday, @Password, @Email, @PhoneNumber, @Address,
          @Country, @City, @Province, @PostalCode, @RoleID, @Status, @Image, @Token);
      `;

      await transaction.request()
        .input('FirstName', sql.NVarChar(50), accountData.FirstName)
        .input('LastName', sql.NVarChar(50), accountData.LastName)
        .input('Gender', sql.NVarChar(10), accountData.Gender)
        .input('Birthday', sql.Date, accountData.Birthday)
        .input('Password', sql.VarChar(100), accountData.Password)
        .input('Email', sql.VarChar(100), accountData.Email)
        .input('PhoneNumber', sql.VarChar(20), accountData.PhoneNumber)
        .input('Address', sql.NVarChar(sql.MAX), accountData.Address)
        .input('Country', sql.NVarChar(50), accountData.Country)
        .input('City', sql.NVarChar(50), accountData.City)
        .input('Province', sql.NVarChar(50), accountData.Province)
        .input('PostalCode', sql.VarChar(50), accountData.PostalCode)
        .input('RoleID', sql.Int, newRoleId)
        .input('Status', sql.VarChar(50), accountData.Status)
        .input('Image', sql.VarChar(sql.MAX), accountData.Image)
        .input('Token', sql.VarChar(sql.MAX), token)
        .query(insertAccountQuery);

      // Commit the transaction
      await transaction.commit();

      return { token, newRoleId }; // Return the generated token and RoleID
    } catch (err) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error creating account:', err.message);
      throw { error: 'Failed to create account' }; // Throw a custom error message
    }
  } catch (err) {
    console.error('Error creating account:', err.message);
    throw { error: 'Failed to create account' }; // Throw a custom error message
  }
}

async function updateAccountInfo(accountData, userId) {
  try {
    await connectDB();

    // Start a transaction
    let transaction = await new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update account data in the Account table
      let updateAccountQuery = `
        UPDATE Account
        SET FirstName = @FirstName,
            LastName = @LastName,
            Gender = @Gender,
            Birthday = @Birthday,
            Password = @Password,
            PhoneNumber = @PhoneNumber,
            Address = @Address,
            Country = @Country,
            City = @City,
            Province = @Province,
            PostalCode = @PostalCode,
            Status = @Status,
            Image = @Image
        WHERE AccountID = @AccountID;
      `;

      await transaction.request()
        .input('FirstName', sql.NVarChar(50), accountData.FirstName)
        .input('LastName', sql.NVarChar(50), accountData.LastName)
        .input('Gender', sql.NVarChar(10), accountData.Gender)
        .input('Birthday', sql.Date, accountData.Birthday)
        .input('Password', sql.VarChar(100), accountData.Password)
        .input('PhoneNumber', sql.VarChar(20), accountData.PhoneNumber)
        .input('Address', sql.NVarChar(sql.MAX), accountData.Address)
        .input('Country', sql.NVarChar(50), accountData.Country)
        .input('City', sql.NVarChar(50), accountData.City)
        .input('Province', sql.NVarChar(50), accountData.Province)
        .input('PostalCode', sql.VarChar(50), accountData.PostalCode)
        .input('Status', sql.VarChar(50), accountData.Status)
        .input('Image', sql.VarChar(sql.MAX), accountData.Image)
        .input('AccountID', sql.Int, userId)
        .query(updateAccountQuery);

      // Commit the transaction
      await transaction.commit();

      return { message: 'Account information updated successfully' };
    } catch (err) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error updating account information:', err.message);
      throw { error: 'Failed to update account information' }; // Throw a custom error message
    }
  } catch (err) {
    console.error('Error updating account information:', err.message);
    throw { error: 'Failed to update account information' }; // Throw a custom error message
  }
}

module.exports = {
  createAccount,
  updateAccountInfo,
};
