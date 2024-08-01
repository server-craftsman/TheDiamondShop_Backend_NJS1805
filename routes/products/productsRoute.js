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
  getMaterialDetails,
  getRingSizeDetails,
  getBridalAccessory,
  getRingsAccessory,
  getBridalPriceByMaterialID,
  getRingPriceByMaterialID,
  getBridalByRingSize,
  getBridalByMaterial,
} = require("../../dao/products/manageProducts");
const config = require("../../config/dbconfig");
const sql = require("mssql");

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

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
  getAllProduct().then(result => {
    response.json(result[0]);
  }).catch(error => {
    console.error('Error fetching banners: ', error);
    response.status(500).send('Error fetching banners');
  });
});

//View Banner
router.get("/banner", async (req, response) => {
  getAllBanner().then(result => {
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
  if (!dataSource.diamondId) {
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
// router.put("/edit-diamond-rings", async (req, res) => {
//   const diamondRingsData = req.body;

//   if (!diamondRingsData.ringStyle) {
//     return res.status(400).send("Diamond ring style required");
//   }
//   try {
//     const results = await updateDiamondRings(diamondRingsData);
//     if (results.rowsAffected && results.rowsAffected[0] > 0) {
//       res.status(200).json({ message: "Diamond ring updated successfully" });
//     } else {
//       res.status(404).json({ message: "Diamond ring not found" });
//     }
//   } catch (err) {
//     console.error("Error updating diamond ring:", err.message);
//     res.status(500).send("Internal server error");
//   }
// });

// Delete Diamond ring
router.delete("/delete-diamond-rings", async (req, res) => {
  const diamondRingsData = req.body;
  // Validate the diamondId
  if (!diamondRingsData.diamondRingsId) {
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
// router.post("/add-bridals", async (req, res) => {
//   const{
//     bridalStyle,
//     nameBridal,
//     category,
//     brandName,
//     material,
//     settingType,
//     gender,
//     weight,
//     centerDiamond,
//     diamondCaratRange,
//     ringSizeRange,
//     totalCaratweight,
//     totalDiamond,
//     description,
//     price,
//     imageBridal,
//     imageBrand,
//     inventory
//   } = req.body;

//   try {
//     // Insert new diamond ring
//     await insertBridals({
//     bridalStyle,
//     nameBridal,
//     category,
//     brandName,
//     material,
//     settingType,
//     gender,
//     weight,
//     centerDiamond,
//     diamondCaratRange,
//     ringSizeRange,
//     totalCaratweight,
//     totalDiamond,
//     description,
//     price,
//     imageBridal,
//     imageBrand,
//     inventory
//     });

//     res.status(200).json({ message: "Bridal added successfully" });
//   } catch (err) {
//     console.error("Error adding Bridal:", err.message);
//     res.status(500).send("Internal server error");
//   }
// });

// Insert Data Bridal True
// router.post("/add-bridals", async (req, res) => {
//   const{
//     bridalStyle,
//     nameBridal,
//     category,
//     brandName,
//     material,
//     settingType,
//     gender,
//     weight,
//     centerDiamond,
//     diamondCaratRange,
//     ringSizeRange,
//     totalCaratweight,
//     totalDiamond,
//     description,
//     price,
//     imageBridal,
//     imageBrand,
//     inventory
//   } = req.body;

//   try {
//     // Insert new diamond ring
//     await insertBridals({
//     bridalStyle,
//     nameBridal,
//     category,
//     brandName,
//     material,
//     settingType,
//     gender,
//     weight,
//     centerDiamond,
//     diamondCaratRange,
//     ringSizeRange,
//     totalCaratweight,
//     totalDiamond,
//     description,
//     price,
//     imageBridal,
//     imageBrand,
//     inventory
//     });

//     res.status(200).json({ message: "Bridal added successfully" });
//   } catch (err) {
//     console.error("Error adding Bridal:", err.message);
//     res.status(500).send("Internal server error");
//   }
// });

// router.post("/add-bridals", async (req, res) => {
//   const {
//     bridalStyle,
//     nameBridal,
//     category,
//     brandName,
//     material,
//     settingType,
//     gender,
//     weight,
//     centerDiamond,
//     diamondCaratRange,
//     ringSizeRange,
//     totalCaratweight,
//     totalDiamond,
//     description,
//     price,
//     imageBridal,
//     imageBrand,
//     inventory
//   } = req.body;

//   try {
//     // Insert new bridal and accessories
//     await insertBridals({
//       bridalStyle,
//       nameBridal,
//       category,
//       brandName,
//       material,
//       settingType,
//       gender,
//       weight,
//       centerDiamond,
//       diamondCaratRange,
//       ringSizeRange,
//       totalCaratweight,
//       totalDiamond,
//       description,
//       price,
//       imageBridal,
//       imageBrand,
//       inventory
//     });

//     res.status(200).json({ message: "Bridal added successfully" });
//   } catch (err) {
//     console.error("Error adding Bridal:", err.message);
//     res.status(500).send("Internal server error");
//   }
// });

//Update Bridals
router.put("/edit-bridals", async (req, res) => {
  const bridalsData = req.body;

  if (!bridalsData.bridalID) {
    return res.status(400).send("Bridal ID required");
  }
  try {
    const results = await updateBridals(bridalsData);
    if (results.rowsAffected && results.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Bridal updated successfully" });
    } else {
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
  if (!bridalsData.bridalId) {
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
  const {
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

//Update Timepieces
router.put("/edit-timepieces", async (req, res) => {
  const timepiecesData = req.body;

  if (!timepiecesData.diamondTimepiecesID) {
    return res.status(400).send("Timepieces ID required");
  }
  try {
    const results = await updateTimepieces(timepiecesData);
    if (results.rowsAffected && results.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Timepieces updated successfully" });
    } else {
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
  if (!timepiecesData.diamondTimepiecesId) {
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
//=============
// // Route to fetch material details
// router.get("/material-details", async (req, res) => {
//   try {
//     const materials = await getMaterialDetails();
//     res.json(materials);
//   } catch (error) {
//     console.error("Error fetching material details:", error);
//     res.status(500).send("Error fetching material details");
//   }
// });

// // Route to fetch ring size details
// router.get("/ring-size-details", async (req, res) => {
//   try {
//     const ringSizes = await getRingSizeDetails();
//     res.json(ringSizes);
//   } catch (error) {
//     console.error("Error fetching ring size details:", error);
//     res.status(500).send("Error fetching ring size details");
//   }
// });

router.get('/bridal-accessory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const accessories = await getBridalAccessory(id);
    res.json(accessories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bridal accessories' });
  }
});

// Định nghĩa route
router.get('/ring-accessory-details/:id', async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(parseInt(id))) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const accessories = await getRingsAccessory(id);
    res.json(accessories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rings accessories' });
  }
});
//View bridal price theo material
router.get("/bridal-price/:materialID", async (req, res) => {
  const { materialID } = req.params;
  if (isNaN(materialID)) {
    return res.status(400).json({ error: 'Invalid MaterialID' });
  }
  try {
    const price = await getBridalPriceByMaterialID(materialID);
    res.json(price);
  } catch (error) {
    console.error("Error fetching bridal price:", error);
    res.status(500).send("Error fetching bridal price");
  }
});

//View ring price theo material
router.get("/ring-price/:materialID", async (req, res) => {
  const { materialID } = req.params;
  if (isNaN(materialID)) {
    return res.status(400).json({ error: 'Invalid MaterialID' });
  }
  try {
    const price = await getRingPriceByMaterialID(materialID);
    res.json(price);
  } catch (error) {
    console.error("Error fetching bridal price:", error);
    res.status(500).send("Error fetching bridal price");
  }
});


//===========for only diamond-rings=============
//add-rings
router.post('/add-diamond-ring', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { RingStyle, NameRings, Category, BrandName, Material, CenterGemstone, CenterGemstoneShape, Width, CenterDiamondDimension, Weight, GemstoneWeight, CenterDiamondColor, CenterDiamondClarity, CenterDiamondCaratWeight, RingSize, Gender, Fluorescence, Description, ImageRings, ImageBrand, Inventory, MaterialID, RingSizeID, Price } = req.body;

    // Insert into DiamondRings table
    const diamondRingsQuery = `
      INSERT INTO DiamondRings (RingStyle, NameRings, Category, BrandName, Material, CenterGemstone, CenterGemstoneShape, Width, CenterDiamondDimension, Weight, GemstoneWeight, CenterDiamondColor, CenterDiamondClarity, CenterDiamondCaratWeight, RingSize, Gender, Fluorescence, Description, ImageRings, ImageBrand, Inventory)
      OUTPUT INSERTED.DiamondRingsID
      VALUES (@RingStyle, @NameRings, @Category, @BrandName, @Material, @CenterGemstone, @CenterGemstoneShape, @Width, @CenterDiamondDimension, @Weight, @GemstoneWeight, @CenterDiamondColor, @CenterDiamondClarity, @CenterDiamondCaratWeight, @RingSize, @Gender, @Fluorescence, @Description, @ImageRings, @ImageBrand, @Inventory);
    `;
    const result = await pool.request()
      .input('RingStyle', sql.VarChar(50), RingStyle)
      .input('NameRings', sql.VarChar(50), NameRings)
      .input('Category', sql.VarChar(50), Category)
      .input('BrandName', sql.VarChar(50), BrandName)
      .input('Material', sql.VarChar(50), Material)
      .input('CenterGemstone', sql.VarChar(50), CenterGemstone)
      .input('CenterGemstoneShape', sql.VarChar(50), CenterGemstoneShape)
      .input('Width', sql.Decimal(10, 2), Width)
      .input('CenterDiamondDimension', sql.Int, CenterDiamondDimension)
      .input('Weight', sql.Decimal(10, 2), Weight)
      .input('GemstoneWeight', sql.Decimal(5, 2), GemstoneWeight)
      .input('CenterDiamondColor', sql.VarChar(50), CenterDiamondColor)
      .input('CenterDiamondClarity', sql.VarChar(50), CenterDiamondClarity)
      .input('CenterDiamondCaratWeight', sql.Decimal(5, 2), CenterDiamondCaratWeight)
      .input('RingSize', sql.Decimal(10, 2), RingSize)
      .input('Gender', sql.VarChar(50), Gender)
      .input('Fluorescence', sql.VarChar(50), Fluorescence)
      .input('Description', sql.VarChar(sql.MAX), Description)
      .input('ImageRings', sql.VarChar(sql.MAX), ImageRings)
      .input('ImageBrand', sql.VarChar(sql.MAX), ImageBrand)
      .input('Inventory', sql.Int, Inventory)
      .query(diamondRingsQuery);

    const diamondRingsID = result.recordset[0].DiamondRingsID;

    // Insert into RingsPrice table
    const ringsPriceQuery = `
      INSERT INTO RingsPrice (Price)
      OUTPUT INSERTED.PriceID
      VALUES (@Price);
    `;
    const priceResult = await pool.request()
      .input('Price', sql.Decimal(18, 2), Price)
      .query(ringsPriceQuery);

    const priceID = priceResult.recordset[0].PriceID;

    // Insert into RingsAccessory table
    const ringsAccessoryQuery = `
      INSERT INTO RingsAccessory (DiamondRingsID, MaterialID, RingSizeID, PriceID)
      VALUES (@DiamondRingsID, @MaterialID, @RingSizeID, @PriceID);
    `;
    await pool.request()
      .input('DiamondRingsID', sql.Int, diamondRingsID)
      .input('MaterialID', sql.Int, MaterialID)
      .input('RingSizeID', sql.Int, RingSizeID)
      .input('PriceID', sql.Int, priceID)
      .query(ringsAccessoryQuery);

    res.status(200).send({ message: 'Diamond Ring added successfully', DiamondRingsID: diamondRingsID });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.put('/edit-diamond-rings/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const {
      RingStyle, NameRings, Category, BrandName, Material, CenterGemstone,
      CenterGemstoneShape, Width, CenterDiamondDimension, Weight, GemstoneWeight,
      CenterDiamondColor, CenterDiamondClarity, CenterDiamondCaratWeight, RingSize,
      Gender, Fluorescence, Description, ImageRings, ImageBrand, Inventory,
      MaterialID, RingSizeID, PriceID, NewPrice
    } = req.body;

    const { id } = req.params;

    console.log('Received request body:', req.body);
    console.log('Received parameters:', req.params);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update DiamondRings table
      const diamondRingsUpdateQuery = `
        UPDATE DiamondRings
        SET RingStyle = @RingStyle, NameRings = @NameRings, Category = @Category,
            BrandName = @BrandName, Material = @Material, CenterGemstone = @CenterGemstone,
            CenterGemstoneShape = @CenterGemstoneShape, Width = @Width, CenterDiamondDimension = @CenterDiamondDimension,
            Weight = @Weight, GemstoneWeight = @GemstoneWeight, CenterDiamondColor = @CenterDiamondColor,
            CenterDiamondClarity = @CenterDiamondClarity, CenterDiamondCaratWeight = @CenterDiamondCaratWeight,
            RingSize = @RingSize, Gender = @Gender, Fluorescence = @Fluorescence, Description = @Description,
            ImageRings = @ImageRings, ImageBrand = @ImageBrand, Inventory = @Inventory
        WHERE DiamondRingsID = @id
      `;

      await transaction.request()
        .input('id', sql.Int, id)
        .input('RingStyle', sql.VarChar, RingStyle)
        .input('NameRings', sql.VarChar, NameRings)
        .input('Category', sql.VarChar, Category)
        .input('BrandName', sql.VarChar, BrandName)
        .input('Material', sql.VarChar, Material)
        .input('CenterGemstone', sql.VarChar, CenterGemstone)
        .input('CenterGemstoneShape', sql.VarChar, CenterGemstoneShape)
        .input('Width', sql.Decimal, Width)
        .input('CenterDiamondDimension', sql.Int, CenterDiamondDimension)
        .input('Weight', sql.Decimal, Weight)
        .input('GemstoneWeight', sql.Decimal, GemstoneWeight)
        .input('CenterDiamondColor', sql.VarChar, CenterDiamondColor)
        .input('CenterDiamondClarity', sql.VarChar, CenterDiamondClarity)
        .input('CenterDiamondCaratWeight', sql.Decimal, CenterDiamondCaratWeight)
        .input('RingSize', sql.Decimal, RingSize)
        .input('Gender', sql.VarChar, Gender)
        .input('Fluorescence', sql.VarChar, Fluorescence)
        .input('Description', sql.VarChar, Description)
        .input('ImageRings', sql.VarChar, ImageRings)
        .input('ImageBrand', sql.VarChar, ImageBrand)
        .input('Inventory', sql.Int, Inventory)
        .query(diamondRingsUpdateQuery);

      console.log('DiamondRings table updated successfully');

      // Update RingsPrice table if NewPrice and PriceID are provided
      if (PriceID && NewPrice) {
        console.log('Updating RingsPrice table');

        const getPriceIDQuery = `
          SELECT PriceID, MaterialID, RingSizeID, DiamondRingsID
          FROM RingsAccessory
          WHERE DiamondRingsID = @id
            AND MaterialID = @MaterialID
            AND RingSizeID = @RingSizeID
        `;

        const result = await transaction.request()
          .input('id', sql.Int, id)
          .input('MaterialID', sql.Int, MaterialID)
          .input('RingSizeID', sql.Int, RingSizeID)
          .query(getPriceIDQuery);

        console.log('Result from RingsAccessory query:', result.recordset);

        const newPriceID = result.recordset[0]?.PriceID;

        if (newPriceID) {
          const ringsPriceUpdateQuery = `
            UPDATE RingsPrice
            SET Price = @NewPrice
            WHERE PriceID = @PriceID
          `;

          await transaction.request()
            .input('PriceID', sql.Int, newPriceID)
            .input('NewPrice', sql.Decimal(18, 2), NewPrice)
            .query(ringsPriceUpdateQuery);

          console.log('RingsPrice table updated successfully');
        } else {
          throw new Error('PriceID not found for the given parameters');
        }
      }

      await transaction.commit();
      res.status(200).send('Diamond ring and accessory updated successfully');
    } catch (err) {
      await transaction.rollback();
      console.error('Error during transaction:', err);
      res.status(500).send('Error updating diamond ring and accessory');
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    res.status(500).send('Error connecting to database');
  }
});

router.get('/diamond-rings-material/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const query = `
      SELECT DISTINCT dr.DiamondRingsID, ra.MaterialID, m.MaterialName
      FROM DiamondRings dr
      JOIN RingsAccessory ra ON dr.DiamondRingsID = ra.DiamondRingsID
      JOIN Material m ON ra.MaterialID = m.MaterialID
      WHERE dr.DiamondRingsID = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving diamond ring materials');
  }
});

// Router to view distinct RingSizes for a DiamondRingsID
router.get('/diamond-rings-size/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const query = `
      SELECT DISTINCT dr.DiamondRingsID, ra.RingSizeID, rs.RingSize
      FROM DiamondRings dr
      JOIN RingsAccessory ra ON dr.DiamondRingsID = ra.DiamondRingsID
      JOIN RingSize rs ON ra.RingSizeID = rs.RingSizeID
      WHERE dr.DiamondRingsID = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving diamond ring sizes');
  }
});

// Router to view distinct Prices for a DiamondRingsID
router.get('/diamond-rings-price/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const query = `
    SELECT DISTINCT dr.DiamondRingsID, rp.PriceID, rp.Price
      FROM DiamondRings dr
      JOIN RingsAccessory ra ON dr.DiamondRingsID = ra.DiamondRingsID
      JOIN RingsPrice rp ON ra.PriceID = rp.PriceID
      WHERE dr.DiamondRingsID = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving diamond ring prices');
  }
});

// Define the endpoint
router.post('/price-id', async (req, res) => {
  try {
    const { diamondRingsId, materialID, ringSizeID } = req.body;

    if (materialID === null || ringSizeID === null || diamondRingsId === null) {
      return res.status(400).json({ error: 'MaterialID, RingSizeID, and DiamondRingsID are required' });
    }

    console.log('Input Data:', { diamondRingsId, materialID, ringSizeID });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('MaterialID', sql.Int, materialID)
      .input('RingSizeID', sql.Int, ringSizeID)
      .input('DiamondRingsID', sql.Int, diamondRingsId)
      .query(`
        SELECT p.PriceID
        FROM RingsAccessory ra
        JOIN RingsPrice p ON ra.PriceID = p.PriceID
        WHERE ra.MaterialID = @MaterialID
        AND ra.RingSizeID = @RingSizeID
        AND ra.DiamondRingsID = @DiamondRingsID
      `);

    console.log('Query Result:', result.recordset);

    if (result.recordset.length > 0) {
      res.json({ PriceID: result.recordset[0].PriceID });
    } else {
      res.status(404).json({ error: 'PriceID not found for the given MaterialID and RingSizeID' });
    }
  } catch (err) {
    console.error('Error fetching PriceID:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//===========================================
// //===================Follow of Bridal===========
// router.post('/add-bridal', async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { BridalStyle, NameBridal, Category, BrandName, Material, SettingType, Gender, Weight, CenterDiamond, DiamondCaratRange, RingSizeRange, TotalCaratWeight, TotalDiamond, Description, ImageBridal, ImageBrand, Inventory, MaterialID, RingSizeID, Price } = req.body;

//     //Insert into DiamondRings table
//     const bridalQuery = `
//     INSERT INTO Bridal (BridalStyle, NameBridal, Category, BrandName, Material, SettingType, Gender, Weight, CenterDiamond, DiamondCaratRange, RingSizeRange, TotalCaratWeight, TotalDiamond, Description, ImageBridal, ImageBrand, Inventory)
//     OUTPUT INSERTED.BridalID
//     VALUES (@BridalStyle, @NameBridal, @Category, @BrandName, @Material, @SettingType, @Gender, @Weight, @CenterDiamond, @DiamondCaratRange, @RingSizeRange, @TotalCaratWeight, @TotalDiamond, @Description, @ImageBridal, 'https://collections.jewelryimages.net/collections_logos/00008w.jpg', @Inventory);
//     `;

//     const result = await pool.request()
//       .input('BridalStyle', sql.VarChar(50), BridalStyle)
//       .input('NameBridal', sql.VarChar(50), NameBridal)
//       .input('Category', sql.VarChar(sql.MAX), Category)
//       .input('BrandName', sql.VarChar(50), BrandName)
//       .input('Material', sql.VarChar(sql.MAX), Material)
//       .input('SettingType', sql.VarChar(sql.MAX), SettingType)
//       .input('Gender', sql.VarChar(sql.MAX), Gender)
//       .input('Weight', sql.Decimal(10, 2), Weight)
//       .input('CenterDiamond', sql.VarChar(sql.MAX), CenterDiamond)
//       .input('DiamondCaratRange', sql.VarChar(sql.MAX), DiamondCaratRange)
//       .input('RingSizeRange', sql.Decimal(10, 2), RingSizeRange)
//       .input('TotalCaratWeight', sql.Decimal(10, 2), TotalCaratWeight)
//       .input('TotalDiamond', sql.Int, TotalDiamond)
//       .input('Description', sql.VarChar(sql.MAX), Description)
//       .input('ImageBridal', sql.VarChar(sql.MAX), ImageBridal)
//       .input('Inventory', sql.Int, Inventory)
//       .query(bridalQuery);

//     const bridalID = result.recordset[0].BridalID;
//     //Insert into BridalPrice table
//     const bridalPriceQuery = `
//         INSERT INTO BridalPrice (Price)
//         OUTPUT INSERTED.PriceID
//         VALUES (@Price); 
//       `;
//     const priceResult = await pool.request()
//       .input('Price', sql.Decimal(18, 2), Price)
//       .query(bridalPriceQuery);

//     const priceID = priceResult.recordset[0].PriceID;

//     //Insert into BridalAccessory table
//     const bridalAccessory = `
//       INSERT INTO BridalAccessory (BridalID, MaterialID, RingSizeID, PriceID)
//       VALUES (@BridalID, @MaterialID, @RingSizeID, @PriceID);
//       `;
//     await pool.request()
//       .input('BridalID', sql.Int, bridalID)
//       .input('MaterialID', sql.Int, MaterialID)
//       .input('RingSizeID', sql.Int, RingSizeID)
//       .input('PriceID', sql.Int, priceID)
//       .query(bridalAccessory);

//     res.status(200).send({ message: 'Bridal added successfully', BridalID: bridalID })
//   } catch (err) {
//     res.status(500).send({ message: err.message });
//   }
// });

// router.put('/edit-bridal/:id', async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { BridalStyle, NameBridal, Category, BrandName, Material, SettingType, Gender,
//       Weight, CenterDiamond, DiamondCaratRange, RingSizeRange, TotalCaratWeight, TotalDiamond,
//       Description, ImageBridal, ImageBrand, Inventory,
//       MaterialID, RingSizeID, PriceID, NewPrice
//     } = req.body;

//     const { id } = req.params;

//     //Begin transaction
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();
//     try {
//       // Update Bridal table
//       const bridalUpdateQuery = `
//     UPDATE Bridal
//     SET BridalStyle = @BridalStyle,
//           NameBridal = @NameBridal,
//           Category = @Category,
//           BrandName = @BrandName,
//           Material = @Material,
//           SettingType = @SettingType,
//           Gender = @Gender,
//           Weight = @Weight,
//           CenterDiamond = @CenterDiamond,
//           DiamondCaratRange = @DiamondCaratRange,
//           RingSizeRange = @RingSizeRange,
//           TotalCaratWeight = @TotalCaratWeight,
//           TotalDiamond = @TotalDiamond,
//           Description = @Description,
//           ImageBridal = @ImageBridal,
//           Inventory = @Inventory
//     WHERE BridalID = @id
//     `;
//       await pool.request()
//         .input('id', sql.Int, id)
//         .input("BridalStyle", sql.VarChar, BridalStyle)
//         .input("NameBridal", sql.VarChar, NameBridal)
//         .input("Category", sql.VarChar, Category)
//         .input("BrandName", sql.VarChar, BrandName)
//         .input("Material", sql.VarChar, Material)
//         .input("SettingType", sql.VarChar, SettingType)
//         .input("Gender", sql.VarChar, Gender)
//         .input("Weight", sql.Decimal, Weight)
//         .input("CenterDiamond", sql.VarChar, CenterDiamond)
//         .input("DiamondCaratRange", sql.VarChar, DiamondCaratRange)
//         .input("RingSizeRange", sql.Decimal, RingSizeRange)  // Corrected the name
//         .input("TotalCaratWeight", sql.Decimal, TotalCaratWeight)
//         .input("TotalDiamond", sql.Int, TotalDiamond)
//         .input("Description", sql.VarChar, Description)
//         .input("ImageBridal", sql.VarChar, ImageBridal)
//         .input('Inventory', sql.Int, Inventory)
//         .query(bridalUpdateQuery)

//       // Update BridalPrice table if NewPrice and PriceID are provided
//       if (PriceID && NewPrice) {
//         const getPriceIDQuery = `
//           SELECT PriceID
//           FROM BridalAccessory
//           WHERE BridalID = @id
//             AND MaterialID = @MaterialID
//             AND RingSizeID = @RingSizeID
//         `;

//         const result = await transaction.request()
//           .input('id', sql.Int, id)
//           .input('MaterialID', sql.Int, MaterialID)
//           .input('RingSizeID', sql.Int, RingSizeID)
//           .query(getPriceIDQuery);

//         const newPriceID = result.recordset[0]?.PriceID;

//         if (newPriceID) {
//           const bridalPriceUpdateQuery = `
//             UPDATE BridalPrice
//             SET Price = @NewPrice
//             WHERE PriceID = @PriceID
//           `;

//           await transaction.request()
//             .input('PriceID', sql.Int, newPriceID)
//             .input('NewPrice', sql.Decimal(18, 2), NewPrice)
//             .query(bridalPriceUpdateQuery);
//         } else {
//           throw new Error('PriceID not found for the given parameters');
//         }
//       }
//       // Commit transaction
//       await transaction.commit();
//       res.status(200).send('Bridal and accessory updated successfully');
//     } catch (err) {
//       // Rollback transaction in case of error
//       await transaction.rollback();
//       console.error('Error during transaction:', err);
//       res.status(500).send('Error updating bridal and accessory');
//     }
//   } catch (err) {
//     console.error('Error connecting to database:', err);
//     res.status(500).send('Error connecting to database');
//   }
// });

// router.get('/bridal-material/:id', async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { id } = req.params;

//     const query = `
//     SELECT DISTINCT br.BridalID, m.MaterialName
//     FROM Bridal br
//     JOIN BridalAccessory ba ON br.BridalID = ba.BridalID
//     JOIN Material m ON ba.MaterialID = m.MaterialID
//     WHERE br.BridalID = @id
//     `;

//     const result = await pool.request()
//       .input('id', sql.Int, id)
//       .query(query);

//     res.status(200).json(result.recordset);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error retrieving bridal materials');
//   }
// });

// router.get('/bridal-size/:id', async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { id } = req.params;
//     const query = `
//     SELECT DISTINCT br.BridalID, rs.RingSize
//     FROM  Bridal br
//     JOIN BridalAccessory ba ON br.BridalID = ba.BridalID
//     JOIN RingSize rs ON ba.RingSizeID = rs.RingSizeID
//     WHERE br.BridalID = @id
//     `;

//     const result = await pool.request()
//       .input('id', sql.Int, id)
//       .query(query);

//     res.status(200).json(result.recordset);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error retrieving diamond ring sizes');
//   }
// });

// router.get('/bridal-prices/:id', async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { id } = req.params;

//     const query = `
//     SELECT DISTINCT br.BridalID, bp.Price
//     FROM  Bridal br
//     JOIN BridalAccessory ba ON br.BridalID = ba.BridalID
//     JOIN BridalPrice bp ON ba.PriceID = bp.PriceID
//     WHERE br.BridalID = @id
//     `;

//     const result = await pool.request()
//       .input('id', sql.Int, id)
//       .query(query);

//     res.status(200).json(result.recordset);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error retrieving diamond ring prices');
//   }
// });

//===================Follow of Bridal===========
router.post('/add-bridal', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { BridalStyle, NameBridal, Category, BrandName, Material, SettingType, Gender, Weight, CenterDiamond, DiamondCaratRange, RingSizeRange, TotalCaratWeight, TotalDiamond, Description, ImageBridal, ImageBrand, Inventory, MaterialID, RingSizeID, Price } = req.body;

    //Insert into DiamondRings table
    const bridalQuery = `
    INSERT INTO Bridal (BridalStyle, NameBridal, Category, BrandName, Material, SettingType, Gender, Weight, CenterDiamond, DiamondCaratRange, RingSizeRange, TotalCaratWeight, TotalDiamond, Description, ImageBridal, ImageBrand, Inventory)
    OUTPUT INSERTED.BridalID
    VALUES (@BridalStyle, @NameBridal, @Category, @BrandName, @Material, @SettingType, @Gender, @Weight, @CenterDiamond, @DiamondCaratRange, @RingSizeRange, @TotalCaratWeight, @TotalDiamond, @Description, @ImageBridal, 'https://collections.jewelryimages.net/collections_logos/00008w.jpg', @Inventory);
    `;

    const result = await pool.request()
      .input('BridalStyle', sql.VarChar(50), BridalStyle)
      .input('NameBridal', sql.VarChar(50), NameBridal)
      .input('Category', sql.VarChar(sql.MAX), Category)
      .input('BrandName', sql.VarChar(50), BrandName)
      .input('Material', sql.VarChar(sql.MAX), Material)
      .input('SettingType', sql.VarChar(sql.MAX), SettingType)
      .input('Gender', sql.VarChar(sql.MAX), Gender)
      .input('Weight', sql.Decimal(10, 2), Weight)
      .input('CenterDiamond', sql.VarChar(sql.MAX), CenterDiamond)
      .input('DiamondCaratRange', sql.VarChar(sql.MAX), DiamondCaratRange)
      .input('RingSizeRange', sql.Decimal(10, 2), RingSizeRange)
      .input('TotalCaratWeight', sql.Decimal(10, 2), TotalCaratWeight)
      .input('TotalDiamond', sql.Int, TotalDiamond)
      .input('Description', sql.VarChar(sql.MAX), Description)
      .input('ImageBridal', sql.VarChar(sql.MAX), ImageBridal)
      .input('Inventory', sql.Int, Inventory)
      .query(bridalQuery);

    const bridalID = result.recordset[0].BridalID;
    //Insert into BridalPrice table
    const bridalPriceQuery = `
        INSERT INTO BridalPrice (Price)
        OUTPUT INSERTED.PriceID
        VALUES (@Price); 
      `;
    const priceResult = await pool.request()
      .input('Price', sql.Decimal(18, 2), Price)
      .query(bridalPriceQuery);

    const priceID = priceResult.recordset[0].PriceID;

    //Insert into BridalAccessory table
    const bridalAccessory = `
      INSERT INTO BridalAccessory (BridalID, MaterialID, RingSizeID, PriceID)
      VALUES (@BridalID, @MaterialID, @RingSizeID, @PriceID);
      `;
    await pool.request()
      .input('BridalID', sql.Int, bridalID)
      .input('MaterialID', sql.Int, MaterialID)
      .input('RingSizeID', sql.Int, RingSizeID)
      .input('PriceID', sql.Int, priceID)
      .query(bridalAccessory);

    res.status(200).send({ message: 'Bridal added successfully', BridalID: bridalID })
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.put('/edit-bridal/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { BridalStyle, NameBridal, Category, BrandName,
      Material, SettingType, Gender,
      Weight, CenterDiamond, DiamondCaratRange,
      RingSizeRange, TotalCaratWeight, TotalDiamond,
      Description, ImageBridal, ImageBrand, Inventory,
      MaterialID, RingSizeID, PriceID, NewPrice
    } = req.body;

    const { id } = req.params;

    console.log('Received request body:', req.body);
    console.log('Received parameters:', req.params);

    //Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      // Update Bridal table
      const bridalUpdateQuery = `
    UPDATE Bridal
    SET BridalStyle = @BridalStyle,
          NameBridal = @NameBridal,
          Category = @Category,
          BrandName = @BrandName,
          Material = @Material,
          SettingType = @SettingType,
          Gender = @Gender,
          Weight = @Weight,
          CenterDiamond = @CenterDiamond,
          DiamondCaratRange = @DiamondCaratRange,
          RingSizeRange = @RingSizeRange,
          TotalCaratWeight = @TotalCaratWeight,
          TotalDiamond = @TotalDiamond,
          Description = @Description,
          ImageBridal = @ImageBridal,
          Inventory = @Inventory
    WHERE BridalID = @id
    `;
      await pool.request()
        .input('id', sql.Int, id)
        .input("BridalStyle", sql.VarChar, BridalStyle)
        .input("NameBridal", sql.VarChar, NameBridal)
        .input("Category", sql.VarChar, Category)
        .input("BrandName", sql.VarChar, BrandName)
        .input("Material", sql.VarChar, Material)
        .input("SettingType", sql.VarChar, SettingType)
        .input("Gender", sql.VarChar, Gender)
        .input("Weight", sql.Decimal, Weight)
        .input("CenterDiamond", sql.VarChar, CenterDiamond)
        .input("DiamondCaratRange", sql.VarChar, DiamondCaratRange)
        .input("RingSizeRange", sql.Decimal, RingSizeRange)  // Corrected the name
        .input("TotalCaratWeight", sql.Decimal, TotalCaratWeight)
        .input("TotalDiamond", sql.Int, TotalDiamond)
        .input("Description", sql.VarChar, Description)
        .input("ImageBridal", sql.VarChar, ImageBridal)
        .input('Inventory', sql.Int, Inventory)
        .query(bridalUpdateQuery)

      // Update BridalPrice table if NewPrice and PriceID are provided
      if (PriceID && NewPrice) {
        console.log('Updating BridalPrice table');

        const getPriceIDQuery = `
          SELECT PriceID, MaterialID, RingSizeID, BridalID
          FROM BridalAccessory
          WHERE BridalID = @id
            AND MaterialID = @MaterialID
            AND RingSizeID = @RingSizeID
        `;

        const result = await transaction.request()
          .input('id', sql.Int, id)
          .input('MaterialID', sql.Int, MaterialID)
          .input('RingSizeID', sql.Int, RingSizeID)
          .query(getPriceIDQuery);

        console.log('Result from BridalAccessory query:', result.recordset);

        const newPriceID = result.recordset[0]?.PriceID;

        if (newPriceID) {
          const bridalPriceUpdateQuery = `
            UPDATE BridalPrice
            SET Price = @NewPrice
            WHERE PriceID = @PriceID
          `;

          await transaction.request()
            .input('PriceID', sql.Int, newPriceID)
            .input('NewPrice', sql.Decimal(18, 2), NewPrice)
            .query(bridalPriceUpdateQuery);

            console.log('BridalPrice table updated successfully');
        } else {
          throw new Error('PriceID not found for the given parameters');
        }
      }
      // Commit transaction
      await transaction.commit();
      res.status(200).send('Bridal and accessory updated successfully');
    } catch (err) {
      // Rollback transaction in case of error
      await transaction.rollback();
      console.error('Error during transaction:', err);
      res.status(500).send('Error updating bridal and accessory');
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    res.status(500).send('Error connecting to database');
  }
});

router.get('/bridal-material/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const query = `
    SELECT DISTINCT br.BridalID, ba.MaterialID, m.MaterialName
    FROM Bridal br
    JOIN BridalAccessory ba ON br.BridalID = ba.BridalID
    JOIN Material m ON ba.MaterialID = m.MaterialID
    WHERE br.BridalID = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving bridal materials');
  }
});

router.get('/bridal-size/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const query = `
    SELECT DISTINCT br.BridalID, ba.RingSizeID, rs.RingSize
    FROM  Bridal br
    JOIN BridalAccessory ba ON br.BridalID = ba.BridalID
    JOIN RingSize rs ON ba.RingSizeID = rs.RingSizeID
    WHERE br.BridalID = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving diamond ring sizes');
  }
});

router.get('/bridal-prices/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const query = `
    SELECT DISTINCT br.BridalID, bp.PriceID, bp.Price
    FROM  Bridal br
    JOIN BridalAccessory ba ON br.BridalID = ba.BridalID
    JOIN BridalPrice bp ON ba.PriceID = bp.PriceID
    WHERE br.BridalID = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving diamond ring prices');
  }
});

// Define the endpoint
router.post('/price-bridal-id', async (req, res) => {
  try {
    const { bridalId, materialID, ringSizeID } = req.body;

    if(materialID === null || ringSizeID === null || bridalId === null) {
      return res.status(400).json({ error: 'MaterialID, RingSizeID, and BridalID are required' });
    }

    console.log('Input Data:', { bridalId, materialID, ringSizeID });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('MaterialID', sql.Int, materialID)
      .input('RingSizeID', sql.Int, ringSizeID)
      .input('BridalID', sql.Int, bridalId)
      .query(`
        SELECT b.PriceID
        FROM BridalAccessory ba
        JOIN BridalPrice b ON ba.PriceID = b.PriceID
        WHERE ba.MaterialID = @MaterialID
        AND ba.RingSizeID = @RingSizeID
        AND ba.BridalID = @BridalID
        `);

        console.log('Query Result:', result.recordset);

        if (result.recordset.length > 0) {
          res.json({ PriceID: result.recordset[0].PriceID });
        } else {
          res.status(404).json({ error: 'PriceID not found for the given MaterialID and RingSizeID' });
        }
  } catch (err) {
    console.error('Error fetching PriceID:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//Add Price for Material and Ringsize difference
router.post('/addPrice/:id', async (req, res) => {
  const bridalID = req.params.id;
  const { materialID, ringSizeID, price } = req.body;

  try {
    const pool = await sql.connect(config);

    // Start a transaction
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // Insert the new price into the BridalPrice table
      const result = await transaction.request()
        .input('price', sql.Decimal(18, 2), price)
        .query('INSERT INTO BridalPrice (Price) OUTPUT INSERTED.PriceID VALUES (@price)');
      
      const priceID = result.recordset[0].PriceID;

      // Insert the new entry into BridalAccessory table with BridalID
      await transaction.request()
        .input('bridalID', sql.Int, bridalID)
        .input('materialID', sql.Int, materialID)
        .input('ringSizeID', sql.Int, ringSizeID)
        .input('priceID', sql.Int, priceID)
        .query('INSERT INTO BridalAccessory (BridalID, MaterialID, RingSizeID, PriceID) VALUES (@bridalID, @materialID, @ringSizeID, @priceID)');

      // Commit the transaction
      await transaction.commit();
      res.status(200).send('Price added successfully');
    } catch (err) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      console.error('Transaction error:', err);
      res.status(500).send('Internal Server Error');
    }
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).send('Internal Server Error');
  }
});
module.exports = router;
