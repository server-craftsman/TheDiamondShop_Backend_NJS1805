const sql = require("mssql");
const config = require("../../config/dbconfig");

async function createOrder(orderData) {
  let OrderID;

  try {
    const pool = await sql.connect(config);
    const {
      RoleID,
      AccountID,
      OrderDate,
      Quantity,
      OrderStatus,
      voucherID,
      DiamondID,
      BridalID,
      DiamondRingsID,
      DiamondTimepiecesID,
      AttachedAccessories,
      Shipping,
      DeliveryAddress,
    } = orderData;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      let productPrice = 0;

      if (DiamondID) {
        const productResult = await transaction
          .request()
          .input("DiamondID", sql.Int, DiamondID)
          .query("SELECT Price FROM Diamond WHERE DiamondID = @DiamondID");
        productPrice = productResult.recordset[0].Price;
      } else if (BridalID) {
        const productResult = await transaction
          .request()
          .input("BridalID", sql.Int, BridalID)
          .query("SELECT Price FROM Bridal WHERE BridalID = @BridalID");
        productPrice = productResult.recordset[0].Price;
      } else if (DiamondRingsID) {
        const productResult = await transaction
          .request()
          .input("DiamondRingsID", sql.Int, DiamondRingsID)
          .query(
            "SELECT Price FROM DiamondRings WHERE DiamondRingsID = @DiamondRingsID"
          );
        productPrice = productResult.recordset[0].Price;
      } else if (DiamondTimepiecesID) {
        const productResult = await transaction
          .request()
          .input("DiamondTimepiecesID", sql.Int, DiamondTimepiecesID)
          .query(
            "SELECT Price FROM DiamondTimepieces WHERE DiamondTimepiecesID = @DiamondTimepiecesID"
          );
        productPrice = productResult.recordset[0].Price;
      }

      // Calculate total price before discount
      let totalPrice = productPrice * Quantity;

      // Applying discount from voucher if available
      let discount = 0;
      if (voucherID) {
        const voucherResult = await transaction
          .request()
          .input("VoucherID", sql.Int, voucherID)
          .query(
            "SELECT * FROM Voucher WHERE VoucherID = @VoucherID AND UsagedQuantity < TotalQuantity"
          );

        if (voucherResult.recordset.length === 0) {
          throw new Error("Invalid or expired voucher");
        }

        const voucher = voucherResult.recordset[0];
        if (voucher.Prerequisites && totalPrice < voucher.Prerequisites) {
          throw new Error("Order total does not meet voucher prerequisites");
        }

        discount = voucher.Discount;

        // Update UsagedQuantity and TotalQuantity in Voucher table
        await transaction
          .request()
          .input("VoucherID", sql.Int, voucherID)
          .query(
            "UPDATE Voucher SET UsagedQuantity = UsagedQuantity + 1, TotalQuantity = TotalQuantity - 1 WHERE VoucherID = @VoucherID"
          );

        // Recalculate total price after applying discount
        if (discount > 0) {
          totalPrice -= (totalPrice * discount) / 100;
        }
      }

      // Insert order into Orders table and get OrderID
      const orderResult = await transaction
        .request()
        .input("AccountID", sql.Int, AccountID)
        .input("OrderDate", sql.Date, OrderDate)
        .input("Quantity", sql.Int, Quantity)
        .input("OrderStatus", sql.VarChar, OrderStatus)
        .input("TotalPrice", sql.Decimal(10, 2), totalPrice)
        .query(
          "INSERT INTO Orders (AccountID, OrderDate, Quantity, OrderStatus, TotalPrice) OUTPUT INSERTED.OrderID VALUES (@AccountID, @OrderDate, @Quantity, @OrderStatus, @TotalPrice)"
        );

      OrderID = orderResult.recordset[0].OrderID;

      // Insert into VoucherListInOrder table if voucherID is provided
      if (voucherID) {
        await transaction
          .request()
          .input("OrderID", sql.Int, OrderID)
          .input("VoucherID", sql.Int, voucherID)
          .query(
            "INSERT INTO VoucherListInOrder (OrderID, VoucherID) VALUES (@OrderID, @VoucherID)"
          );
      }

      // Insert order details into OrderDetails table
      const orderDetailsResult = await transaction
        .request()
        .input("OrderID", sql.Int, OrderID)
        .input("DiamondID", sql.Int, DiamondID || null)
        .input("BridalID", sql.Int, BridalID || null)
        .input("DiamondRingsID", sql.Int, DiamondRingsID || null)
        .input("DiamondTimepiecesID", sql.Int, DiamondTimepiecesID || null)
        .input("AttachedAccessories", sql.VarChar, AttachedAccessories || null)
        .input("Shipping", sql.VarChar, Shipping || null)
        .input("OrderStatus", sql.VarChar, OrderStatus)
        .input("ReportNo", sql.VarChar, "")
        .input("DeliveryAddress", sql.NVarChar, DeliveryAddress || null)
        .query(
          "INSERT INTO OrderDetails (OrderID, DiamondID, BridalID, DiamondRingsID, DiamondTimepiecesID, AttachedAccessories, Shipping, OrderStatus, ReportNo, DeliveryAddress) VALUES (@OrderID, @DiamondID, @BridalID, @DiamondRingsID, @DiamondTimepiecesID, @AttachedAccessories, @Shipping, @OrderStatus, @ReportNo, @DeliveryAddress); SELECT SCOPE_IDENTITY() AS OrderDetailID;"
        );

      const OrderDetailID = orderDetailsResult.recordset[0].OrderDetailID;

      // Generate a report number for warranty receipt
      const reportNo = generateReportNo();

      // Insert warranty receipt into WarrantyReceipt table
      const warrantyReceiptResult = await transaction
        .request()
        .input("ReportNo", sql.VarChar, reportNo)
        .input(
          "Descriptions",
          sql.VarChar,
          "Warranty for the purchased product"
        )
        .input("Date", sql.Date, new Date())
        .input("PlaceToBuy", sql.VarChar, "Online Store")
        .input(
          "Period",
          sql.Date,
          new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        )
        .input("WarrantyType", sql.VarChar, "Standard")
        .input(
          "WarrantyConditions",
          sql.VarChar,
          "Covers manufacturing defects"
        )
        .input("AccompaniedService", sql.VarChar, "Free repair")
        .input("Condition", sql.VarChar, "Brand New")
        .input("OrderDetailID", sql.Int, OrderDetailID)
        .query(
          "INSERT INTO WarrantyReceipt (ReportNo, Descriptions, Date, PlaceToBuy, Period, WarrantyType, WarrantyConditions, AccompaniedService, Condition, OrderDetailID) VALUES (@ReportNo, @Descriptions, @Date, @PlaceToBuy, @Period, @WarrantyType, @WarrantyConditions, @AccompaniedService, @Condition, @OrderDetailID)"
        );

      // Update ReportNo in OrderDetails table
      await transaction
        .request()
        .input("ReportNo", sql.VarChar, reportNo)
        .input("OrderDetailID", sql.Int, OrderDetailID)
        .query(
          "UPDATE OrderDetails SET ReportNo = @ReportNo WHERE OrderDetailID = @OrderDetailID"
        );

      // Calculate BonusPoints based on TotalPrice
      const bonusPointsEarned = Math.floor(totalPrice / 100); // Example calculation, adjust as per your business logic

      // Update Roles table to add BonusPoints and determine Rank
      const updateRoleQuery = `
DECLARE @NewBonusPoints INT;
DECLARE @TotalPoints INT;
DECLARE @NewRank VARCHAR(50);

SET @NewBonusPoints = @BonusPointsEarned;

SELECT @TotalPoints = BonusPoints + @NewBonusPoints FROM Roles WHERE RoleID = @RoleID;

IF @TotalPoints >= 10000
  SET @NewRank = 'Supreme Advisor';
ELSE IF @TotalPoints >= 5000
  SET @NewRank = 'Emerald';
ELSE IF @TotalPoints >= 3000
  SET @NewRank = 'Platinum';
ELSE IF @TotalPoints >= 1000
  SET @NewRank = 'Gold';
ELSE IF @TotalPoints >= 500
  SET @NewRank = 'Silver';
ELSE
  SET @NewRank = 'Bronze';

UPDATE Roles 
SET BonusPoints = BonusPoints + @NewBonusPoints,
    Rank = @NewRank
WHERE RoleID = @RoleID;
`;

      await transaction
        .request()
        .input("RoleID", sql.Int, RoleID)
        .input("BonusPointsEarned", sql.Int, bonusPointsEarned)
        .query(updateRoleQuery);

      // Call function to update inventory after successful order
      await updateInventoryAfterOrder({
        DiamondID,
        BridalID,
        DiamondRingsID,
        DiamondTimepiecesID,
        Quantity,
      });

      // Retrieve certificates associated with the order
      const certificatesQuery = `
      SELECT C.*
      FROM Certificate C
      LEFT JOIN OrderDetails OD ON OD.DiamondID = C.DiamondID
      WHERE OD.OrderDetailID = @OrderDetailID;
      `;

      const certificatesResult = await transaction
        .request()
        .input("OrderDetailID", sql.Int, OrderDetailID)
        .query(certificatesQuery);

      const certificates = certificatesResult.recordset;

      // Commit the transaction
      await transaction.commit();

      return { OrderID, certificates };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

async function updateInventoryAfterOrder({
  DiamondID,
  BridalID,
  DiamondRingsID,
  DiamondTimepiecesID,
  Quantity,
}) {
  try {
    const pool = await sql.connect(config);

    if (DiamondID) {
      await pool
        .request()
        .input("DiamondID", sql.Int, DiamondID)
        .input("Quantity", sql.Int, Quantity)
        .query(
          `UPDATE Diamond SET Quantity = Quantity - @Quantity WHERE DiamondID = @DiamondID`
        );
    } else if (BridalID) {
      await pool
        .request()
        .input("BridalID", sql.Int, BridalID)
        .input("Quantity", sql.Int, Quantity)
        .query(
          `UPDATE Bridal SET Quantity = Quantity - @Quantity WHERE BridalID = @BridalID`
        );
    } else if (DiamondRingsID) {
      await pool
        .request()
        .input("DiamondRingsID", sql.Int, DiamondRingsID)
        .input("Quantity", sql.Int, Quantity)
        .query(
          `UPDATE DiamondRings SET Quantity = Quantity - @Quantity WHERE DiamondRingsID = @DiamondRingsID`
        );
    } else if (DiamondTimepiecesID) {
      await pool
        .request()
        .input("DiamondTimepiecesID", sql.Int, DiamondTimepiecesID)
        .input("Quantity", sql.Int, Quantity)
        .query(
          `UPDATE DiamondTimepieces SET Quantity = Quantity - @Quantity WHERE DiamondTimepiecesID = @DiamondTimepiecesID`
        );
    }

    await sql.close();
  } catch (error) {
    throw error;
  }
}

function generateReportNo() {
  // Implement your logic to generate a unique report number
  // Example: return a concatenated string based on date/time or a random alphanumeric string
  return "WR-" + Date.now();
}

module.exports = {
  createOrder,
};
