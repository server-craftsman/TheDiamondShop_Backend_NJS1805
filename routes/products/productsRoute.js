const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getAllBrands,
  getAllBridals,
  getAllDiamonds,
  getAllDiamondRings,
  getAllTimePieces,
  getAllProduct,
  getAllBanner,
  insertDiamond,
  updateDiamond,
  deleteDiamond,
  insertDiamondRings,
  updateDiamondRings,
  deleteDiamondRings,
  insertBridals,
  updateBridals,
  deleteBridals,
  insertTimepieces,
  updateTimepieces,
  deleteTimepieces,
  getDiamondById,
  getBridalById,
  getRingsById,
  getTimepiecesById,
  getRingDetailByMaterialAndSize,
  getBridalByMaterial,
  getBridalByRingSize
} = require("../../dao/products/manageProducts");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads")); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`); // Unique filename for each uploaded file
  },
});

const upload = multer({ storage: storage });

// const fileFilter = (req, file, cb) => {
//   // Accept only image files
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed!"), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
// });

router.post("/upload-image", upload.single("image"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }
  const imageUrl = `http://localhost:8090/uploads/${file.filename}`;
  res.status(201).json({ imageUrl: imageUrl });
});

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

//View all product
router.get("/product", async (req, response) => {
  getAllProduct().then(result =>{
    response.json(result[0]);
  }).catch(error => {
    console.error('Error fetching banners: ', error);
    response.status(500).send('Error fetching banners');
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

  if (!diamondData.stockNumber) {
    return res.status(400).send("Stock Number required");
  }
  try {
    const results = await updateDiamond(diamondData);
    if (results.rowsAffected && results.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Diamond updated successfully" });
    } else {
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

//Add Diamonds Rings
router.post("/add-diamond-rings", async (req, res) => {
  const {
    ringStyle,
    nameRings,
    category,
    brandName,
    material,
    centerGemstone,
    centerGemstoneShape,
    width,
    centerDiamondDimension,
    weight,
    gemstoneWeight,
    centerDiamondColor,
    centerDiamondClarity,
    centerDiamondCaratWeight,
    ringSize,
    price,
    gender,
    fluorescence,
    description,
    imageRings,
    imageBrand,
    inventory,
  } = req.body;

  try {
    // Insert new diamond ring
    await insertDiamondRings({
      ringStyle,
      nameRings,
      category,
      brandName,
      material,
      centerGemstone,
      centerGemstoneShape,
      width,
      centerDiamondDimension,
      weight,
      gemstoneWeight,
      centerDiamondColor,
      centerDiamondClarity,
      centerDiamondCaratWeight,
      ringSize,
      price,
      gender,
      fluorescence,
      description,
      imageRings,
      imageBrand,
      inventory,
    });

    res.status(200).json({ message: "Diamond ring added successfully" });
  } catch (err) {
    console.error("Error adding diamond ring:", err.message);
    res.status(500).send("Internal server error");
  }
});

//Update Diamond Rings
router.put("/edit-diamond-rings", async (req, res) => {
  const diamondRingsData = req.body;

  if (!diamondRingsData.ringStyle) {
    return res.status(400).send("Diamond ring style required");
  }
  try {
    const results = await updateDiamondRings(diamondRingsData);
    if(results.rowsAffected && results.rowsAffected[0] >0){
      res.status(200).json({ message: "Diamond ring updated successfully" });
    }else{
      res.status(404).json({ message: "Diamond ring not found" });
    }
  } catch (err) {
    console.error("Error updating diamond ring:", err.message);
    res.status(500).send("Internal server error");
  }
});

// Delete Diamond ring
router.delete("/delete-diamond-rings", async (req, res) => {
  const diamondRingsData = req.body;
 // Validate the diamondId
 if(!diamondRingsData.diamondRingsId){
   return res.status(400).send("Diamond ring ID required");
 }
 try {
   // Delete diamond ring
   const result = await deleteDiamondRings(diamondRingsData);
   if (result.rowsAffected && result.rowsAffected[0] > 0) {
     res.status(200).json({ message: 'Diamond ring deleted successfully' });
   } else {
     res.status(404).json({ error: 'Diamond ring not found or already deleted' });
   }
 } catch (error) {
   console.error('Error deleting diamond ring:', error.message);
   res.status(500).json({ error: 'Failed to delete diamond ring' });
 }
});

//Add Bridals
router.post("/add-bridals", async (req, res) => {
  const{
    bridalStyle,
    nameBridal,
    category,
    brandName,
    material,
    settingType,
    gender,
    weight,
    centerDiamond,
    diamondCaratRange,
    ringSizeRange,
    totalCaratweight,
    totalDiamond,
    description,
    price,
    imageBridal,
    imageBrand,
    inventory
  } = req.body;

  try {
    // Insert new diamond ring
    await insertBridals({
    bridalStyle,
    nameBridal,
    category,
    brandName,
    material,
    settingType,
    gender,
    weight,
    centerDiamond,
    diamondCaratRange,
    ringSizeRange,
    totalCaratweight,
    totalDiamond,
    description,
    price,
    imageBridal,
    imageBrand,
    inventory
    });

    res.status(200).json({ message: "Bridal added successfully" });
  } catch (err) {
    console.error("Error adding Bridal:", err.message);
    res.status(500).send("Internal server error");
  }
});

//Update Bridals
router.put("/edit-bridals", async (req, res) => {
  const bridalsData = req.body;

  if (!bridalsData.bridalStyle) {
    return res.status(400).send("Bridal ID required");
  }
  try {
    const results = await updateBridals(bridalsData);
    if(results.rowsAffected && results.rowsAffected[0] >0){
      res.status(200).json({ message: "Bridal updated successfully" });
    }else{
      res.status(404).json({ message: "Bridal not found" });
    }
  } catch (err) {
    console.error("Error updating Bridal:", err.message);
    res.status(500).send("Internal server error");
  }
});


// Delete Bridals
router.delete("/delete-bridals", async (req, res) => {
  const bridalsData = req.body;
 // Validate the bridaldId
 if(!bridalsData.bridalId){
   return res.status(400).send("Bridals ID required");
 }
 try {
   // Delete Bridal
   const result = await deleteBridals(bridalsData);
   if (result.rowsAffected && result.rowsAffected[0] > 0) {
     res.status(200).json({ message: 'Bridal deleted successfully' });
   } else {
     res.status(404).json({ error: 'Bridal not found or already deleted' });
   }
 } catch (error) {
   console.error('Error deleting Bridal:', error.message);
   res.status(500).json({ error: 'Failed to delete Bridal' });
 }
});

//Add Timepieces
router.post("/add-timepieces", async (req, res) => {
  const{
      timepiecesStyle,
      nameTimepieces,
      collection,
      waterResistance,
      crystalType,
      braceletMaterial,
      caseSize,
      dialColor,
      movement,
      gender,
      category,
      brandName,
      dialType,
      description,
      price,
      imageTimepieces,
      imageBrand,
      inventory
  } = req.body;

  try {
    // Insert new timepieces
    await insertTimepieces({
      timepiecesStyle,
      nameTimepieces,
      collection,
      waterResistance,
      crystalType,
      braceletMaterial,
      caseSize,
      dialColor,
      movement,
      gender,
      category,
      brandName,
      dialType,
      description,
      price,
      imageTimepieces,
      imageBrand,
      inventory
    });

    res.status(200).json({ message: "Timepieces added successfully" });
  } catch (err) {
    console.error("Error adding Timepieces:", err.message);
    res.status(500).send("Internal server error");
  }
});

//Update Bridals
router.put("/edit-timepieces", async (req, res) => {
  const timepiecesData = req.body;

  if (!timepiecesData.timepiecesStyle) {
    return res.status(400).send("Timepieces ID required");
  }
  try {
    const results = await updateTimepieces(timepiecesData);
    if(results.rowsAffected && results.rowsAffected[0] >0){
      res.status(200).json({ message: "Timepieces updated successfully" });
    }else{
      res.status(404).json({ message: "Timepieces not found" });
    }
  } catch (err) {
    console.error("Error updating Timepieces:", err.message);
    res.status(500).send("Internal server error");
  }
});

// Delete Timepieces
router.delete("/delete-timepieces", async (req, res) => {
  const timepiecesData = req.body;
 // Validate the bridaldId
 if(!timepiecesData.diamondTimepiecesId){
   return res.status(400).send("Timepieces ID required");
 }
 try {
   // Delete Bridal
   const result = await deleteTimepieces(timepiecesData);
   if (result.rowsAffected && result.rowsAffected[0] > 0) {
     res.status(200).json({ message: 'Timepieces deleted successfully' });
   } else {
     res.status(404).json({ error: 'Timepieces not found or already deleted' });
   }
 } catch (error) {
   console.error('Error deleting Timepieces:', error.message);
   res.status(500).json({ error: 'Failed to delete Bridal' });
 }
});
//view details
// Get a specific diamond by ID
router.get('/diamonds/:id', (req, res) => {
  const diamondId = req.params.id;
  getDiamondById(diamondId, (err, diamond) => {
    if (err) return res.status(500).json({ error: 'Failed to retrieve diamond' });
    res.json(diamond);
  });
});

router.get('/bridals/:id', (req, res) => {
  const bridalId = req.params.id;
  getBridalById(bridalId, (err, bridal) => {
    if (err) return res.status(500).json({ error: 'Failed to retrieve bridal' });
    res.json(bridal);
  });
});

router.get('/rings/:id', (req, res) => {
  const ringsId = req.params.id;
  getRingsById(ringsId, (err, rings) => {
    if (err) return res.status(500).json({ error: 'Failed to retrieve rings' });
    res.json(rings);
  });
});

router.get('/timepieces/:id', (req, res) => {
  const timepiecesId = req.params.id;
  getTimepiecesById(timepiecesId, (err, timepieces) => {
    if (err) return res.status(500).json({ error: 'Failed to retrieve timepieces' });
    res.json(timepieces);
  });
});

router.get("/ring-detail", async (req, res) => {
  const { material, ringSize } = req.query;

  if (!material || !ringSize) {
    return res
      .status(400)
      .json({ message: "Material and ring size are required" });
  }

  try {
    const diamondRingsID = await getRingDetailByMaterialAndSize(
      material,
      ringSize
    );

    if (diamondRingsID) {
      res.json({ DiamondRingsID: diamondRingsID });
    } else {
      res.status(404).json({ message: "Ring not found" });
    }
  } catch (error) {
    console.error("Error fetching ring details", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//-----Bridal and Ring------//
router.get("/material-details", async (req, response) => {
  getBridalByMaterial()
    .then((result) => {
      response.json(result[0]);
    })
    .catch((error) => {
      console.error("Error fetching bridal and ring of materials: ", error);
      response.status(500).send("Error fetching bridal and ring materials");
    });
});

router.get("/ring-size-details", async (req, response) => {
  getBridalByRingSize()
    .then((result) => {
      response.json(result[0]);
    })
    .catch((error) => {
      console.error("Error fetching bridal ring sizes: ", error);
      response.status(500).send("Error fetching bridal ring sizes");
    });
});

module.exports = router;
