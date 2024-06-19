//npm install mysql
//npm install dotenv - module này để quản lí biến môi trường
//npm install jsonwebtoken
//npm install express body-parser cors jsonwebtoken dotenv mssql
//npm install express-session
//npm install express express-session body-parser
//npm install googleapis nodemailer
//npm install ejs
//npm install express-flash express-session
//npm install passport-google-oauth20

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sql = require("mssql");
const dbConfig = require("./config/dbconfig");
const session = require("express-session");
const flash = require("express-flash");
//import Route
const authRoute = require("./routes/authentication/authRoute");
const forgotPassword = require("./routes/userFeatures/view/email/forgotPassword");
const manageProduct = require("./routes/products/productsRoute");
const userFeatures = require("./routes/userFeatures/userFeaturesRoute");
const voucherRoute = require("./routes/voucher/voucherRoute");
const eventRouter = require("./routes/event/eventRouter");
const certificateRouter = require("./routes/certificate/certificateRouter");
//---order danger---
const orderRoute = require("./routes/orders/ordersRoute");
//------------------
//-------//
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json()); //

app.use(
  session({
    secret: "huyit",
    resave: false,
    saveUninitialized: true,
  })
);

const corsOptions = {
  origin: "*", // Cho phép tất cả nguồn Front-end
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
const router = express.Router();

router.use((request, response, next) => {
  // Logger Middleware
  console.log("Request received at:", new Date().toLocaleString());
  next();
});

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
    app.use("/features", userFeatures);
    app.use("/products", manageProduct);
    app.use("/orders", orderRoute);
    app.use(flash());
    app.use("/", voucherRoute);
    app.use("/events", eventRouter);
    app.use("/certificate", certificateRouter);

    const port = process.env.PORT || 8090; // set default port if PORT environment variable is not defined
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
