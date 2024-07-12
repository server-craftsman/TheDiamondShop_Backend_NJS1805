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
async function checkInventory(productID, tableName, request) {
  try {
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
          const updateQuery = `
                        UPDATE ${productUpdate.tableName}
                        SET Inventory = Inventory - 1
                        WHERE ${productUpdate.tableName}ID = @productID;
                    `;

          await request
            .input("productID", sql.Int, productID)
            .query(updateQuery);
        }
      }
    }
  } catch (error) {
    throw new Error(`Error updating inventory: ${error.message}`);
  }
}

// Function to generate a warranty receipt for an order detail
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

// Function to apply a voucher to an order
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
      .input("PaymentDate", sql.Date, new Date())
      .input("PaymentAmount", sql.Decimal(10, 2), totalPrice)
      .input("Method", sql.VarChar(50), paymentMethod)
      .query(transactionQuery);
  } catch (error) {
    throw new Error(`Error saving transaction: ${error.message}`);
  }
}

// // Function to create a new order in the database// Function to create a new order in the database
// async function createOrder(orderData, accountID, voucherID, paymentMethod) {
//   let pool;
//   let transaction;

//   try {
//     // Input validation
//     if (
//       !orderData ||
//       !orderData.BridalID ||
//       !Array.isArray(orderData.BridalID)
//     ) {
//       throw new Error(
//         "Order data is invalid or BridalID is missing or not an array."
//       );
//     }

//     // Connect to the database
//     pool = await connectToDatabase();
//     transaction = new sql.Transaction(pool);
//     await transaction.begin();

//     const request = new sql.Request(transaction);

//     // Insert into Orders table
//     const orderQuery = `
//             INSERT INTO Orders (AccountID, OrderDate, Quantity, OrderStatus, TotalPrice)
//             VALUES (@AccountID, @OrderDate, @Quantity, @OrderStatus, @TotalPrice);

//             SELECT SCOPE_IDENTITY() AS OrderID;
//         `;

//     const orderResult = await request
//       .input("AccountID", sql.Int, accountID)
//       .input("OrderDate", sql.Date, new Date())
//       .input("Quantity", sql.Int, orderData.Quantity || 1)
//       .input("OrderStatus", sql.VarChar(50), "Pending")
//       .input("TotalPrice", sql.Decimal(10, 2), orderData.TotalPrice || 0)
//       .query(orderQuery);

//     const orderID = orderResult.recordset[0].OrderID;

//     // Check inventory and update for each product type
//     const productTypes = [
//       "Diamond",
//       "Bridal",
//       "DiamondTimepieces",
//       "DiamondRings",
//     ];
//     for (const productType of productTypes) {
//       if (orderData[productType + "ID"]) {
//         await checkInventory(
//           orderData[productType + "ID"],
//           productType,
//           request
//         );
//       }
//     }

//     // Insert into OrderDetails table for each product type
//     const orderDetailsQueries = [];
//     for (const productType of productTypes) {
//       if (orderData[productType + "ID"]) {
//         const productIDs = orderData[productType + "ID"];
//         if (Array.isArray(productIDs)) {
//           for (const productID of productIDs) {
//             orderDetailsQueries.push({
//               OrderID: orderID,
//               ProductTypeID: productType + "ID",
//               ProductID: productID,
//               DeliveryAddress: orderData.DeliveryAddress || "",
//               AttachedAccessories: orderData.AttachedAccessories || "",
//               Shipping: orderData.Shipping || "",
//               OrderStatus: "Pending",
//               MaterialID: orderData.MaterialID || null,
//               RingSizeID: orderData.RingSizeID || null,
//             });
//           }
//         } else {
//           orderDetailsQueries.push({
//             OrderID: orderID,
//             ProductTypeID: productType + "ID",
//             ProductID: productIDs,
//             DeliveryAddress: orderData.DeliveryAddress,
//             AttachedAccessories: orderData.AttachedAccessories || "",
//             Shipping: orderData.Shipping || "",
//             OrderStatus: "Pending",
//             MaterialID: orderData.MaterialID || null,
//             RingSizeID: orderData.RingSizeID || null,
//           });
//         }
//       }
//     }

//     // Execute all OrderDetails insert queries
// for (const query of orderDetailsQueries) {
//     const orderDetailsQuery = `
//         INSERT INTO OrderDetails (OrderID, ${query.ProductTypeID}, DeliveryAddress, AttachedAccessories, Shipping, OrderStatus, MaterialID, RingSizeID)
//         VALUES (@OrderID, @ProductID, @DeliveryAddress, @AttachedAccessories, @Shipping, @OrderStatus3, @MaterialID, @RingSizeID);
//     `;

//     await request
//         .input("OrderID", sql.Int, query.OrderID)
//         .input("ProductID", sql.Int, query.ProductID)
//         .input("DeliveryAddress", sql.NVarChar(sql.MAX), query.DeliveryAddress)
//         .input("AttachedAccessories", sql.NVarChar(sql.MAX), query.AttachedAccessories)
//         .input("Shipping", sql.NVarChar(sql.MAX), query.Shipping)
//         .input("OrderStatus3", sql.VarChar(50), query.OrderStatus)
//         .input("MaterialID", sql.Int, query.MaterialID)
//         .input("RingSizeID", sql.Int, query.RingSizeID)
//         .query(orderDetailsQuery);
// }


//     // Generate warranty receipt if applicable
//     if (orderData.HasWarranty) {
//       await generateWarrantyReceipt(
//         orderID,
//         orderData.WarrantyDescriptions,
//         orderData.WarrantyDate,
//         orderData.WarrantyProvider,
//         orderData.WarrantyExpiry,
//         orderData.WarrantyType,
//         orderData.WarrantyConditions,
//         orderData.AccompaniedService,
//         orderData.Condition,
//         transaction
//       );
//     }

//     // Apply voucher if provided
//     if (orderData.VoucherID) {
//       await applyVoucher(
//         orderData.VoucherID,
//         orderData.TotalPrice,
//         orderID,
//         transaction
//       );
//     }

//     // Save transaction details
//     await saveTransaction(
//       orderID,
//       orderData.TotalPrice,
//       orderData.PaymentMethod,
//       transaction
//     );

//     // Commit the transaction
//     await transaction.commit();

//     return orderID;
//   } catch (error) {
//     // Rollback the transaction on error
//     if (transaction) {
//       try {
//         await transaction.rollback();
//       } catch (rollbackError) {
//         console.error("Transaction rollback error:", rollbackError.message);
//       }
//     }
//     throw new Error(`Error creating order: ${error.message}`);
//   } finally {
//     // Close connection pool
//     if (pool) {
//       try {
//         await pool.close();
//       } catch (error) {
//         console.error("Error closing connection pool:", error.message);
//       }
//     }
//   }
// }

// Function to create a new order in the database
async function createOrder(orderData, accountID) {
    let pool;
    let transaction;
  
    
    try {
      // Input validation
      if (
        !orderData ||
        !orderData.BridalID ||
        !Array.isArray(orderData.BridalID)
      ) {
        throw new Error(
          "Order data is invalid or BridalID is missing or not an array."
        );
      }
  
      // Connect to the database
      pool = await connectToDatabase();
      transaction = new sql.Transaction(pool);
      await transaction.begin();
  
      const request = new sql.Request(transaction);
  
      // Insert into Orders table
      const orderQuery = `
        INSERT INTO Orders (AccountID, OrderDate, Quantity, OrderStatus, TotalPrice)
        OUTPUT inserted.OrderID
        VALUES (@AccountID, @OrderDate, @Quantity, @OrderStatus, @TotalPrice);
      `;
  
      const orderResult = await request
        .input("AccountID", sql.Int, accountID)
        .input("OrderDate", sql.DateTime, new Date())
        .input("Quantity", sql.Int, orderData.Quantity || 1)
        .input("OrderStatus", sql.VarChar(50), "Pending")
        .input("TotalPrice", sql.Decimal(10, 2), orderData.TotalPrice || 0)
        .query(orderQuery);
  
      const orderID = orderResult.recordset[0].OrderID;
  
      // Insert into OrderDetails table
      const orderDetailsQuery = `
        INSERT INTO OrderDetails (OrderID, BridalID, MaterialID, RingSizeID, DeliveryAddress, AttachedAccessories, Shipping, OrderStatus)
        VALUES (@OrderID, @BridalID, @MaterialID, @RingSizeID, @DeliveryAddress, @AttachedAccessories, @Shipping, @OrderStatus3);
      `;
  
      await request
        .input("OrderID", sql.Int, orderID)
        .input("BridalID", sql.Int, orderData.BridalID[0]) // Assuming the first BridalID from the array
        .input("MaterialID", sql.Int, orderData.MaterialID || null)
        .input("RingSizeID", sql.Int, orderData.RingSizeID || null)
        .input("DeliveryAddress", sql.NVarChar(sql.MAX), orderData.DeliveryAddress || "")
        .input("AttachedAccessories", sql.NVarChar(sql.MAX), orderData.AttachedAccessories || "")
        .input("Shipping", sql.NVarChar(sql.MAX), orderData.Shipping || "")
        .input("OrderStatus3", sql.VarChar(50), "Pending")
        .query(orderDetailsQuery);
  
      // Commit the transaction
      await transaction.commit();
  
      return orderID;
    } catch (error) {
      // Rollback the transaction on error
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error("Transaction rollback error:", rollbackError.message);
        }
      }
      throw new Error(`Error creating order: ${error.message}`);
    } finally {
      // Close connection pool
      if (pool) {
        try {
          await pool.close();
        } catch (error) {
          console.error("Error closing connection pool:", error.message);
        }
      }
    }
  }
  

module.exports = {
  createOrder,
  connectToDatabase,
  disconnectFromDatabase,
};
