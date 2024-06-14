const express = require("express");
const router = express.Router();
const {
  getAllBrands,
  getAllBridals,
  getAllDiamonds,
  getAllDiamondRings,
  getAllTimePieces,
  getAllBanner,
  insertDiamond,
  updateDiamond,
  deleteDiamond,
} = require("../../dao/products/manageProducts");

// View Bridal
router.get("/bridals", async (req, response) => {
  getAllBridals()
    .then((result) => {
      response.json(result[0]);
    })
    .catch((error) => {
      console.error("Error fetching bridals: ", error);
      response.status(500).send("Error fetching bridals");
    });
});

// View diamonds
router.get("/diamonds", async (req, response) => {
  getAllDiamonds()
    .then((result) => {
      response.json(result[0]);
    })
    .catch((error) => {
      console.error("Error fetching diamonds: ", error);
      response.status(500).send("Error fetching diamonds");
    });
});

// View brands
router.get("/brands", async (req, res) => {
  try {
    const brands = await getAllBrands();
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// View timepieces
router.get("/timepieces", async (req, response) => {
    getAllTimePieces().then(result => {
        response.json(result[0]);
    }).catch(error => {
        console.error('Error fetching timepieces: ', error);
        response.status(500).send('Error fetching timepieces');
    });
});

// View Diamond Rings
router.get("/diamond-rings", async (req, response) => {
    getAllDiamondRings().then(result => {
        response.json(result[0]);
    }).catch(error => {
        console.error('Error fetching diamond rings: ', error);
        response.status(500).send('Error fetching diamond rings');
    });
});

//View Banner
router.get("/banner", async (req, response) => {
  getAllBanner().then(result =>{
    response.json(result[0]);
  }).catch(error => {
    console.error('Error fetching banners: ', error);
    response.status(500).send('Error fetching banners');
  });
});

//Add Diamond
router.post("/add-diamond", async (req, res) => {
  const {
    diamondOrigin,
    caratWeight,
    color,
    clarity,
    cut,
    price,
    shape,
    image,
    polish,
    symmetry,
    tablePercentage,
    depth,
    measurements,
    giaReportNumber,
    stockNumber,
    labReportNumber,
    gemstone,
    gradingReport,
    descriptors,
    fluorescence,
    inventory,
  } = req.body;

// Validate required fields
  if (!caratWeight || !price || !shape) {
    return res
      .status(400)
      .send("Diamond ID, Carat Weight, Price, and Shape are required");
  }

  try {
// Insert new diamond
    await insertDiamond({
      diamondOrigin,
      caratWeight,
      color,
      clarity,
      cut,
      price,
      shape,
      image,
      polish,
      symmetry,
      tablePercentage,
      depth,
      measurements,
      giaReportNumber,
      stockNumber,
      labReportNumber,
      gemstone,
      gradingReport,
      descriptors,
      fluorescence,
      inventory,
    });

    res.status(200).json({ message: "Diamond added successfully" });
  } catch (err) {
    console.error("Error adding diamond:", err.message);
    res.status(500).send("Internal server error");
  }
});

//Update Diamond
router.put("/edit-diamond", async (req, res) => {
  const diamondData = req.body;

  if (!diamondData.diamondId) {
    return res.status(400).send("Diamond ID required");
  }
  try {
    const results = await updateDiamond(diamondData);
    if(results.rowsAffected && results.rowsAffected[0] >0){
      res.status(200).json({ message: "Diamond updated successfully" });
    }else{
      res.status(404).json({ message: "Diamond not found" });
    }
  } catch (err) {
    console.error("Error updating diamond:", err.message);
    res.status(500).send("Internal server error");
  }
});

// Delete Diamond
router.delete("/delete-diamond", async (req, res) => {
   const dataSource = req.body;
  // Validate the diamondId
  if(!dataSource.diamondId){
    return res.status(400).send("Diamond ID required");
  }
  try {
    // Delete diamond
    const result = await deleteDiamond(dataSource);
    if (result.rowsAffected && result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Diamond deleted successfully' });
    } else {
      res.status(404).json({ error: 'Diamond not found or already deleted' });
    }
  } catch (error) {
    console.error('Error deleting diamond:', error.message);
    res.status(500).json({ error: 'Failed to delete diamond' });
  }
});

module.exports = router;
