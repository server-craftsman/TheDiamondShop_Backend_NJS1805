const express = require("express");
const router = express.Router();
const{
    getWarranty,
    getWarrantybyReportNo,
    createWarranty,
    updateWarranty,
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
module.exports = router;