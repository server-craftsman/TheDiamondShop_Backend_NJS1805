const sql = require("mssql");
const config = require("../../config/dbconfig");

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

// Function to check inventory for a given product
async function checkInventory(productID, tableName, transaction) {
  try {
    const request = new sql.Request(transaction);

    // Ensure productID is valid and convert it to integer
    const parsedProductID = parseInt(productID, 10);
    if (isNaN(parsedProductID) || parsedProductID <= 0) {
      throw new Error(`Invalid productID: ${productID}`);
    }

    const query = `
      SELECT Inventory FROM ${tableName} WHERE ${tableName}ID = @productID;
    `;

    const result = await request
      .input("productID", sql.Int, parsedProductID)
      .query(query);

    if (result.recordset.length === 0) {
      throw new Error(
        `Product with ID ${parsedProductID} not found in ${tableName}.`
      );
    }

    const inventory = result.recordset[0].Inventory;

    if (inventory <= 0) {
      throw new Error(
        `Out of stock. Cannot create order for ${tableName} with ID ${parsedProductID}.`
      );
    }
  } catch (error) {
    throw new Error(`Error checking inventory: ${error.message}`);
  }
}

// Function to update inventory after creating an order
async function updateInventory(orderData, transaction) {
  try {
    const request = new sql.Request(transaction);

    const productUpdates = [
      { idField: "DiamondID", tableName: "Diamond" },
      { idField: "BridalID", tableName: "Bridal" },
      { idField: "DiamondTimepiecesID", tableName: "DiamondTimepieces" },
      { idField: "DiamondRingsID", tableName: "DiamondRings" },
    ];

    for (const productUpdate of productUpdates) {
      const productIDs = orderData[productUpdate.idField];
      if (productIDs && productIDs.length > 0) {
        for (const productID of productIDs) {
          const paramName = `${productUpdate.idField}_${productID}`; // Create unique parameter name
          const updateQuery = `
              UPDATE ${productUpdate.tableName}
              SET Inventory = Inventory - 1
              WHERE ${productUpdate.tableName}ID = @${paramName};
            `;

          await request
            .input(paramName, sql.Int, productID) // Use unique parameter name
            .query(updateQuery);
        }
      }
    }
  } catch (error) {
    throw new Error(`Error updating inventory: ${error.message}`);
  }
}

// Function to apply a voucher to an order
async function applyVoucher(voucherID, totalPrice, orderID, transaction) {
  try {
    const request = new sql.Request(transaction);

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
      VALUES (@OrderID, @VoucherID1);
    `;
    await request
      .input("OrderID", sql.Int, orderID)
      .input("VoucherID1", sql.Int, voucherID)
      .query(applyVoucherQuery);

    // Update the Voucher table for usage and total quantities
    const updateVoucherQuery = `
      UPDATE Voucher
      SET UsagedQuantity = UsagedQuantity + 1,
          TotalQuantity = TotalQuantity - 1
      WHERE VoucherID = @VoucherID2 AND TotalQuantity > 0;
    `;
    await request
      .input("VoucherID2", sql.Int, voucherID)
      .query(updateVoucherQuery);
  } catch (error) {
    throw new Error(`Error applying voucher: ${error.message}`);
  }
}

// Function to save transaction details for an order
async function saveTransaction(
  orderID,
  totalPrice,
  paymentMethod,
  transaction
) {
  try {
    const request = new sql.Request(transaction);

    const transactionQuery = `
      INSERT INTO Transactions (OrderID, PaymentDate, PaymentAmount, Method)
      VALUES (@OrderID, @PaymentDate, @PaymentAmount, @Method);
    `;

    await request
      .input("OrderID", sql.Int, orderID)
      .input("PaymentDate", sql.DateTime, new Date())
      .input("PaymentAmount", sql.Decimal(10, 2), totalPrice)
      .input("Method", sql.VarChar(50), paymentMethod)
      .query(transactionQuery);
  } catch (error) {
    throw new Error(`Error saving transaction: ${error.message}`);
  }
}

async function createOrder(orderData, accountID) {
  let pool;
  let transaction;

  try {
    if (
      !orderData ||
      (!Array.isArray(orderData.BridalID) &&
        !Array.isArray(orderData.DiamondRingsID) && !Array.isArray(orderData.DiamondID) && !Array.isArray(orderData.DiamondTimepiecesID))
    ) {
      throw new Error(
        "Order data is invalid. At least one of BridalID or DiamondRingsID or DiamondID or DiamondTimepiecesID must be an array."
      );
    }

    pool = await connectToDatabase();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const orderQuery = `
        INSERT INTO Orders (AccountID, OrderDate, Quantity, OrderStatus, TotalPrice)
        OUTPUT inserted.OrderID
        VALUES (@AccountID, @OrderDate, @Quantity, @OrderStatus, @TotalPrice);
      `;

    const requestOrder = new sql.Request(transaction);

    requestOrder.input("AccountID", sql.Int, accountID);
    requestOrder.input("OrderDate", sql.DateTime, new Date());
    requestOrder.input("Quantity", sql.Int, orderData.Quantity || 1);
    requestOrder.input("OrderStatus", sql.VarChar(50), "Pending");
    requestOrder.input(
      "TotalPrice",
      sql.Decimal(10, 2),
      orderData.TotalPrice || 0
    );

    const orderResult = await requestOrder.query(orderQuery);
    const orderID = orderResult.recordset[0].OrderID;

    async function insertOrderDetails(productIDs, idField, productType) {
      for (let i = 0; i < productIDs.length; i++) {
        const productID = productIDs[i];
        const size = sizes[i] || null;
        const material = materials[i] || null;

        const orderDetailsQuery = `
            INSERT INTO OrderDetails (OrderID, DeliveryAddress, ${idField}, AttachedAccessories, Shipping, OrderStatus, MaterialID, RingSizeID)
            OUTPUT inserted.OrderDetailID
            VALUES (@OrderID, @DeliveryAddress, @ProductID, @AttachedAccessories, @Shipping, @OrderStatus, @MaterialID, @RingSizeID);
          `;
        const requestDetails = new sql.Request(transaction);

        requestDetails.input("OrderID", sql.Int, orderID);
        requestDetails.input(
          "DeliveryAddress",
          sql.NVarChar(100),
          orderData.DeliveryAddress || ""
        );
        requestDetails.input("ProductID", sql.Int, productID);
        requestDetails.input(
          "AttachedAccessories",
          sql.VarChar(100),
          orderData.AttachedAccessories || "Box, Certificate"
        );
        requestDetails.input(
          "Shipping",
          sql.VarChar(100),
          orderData.Shipping || "Standard"
        );
        requestDetails.input("OrderStatus", sql.VarChar(50), "Pending");
        requestDetails.input(
          "MaterialID",
          sql.Int,
          material
        );
        requestDetails.input(
          "RingSizeID",
          sql.Int,
          size
        );

        const orderDetailsResult = await requestDetails.query(
          orderDetailsQuery
        );
        const orderDetailID = orderDetailsResult.recordset[0].OrderDetailID;

        await generateWarrantyReceipt(
          orderDetailID,
          productID,
          `
  Luxurious Warranty for ${productType} (${productID})
  -----------------------------------------------------
  Coverage: 10 years starting from ${new Date().getFullYear()}-06-01
  Full Protection: Includes any manufacturing defects
  Complimentary Services: Annual inspections at no additional cost
  Guarantee: Pristine condition or your money back
  Provider: NHA VAN HOA SINH VIEN
  Warranty Type: Full Warranty
  `,
          new Date(),
          "NHA VAN HOA SINH VIEN",
          new Date(new Date().getFullYear() + 10, 5, 1),
          "Full Warranty",
          "No scratches or damages",
          "Free annual inspection",
          "Brand New",
          transaction
        );
      }
      await checkInventory(productIDs, productType, transaction);
    }

    if (orderData.BridalID && orderData.BridalID.length > 0) {
      await insertOrderDetails(orderData.BridalID, "BridalID", "Bridal",
        orderData.BridalsSizes,
          orderData.BridalsMaterials
      );
    }

    if (orderData.DiamondRingsID && orderData.DiamondRingsID.length > 0) {
      await insertOrderDetails(
        orderData.DiamondRingsID,
        "DiamondRingsID",
        "DiamondRings",
        orderData.DiamondRingSizes,
          orderData.DiamondRingsMaterials
      );
    }

    if (orderData.DiamondID && orderData.DiamondID.length > 0) {
        await insertOrderDetails(
          orderData.DiamondID,
          "DiamondID",
          "Diamond"
        );
      }

      if (orderData.DiamondTimepiecesID && orderData.DiamondTimepiecesID.length > 0) {
        await insertOrderDetails(
          orderData.DiamondTimepiecesID,
          "DiamondTimepiecesID",
          "DiamondTimepieces"
        );
      }
  

    await updateInventory(orderData, transaction);

    if (orderData.VoucherID) {
      await applyVoucher(
        orderData.VoucherID,
        orderData.TotalPrice,
        orderID,
        transaction
      );
    }

    await saveTransaction(
      orderID,
      orderData.TotalPrice,
      orderData.PaymentMethod,
      transaction
    );

    await transaction.commit();

    return { success: true, orderID };
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError.message);
      }
    }
    throw new Error(`Error creating order: ${error.message}`);
  } finally {
    if (pool) {
      try {
        await disconnectFromDatabase();
      } catch (disconnectError) {
        console.error(
          "Error disconnecting from database:",
          disconnectError.message
        );
      }
    }
  }
}

async function generateWarrantyReceipt(
  orderDetailID,
  productID,
  warrantyDescriptionsTemplate,
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
    function generateReportNo() {
      const randomNumber = Math.floor(Math.random() * 10000000);
      const formattedNumber = randomNumber.toString().padStart(7, "0");
      return `WR${formattedNumber}`;
    }

    const newReportNo = generateReportNo();

    const warrantyDescriptions = `
  Warranty for Product (${productID})
  | Coverage: 10 years starting from ${new Date().getFullYear()}-06-01
  | Full Protection: Includes any manufacturing defects
  | Complimentary Services: Annual inspections at no additional cost
  | Guarantee: Pristine condition or your money back
  | Provider: NHA VAN HOA SINH VIEN
  | Warranty Type: Full Warranty
  `;

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

module.exports = {
  createOrder,
};
