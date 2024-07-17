const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const flash = require("express-flash");
require("dotenv").config();
const sql = require("mssql");
const dbConfig = require("../../config/dbconfig");
const JWT_SECRET = process.env.JWT_SECRET;
const userDao = require("../../dao/authentication/userDAO");
const verifyToken = require("../../dao/authentication/middleWare");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const {
  viewWarrantyRequestManager,
  viewWarrantyRequestSale,
} = require("../../dao/authentication/authenticationDAO");
const {
  viewAccount,
  viewAccoundByEmail,
} = require("../../dao/authentication/userDAO");

const register = require("../../dao/authentication/testRegister");
let pool = null;
const config = require("../../config/dbconfig");
async function connectDB() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
    }
  } catch (err) {
    console.error("Error connecting to database:", err.message);
    throw err;
  }
}
// Generate and save token
router.post("/generate-token", async (req, res) => {
  const { accountId } = req.body;

  try {
    const user = await userDao.getUserById(accountId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ id: user.AccountID }, JWT_SECRET, {
      expiresIn: "1h",
    });
    await userDao.saveToken(user.AccountID, token);

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
});

// router.post('/verify-token', verifyToken, (req, res) => {

//   const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header

//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized: No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     // decoded now contains the decoded JWT payload
//     // res.status(200).json(decoded);
//     res.status(200).json(req.user); // Send back decoded user data or appropriate response
//   } catch (error) {
//     console.error('Error verifying token:', error.message);
//     res.status(401).json({ message: 'Unauthorized: Invalid token' });
//   }
// });

router.post("/verify-token", verifyToken, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the token
    // Typically, you would save some data associated with the token, such as user information
    const { userId, username } = decoded; // Extract user ID and other relevant data from decoded token

    // Example: Store user ID in session or database
    // Replace this with your own logic to store session or user data
    req.session.userId = userId;

    res
      .status(200)
      .json({ message: "Token verified successfully", user: decoded });
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const users = await userDao.getUserByEmailAndPassword(email, password);

    if (users.length === 0) {
      return res.status(401).send("Invalid email or password");
    }

    const user = users[0];

    if (user.Status === "Deactivate") {
      return res
        .status(403)
        .send(
          "Account is deactivated. Please contact Administrator for support."
        );
    }

    const token = jwt.sign(
      { accountId: user.AccountID, roleName: user.RoleName },
      JWT_SECRET,
      { expiresIn: "10h" }
    );

    await userDao.saveToken(user.AccountID, token);

    res.json({
      message: `Hello, ${user.RoleName}!`,
      token,
      roleName: user.RoleName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// Logout route
router.post("/logout", async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({ message: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await userDao.clearToken(decoded.accountId);
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// Register route
// router.post('/register', async (req, res) => {
//   const {
//     firstName,
//     lastName,
//     gender,
//     birthday,
//     password,
//     email,
//     phoneNumber,
//     address,
//     country,
//     city,
//     province,
//     postalCode,
//   } = req.body;

//   if (!firstName || !lastName || !email || !password) {
//     return res.status(400).send('First name, last name, email, and password are required');
//   }

//   try {
//     await userDao.registerUser({
//       firstName,
//       lastName,
//       gender,
//       birthday,
//       password,
//       email,
//       phoneNumber,
//       address,
//       country,
//       city,
//       province,
//       postalCode,
//     });

//     const user = await userDao.getUserByEmailAndPassword(email, password);
//     if (user.length === 0) {
//       return res.status(404).json({ message: 'User not found after registration' });
//     }

//     const newUser = user[0];
//     const token = jwt.sign(
//       { accountId: newUser.AccountID, roleName: newUser.RoleName },
//       JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     await userDao.saveToken(newUser.AccountID, token);

//     res.status(201).json({ message: 'User registered successfully', token });
//   } catch (err) {
//     console.error('Registration error:', err.message);
//     if (err.message === 'Email already exists') {
//       return res.status(409).send('Email already exists');
//     }
//     if (err.message === 'Password must be at least 8 characters long') {
//       return res.status(400).send('Password must be at least 8 characters long');
//     }
//     res.status(500).send('Internal server error');
//   }
// });

// test Debug
// POST /register endpoint for guest registration
// POST route to register a guest
router.post("/register", async (req, res) => {
  const guestData = req.body;

  console.log(
    `Request received at: POST /auth/register - ${new Date().toLocaleString()}`
  );

  //   try {
  //     const token = await register.insertNewRoleAndGuestAccount(guestData);
  //     res.status(200).json({ token });
  //   } catch (err) {
  //     console.error('Failed to register guest:', err);
  //     if (err.message === 'Email already exists.') {
  //       // Respond with a 400 status code if the email already exists
  //       res.status(400).json({ error: 'Email already exists.' });
  //     } else {
  //       // Respond with a 500 status code for other errors
  //       res.status(500).json({ error: 'Failed to register guest' });
  //     }
  //   }
  // });
  try {
    await connectDB();

    // Start a transaction
    let transaction = await new sql.Transaction(pool);
    await transaction.begin();

    // Check if the email already exists in Account table
    let checkEmailQuery = `
      SELECT COUNT(*) AS CountEmail
      FROM Account
      WHERE Email = @Email
    `;
    let emailCheckResult = await transaction
      .request()
      .input("Email", sql.VarChar(100), guestData.Email)
      .query(checkEmailQuery);

    if (emailCheckResult.recordset[0].CountEmail > 0) {
      await transaction.rollback();
      console.error("Email already exists.");
      return res.status(400).json({ error: "Email already exists." });
    }

    // If email is unique, proceed to insert new role and guest account
    try {
      const token = await register.insertNewRoleAndGuestAccount(transaction, guestData);
      await transaction.commit();
      res.status(200).json({ token });
    } catch (err) {
      await transaction.rollback();
      console.error("Failed to register guest:", err);
      res.status(500).json({ error: "Failed to register guest" });
    }
  } catch (err) {
    console.error("Failed to register guest:", err);
    res.status(500).json({ error: "Failed to register guest" });
  }
});

// Create Account route
router.post("/createAccount", async (req, res) => {
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
    roleName,
    transportation,
  } = req.body;

  if (!firstName || !lastName || !email || !password || !roleName) {
    return res
      .status(400)
      .send(
        "First name, last name, email, password, role name, and transportation are required"
      );
  }

  try {
    await createUser(
      {
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
      },
      {
        roleName,
        transportation,
      }
    );

    const user = await userDAO.getUserByEmailAndPassword(email, password);
    if (user.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found after registration" });
    }

    const newUser = user[0];
    const token = jwt.sign(
      { accountId: newUser.AccountID, roleName: newUser.RoleName },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    await userDAO.saveToken(newUser.AccountID, token);

    res.status(201).json({ message: "User registered successfully", token });
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


//view by OrderId
// GET history-order route
router.get("/history-order", verifyToken, async (req, res) => {
  const { accountId } = req.user;

  try {
    const pool = await sql.connect(dbConfig);
    const query = `
    SELECT DISTINCT
    a.FirstName, a.LastName, a.Email, a.PhoneNumber, 
    o.OrderID, o.OrderDate, o.Quantity,
    o.OrderStatus, o.TotalPrice 
  FROM Orders o 
  JOIN Account a ON o.AccountID = a.AccountID 
  WHERE a.AccountID = @AccountId
    `;
    const result = await pool
      .request()
      .input("AccountId", sql.Int, accountId)
      .query(query);

    if (result.recordset.length > 0) {
      res.status(200).json({
        status: true,
        message: "History orders found",
        historyOrder: result.recordset,
      });
    } else {
      res.status(200).json({
        status: false,
        message:
          "No history orders found. Buy something luxurious to fill it up.",
      });
    }
  } catch (error) {
    console.error("Error fetching history orders:", error.message);
    res
      .status(500)
      .json({
        status: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});

// Route to fetch history orders by OrderID
router.get("/history-order/:orderId", verifyToken, async (req, res) => {
  const { accountId } = req.user;
  const { orderId } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    const query = `
      SELECT 
        o.OrderID, o.OrderDate, o.Quantity, o.OrderStatus, o.TotalPrice,
        od.OrderDetailID, od.FirstName, od.LastName, od.PhoneNumber, od.AttachedAccessories, 
        od.Shipping, od.DeliveryAddress, od.RequestWarranty,
        d.DiamondID, d.StockNumber, d.CaratWeight, d.DiamondOrigin, d.Color, d.Clarity, d.Cut, d.Price, d.Shape, d.Image as DiamondImage,
        b.BridalID, b.BridalStyle, b.NameBridal, b.Category as BridalCategory, b.BrandName as BridalBrand, b.Material as BridalMaterial, b.SettingType, b.Gender as BridalGender, b.Weight as BridalWeight, b.CenterDiamond, b.DiamondCaratRange, b.RingSizeRang, b.TotalCaratWeight, b.TotalDiamond, b.Description as BridalDescription, b.Price as BridalPrice, b.ImageBridal, b.ImageBrand as BridalBrandImage,
        dr.DiamondRingsID, dr.RingStyle, dr.NameRings, dr.Category as RingsCategory, dr.BrandName as RingsBrand, dr.Material as RingsMaterial, dr.CenterGemstone, dr.CenterGemstoneShape, dr.Width, dr.CenterDiamondDimension, dr.Weight as RingsWeight, dr.GemstoneWeight, dr.CenterDiamondColor, dr.CenterDiamondClarity, dr.CenterDiamondCaratWeight, dr.RingSize, dr.Gender as RingsGender, dr.Fluorescence, dr.Description as RingsDescription, dr.Price as RingsPrice, dr.ImageRings, dr.ImageBrand as RingsBrandImage,
        dt.DiamondTimepiecesID, dt.TimepiecesStyle, dt.NameTimepieces, dt.Collection as TimepiecesCollection, dt.WaterResistance, dt.CrystalType, dt.BraceletMaterial, dt.CaseSize, dt.DialColor, dt.Movement, dt.Gender as TimepiecesGender, dt.Category as TimepiecesCategory, dt.BrandName as TimepiecesBrand, dt.DialType, dt.Description as TimepiecesDescription, dt.Price as TimepiecesPrice, dt.ImageTimepieces, dt.ImageBrand as TimepiecesBrandImage,
        w.*, rm.MaterialName, lrs.RingSize
      FROM Orders o
      JOIN Account a ON o.AccountID = a.AccountID 
      JOIN OrderDetails od ON o.OrderID = od.OrderID 
      LEFT JOIN RingsMaterial rm ON od.MaterialID = rm.MaterialID
      LEFT JOIN ListRingsSize lrs ON od.RingSizeID = lrs.RingSizeID
      LEFT JOIN Diamond d ON od.DiamondID = d.DiamondID
      LEFT JOIN Bridal b ON od.BridalID = b.BridalID
      LEFT JOIN DiamondRings dr ON od.DiamondRingsID = dr.DiamondRingsID
      LEFT JOIN DiamondTimepieces dt ON od.DiamondTimepiecesID = dt.DiamondTimepiecesID
      LEFT JOIN WarrantyReceipt w ON od.OrderDetailID = w.OrderDetailID
      WHERE o.OrderID = @OrderId AND a.AccountID = @AccountId
    `;

    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("AccountId", sql.Int, accountId)
      .query(query);

    if (result.recordset.length > 0) {
      const order = {
        OrderID: result.recordset[0].OrderID,
        OrderDate: result.recordset[0].OrderDate,
        Quantity: result.recordset[0].Quantity,
        OrderStatus: result.recordset[0].OrderStatus,
        TotalPrice: result.recordset[0].TotalPrice,
        OrderDetails: result.recordset.map(detail => ({
          OrderDetailID: detail.OrderDetailID,
          FirstName: detail.FirstName,
          LastName: detail.LastName,
          PhoneNumber: detail.PhoneNumber,
          AttachedAccessories: detail.AttachedAccessories,
          Shipping: detail.Shipping,
          DeliveryAddress: detail.DeliveryAddress,
          RequestWarranty: detail.RequestWarranty,
          Product: {
            Diamond: detail.DiamondID ? {
              DiamondID: detail.DiamondID,
              StockNumber: detail.StockNumber,
              CaratWeight: detail.CaratWeight,
              DiamondOrigin: detail.DiamondOrigin,
              Color: detail.Color,
              Clarity: detail.Clarity,
              Cut: detail.Cut,
              Price: detail.Price,
              Shape: detail.Shape,
              Image: detail.DiamondImage
            } : null,
            Bridal: detail.BridalID ? {
              BridalID: detail.BridalID,
              BridalStyle: detail.BridalStyle,
              NameBridal: detail.NameBridal,
              Category: detail.BridalCategory,
              BrandName: detail.BridalBrand,

              MaterialName: detail.MaterialName,
              RingSize: detail.RingSize,

              SettingType: detail.SettingType,
              Gender: detail.BridalGender,
              Weight: detail.BridalWeight,
              CenterDiamond: detail.CenterDiamond,
              DiamondCaratRange: detail.DiamondCaratRange,
              TotalCaratWeight: detail.TotalCaratWeight,
              TotalDiamond: detail.TotalDiamond,
              Description: detail.BridalDescription,
              Price: detail.BridalPrice,
              ImageBridal: detail.ImageBridal,
              ImageBrand: detail.BridalBrandImage
            } : null,
            DiamondRings: detail.DiamondRingsID ? {
              DiamondRingsID: detail.DiamondRingsID,
              RingStyle: detail.RingStyle,
              NameRings: detail.NameRings,
              Category: detail.RingsCategory,
              BrandName: detail.RingsBrand,

              MaterialName: detail.MaterialName,
              RingSize: detail.RingSize,

              CenterGemstone: detail.CenterGemstone,
              CenterGemstoneShape: detail.CenterGemstoneShape,
              Width: detail.Width,
              CenterDiamondDimension: detail.CenterDiamondDimension,
              Weight: detail.RingsWeight,
              GemstoneWeight: detail.GemstoneWeight,
              CenterDiamondColor: detail.CenterDiamondColor,
              CenterDiamondClarity: detail.CenterDiamondClarity,
              CenterDiamondCaratWeight: detail.CenterDiamondCaratWeight,
              Gender: detail.RingsGender,
              Fluorescence: detail.Fluorescence,
              Description: detail.RingsDescription,
              Price: detail.RingsPrice,
              ImageRings: detail.ImageRings,
              ImageBrand: detail.RingsBrandImage
            } : null,
            DiamondTimepieces: detail.DiamondTimepiecesID ? {
              DiamondTimepiecesID: detail.DiamondTimepiecesID,
              TimepiecesStyle: detail.TimepiecesStyle,
              NameTimepieces: detail.NameTimepieces,
              Collection: detail.TimepiecesCollection,
              WaterResistance: detail.WaterResistance,
              CrystalType: detail.CrystalType,
              BraceletMaterial: detail.BraceletMaterial,
              CaseSize: detail.CaseSize,
              DialColor: detail.DialColor,
              Movement: detail.Movement,
              Gender: detail.TimepiecesGender,
              Category: detail.TimepiecesCategory,
              BrandName: detail.TimepiecesBrand,
              DialType: detail.DialType,
              Description: detail.TimepiecesDescription,
              Price: detail.TimepiecesPrice,
              ImageTimepieces: detail.ImageTimepieces,
              ImageBrand: detail.TimepiecesBrandImage
            } : null
          },
          Warranty: {
            // Include warranty details if available
          },
          MaterialName: detail.MaterialName,
          RingSize: detail.RingSize
        }))
      };

      res.status(200).json({
        status: true,
        message: "Order details found",
        order
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});




router.put("/update-warranty", verifyToken, async (req, res) => {
  const { orderId } = req.body;
  const requestWarranty = "Request"; // Set RequestWarranty to 'Request'

  if (!orderId || !requestWarranty) {
    return res
      .status(400)
      .json({ message: "orderId and RequestWarranty are required" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("RequestWarranty", sql.VarChar, requestWarranty)
      .query(
        "UPDATE OrderDetails SET RequestWarranty = @RequestWarranty WHERE OrderID = @OrderId"
      );

    if (result.rowsAffected[0] > 0) {
      res
        .status(200)
        .json({ message: "Warranty request updated successfully" });
    } else {
      res.status(404).json({ message: "OrderId not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//View request Warranty ("Manger")
router.get("/view-warranty-manager", verifyToken, async (req, res) => {
  try {
    const results = await viewWarrantyRequestManager();
    if (results.length > 0) {
      res.status(200).json({
        status: true,
        message: "Warranty requests found",
        warrantyRequests: results[0],
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No warranty requests found.",
      });
    }
  } catch (error) {
    console.error("Error fetching warranty requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Update request warranty ("Manger")
router.put("/update-warranty-manager", verifyToken, async (req, res) => {
  const { orderId, requestWarranty } = req.body;
  const validStatuses = ["Assign", "Processing", "Approved", "Refused"];

  // Debug log to inspect the received value

  if (!orderId || !requestWarranty) {
    return res
      .status(400)
      .json({ message: "orderId and requestWarranty are required" });
  }

  if (!validStatuses.includes(requestWarranty)) {
    return res
      .status(400)
      .send({
        message:
          "Request Warranty must be Assign, Processing, Approved, or Refused",
      });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("RequestWarranty", sql.VarChar, requestWarranty)
      .query(
        "UPDATE OrderDetails SET RequestWarranty = @RequestWarranty WHERE OrderID = @OrderId"
      );

    if (result.rowsAffected[0] > 0) {
      res
        .status(200)
        .json({ message: "Warranty request updated successfully" });
    } else {
      res.status(404).json({ message: "OrderId not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//View request Warranty ("Sale")
router.get("/view-warranty-sale", verifyToken, async (req, res) => {
  try {
    const results = await viewWarrantyRequestSale();
    if (results.length > 0) {
      res.status(200).json({
        status: true,
        message: "Warranty requests found",
        warrantyRequests: results[0],
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No warranty requests found.",
      });
    }
  } catch (error) {
    console.error("Error fetching warranty requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Update request warranty ("Sale")
router.put("/update-warranty-sale", verifyToken, async (req, res) => {
  const { orderId, requestWarranty } = req.body;
  const validStatuses = ["Processing", "Approved", "Refused"];

  if (!orderId || !requestWarranty) {
    return res
      .status(400)
      .json({ message: "orderId and requestWarranty are required" });
  }

  if (!validStatuses.includes(requestWarranty)) {
    return res
      .status(400)
      .send({
        message:
          "Request Warranty must be Assign, Processing, Approved, or Refused",
      });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("RequestWarranty", sql.VarChar, requestWarranty)
      .query(
        "UPDATE OrderDetails SET RequestWarranty = @RequestWarranty WHERE OrderID = @OrderId"
      );

    if (result.rowsAffected[0] > 0) {
      res
        .status(200)
        .json({ message: "Warranty request updated successfully" });
    } else {
      res.status(404).json({ message: "OrderId not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
const bcrypt = require("bcrypt");
const saltRounds = 10;

passport.use(
  "customer-google",
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8090/auth/google/customer/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Connect to SQL Server
        const pool = await sql.connect(dbConfig);

        // Check if email is provided in the Google profile
        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;
        if (!email) {
          return done(new Error("Email not provided by Google profile"));
        }

        // Check if the email already exists in the Account table
        const emailCheckQuery = `SELECT * FROM Account WHERE Email = @Email`;
        const emailCheckResult = await pool
          .request()
          .input("Email", sql.NVarChar, email)
          .query(emailCheckQuery);

        if (
          emailCheckResult.recordset &&
          emailCheckResult.recordset.length > 0
        ) {
          // Email already exists, return existing user details
          return done(null, emailCheckResult.recordset[0]);
        }

        // Insert or update Role in Roles table
        let roleId = null;
        const insertRoleQuery = `INSERT INTO Roles (RoleName) VALUES ('Customer'); SELECT SCOPE_IDENTITY() AS RoleID;`;
        const insertRoleResult = await pool.request().query(insertRoleQuery);
        if (
          insertRoleResult.recordset &&
          insertRoleResult.recordset.length > 0
        ) {
          roleId = insertRoleResult.recordset[0].RoleID;
        } else {
          console.error(
            "Failed to retrieve RoleID from Roles table:",
            insertRoleResult
          );
          return done(new Error("Failed to retrieve RoleID from Roles table"));
        }

        // Generate a random password and hash it
        const randomPassword = Math.random().toString(36).slice(-8); // Generate a simple random password
        const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

        // Insert new customer with the retrieved RoleID and hashed password
        const insertAccountQuery = `INSERT INTO Account (FirstName, LastName, Email, Password, RoleID) 
                                    OUTPUT INSERTED.AccountID
                                    VALUES (@FirstName, @LastName, @Email, @Password, @RoleID)`;
        const insertAccountResult = await pool
          .request()
          .input("FirstName", sql.NVarChar, profile.name.givenName)
          .input("LastName", sql.NVarChar, profile.name.familyName)
          .input("Email", sql.NVarChar, email)
          .input("Password", sql.NVarChar, hashedPassword)
          .input("RoleID", sql.Int, roleId)
          .query(insertAccountQuery);

        if (
          insertAccountResult.recordset &&
          insertAccountResult.recordset.length > 0
        ) {
          // Return newly created customer
          return done(null, {
            AccountID: insertAccountResult.recordset[0].AccountID,
            FirstName: profile.name.givenName,
            LastName: profile.name.familyName,
            Email: email,
            RoleID: roleId,
          });
        } else {
          console.error("Invalid insertAccountResult:", insertAccountResult);
          return done(new Error("Failed to create new account"));
        }
      } catch (error) {
        console.error("Error during Google authentication:", error);
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
    request.input("accountId", sql.Int, id);
    const result = await request.query(
      `SELECT * FROM Account WHERE AccountID = @accountId`
    );

    if (result.recordset && result.recordset.length > 0) {
      done(null, result.recordset[0]);
    } else {
      done(new Error("User not found"));
    }
  } catch (error) {
    done(error);
  }
});

// Google authentication route for customer
router.get(
  "/google/customer",
  passport.authenticate("customer-google", { scope: ["profile", "email"] })
);

const frontendHomepageURL = "http://localhost:5173/";

router.get(
  "/google/customer/callback",
  passport.authenticate("customer-google", { failureRedirect: "/login" }),
  (req, res) => {
    // Redirect to the front-end homepage URL after successful authentication
    res.redirect(frontendHomepageURL);
  }
);

//View Account
router.get("/account", verifyToken, async (req, res) => {
  try {
    const result = await viewAccount();
    if (result.length > 0) {
      res.status(200).json({
        status: true,
        message: "Account details found",
        account: result[0],
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No account details found.",
      });
    }
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//View Account by Email
router.get("/account/:email", verifyToken, async (req, res) => {
  const email = req.params.email;

  try {
    const result = await viewAccoundByEmail(email);
    if (result.length > 0) {
      res.status(200).json({
        status: true,
        message: "Account details found",
        account: result[0],
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No account details found.",
      });
    }
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
