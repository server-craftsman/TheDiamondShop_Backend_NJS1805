const config = require("../../config/dbconfig");
const sql = require("mssql");

// Function to establish SQL connection
async function connectToDatabase() {
  try {
    return await sql.connect(config);
  } catch (error) {
    throw new Error(`Error establishing database connection: ${error.message}`);
  }
}

// Function to close SQL connection
async function disconnectFromDatabase() {
  try {
    await sql.close();
    console.log("Disconnected from SQL database");
  } catch (error) {
    console.error("Error closing the SQL connection:", error.message);
  }
}

/**
 * Creates a new order in the database.
 * @param {Object} orderData - The data of the order to create.
 * @param {number} accountID - The ID of the account placing the order.
 * @returns {Promise<Object>} The ID of the newly created order and any associated certificates.
 */ async function createOrder(orderData, accountID) {
  let pool;
  let transaction;

  try {
    if (!orderData) {
      throw new Error("Order data is required.");
    }

    // Establish database connection
    pool = await connectToDatabase();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    // Default values and validations
    const orderDate = new Date();
    const orderStatus = "Pending";
    const totalQuantity = orderData.Quantity || 1;
    const totalPrice = orderData.TotalPrice || 0;

    // First query (orderQuery)
    const orderQuery = `
      INSERT INTO Orders (AccountID, OrderDate, Quantity, OrderStatus, TotalPrice)
      VALUES (@AccountID, @OrderDate, @Quantity, @OrderStatus1, @TotalPrice);

      SELECT SCOPE_IDENTITY() AS OrderID;
    `;

    // Execute orderQuery
    const orderResult = await request
      .input("AccountID", sql.Int, accountID)
      .input("OrderDate", sql.Date, orderDate)
      .input("Quantity", sql.Int, totalQuantity)
      .input("OrderStatus1", sql.VarChar(50), orderStatus) // Renamed to OrderStatus1
      .input("TotalPrice", sql.Decimal(10, 2), totalPrice)
      .query(orderQuery);

    // Extract OrderID from orderResult
    const orderID = orderResult.recordset[0].OrderID;

    // Second query (orderDetailsQuery)
    const orderDetailsQuery = `
      INSERT INTO OrderDetails (OrderID, DeliveryAddress, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID, AttachedAccessories, Shipping, OrderStatus)
      VALUES (@OrderID, @DeliveryAddress, @DiamondID, @BridalID, @DiamondRingsID, @DiamondTimepiecesID, @AttachedAccessories, @Shipping, @OrderStatus2);

      SELECT SCOPE_IDENTITY() AS OrderDetailID;
    `;

    // Execute orderDetailsQuery
    const orderDetailsResult = await request
      .input("OrderID", sql.Int, orderID)
      .input(
        "DeliveryAddress",
        sql.NVarChar(100),
        orderData.DeliveryAddress || ""
      )
      .input("DiamondID", sql.Int, orderData.DiamondID || null)
      .input("BridalID", sql.Int, orderData.BridalID || null)
      .input("DiamondRingsID", sql.Int, orderData.DiamondRingsID || null)
      .input(
        "DiamondTimepiecesID",
        sql.Int,
        orderData.DiamondTimepiecesID || null
      )
      .input("AttachedAccessories", sql.VarChar(100), "Box, Certificate")
      .input("Shipping", sql.VarChar(100), orderData.Shipping || "Standard")
      .input("OrderStatus2", sql.VarChar(50), orderStatus) // Renamed to OrderStatus2
      .query(orderDetailsQuery);

    // Extract OrderDetailID from orderDetailsResult
    const orderDetailID = orderDetailsResult.recordset[0].OrderDetailID;

    // Generate WarrantyReceipt
    const warrantyDescriptions = `Warranty for ${orderData.ProductType} (${
      orderData.ProductID
    }) Date ${new Date().getFullYear()}-06-01 (+10 years valid from warranty) Full Warranty No scratches or damages Free annual inspection Brand New`;

    await generateWarrantyReceipt(
      orderDetailID,
      warrantyDescriptions,
      new Date(), // Current date
      "Random Diamond Store", // Random store name
      new Date(new Date().getFullYear() + 10, 5, 1), // 10 years from current year, June 1st
      "Default Warranty Type", // Default warranty type
      "Default Warranty Conditions", // Default warranty conditions
      "Default Accompanied Service", // Default accompanied service
      "Default Condition", // Default condition
      transaction
    );

    // Apply voucher if applicable
    if (orderData.VoucherID) {
      await applyVoucher(orderData.VoucherID, totalPrice, orderID, transaction);
    }

    // Save transaction record
    await saveTransaction(
      orderID,
      totalPrice,
      orderData.PaymentMethod,
      transaction
    );

    await transaction.commit(); // Commit transaction on success

    // Return successful response with order and certificate details
    return {
      success: true,
      message: "Order created successfully",
      orderID: orderID,
      productType: orderData.ProductType,
      productID: orderData.ProductID,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback(); // Rollback transaction on error
    }
    throw new Error(`Error creating order: ${error.message}`);
  } finally {
    if (pool) {
      await disconnectFromDatabase();
    }
  }
}

/**
 * Applies a voucher to a specific order.
 * @param {number} voucherID - The ID of the voucher to apply.
 * @param {number} totalPrice - The total price of the order to which the voucher applies.
 * @param {number} orderID - The ID of the order to apply the voucher to.
 * @param {Object} transaction - The SQL transaction object.
 */
async function applyVoucher(voucherID, totalPrice, orderID, transaction) {
  try {
    const voucherDetails = await getVoucherDetails(voucherID);

    if (!voucherDetails) {
      throw new Error("Voucher not found");
    }

    const discountAmount =
      (voucherDetails.DiscountPercentage / 100) * totalPrice;

    const request = transaction.request();
    const applyVoucherQuery = `
      INSERT INTO VoucherListInOrder (OrderID, VoucherID)
      VALUES (@OrderID, @VoucherID);
    `;

    await request
      .input("OrderID", sql.Int, orderID)
      .input("VoucherID", sql.Int, voucherID)
      .query(applyVoucherQuery);

    // Update the Voucher table for usage and total quantities
    const updateVoucherQuery = `
      UPDATE Voucher
      SET UsagedQuantity = UsagedQuantity + 1,
          TotalQuantity = TotalQuantity - 1
      WHERE VoucherID = @VoucherID;
    `;

    await request
      .input("VoucherID", sql.Int, voucherID)
      .query(updateVoucherQuery);
  } catch (error) {
    throw new Error(`Error applying voucher: ${error.message}`);
  }
}

/**
 * Saves transaction details after an order is placed.
 * @param {number} orderID - The ID of the order.
 * @param {number} totalPrice - The total price of the order.
 * @param {string} paymentMethod - The payment method used.
 * @param {Object} transaction - The SQL transaction object.
 */
async function saveTransaction(
  orderID,
  totalPrice,
  paymentMethod,
  transaction
) {
  try {
    const request = transaction.request();

    const transactionQuery = `
      INSERT INTO Transactions (OrderID, PaymentAmount, Method, PaymentDate)
      VALUES (@OrderID, @PaymentAmount, @Method, GETDATE());
    `;

    await request
      .input("OrderID", sql.Int, orderID)
      .input("PaymentAmount", sql.Decimal(10, 2), totalPrice)
      .input("Method", sql.VarChar(50), paymentMethod)
      .query(transactionQuery);
  } catch (error) {
    throw new Error(`Error saving transaction: ${error.message}`);
  }
}

/**
 * Generates a warranty receipt for an order detail.
 * @param {number} orderDetailID - The ID of the order detail.
 * @param {string} descriptions - The descriptions for the warranty.
 * @param {Date} date - The date of the warranty.
 * @param {string} placeToBuy - The place of purchase for the warranty.
 * @param {Date} period - The period of the warranty.
 * @param {string} warrantyType - The type of warranty.
 * @param {string} warrantyConditions - The conditions of the warranty.
 * @param {string} accompaniedService - The accompanied service.
 * @param {string} condition - The condition of the warranty.
 * @param {Object} transaction - The SQL transaction object.
 */
async function generateWarrantyReceipt(
  orderDetailID,
  descriptions,
  date,
  placeToBuy,
  period,
  warrantyType,
  warrantyConditions,
  accompaniedService,
  condition,
  transaction
) {
  try {
    const request = transaction.request();

    const reportNo = generateReportNo(); // Generate a unique report number
    const insertQuery = `
      INSERT INTO WarrantyReceipt (ReportNo, Descriptions, Date, PlaceToBuy, Period, WarrantyType, WarrantyConditions, AccompaniedService, Condition, OrderDetailID)
      VALUES (@ReportNo, @Descriptions, @Date, @PlaceToBuy, @Period, @WarrantyType, @WarrantyConditions, @AccompaniedService, @Condition, @OrderDetailID);
    `;

    await request
      .input("ReportNo", sql.VarChar(20), reportNo)
      .input("Descriptions", sql.VarChar(255), descriptions)
      .input("Date", sql.Date, date)
      .input("PlaceToBuy", sql.VarChar(255), placeToBuy)
      .input("Period", sql.Date, period)
      .input("WarrantyType", sql.VarChar(150), warrantyType)
      .input("WarrantyConditions", sql.VarChar(255), warrantyConditions)
      .input("AccompaniedService", sql.VarChar(255), accompaniedService)
      .input("Condition", sql.VarChar(150), condition)
      .input("OrderDetailID", sql.Int, orderDetailID)
      .query(insertQuery);
  } catch (error) {
    throw new Error(`Error generating warranty receipt: ${error.message}`);
  }
}


// Generate a unique report number
function generateReportNo() {
  return `REPORT-${Date.now()}`;
}

/**
 * Retrieves voucher details from the database.
 * @param {number} voucherID - The ID of the voucher to retrieve.
 * @returns {Promise<Object>} The details of the voucher.
 */
async function getVoucherDetails(voucherID) {
  try {
    const pool = await connectToDatabase();
    const request = new sql.Request(pool);

    const query = `
      SELECT * FROM Voucher WHERE VoucherID = @VoucherID;
    `;

    const result = await request
      .input("VoucherID", sql.Int, voucherID)
      .query(query);

    return result.recordset[0];
  } catch (error) {
    throw new Error(`Error retrieving voucher details: ${error.message}`);
  } finally {
    await disconnectFromDatabase();
  }
}

module.exports = {
  createOrder,
};
