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
 */
async function createOrder(orderData, accountIDFromToken) {
  let pool;
  let transaction;

  try {
    if (!orderData) {
      throw new Error("Order data is required.");
    }

    pool = await connectToDatabase();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    // Kiểm tra và ném lỗi nếu lượng tồn kho bằng 0
    switch (orderData.ProductType) {
      case "Diamond":
        await checkInventory(
          "DiamondID",
          orderData.DiamondID,
          "Diamond",
          request
        );
        break;
      case "Bridal":
        await checkInventory("BridalID", orderData.BridalID, "Bridal", request);
        break;
      case "DiamondTimepieces":
        await checkInventory(
          "DiamondTimepiecesID",
          orderData.DiamondTimepiecesID,
          "DiamondTimepieces",
          request
        );
        break;
      case "DiamondRings":
        await checkInventory(
          "DiamondRingsID",
          orderData.DiamondRingsID,
          "DiamondRings",
          request
        );
        break;
      default:
        throw new Error("Invalid product type specified.");
    }

    const orderDate = new Date();
    const totalQuantity = orderData.Quantity || 1;
    const totalPrice = orderData.TotalPrice || 0;

    const orderQuery = `
      INSERT INTO Orders (AccountID, OrderDate, Quantity, OrderStatus, TotalPrice)
      VALUES (@AccountID, @OrderDate, @Quantity, @OrderStatus, @TotalPrice);

      SELECT SCOPE_IDENTITY() AS OrderID;
    `;

    const orderResult = await request
      .input("AccountID", sql.Int, accountIDFromToken)
      .input("OrderDate", sql.Date, orderDate)
      .input("Quantity", sql.Int, totalQuantity)
      .input("OrderStatus", sql.VarChar(50), "Pending")
      .input("TotalPrice", sql.Decimal(10, 2), totalPrice)
      .query(orderQuery);

    const orderID = orderResult.recordset[0].OrderID;

    const orderDetailsQuery = `
      INSERT INTO OrderDetails (OrderID, DeliveryAddress, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID, AttachedAccessories, Shipping, OrderStatus)
      VALUES (@OrderID, @DeliveryAddress, @DiamondID, @BridalID, @DiamondRingsID, @DiamondTimepiecesID, @AttachedAccessories, @Shipping, @OrderStatusID1);

      SELECT SCOPE_IDENTITY() AS OrderDetailID;
    `;

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
      .input("OrderStatusID1", sql.VarChar(50), "Pending")
      .query(orderDetailsQuery);

    const orderDetailID = orderDetailsResult.recordset[0].OrderDetailID;

    const warrantyDescriptions = `Warranty for ${orderData.ProductType} (${
      orderData.ProductID
    }) Date ${new Date().getFullYear()}-06-01 (+10 years valid from warranty) Full Warranty No scratches or damages Free annual inspection Brand New`;

    await generateWarrantyReceipt(
      orderDetailID,
      warrantyDescriptions,
      new Date(),
      "Random Diamond Store",
      new Date(new Date().getFullYear() + 10, 5, 1),
      "Default Warranty Type",
      "Default Warranty Conditions",
      "Default Accompanied Service",
      "Default Condition",
      transaction
    );

    if (orderData.VoucherID) {
      await applyVoucher(orderData.VoucherID, totalPrice, orderID, transaction);
    }

    await saveTransaction(
      orderID,
      totalPrice,
      orderData.PaymentMethod,
      transaction
    );

    // Cập nhật lượng tồn kho dựa trên sản phẩm đã đặt hàng
    await updateInventory(orderData, transaction);

    await transaction.commit();

    return {
      success: true,
      message: "Order created successfully",
      orderID: orderID,
      productType: orderData.ProductType,
      productID: orderData.ProductID,
      diamondId: orderData.DiamondID,
      bridalId: orderData.BridalID,
      diamondRingsId: orderData.DiamondRingsID,
      diamondTimepiecesId: orderData.DiamondTimepiecesID,
      // attachedAccessories: orderData.AttachedAccessories,
      // shipping: orderData.Shipping,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw new Error(`Error creating order: ${error.message}`);
  } finally {
    if (pool) {
      await disconnectFromDatabase();
    }
  }
}

async function checkInventory(idField, productID, tableName, request) {
  const query = `
    SELECT Inventory FROM ${tableName} WHERE ${idField} = @ProductID;
  `;

  const result = await request
    .input("ProductID", sql.Int, productID)
    .query(query);

  if (result.recordset.length === 0) {
    throw new Error(`Product with ID ${productID} not found in ${tableName}.`);
  }

  const inventory = result.recordset[0].Inventory;

  if (inventory <= 0) {
    throw new Error(
      `Out of stock. Cannot create order for ${tableName} with ${idField} ${productID}.`
    );
  }
}

async function updateInventory(orderData, transaction) {
  try {
    const request = new sql.Request(transaction);
    const productType = orderData.ProductType;
    const quantity = orderData.Quantity;

    let updateQuery = "";
    let productIDField = "";
    let productIDValue = null;

    switch (productType) {
      case "Diamond":
        updateQuery = `
          UPDATE Diamond
          SET Inventory = Inventory - @Quantity
          WHERE DiamondID = @ProductID;
        `;
        productIDField = "DiamondID";
        productIDValue = orderData.DiamondID;
        break;
      case "Bridal":
        updateQuery = `
          UPDATE Bridal
          SET Inventory = Inventory - @Quantity
          WHERE BridalID = @ProductID;
        `;
        productIDField = "BridalID";
        productIDValue = orderData.BridalID;
        break;
      case "DiamondTimepieces":
        updateQuery = `
          UPDATE DiamondTimepieces
          SET Inventory = Inventory - @Quantity
          WHERE DiamondTimepiecesID = @ProductID;
        `;
        productIDField = "DiamondTimepiecesID";
        productIDValue = orderData.DiamondTimepiecesID;
        break;
      case "DiamondRings":
        updateQuery = `
          UPDATE DiamondRings
          SET Inventory = Inventory - @Quantity
          WHERE DiamondRingsID = @ProductID;
        `;
        productIDField = "DiamondRingsID";
        productIDValue = orderData.DiamondRingsID;
        break;
      default:
        throw new Error("Invalid product type.");
    }

    console.log(`Executing query to update inventory: ${updateQuery}`);

    const result = await request
      .input("ProductID", sql.Int, productIDValue)
      .input("Quantity", sql.Int, quantity)
      .query(updateQuery);

    console.log(`Update result: ${JSON.stringify(result)}`);
  } catch (error) {
    throw new Error(`Error updating inventory: ${error.message}`);
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
    const request = transaction.request();

    // Retrieve voucher details
    const voucherQuery = `
      SELECT * FROM Voucher WHERE VoucherID = @VoucherID;
    `;
    const voucherResult = await request
      .input("VoucherID", sql.Int, voucherID)
      .query(voucherQuery);

    if (!voucherResult.recordset.length) {
      throw new Error("Voucher not found");
    }

    const voucherDetails = voucherResult.recordset[0];
    const discountAmount =
      (voucherDetails.DiscountPercentage / 100) * totalPrice;

    // Apply voucher to the order
    const applyVoucherQuery = `
      INSERT INTO VoucherListInOrder (OrderID, VoucherID)
      VALUES (@OrderID, @VoucherID);
    `;
    await request
      .input("OrderID", sql.Int, orderID)
      .input("VoucherID2", sql.Int, voucherID) // Renamed to ensure uniqueness
      .query(applyVoucherQuery);

    // Update the Voucher table for usage and total quantities
    const updateVoucherQuery = `
      UPDATE Voucher
      SET UsagedQuantity = UsagedQuantity + 1,
          TotalQuantity = TotalQuantity - 1
      WHERE VoucherID = @VoucherID3 AND TotalQuantity > 0;
    `;
    await request
      .input("VoucherID3", sql.Int, voucherID) // Renamed to ensure uniqueness
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

    // Insert into WarrantyReceipt table
    const insertWarrantyReceiptQuery = `
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
      .query(insertWarrantyReceiptQuery);

    // Update OrderDetails table with ReportNo
    const updateOrderDetailsQuery = `
      UPDATE OrderDetails
      SET ReportNo = @ReportNo
      WHERE OrderDetailID = @OrderDetailID;
    `;

    await request
      .input("ReportNoID1", sql.VarChar(20), reportNo)
      .input("OrderDetailID2", sql.Int, orderDetailID)
      .query(updateOrderDetailsQuery);
  } catch (error) {
    throw new Error(`Error generating warranty receipt: ${error.message}`);
  }
}

// Generate a unique report number
function generateReportNo() {
  return `WR-${Date.now()}`;
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
