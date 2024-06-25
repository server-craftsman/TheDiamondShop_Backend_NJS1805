const sql = require('mssql');
const config = require('../../config/dbconfig');

// Get user by ID
async function getUserById(accountId) {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query('SELECT FirstName, LastName, Gender, Birthday, Email, PhoneNumber, Address, Country, Province, City, PostalCode, r.RoleName, Image FROM Account a JOIN Roles r ON r.RoleID = a.RoleID WHERE AccountID = @AccountID');
    return result.recordset[0];
  } catch (err) {
    console.error('SQL error', err);
    throw new Error('Database query error');
  }
}

// Get user by Token
async function getUserByToken(token) {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request()
      .input('Token', sql.VarChar, token)
      .query('SELECT * FROM Account WHERE Token = @Token');
    return result.recordset[0];
  } catch (err) {
    console.error('SQL error', err);
    throw new Error('Database query error');
  }
}

// Save token for user
async function saveToken(accountId, token) {
  try {
    let pool = await sql.connect(config);
    await pool.request()
      .input('AccountID', sql.Int, accountId)
      .input('Token', sql.VarChar, token)
      .query('UPDATE Account SET Token = @Token WHERE AccountID = @AccountID');
  } catch (err) {
    console.error('SQL error', err);
    throw new Error('Database update error');
  }
}

const getUserByEmailAndPassword = async (email, password) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .input("Password", sql.VarChar, password).query(`
        SELECT a.*, r.RoleName
        FROM Account a
        JOIN Roles r ON a.RoleID = r.RoleID
        WHERE a.Email = @Email AND a.Password = @Password
      `);
    return result.recordset;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

const getUserByEmail = async (email) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().input("Email", sql.NVarChar, email)
      .query(`
        SELECT *
        FROM Account
        WHERE Email = @Email
      `);
    return result.recordset[0];
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

const getRoleByName = async (roleName) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("RoleName", sql.NVarChar, roleName).query(`
        SELECT *
        FROM Roles
        WHERE RoleName = @RoleName
      `);
    return result.recordset[0];
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

const insertUser = async (userData) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      birthday,
      password,
      email,
      phoneNumber,
      address,
      country,
      city,
      province,
      postalCode,
      roleId,
      status,
    } = userData;
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("FirstName", sql.NVarChar, firstName)
      .input("LastName", sql.NVarChar, lastName)
      .input("Gender", sql.NVarChar, gender)
      .input("Birthday", sql.Date, birthday)
      .input("Password", sql.VarChar, password)
      .input("Email", sql.NVarChar, email)
      .input("PhoneNumber", sql.NVarChar, phoneNumber)
      .input("Address", sql.NVarChar, address)
      .input("Country", sql.NVarChar, country)
      .input("City", sql.NVarChar, city)
      .input("Province", sql.NVarChar, province)
      .input("PostalCode", sql.NVarChar, postalCode)
      .input("RoleID", sql.Int, roleId)
      .input("Status", sql.NVarChar, status).query(`
        INSERT INTO Account (FirstName, LastName, Gender, Birthday, Password, Email, PhoneNumber, Address, Country, City, Province, PostalCode, RoleID, Status)
        VALUES (@FirstName, @LastName, @Gender, @Birthday, @Password, @Email, @PhoneNumber, @Address, @Country, @City, @Province, @PostalCode, @RoleID, @Status)
      `);
    return result;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

const registerUser = async (userData) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      birthday,
      password,
      email,
      phoneNumber,
      address,
      country,
      city,
      province,
      postalCode,
    } = userData;

    console.log("Starting user registration...");

    // Check if email already exists
    console.log(`Checking if email exists: ${email}`);
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log("Email already exists.");
      throw new Error("Email already exists");
    }

    // Check password length
    console.log("Checking password length...");
    if (password.length < 8) {
      console.log("Password is too short.");
      throw new Error("Password must be at least 8 characters long");
    }

    // Get RoleID for "Customer"
    console.log("Retrieving RoleID for 'Customer'...");
    const role = await getRoleByName("Customer");
    if (!role) {
      console.log("Role 'Customer' not found.");
      throw new Error('Role "Customer" not found');
    }

    // Insert new user with the retrieved RoleID
    console.log("Inserting new user...");
    const result = await insertUser({
      firstName,
      lastName,
      gender,
      birthday,
      password,
      email,
      phoneNumber,
      address,
      country,
      city,
      province,
      postalCode,
      roleId: role.RoleID, // Assuming roleId is the property name for RoleID
      status: "Activate",
    });

    console.log("User registered successfully.");
    return result;
  } catch (err) {
    console.error("Error registering user:", err);
    throw err;
  }
};

async function clearToken(accountId) {
  try {
    const pool = await sql.connect(dbConfig);
    const query = `
      UPDATE Account
      SET Token = NULL
      WHERE AccountID = @AccountId
    `;
    await pool.request()
      .input('AccountId', sql.Int, accountId)
      .query(query);
  } catch (error) {
    console.error('Error clearing token:', error.message);
    throw error;
  }
};

module.exports = {
  getUserById,
  getUserByToken,
  saveToken,
  getUserByEmailAndPassword,
  getUserByEmail,
  getRoleByName,
  insertUser,
  registerUser,
  clearToken,
};