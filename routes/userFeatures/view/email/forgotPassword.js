const express = require("express");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const sql = require("mssql");
const ejs = require("ejs");
const path = require("path");
const router = express.Router();
require("dotenv").config();
const dbConfig = require("../../../../config/dbconfig");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

async function getAccessToken() {
  const accessTokenResponse = await oAuth2Client.getAccessToken();
  return accessTokenResponse.token;
}

const sendMail = async (email, subject, resetCode) => {
  const accessToken = await getAccessToken();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  const templatePath = path.join(
    __dirname,
    "../../view/email/resetPasswordTemplate.ejs"
  );
  const html = await ejs.renderFile(templatePath, { resetCode });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    html: html,
  };

  await transporter.sendMail(mailOptions);
};

const resetPasswordHandler = async (email, userType) => {
  await sql.connect(dbConfig);

  const userTables = {
    account: "dbo.Account",
  };

  const userTable = userTables[userType];

  if (!userTable) {
    throw new Error("Invalid user type");
  }

  const query = `SELECT * FROM ${userTable} WHERE Email = @Email`;
  const request = new sql.Request();
  request.input("Email", sql.VarChar, email);
  const queryResult = await request.query(query);

  if (queryResult.recordset.length === 0) {
    throw new Error("User not found");
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // Tạo mã 6 chữ số

  const updateQuery = `UPDATE ${userTable} SET ResetToken = @ResetToken, ResetTokenExpire = DATEADD(HOUR, 1, GETDATE()) WHERE Email = @Email`;
  const updateRequest = new sql.Request();
  updateRequest.input("ResetToken", sql.VarChar, resetCode);
  updateRequest.input("Email", sql.VarChar, email);
  await updateRequest.query(updateQuery);

  await sendMail(email, "Password Reset Request", resetCode);
};

router.post("/forgot-password", async (req, res) => {
  const { email, userType } = req.body;

  if (!email || !userType) {
    return res.status(400).json({ error: "Email and user type are required" });
  }

  try {
    await resetPasswordHandler(email, userType);
    res
      .status(200)
      .json({ message: "Password reset instructions sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, userType, resetCode, password } = req.body;

  if (!email || !userType || !resetCode || !password) {
    return res.status(400).json({
      error: "Email, user type, reset code, and password are required",
    });
  }

  // Check if the password is at least 8 characters long
 

  try {
    await sql.connect(dbConfig);
    const userTable = {
      account: "dbo.Account",
    }[userType];

    if (!userTable) {
      return res.status(400).json({ error: "Invalid user type" });
    }

    if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters long" });
      }
    const query = `SELECT * FROM ${userTable} WHERE Email = @Email AND ResetToken = @ResetToken AND ResetTokenExpire > GETDATE()`;
    const request = new sql.Request();
    request.input("Email", sql.VarChar, email);
    request.input("ResetToken", sql.VarChar, resetCode);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const plainPassword = password;

    const updateQuery = `UPDATE ${userTable} SET Password = @Password, ResetToken = NULL, ResetTokenExpire = NULL WHERE Email = @Email`;
    const updateRequest = new sql.Request();
    updateRequest.input("Password", sql.VarChar, plainPassword);
    updateRequest.input("Email", sql.VarChar, email);
    await updateRequest.query(updateQuery);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
