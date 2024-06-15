const express = require("express");
const jwt = require("jsonwebtoken");
const {
  getUserByEmailAndPassword,
  registerUser,
} = require("../../dao/authentication/loginDAO");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const flash = require("express-flash");
require("dotenv").config();
const sql = require("mssql");
const dbConfig = require("../../config/dbconfig");
const JWT_SECRET = process.env.JWT_SECRET; // Replace with your own secret key

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token found in request headers");
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      return res.sendStatus(403); // Forbidden
    }
    console.log("Token verified successfully:", user);
    req.user = user;
    next();
  });
}

router.get("/protected", authenticateToken, (req, res) => {
  res.send(`Hello, ${req.user.roleName}`);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const users = await getUserByEmailAndPassword(email, password);

    if (users.length === 0) {
      return res.status(401).send("Invalid email or password");
    }

    const user = users[0];

    const token = jwt.sign(
      { accountId: user.AccountID, roleName: user.RoleName },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true }); // Set token in cookie
    res.json({ message: `Hello, ${user.RoleName}!`, token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

router.post("/logout", (req, res) => {
  // Clear the token from the client's cookie
  res.clearCookie("token"); // Clear token cookie

  // Respond with success message
  res.status(200).json({ message: "Logout successful" });
});

router.post("/register", async (req, res) => {
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
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return res
      .status(400)
      .send("First name, last name, email, and password are required");
  }

  try {
    // Register user
    await registerUser({
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
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err.message);
    if (err.message === "Email already exists") {
      return res.status(409).send("Email already exists");
    }
    if (err.message === "Password must be at least 8 characters long") {
      return res
        .status(400)
        .send("Password must be at least 8 characters long");
    }
    res.status(500).send("Internal server error");
  }
});

// Change Password
router.put("/change-password", async (request, response) => {
  const { email, password, role } = request.body;

  if (!email || !password || !role) {
    return response
      .status(400)
      .json({ status: false, message: "Please Input Required Field" });
  }
  if (password.length < 8) {
    return response.status(400).json({
      status: false,
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    console.log("Database connected successfully");
    //check old password
    const currentPasswordResult = await pool
      .request()
      .input("Email", sql.VarChar, email)
      .input("Role", sql.VarChar, role)
      .query(
        "SELECT Password From Account a JOIN Roles r ON a.RoleID = r.RoleID WHERE r.RoleName = @Role AND a.Email = @Email"
      );

    if (currentPasswordResult.recordset.length === 0) {
      return response
        .status(400)
        .json({ status: false, message: "Account not found" });
    }

    const currentPassword = currentPasswordResult.recordset[0].Password;

    // Compare the new password with the current password
    if (password === currentPassword) {
      return response.status(400).json({
        status: false,
        message: "New password cannot be the same as the old password",
      });
    }

    const result = await pool
      .request()
      .input("Email", sql.VarChar, email)
      .input("Role", sql.VarChar, role)
      .input("Password", sql.VarChar, password)
      .query(
        "UPDATE Account SET Password = @Password FROM Account a JOIN Roles r ON a.RoleID = r.RoleID WHERE a.Email = @Email AND r.RoleName = @Role"
      );

    console.log("Change Password result:", result);

    if (result.rowsAffected[0] > 0) {
      console.log("Change Password successful");
      response.json({ status: true, message: "Change Password successful" });
    } else {
      console.log("Change Password failed");
      response
        .status(500)
        .json({ status: false, message: "Change Password failed" });
    }
  } catch (error) {
    console.error("Error Changing Password:", error);
    response.status(500).json({
      status: false,
      message: "An error occurred during changing password",
      error: error.message,
    });
  }
});

//login google
// Google authentication setup
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
        // Connect to SQL Server
        const pool = await sql.connect(dbConfig);

        // Check if email is provided in the Google profile
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('Email not provided by Google profile'));
        }

        // Insert or update Role in Roles table
        let roleId = null;
        const insertRoleQuery = `INSERT INTO Roles (RoleName) VALUES ('Customer'); SELECT SCOPE_IDENTITY() AS RoleID;`;
        const insertRoleResult = await pool.request().query(insertRoleQuery);
        if (insertRoleResult.recordset && insertRoleResult.recordset.length > 0) {
          roleId = insertRoleResult.recordset[0].RoleID;
        } else {
          // Handle case where roleId is not retrieved properly
          console.error('Failed to retrieve RoleID from Roles table:', insertRoleResult);
          return done(new Error('Failed to retrieve RoleID from Roles table'));
        }

        // Insert new customer with the retrieved RoleID
        const insertAccountQuery = `INSERT INTO Account (FirstName, LastName, Email, RoleID) 
                                    OUTPUT INSERTED.AccountID
                                    VALUES ('${profile.name.givenName}', '${profile.name.familyName}', '${email}', ${roleId})`;
        const insertAccountResult = await pool.request().query(insertAccountQuery);

        if (insertAccountResult.recordset && insertAccountResult.recordset.length > 0) {
          // Return newly created customer
          return done(null, {
            AccountID: insertAccountResult.recordset[0].AccountID,
            FirstName: profile.name.givenName,
            LastName: profile.name.familyName,
            Email: email,
            RoleID: roleId,
          });
        } else {
          // Handle case where insertAccountResult does not return valid data
          console.error('Invalid insertAccountResult:', insertAccountResult);
          return done(new Error('Failed to create new account'));
        }
      } catch (error) {
        console.error('Error during Google authentication:', error);
        return done(error);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.AccountID);
});

passport.deserializeUser(async (id, done) => {
  try {
    const pool = await sql.connect(dbConfig);

    const request = pool.request();
    request.input('accountId', sql.Int, id);
    const result = await request.query(`SELECT * FROM Account WHERE AccountID = @accountId`);

    if (result.recordset && result.recordset.length > 0) {
      done(null, result.recordset[0]);
    } else {
      done(new Error('User not found'));
    }
  } catch (error) {
    done(error);
  }
});

// Google authentication route for customer
router.get('/google/customer', passport.authenticate('customer-google', { scope: ['profile', 'email'] }));

router.get(
  '/google/customer/callback',
  passport.authenticate('customer-google', { failureRedirect: '/login' }),
  (req, res) => {
    // If authentication is successful, redirect to the homepage with a success message
    res.send('Login successful!');
  }
);

module.exports = router;