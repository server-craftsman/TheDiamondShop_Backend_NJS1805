const express = require("express");
const router = express.Router();
const sql = require("mssql");
const config = require("../../config/dbconfig");

let pool = null;

async function connectDB() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('Database connection established.');
    }
    return pool;
  } catch (err) {
    console.error('Error connecting to database:', err.message);
    throw err;
  }
}

router.get('/verify/:token', async (req, res) => {
  const token = req.params.token;

  try {
    await connectDB();

    let verifyQuery = `
      UPDATE Account
      SET Status = 'Activate'
      WHERE Token = @Token
      AND Status = 'Pending';
    `;

    let result = await pool.request()
      .input('Token', sql.VarChar(sql.MAX), token)
      .query(verifyQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).send('Invalid or expired token.');
    }

    // Redirect to the desired URL after successful verification
    res.redirect('http://localhost:5173/login'); // Replace with your actual React app URL
  } catch (error) {
    console.error('Error verifying account:', error);
    res.status(500).send('Failed to verify account.');
  }
});

module.exports = router;
