const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sql = require("mssql");
const dbConfig = require("./config/dbconfig");
const session = require("express-session");
const flash = require("express-flash");
const cookieParser = require("cookie-parser");
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const passport = require('passport');
// Import Routes
const authRoute = require("./routes/authentication/authRoute");
const forgotPassword = require("./routes/userFeatures/view/email/forgotPassword");
const manageProduct = require("./routes/products/productsRoute");
const userFeatures = require("./routes/userFeatures/userFeaturesRoute");
const voucherRoute = require("./routes/voucher/voucherRoute");
const eventRouter = require("./routes/event/eventRouter");
const certificateRouter = require("./routes/certificate/certificateRouter");
const warrantyRoute = require("./routes/warranty/warrantyRoute");
const paypalRouter = require("./routes/authentication/paypalRoute");
const manageAccount = require("./routes/userFeatures/testManageAccountRoute");

//---order danger---
const orderTest = require("./routes/orders/orderTest");
//------------------
//------------ admin ---------
const adminRoute = require("./routes/admin-dashboard/adminRoute");
//----------------
//----------- verify register ----------
const verifyEmail = require("./routes/verify-gmail/sendEmail");
const activeAccount = require("./routes/verify-gmail/verifyRoute");
const loginGoogle = require("./routes/authentication/loginGoogle");
// Create an Express app
const app = express();

// Middleware
app.use(bodyParser.json({ limit: '1024mb' })); // Increase payload size limit to 50MB
app.use(bodyParser.urlencoded({ limit: '1024mb', extended: true })); // Increase URL-encoded payload size limit to 50MB
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
app.use(cookieParser());
app.use(flash());

// Session configuration
app.use(
  session({
    secret: "huyit", // Change this to a secure secret
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      maxAge: 3600000, // Cookie lifespan in milliseconds (1 hour in this case)
    },
    })
);
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173", // Update with your actual frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
  credentials: true, // Allow cookies to be sent with the request
  optionsSuccessStatus: 200, // Legacy browser compatibility
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log(
    `Request received at: ${req.method} ${
      req.path
    } - ${new Date().toLocaleString()}`
  );
  next();
});

//printer
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

//

// Function to create a unique styled message
function createStyledMessage(text, colorCode) {
  const borderSymbol = "⊱";
  const borderLength = text.length + 4;
  const border = `${borderSymbol}${"━".repeat(borderLength)}${borderSymbol}`;

  const paddedText = `${borderSymbol} ${text} ${" ".repeat(
    borderLength - text.length - 2
  )}${borderSymbol}`;

  return `\x1b[${colorCode}m${border}\n${paddedText}\n${border}\x1b[0m`;
}

sql
  .connect(dbConfig)
  .then(() => {
    console.log(createStyledMessage("Connected to SSMS 🚀", "36"));

    // Use Routes
    app.use("/auth", authRoute, forgotPassword);
    app.use("/features", userFeatures, manageAccount);
    app.use("/products", manageProduct);
    app.use("/orders", orderTest);
    app.use("/", voucherRoute, verifyEmail, activeAccount, loginGoogle);
    app.use("/events", eventRouter);
    app.use("/certificate", certificateRouter);
    app.use("/warranty", warrantyRoute);
    app.use("/paypal", paypalRouter);
    app.use("/admin", adminRoute);
    // app.use("/verify-email", sendEmail);
    const port = process.env.PORT || 8090; // Set default port if PORT environment variable is not defined
    app.listen(port, () => {
      console.log(
        createStyledMessage(
          `API is running at http://localhost:${port}/ 🌐`,
          "35"
        )
      );
    });
  })
  .catch((err) => {
    console.error(
      createStyledMessage(`Database connection failed: ${err.message} 💥`, "31")
    );
  });
