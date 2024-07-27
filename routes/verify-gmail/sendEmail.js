const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../../config/dbconfig');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();
// EMAIL=testuserpaypaldiamondshop@gmail.com
// CLIENT_ID=217812163880-vndssc540bg7925gbs68fhb5m3db6q59.apps.googleusercontent.com
// CLIENT_SECRET=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
// REDIRECT_URI=https://oauth2.googleapis.com/token
// REFRESH_TOKEN=1//04N_wMiHbiwGyCgYIARAAGAQSNwF-L9IrsR7664oC2BU50zsUNbY6JjMrkS9KXHxzuB0YjRxbI9OMKJvODKwNmhtN7OcFlYOWp0g

// OAuth2 credentials from environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// Create an OAuth2 client with the credentials
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Connect to database
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

// Send verification email
const sendVerificationEmail = async (email, token) => {
  try {
    const { token: accessToken } = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'testuserpaypaldiamondshop@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      }, tls: {
        rejectUnauthorized: false, // Add this line
      },
    });

    const templatePath = path.join(__dirname, './index.ejs');
    const verificationLink = `http://localhost:8090/verify/${token}`;
    const html = await ejs.renderFile(templatePath, { verificationLink });

    const mailOptions = {
      from: 'testuserpaypaldiamondshop@gmail.com',
      to: email,
      subject: 'Account Verification',
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error.message);
    console.error('Detailed error info:', error);
    throw new Error('Failed to send verification email');
  }
};

// Register and verify in one API
router.post('/auth/register', async (req, res) => {
  const guestData = req.body;

  console.log(`Request received at: POST /auth/register - ${new Date().toLocaleString()}`);

  try {
    await connectDB();

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if the email already exists
      const emailCheckResult = await transaction.request()
        .input('Email', sql.VarChar(100), guestData.Email)
        .query(`
          SELECT COUNT(*) AS CountEmail
          FROM Account
          WHERE Email = @Email
        `);

      if (emailCheckResult.recordset[0].CountEmail > 0) {
        throw new Error('Email already exists.');
      }

      // Insert a new role into Roles table and get the RoleID
      const roleResult = await transaction.request()
        .query(`
          INSERT INTO Roles (RoleName, Transportation, BonusPoints, NumberOfOrdersDelivered, Rank)
          OUTPUT INSERTED.RoleID
          VALUES ('Customer', '', 0, 0, '')
        `);

      const newRoleId = roleResult.recordset[0].RoleID;

      // Generate a token
      const token = uuidv4();

      // Insert guest data into Account table with 'Pending' status
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
        .input('Image', sql.VarChar(sql.MAX), guestData.Image)
        .input('Token', sql.VarChar(sql.MAX), token)
        .query(`
          INSERT INTO Account (FirstName, LastName, Gender, Birthday, Password, Email, PhoneNumber, Address,
            Country, City, Province, PostalCode, RoleID, Status, Image, Token)
          VALUES (@FirstName, @LastName, @Gender, @Birthday, @Password, @Email, @PhoneNumber, @Address,
            @Country, @City, @Province, @PostalCode, @RoleID, 'Pending', @Image, @Token)
        `);

      await transaction.commit();

      // Send verification email
      await sendVerificationEmail(guestData.Email, token);

      res.status(200).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (err) {
      await transaction.rollback();
      console.error('Error registering guest:', err.message);
      res.status(500).json({ error: 'Failed to register guest' });
    }
  } catch (err) {
    console.error('Error connecting to database or initializing transaction:', err.message);
    res.status(500).json({ error: 'Failed to register guest' });
  }
});

module.exports = router;
