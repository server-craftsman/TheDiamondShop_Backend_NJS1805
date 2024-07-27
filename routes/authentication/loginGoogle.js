const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const flash = require("express-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sql = require("mssql");
require("dotenv").config();
const dbConfig = require("../../config/dbconfig");

const router = express.Router();
const saltRounds = 10;

passport.use(
  'customer-google',
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:8090/auth/google/customer/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const pool = await sql.connect(dbConfig);
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

        if (!email) {
          return done(new Error('Email not provided by Google profile'));
        }

        const emailCheckQuery = `SELECT * FROM Account WHERE Email = @Email`;
        const emailCheckResult = await pool.request().input('Email', sql.NVarChar, email).query(emailCheckQuery);

        if (emailCheckResult.recordset && emailCheckResult.recordset.length > 0) {
          return done(null, emailCheckResult.recordset[0]);
        }

        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

        const roleInsertQuery = `INSERT INTO Roles (RoleName) VALUES ('Customer'); SELECT SCOPE_IDENTITY() AS RoleID;`;
        const roleInsertResult = await pool.request().query(roleInsertQuery);
        const roleId = roleInsertResult.recordset[0].RoleID;

        const token = crypto.randomBytes(64).toString('hex');
        const insertAccountQuery = `INSERT INTO Account (FirstName, LastName, Email, Password, RoleID, Token) VALUES (@FirstName, @LastName, @Email, @Password, @RoleID, @Token); SELECT SCOPE_IDENTITY() AS AccountID;`;
        const insertAccountResult = await pool.request()
          .input('FirstName', sql.NVarChar, profile.name.givenName || 'No FirstName')
          .input('LastName', sql.NVarChar, profile.name.familyName || 'No LastName')
          .input('Email', sql.NVarChar, email)
          .input('Password', sql.NVarChar, hashedPassword)
          .input('RoleID', sql.Int, roleId)
          .input('Token', sql.NVarChar, token)
          .query(insertAccountQuery);

        return done(null, { ...profile._json, token });
      } catch (err) {
        console.error('Google OAuth Error:', err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

router.use(cookieParser());
router.use(flash());
router.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

router.get(
  "/auth/google/customer",
  passport.authenticate("customer-google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/customer/callback",
  passport.authenticate("customer-google", { failureRedirect: "/" }),
  (req, res) => {
    if (req.user) {
      res.redirect(`http://localhost:5173/login?token=${req.user.token}&roleName=Customer&FirstName=${req.user.given_name}&LastName=${req.user.family_name}&email=${req.user.email}@password=${req.user.password}`);
    } else {
      res.redirect("/");
    }
  }
); 

module.exports = router;
