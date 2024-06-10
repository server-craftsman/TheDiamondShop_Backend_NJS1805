const sql = require('mssql');
const dbConfig = require('../../config/dbconfig');

const getUserByEmailAndPassword = async (email, password) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT a.*, r.RoleName
        FROM Account a
        JOIN Roles r ON a.RoleID = r.RoleID
        WHERE a.Email = @email AND a.Password = @password
      `);
    return result.recordset;
  } catch (err) {
    console.error('Database query error:', err);
    throw new Error('Database query error');
  }
};

module.exports = {
  getUserByEmailAndPassword,
};
