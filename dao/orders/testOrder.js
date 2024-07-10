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

    // Check inventory for each product type
    if (orderData.DiamondID) {
      await checkInventory("DiamondID", orderData.DiamondID, "Diamond", request);
    }
    if (orderData.BridalID) {
      await checkInventory("BridalID", orderData.BridalID, "Bridal", request);
    }
    if (orderData.DiamondTimepiecesID) {
      await checkInventory("DiamondTimepiecesID", orderData.DiamondTimepiecesID, "DiamondTimepieces", request);
    }
    if (orderData.DiamondRingsID) {
      await checkInventory("DiamondRingsID", orderData.DiamondRingsID, "DiamondRings", request);
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
      VALUES (@OrderID, @DeliveryAddress, @DiamondID2, @BridalID2, @DiamondRingsID2, @DiamondTimepiecesID2, @AttachedAccessories, @Shipping, @OrderStatus2);

      SELECT SCOPE_IDENTITY() AS OrderDetailID;
    `;

    const orderDetailsResult = await request
      .input("OrderID", sql.Int, orderID)
      .input("DeliveryAddress", sql.NVarChar(100), orderData.DeliveryAddress || "")
      .input("DiamondID2", sql.Int, orderData.DiamondID || null)
      .input("BridalID2", sql.Int, orderData.BridalID || null)
      .input("DiamondRingsID2", sql.Int, orderData.DiamondRingsID || null)
      .input("DiamondTimepiecesID2", sql.Int, orderData.DiamondTimepiecesID || null)
      .input("AttachedAccessories", sql.VarChar(100), "Box, Certificate")
      .input("Shipping", sql.VarChar(100), orderData.Shipping || "Standard")
      .input("OrderStatus2", sql.VarChar(50), "Pending")
      .query(orderDetailsQuery);

    const orderDetailID = orderDetailsResult.recordset[0].OrderDetailID;

    const warrantyDescriptions = `Warranty for ${orderData.ProductType} (${orderData.ProductID}) Date ${new Date().getFullYear()}-06-01 (+10 years valid from warranty) Full Warranty No scratches or damages Free annual inspection Brand New`;

    await generateWarrantyReceipt(
      orderDetailID,
      warrantyDescriptions,
      new Date(),
      "Nha van hoa sinh vien",
      new Date(new Date().getFullYear() + 10, 5, 1),
      "Normal Warranty",
      "Default Warranty Conditions",
      "Default Accompanied Service",
      "Default Condition",
      transaction
    );

    if (orderData.VoucherID) {
      await applyVoucher(orderData.VoucherID, totalPrice, orderID, transaction);
    }

    await saveTransaction(orderID, totalPrice, orderData.PaymentMethod, transaction);

    // Update inventory for each ordered product type
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
    SELECT Inventory FROM ${tableName} WHERE ${idField} = @ProductID_${idField};
  `;

  const result = await request
    .input(`ProductID_${idField}`, sql.Int, productID)
    .query(query);

  if (result.recordset.length === 0) {
    throw new Error(`Product with ID ${productID} not found in ${tableName}.`);
  }

  const inventory = result.recordset[0].Inventory;

  if (inventory <= 0) {
    throw new Error(`Out of stock. Cannot create order for ${tableName} with ${idField} ${productID}.`);
  }
}

async function updateInventory(orderData, transaction) {
  try {
    const request = new sql.Request(transaction);

    const productUpdates = [
      { idField: "DiamondID", productID: orderData.DiamondID, tableName: "Diamond" },
      { idField: "BridalID", productID: orderData.BridalID, tableName: "Bridal" },
      { idField: "DiamondTimepiecesID", productID: orderData.DiamondTimepiecesID, tableName: "DiamondTimepieces" },
      { idField: "DiamondRingsID", productID: orderData.DiamondRingsID, tableName: "DiamondRings" }
    ];

    for (const product of productUpdates) {
      if (product.productID) {
        const updateQuery = `
          UPDATE ${product.tableName}
          SET Inventory = Inventory - 1
          WHERE ${product.idField} = @${product.idField}2;
        `;

        await request
          .input(`${product.idField}2`, sql.Int, product.productID)
          .query(updateQuery);
      }
    }
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
 * Generates a warranty receipt for a specific order detail.
 * @param {number} orderDetailID - The ID of the order detail to generate the warranty receipt for.
 * @param {string} warrantyDescriptions - The descriptions of the warranty.
 * @param {Date} warrantyDate - The date of the warranty.
 * @param {string} warrantyProvider - The provider of the warranty.
 * @param {Date} warrantyExpiry - The expiry date of the warranty.
 * @param {string} warrantyType - The type of the warranty.
 * @param {string} warrantyConditions - The conditions of the warranty.
 * @param {string} accompaniedService - The accompanied service of the warranty.
 * @param {string} condition - The condition of the warranty.
 * @param {Object} transaction - The SQL transaction object.
 */
async function generateWarrantyReceipt(
    orderDetailID,
    warrantyDescriptions,
    warrantyDate,
    warrantyProvider,
    warrantyExpiry,
    warrantyType,
    warrantyConditions,
    accompaniedService,
    condition,
    transaction
  ) {
    try {
      const request = new sql.Request(transaction);
  
      // Generate the new ReportNo
      const reportNoQuery = `
        SELECT MAX(CAST(SUBSTRING(ReportNo, 4, LEN(ReportNo) - 3) AS BIGINT)) AS LastNumber
        FROM WarrantyReceipt;
      `;
  
      const result = await request.query(reportNoQuery);
      const lastNumber = result.recordset[0].LastNumber || 0;
      const newReportNo = `WR0${lastNumber + 1}`;
  
      const warrantyReceiptQuery = `
        INSERT INTO WarrantyReceipt (OrderDetailID, Descriptions, Date, PlaceToBuy, Period, WarrantyType, WarrantyConditions, AccompaniedService, Condition, ReportNo)
        VALUES (@OrderDetailID, @Descriptions, @Date, @PlaceToBuy, @Period, @WarrantyType, @WarrantyConditions, @AccompaniedService, @Condition, @ReportNo);
      `;
  
      await request
        .input("OrderDetailID", sql.Int, orderDetailID)
        .input("Descriptions", sql.NVarChar(sql.MAX), warrantyDescriptions)
        .input("Date", sql.Date, warrantyDate)
        .input("PlaceToBuy", sql.NVarChar(255), warrantyProvider)
        .input("Period", sql.Date, warrantyExpiry)
        .input("WarrantyType", sql.NVarChar(255), warrantyType)
        .input("WarrantyConditions", sql.NVarChar(sql.MAX), warrantyConditions)
        .input("AccompaniedService", sql.NVarChar(sql.MAX), accompaniedService)
        .input("Condition", sql.NVarChar(sql.MAX), condition)
        .input("ReportNo", sql.NVarChar(50), newReportNo)
        .query(warrantyReceiptQuery);
    } catch (error) {
      throw new Error(`Error generating warranty receipt: ${error.message}`);
    }
  }
  
  

/**
 * Saves a transaction for a specific order.
 * @param {number} orderID - The ID of the order to save the transaction for.
 * @param {number} totalPrice - The total price of the order.
 * @param {string} paymentMethod - The payment method used for the order.
 * @param {Object} transaction - The SQL transaction object.
 */
async function saveTransaction(orderID, totalPrice, paymentMethod, transaction) {
  try {
    const request = new sql.Request(transaction);

    const transactionQuery = `
      INSERT INTO Transactions (OrderID, PaymentDate, PaymentAmount, Method)
      VALUES (@OrderID, @PaymentDate, @PaymentAmount, @Method);
    `;

    await request
      .input("OrderID", sql.Int, orderID)
      .input("PaymentDate", sql.Date, new Date())
      .input("PaymentAmount", sql.Decimal(10, 2), totalPrice)
      .input("Method", sql.VarChar(50), paymentMethod)
      .query(transactionQuery);
  } catch (error) {
    throw new Error(`Error saving transaction: ${error.message}`);
  }
}

module.exports = {
  createOrder,
};
