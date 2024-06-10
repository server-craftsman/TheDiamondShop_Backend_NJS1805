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

module.exports = {
  getBonusPointAndAccountDetails
};
