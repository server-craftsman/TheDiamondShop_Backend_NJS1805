const express = require("express");
const router = express.Router();
const sql = require('mssql');
const config = require('../../config/dbconfig');
const verifyToken = require('../../dao/authentication/middleWare');
const{
    getWarranty,
    getWarrantybyReportNo,
    createWarranty,
    updateWarranty,
    getWarrantyByReportNoOrderDetails,
    viewWarrantyStatusProcessing,
    viewWarrantyStatusCompleted,
} = require("../../dao/warranty/warrantyDAO");
const { route } = require('../products/productsRoute');

//View Warranty
router.get("/view-warranty", async (req, res) => {
    getWarranty().then((result) => {
        res.json(result[0]);
    })
    .catch((error) => {
        console.error("Error fetching warranty: ", error);
        res.status(500).send("Error fetching warranty");
      });
});

//View Warranty By ReportNo
router.get('/view-warranty/:reportNo', async (req, res) => {
    const reportNo = req.params.reportNo;
    try {
        const warranty = await getWarrantybyReportNo(reportNo);
        if (warranty && warranty.length > 0) {
            res.json(warranty);
        } else {
            res.status(404).send('Warranty not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
//Create Warranty
router.post("/create-warranty", async (req, res) => {
    const {
        reportNo,
        description,
        date,
        placeToBuy,
        period,
        warrantyType,
        warrantyConditions,
        accompaniedService,
        condition,
        orderDetailId,
    } = req.body;

    try {
        await createWarranty({
            reportNo,
            description,
            date,
            placeToBuy,
            period,
            warrantyType,
            warrantyConditions,
            accompaniedService,
            condition,
            orderDetailId,
        });
        res.status(200).json({message: "Warranty added successfull"})
    } catch (err) {
        console.error("Error adding warranty:", err.message);
        res.status(500).send("Internal server error");
      }
})
//Update Warranty
router.put("/update-warranty", async (req, res) => {
    const warrantyData = req.body;
    if(!warrantyData.reportNo) {
        return res.status(400).send("ReportNo required");
    }
    try{
        const results = await updateWarranty(warrantyData);
        if (results.rowsAffected && results.rowsAffected[0] > 0) {
            res.status(200).json({ message: "Warranty updated successfully" });
          } else {
            res.status(404).json({ message: "Warranty not found" });
          }
        } catch (err) {
          console.error("Error updating warranty:", err.message);
          res.status(500).send("Internal server error");
        }
})
// View Warranty by ReportNo of OrderDetails
router.get('/view-warranty-orderdetails/:reportNo', verifyToken, async (req, res) => {
  const reportNo = req.params.reportNo;

  try {
      const warranty = await getWarrantyByReportNoOrderDetails(reportNo);
      if (warranty && warranty.length > 0) {
          res.json(warranty);
      } else {
          res.status(404).send('Warranty not found');
      }
  } catch (err) {
      console.error('Error fetching warranty:', err);
      res.status(500).send('Internal Server Error');
  }
});

// View Warranty by ReportNo of OrderDetails
// router.get('/view-warranty-orderdetails/:reportNo', verifyToken, async (req, res) => {
//     const reportNo = req.params.reportNo;

//     try {
//         const warranty = await getWarrantyByReportNoOrderDetails(reportNo);
//         if (warranty && warranty.length > 0) {
//             res.json(warranty);
//         } else {
//             res.status(404).send('Warranty not found');
//         }
//     } catch (err) {
//         console.error('Error fetching warranty:', err);
//         res.status(500).send('Internal Server Error');
//     }
// });

router.get('/view-details-warranty/:orderId', verifyToken, async (req, res) => {
  const { orderId } = req.params;

  try {
    const pool = await sql.connect(config);
    const query = `
      SELECT 
        a.FirstName, a.LastName, a.Email, a.PhoneNumber, 
        o.OrderID, o.OrderDate, o.Quantity,
        d.StockNumber, d.Clarity, d.Color,
        dr.RingStyle, dr.NameRings, dr.Category,
        br.NameBridal, br.BridalStyle, br.Category,
        t.NameTimepieces, t.TimepiecesStyle, t.Collection, od.AttachedAccessories, 
        od.Shipping, w.ReportNo, od.DeliveryAddress, 
        o.OrderStatus, o.TotalPrice, od.RequestWarranty, od.WarrantyStatus
      FROM Orders o 
      JOIN Account a ON o.AccountID = a.AccountID 
      JOIN OrderDetails od ON o.OrderID = od.OrderID 
      JOIN WarrantyReceipt w ON od.OrderDetailID = w.OrderDetailID
        LEFT JOIN
          Diamond d ON od.DiamondID = d.DiamondID
        LEFT JOIN
          DiamondRings dr ON od.DiamondRingsID = dr.DiamondRingsID
        LEFT JOIN
          Bridal br ON od.BridalID = br.BridalID
        LEFT JOIN
          DiamondTimepieces t ON od.DiamondTimepiecesID = t.DiamondTimepiecesID
      WHERE o.OrderID = @OrderId
    `;
    const result = await pool.request()
      .input('OrderId', sql.Int, orderId)
      .query(query);

    if (result.recordsets.length > 0) {
      res.status(200).json({
        status: true,
        message: 'Warranty Details found',
        warrantyDetail: result.recordset,
      });
    } else {
      res.status(200).json({
        status: false,
        message: 'No history orders found. Buy something luxurious to fill it up.',
      });
    }
  } catch (error) {
    console.error('Error fetching history orders:', error.message);
    res.status(500).json({ status: false, message: 'An error occurred', error: error.message });
  }
});

//Update Warranty Status Null => Processing
router.put('/update-warrantystatus', verifyToken, async(req, res) => {
  const { orderId, warrantyStatus } = req.body;
  const validStatuses = ["Processing"];
  if (!orderId || !warrantyStatus) {
    return res
      .status(400)
      .json({ message: "orderId and warrantyStatus are required" });
  }

  if (!validStatuses.includes(warrantyStatus)) {
    return res
      .status(400)
      .send({
        message:
          "Warranty Status must be Processing",
      });
  }
  try {
    const pool = await sql.connect(config);
    const result = await pool
    .request()
    .input("OrderId", sql.Int, orderId)
    .input("WarrantyStatus", sql.VarChar, warrantyStatus)
    .query("UPDATE OrderDetails SET WarrantyStatus = @WarrantyStatus WHERE OrderID = @OrderId")
    if (result.rowsAffected[0] > 0) {
      res
        .status(200)
        .json({ message: "Warranty Status updated successfully" });
    } else {
      res.status(404).json({ message: "OrderId not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//Update Warranty Status Processing => Completed
router.put('/update-warrantystatus-Completed', verifyToken, async(req, res) => {
  const { orderId, warrantyStatus } = req.body;
  const validStatuses = ["Completed"];
  if (!orderId || !warrantyStatus) {
    return res
      .status(400)
      .json({ message: "orderId and warrantyStatus are required" });
  }

  if (!validStatuses.includes(warrantyStatus)) {
    return res
      .status(400)
      .send({
        message:
          "Warranty Status must be Processing",
      });
  }
  try {
    const pool = await sql.connect(config);
    const result = await pool
    .request()
    .input("OrderId", sql.Int, orderId)
    .input("WarrantyStatus", sql.VarChar, warrantyStatus)
    .query("UPDATE OrderDetails SET WarrantyStatus = @WarrantyStatus WHERE OrderID = @OrderId")
    if (result.rowsAffected[0] > 0) {
      res
        .status(200)
        .json({ message: "Warranty Status updated successfully" });
    } else {
      res.status(404).json({ message: "OrderId not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//View Warranty Status ("Processing")
router.get('/view-warrantystatus-processing', verifyToken, async(req, res) => {
  try {
    const results = await viewWarrantyStatusProcessing();
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

//View Warranty Status ("Completed")
router.get('/view-warrantystatus-completed', verifyToken, async(req, res) => {
  try {
    const results = await viewWarrantyStatusCompleted();
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

module.exports = router;