const config = require("../../config/dbconfig");
const sql = require("mssql");

async function getAllBridals() {
  try {
    let pool = await sql.connect(config);
    let products = await pool.request().query(`
    SELECT 
    b.BridalID,
    b.BridalStyle,
    b.NameBridal,
    b.Category,
    b.BrandName,
    b.Material,
    b.SettingType,
    b.Gender,
    b.Weight,
    b.CenterDiamond,
    b.DiamondCaratRange,
    b.RingSizeRange,
    b.TotalCaratWeight,
    b.TotalDiamond,
    b.Description,
    b.ImageBridal,
    b.ImageBrand,
    b.Inventory,
    m.MaterialName,
    rs.RingSize,
	bp.Price
FROM 
    Bridal b
CROSS JOIN 
    Material m
CROSS JOIN 
    RingSize rs
CROSS JOIN
	BridalPrice bp
WHERE 
    m.MaterialID = 1 AND rs.RingSizeID = 1 AND bp.PriceID = 1;

`);
    return products.recordsets;
  } catch (error) {
    console.error("SQL error", error);
    throw error;
  }
}

//View All Prodcut
async function getAllProduct() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT 
    DiamondID AS ProductID,
    'Diamond' AS ProductType,
    DiamondOrigin AS Origin,
    CaratWeight,
    Color,
    Clarity,
    Cut,
    Price,
    Shape,
    [Image],
    Polish,
    Symmetry,
    TablePercentage,
    Depth,
    Measurements,
    GIAReportNumber,
    StockNumber,
    LabReportNumber,
    Gemstone,
    GradingReport,
    Descriptors,
    Fluorescence,
    Inventory
FROM 
    Diamond

UNION ALL

SELECT 
    BridalID AS ProductID,
    'Bridal' AS ProductType,
    BridalStyle AS Origin,
    NULL AS CaratWeight,
    NULL AS Color,
    NULL AS Clarity,
    NULL AS Cut,
    Price,
    NULL AS Shape,
    ImageBridal AS [Image],
    NULL AS Polish,
    NULL AS Symmetry,
    NULL AS TablePercentage,
    NULL AS Depth,
    NULL AS Measurements,
    NULL AS GIAReportNumber,
    NULL AS StockNumber,
    NULL AS LabReportNumber,
    CenterDiamond AS Gemstone,
    NULL AS GradingReport,
    Description AS Descriptors,
    NULL AS Fluorescence,
    Inventory
FROM 
    Bridal

UNION ALL

SELECT 
    DiamondTimepiecesID AS ProductID,
    'DiamondTimepieces' AS ProductType,
    TimepiecesStyle AS Origin,
    NULL AS CaratWeight,
    NULL AS Color,
    NULL AS Clarity,
    NULL AS Cut,
    Price,
    NULL AS Shape,
    ImageTimepieces AS [Image],
    NULL AS Polish,
    NULL AS Symmetry,
    NULL AS TablePercentage,
    NULL AS Depth,
    NULL AS Measurements,
    NULL AS GIAReportNumber,
    NULL AS StockNumber,
    NULL AS LabReportNumber,
    NULL AS Gemstone,
    NULL AS GradingReport,
    Description AS Descriptors,
    NULL AS Fluorescence,
    Inventory
FROM 
    DiamondTimepieces

UNION ALL

SELECT 
    DiamondRingsID AS ProductID,
    'DiamondRings' AS ProductType,
    RingStyle AS Origin,
    CenterDiamondCaratWeight AS CaratWeight,
    CenterDiamondColor AS Color,
    CenterDiamondClarity AS Clarity,
    NULL AS Cut,
    Price,
    CenterGemstoneShape AS Shape,
    ImageRings AS [Image],
    NULL AS Polish,
    NULL AS Symmetry,
    NULL AS TablePercentage,
    NULL AS Depth,
    NULL AS Measurements,
    NULL AS GIAReportNumber,
    NULL AS StockNumber,
    NULL AS LabReportNumber,
    CenterGemstone AS Gemstone,
    NULL AS GradingReport,
    Description AS Descriptors,
    Fluorescence,
    Inventory
FROM 
    DiamondRings;
`);
    return result.recordsets;
  } catch (error) {
    console.error("Connection SQL error:", error);
    throw error;
  }
}

async function getAllBrands() {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query(`
          SELECT BrandName, ImageBrand
          FROM Bridal
          
          UNION ALL
          
          SELECT BrandName, ImageBrand
          FROM DiamondTimepieces
          
          UNION ALL
          
          SELECT BrandName, ImageBrand
          FROM DiamondRings
      `);

    // Use a JavaScript Map to ensure uniqueness
    const uniqueBrands = new Map();
    result.recordset.forEach((record) => {
      if (!uniqueBrands.has(record.BrandName)) {
        uniqueBrands.set(record.BrandName, record.ImageBrand);
      }
    });

    // Convert the map back to an array of objects
    const uniqueBrandsArray = Array.from(
      uniqueBrands,
      ([BrandName, ImageBrand]) => ({ BrandName, ImageBrand })
    );

    return uniqueBrandsArray;
  } catch (error) {
    console.error("SQL error", error);
    throw new Error("Database query error");
  } finally {
    await sql.close(); // Ensure the connection is closed
  }
}

async function getAllDiamonds() {
  try {
    let pool = await sql.connect(config);
    let products = await pool.request().query("SELECT * FROM Diamond");
    return products.recordsets;
  } catch (error) {
    console.error("SQL error", error);
    throw error;
  }
}

async function getAllDiamondRings() {
  try {
    let pool = await sql.connect(config);
    let product = await pool.request().query(`SELECT DR.*,
      m.MaterialName,
      rs.RingSize,
      rp.Price
 FROM DiamondRings DR 
 CROSS JOIN 
     Material m
 CROSS JOIN 
     RingSize rs
 CROSS JOIN
   RingsPrice rp
 WHERE
   m.MaterialID = 1 AND rs.RingSizeID = 1 AND rp.PriceID = 1`);
    return product.recordsets;
  } catch (error) {
    console.log("SQL error", error);
    throw error;
  }
}

async function getAllTimePieces() {
  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .query("SELECT * FROM DiamondTimepieces");
    return result.recordsets;
  } catch (error) {
    console.error("Connection SQL error:", error);
    throw error;
  }
}

async function getAllBanner() {
  try {
    const pool = await sql.connect(config);
    const results = await pool.request().query("SELECT * FROM Banner");
    return results.recordsets;
  } catch (error) {
    console.error("Connection SQL error:", error);
  }
}

//insert Diamond
const insertDiamond = async (diamondData) => {
  try {
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
    } = diamondData;

    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("DiamondOrigin", sql.VarChar, diamondOrigin)
      .input("CaratWeight", sql.Float, caratWeight)
      .input("Color", sql.VarChar, color)
      .input("Clarity", sql.VarChar, clarity)
      .input("Cut", sql.VarChar, cut)
      .input("Price", sql.Float, price)
      .input("Shape", sql.VarChar, shape)
      .input("Image", sql.VarChar, image)
      .input("Polish", sql.VarChar, polish)
      .input("Symmetry", sql.VarChar, symmetry)
      .input("TablePercentage", sql.Decimal, tablePercentage)
      .input("Depth", sql.Decimal, depth)
      .input("Measurements", sql.VarChar, measurements)
      .input("GIAReportNumber", sql.VarChar, giaReportNumber)
      .input("StockNumber", sql.VarChar, stockNumber)
      .input("LabReportNumber", sql.VarChar, labReportNumber)
      .input("Gemstone", sql.VarChar, gemstone)
      .input("GradingReport", sql.VarChar, gradingReport)
      .input("Descriptors", sql.Text, descriptors)
      .input("Fluorescence", sql.VarChar, fluorescence)
      .input("Inventory", sql.Int, 1).query(`
        INSERT INTO Diamond (DiamondOrigin, CaratWeight, Color, Clarity, Cut, Price, Shape, Image, Polish, Symmetry, TablePercentage, Depth, Measurements, GIAReportNumber, StockNumber, LabReportNumber, Gemstone, GradingReport, Descriptors, Fluorescence, Inventory)
        VALUES (@DiamondOrigin, @CaratWeight, @Color, @Clarity, @Cut, @Price, @Shape, @Image, @Polish, @Symmetry, @TablePercentage, @Depth, @Measurements, @GIAReportNumber, @StockNumber, @LabReportNumber, @Gemstone, @GradingReport, @Descriptors, @Fluorescence, @Inventory)
      `);
    return result;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

// edit diamond
const updateDiamond = async (diamondData) => {
  try {
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
      stockNumber, // Use StockNumber instead of DiamondID
      labReportNumber,
      gemstone,
      gradingReport,
      descriptors,
      fluorescence,
      inventory,
    } = diamondData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("DiamondOrigin", sql.VarChar, diamondOrigin)
      .input("CaratWeight", sql.Float, caratWeight)
      .input("Color", sql.VarChar, color)
      .input("Clarity", sql.VarChar, clarity)
      .input("Cut", sql.VarChar, cut)
      .input("Price", sql.Float, price)
      .input("Shape", sql.VarChar, shape)
      .input("Image", sql.VarChar, image)
      .input("Polish", sql.VarChar, polish)
      .input("Symmetry", sql.VarChar, symmetry)
      .input("TablePercentage", sql.Decimal, tablePercentage)
      .input("Depth", sql.Decimal, depth)
      .input("Measurements", sql.VarChar, measurements)
      .input("GIAReportNumber", sql.VarChar, giaReportNumber)
      .input("StockNumber", sql.VarChar, stockNumber) // Bind StockNumber
      .input("LabReportNumber", sql.VarChar, labReportNumber)
      .input("Gemstone", sql.VarChar, gemstone)
      .input("GradingReport", sql.VarChar, gradingReport)
      .input("Descriptors", sql.Text, descriptors)
      .input("Fluorescence", sql.VarChar, fluorescence)
      .input("Inventory", sql.Int, inventory).query(`
        UPDATE Diamond
        SET 
          DiamondOrigin = @DiamondOrigin,
          CaratWeight = @CaratWeight,
          Color = @Color,
          Clarity = @Clarity,
          Cut = @Cut,
          Price = @Price,
          Shape = @Shape,
          Image = @Image,
          Polish = @Polish,
          Symmetry = @Symmetry,
          TablePercentage = @TablePercentage,
          Depth = @Depth,
          Measurements = @Measurements,
          GIAReportNumber = @GIAReportNumber,
          LabReportNumber = @LabReportNumber,
          Gemstone = @Gemstone,
          GradingReport = @GradingReport,
          Descriptors = @Descriptors,
          Fluorescence = @Fluorescence,
          Inventory = @Inventory
        WHERE StockNumber = @StockNumber
      `);

    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Delete Diamond
const deleteDiamond = async (dataSource) => {
  try {
    const { diamondId } = dataSource;

    let pool = await sql.connect(config);
    let results = await pool.request().input("diamondId", sql.Int, diamondId)
      .query(`
        DELETE FROM Diamond
        WHERE DiamondID = @diamondId
      `);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//insert Diamond Rings
const insertDiamondRings = async (diamondRingsData) => {
  try {
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
    } = diamondRingsData;
    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("RingStyle", sql.VarChar, ringStyle)
      .input("NameRings", sql.VarChar, nameRings)
      .input("Category", sql.VarChar, category)
      .input("BrandName", sql.VarChar, brandName)
      .input("Material", sql.VarChar, material)
      .input("CenterGemstone", sql.VarChar, centerGemstone)
      .input("CenterGemstoneShape", sql.VarChar, centerGemstoneShape)
      .input("Width", sql.Decimal, width)
      .input("CenterDiamondDimension", sql.Int, centerDiamondDimension)
      .input("Weight", sql.Decimal, weight)
      .input("GemstoneWeight", sql.Decimal, gemstoneWeight)
      .input("CenterDiamondColor", sql.VarChar, centerDiamondColor)
      .input("CenterDiamondClarity", sql.VarChar, centerDiamondClarity)
      .input("CenterDiamondCaratWeight", sql.Decimal, centerDiamondCaratWeight)
      .input("RingSize", sql.Decimal, ringSize)
      .input("Price", sql.Float, price)
      .input("Gender", sql.VarChar, gender)
      .input("Fluorescence", sql.VarChar, fluorescence)
      .input("Description", sql.VarChar, description)
      .input("ImageRings", sql.VarChar, imageRings)
      .input("ImageBrand", sql.VarChar, imageBrand)
      .input("Inventory", sql.Int, 1)
      .query(`INSERT INTO DiamondRings (RingStyle, NameRings, Category, BrandName, Material, CenterGemstone, CenterGemstoneShape, Width, CenterDiamondDimension, Weight, GemstoneWeight, CenterDiamondColor, CenterDiamondClarity, CenterDiamondCaratWeight, RingSize, Price, Gender, Fluorescence, Description, ImageRings, ImageBrand, Inventory)
            VALUES (@RingStyle, @NameRings, @Category, @BrandName, @Material, @CenterGemstone, @CenterGemstoneShape, @Width, @CenterDiamondDimension, @Weight, @GemstoneWeight, @CenterDiamondColor, @CenterDiamondClarity, @CenterDiamondCaratWeight, @RingSize, @Price, @Gender, @Fluorescence, @Description, @ImageRings, @ImageBrand, @Inventory)
          `);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Update Diamond Rings
const updateDiamondRings = async (diamondRingsData) => {
  try {
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
    } = diamondRingsData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("RingStyle", sql.VarChar, ringStyle)
      .input("NameRings", sql.VarChar, nameRings)
      .input("Category", sql.VarChar, category)
      .input("BrandName", sql.VarChar, brandName)
      .input("Material", sql.VarChar, material)
      .input("CenterGemstone", sql.VarChar, centerGemstone)
      .input("CenterGemstoneShape", sql.VarChar, centerGemstoneShape)
      .input("Width", sql.Decimal, width)
      .input("CenterDiamondDimension", sql.Int, centerDiamondDimension)
      .input("Weight", sql.Decimal, weight)
      .input("GemstoneWeight", sql.Decimal, gemstoneWeight)
      .input("CenterDiamondColor", sql.VarChar, centerDiamondColor)
      .input("CenterDiamondClarity", sql.VarChar, centerDiamondClarity)
      .input("CenterDiamondCaratWeight", sql.Decimal, centerDiamondCaratWeight)
      .input("RingSize", sql.Decimal, ringSize)
      .input("Price", sql.Float, price)
      .input("Gender", sql.VarChar, gender)
      .input("Fluorescence", sql.VarChar, fluorescence)
      .input("Description", sql.VarChar, description)
      .input("ImageRings", sql.VarChar, imageRings)
      .input("ImageBrand", sql.VarChar, imageBrand)
      .input("Inventory", sql.Int, inventory).query(`UPDATE DiamondRings
        SET 
          NameRings = @NameRings,
          Category = @Category,
          BrandName = @BrandName,
          Material = @Material,
          CenterGemstone = @CenterGemstone,
          CenterGemstoneShape = @CenterGemstoneShape,
          Width = @Width,
          CenterDiamondDimension = @CenterDiamondDimension,
          Weight = @Weight,
          GemstoneWeight = @GemstoneWeight,
          CenterDiamondColor = @CenterDiamondColor,
          CenterDiamondClarity = @CenterDiamondClarity,
          CenterDiamondCaratWeight = @CenterDiamondCaratWeight,
          RingSize = @RingSize,
          Price = @Price,
          Gender = @Gender,
          Fluorescence = @Fluorescence,
          Description = @Description,
          ImageRings = @ImageRings,
          ImageBrand = @ImageBrand,
          Inventory = @Inventory
        WHERE RingStyle = @RingStyle`);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Delete Diamond Rings
const deleteDiamondRings = async (diamondRingsData) => {
  try {
    const { diamondRingsId } = diamondRingsData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("DiamondRingsId", sql.Int, diamondRingsId).query(`
        DELETE FROM DiamondRings
        WHERE DiamondRingsID = @diamondRingsId
      `);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Add Bridals
const insertBridals = async (bridalsData) => {
  try {
    const {
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
      inventory,
    } = bridalsData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("BridalStyle", sql.VarChar, bridalStyle)
      .input("NameBridal", sql.VarChar, nameBridal)
      .input("Category", sql.VarChar, category)
      .input("BrandName", sql.VarChar, brandName)
      .input("Material", sql.VarChar, material)
      .input("SettingType", sql.VarChar, settingType)
      .input("Gender", sql.VarChar, gender)
      .input("Weight", sql.Decimal, weight)
      .input("CenterDiamond", sql.VarChar, centerDiamond)
      .input("DiamondCaratRange", sql.VarChar, diamondCaratRange)
      .input("RingSizeRang", sql.Decimal, ringSizeRange)
      .input("TotalCaratWeight", sql.Decimal, totalCaratweight)
      .input("TotalDiamond", sql.Int, totalDiamond)
      .input("Description", sql.VarChar, description)
      .input("Price", sql.Float, price)
      .input("ImageBridal", sql.VarChar, imageBridal)
      //.input("ImageBrand", sql.VarChar, imageBrand)
      .input("Inventory", sql.Int, 1)
      .query(`INSERT INTO Bridal (BridalStyle, NameBridal, Category, BrandName, Material, SettingType, Gender, Weight, CenterDiamond, DiamondCaratRange, RingSizeRang, TotalCaratWeight, TotalDiamond, Description, Price, ImageBridal, ImageBrand, Inventory)
            VALUES (@BridalStyle, @NameBridal, @Category, @BrandName, @Material, @SettingType, @Gender, @Weight, @CenterDiamond, @DiamondCaratRange, @RingSizeRang, @TotalCaratWeight, @TotalDiamond, @Description, @Price, @ImageBridal, 'https://collections.jewelryimages.net/collections_logos/00008w.jpg', @Inventory)
          `);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Update Bridals
const updateBridals = async (bridalsData) => {
  try {
    const {
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
      inventory,
    } = bridalsData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("BridalStyle", sql.VarChar, bridalStyle)
      .input("NameBridal", sql.VarChar, nameBridal)
      .input("Category", sql.VarChar, category)
      .input("BrandName", sql.VarChar, brandName)
      .input("Material", sql.VarChar, material)
      .input("SettingType", sql.VarChar, settingType)
      .input("Gender", sql.VarChar, gender)
      .input("Weight", sql.Decimal, weight)
      .input("CenterDiamond", sql.VarChar, centerDiamond)
      .input("DiamondCaratRange", sql.VarChar, diamondCaratRange)
      .input("RingSizeRang", sql.Decimal, ringSizeRange)
      .input("TotalCaratWeight", sql.Decimal, totalCaratweight)
      .input("TotalDiamond", sql.Int, totalDiamond)
      .input("Description", sql.VarChar, description)
      .input("Price", sql.Float, price)
      .input("ImageBridal", sql.VarChar, imageBridal)
      .input("Inventory", sql.Int, inventory).query(`UPDATE Bridal
        SET 
          NameBridal = @NameBridal,
          Category = @Category,
          BrandName = @BrandName,
          Material = @Material,
          SettingType = @SettingType,
          Gender = @Gender,
          Weight = @Weight,
          CenterDiamond = @CenterDiamond,
          DiamondCaratRange = @DiamondCaratRange,
          RingSizeRang = @RingSizeRang,
          TotalCaratWeight = @TotalCaratWeight,
          TotalDiamond = @TotalDiamond,
          Description = @Description,
          Price = @Price,
          ImageBridal = @ImageBridal,
          Inventory = @Inventory
        WHERE BridalStyle = @BridalStyle`);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Delete Bridals
const deleteBridals = async (bridalsData) => {
  try {
    const { bridalId } = bridalsData;

    let pool = await sql.connect(config);
    let results = await pool.request().input("BridalID", sql.Int, bridalId)
      .query(`
        DELETE FROM Bridal
        WHERE BridalID = @BridalID
      `);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Add Timepieces
const insertTimepieces = async (timepiecesData) => {
  try {
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
      inventory,
    } = timepiecesData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("TimepiecesStyle", sql.VarChar, timepiecesStyle)
      .input("NameTimepieces", sql.VarChar, nameTimepieces)
      .input("Collection", sql.VarChar, collection)
      .input("WaterResistance", sql.VarChar, waterResistance)
      .input("CrystalType", sql.VarChar, crystalType)
      .input("BraceletMaterial", sql.VarChar, braceletMaterial)
      .input("CaseSize", sql.VarChar, caseSize)
      .input("DialColor", sql.VarChar, dialColor)
      .input("Movement", sql.VarChar, movement)
      .input("Gender", sql.VarChar, gender)
      .input("Category", sql.VarChar, category)
      .input("BrandName", sql.VarChar, brandName)
      .input("DialType", sql.VarChar, dialType)
      .input("Description", sql.VarChar, description)
      .input("Price", sql.Float, price)
      .input("ImageTimepieces", sql.VarChar, imageTimepieces)
      .input("ImageBrand", sql.VarChar, imageBrand)
      .input("Inventory", sql.Int, 1)
      .query(`INSERT INTO DiamondTimepieces (TimepiecesStyle, NameTimepieces, Collection, WaterResistance, CrystalType, BraceletMaterial, CaseSize, DialColor, Movement, Gender, Category, BrandName, DialType, Description, Price, ImageTimepieces, ImageBrand, Inventory)
            VALUES (@TimepiecesStyle, @NameTimepieces, @Collection, @WaterResistance, @CrystalType, @BraceletMaterial, @CaseSize, @DialColor, @Movement, @Gender, @Category, @BrandName, @DialType, @Description, @Price, @ImageTimepieces, @ImageBrand, @Inventory)
          `);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Update Bridals
const updateTimepieces = async (timepiecesData) => {
  try {
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
      inventory,
    } = timepiecesData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("TimepiecesStyle", sql.VarChar, timepiecesStyle)
      .input("NameTimepieces", sql.VarChar, nameTimepieces)
      .input("Collection", sql.VarChar, collection)
      .input("WaterResistance", sql.VarChar, waterResistance)
      .input("CrystalType", sql.VarChar, crystalType)
      .input("BraceletMaterial", sql.VarChar, braceletMaterial)
      .input("CaseSize", sql.VarChar, caseSize)
      .input("DialColor", sql.VarChar, dialColor)
      .input("Movement", sql.VarChar, movement)
      .input("Gender", sql.VarChar, gender)
      .input("Category", sql.VarChar, category)
      .input("BrandName", sql.VarChar, brandName)
      .input("DialType", sql.VarChar, dialType)
      .input("Description", sql.VarChar, description)
      .input("Price", sql.Float, price)
      .input("ImageTimepieces", sql.VarChar, imageTimepieces)
      .input("ImageBrand", sql.VarChar, imageBrand)
      .input("Inventory", sql.Int, inventory).query(`UPDATE DiamondTimepieces
        SET 
          TimepiecesStyle = @TimepiecesStyle,
          NameTimepieces = @NameTimepieces,
          Collection = @Collection,
          WaterResistance = @WaterResistance,
          CrystalType = @CrystalType,
          BraceletMaterial = @BraceletMaterial,
          CaseSize = @CaseSize,
          DialColor = @DialColor,
          Movement = @Movement,
          Gender = @Gender,
          Category = @Category,
          BrandName = @BrandName,
          DialType = @DialType,
          Description = @Description,
          Price = @Price,
          ImageTimepieces = @ImageTimepieces,
          ImageBrand = @ImageBrand,
          Inventory = @Inventory
        WHERE TimepiecesStyle = @TimepiecesStyle`);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};

//Delete Bridals
const deleteTimepieces = async (timepiecesData) => {
  try {
    const { diamondTimepiecesId } = timepiecesData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("DiamondTimepiecesID", sql.Int, diamondTimepiecesId).query(`
        DELETE FROM DiamondTimepieces
        WHERE DiamondTimepiecesID = @DiamondTimepiecesID
      `);
    return results;
  } catch (err) {
    console.error("Database query error:", err);
    throw new Error("Database query error");
  }
};
const getDiamondById = async (id, callback) => {
  try {
    // Establish the connection
    let pool = await sql.connect(config);

    // Prepare the query
    let result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Diamond WHERE DiamondID = @id");

    // Return the result
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  } finally {
    // Close the connection
    sql.close();
  }
};

// const getBridalById = async (id, callback) => {
//   try {
//     // Establish the connection
//     let pool = await sql.connect(config);

//     // Prepare the query
//     let result = await pool
//       .request()
//       .input("id", sql.Int, id)
//       .query("SELECT * FROM Bridal WHERE BridalID = @id");

//     // Return the result
//     callback(null, result.recordset[0]);
//   } catch (err) {
//     callback(err, null);
//   } finally {
//     // Close the connection
//     sql.close();
//   }
// };

const getBridalById = async (id, callback) => {
  try {
    // Establish the connection
    let pool = await sql.connect(config);

    // Prepare the query
    let result = await pool.request().input("id", sql.Int, id)
      .query(`SELECT * FROM Bridal`);

    // Return the result
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  } finally {
    // Close the connection
    sql.close();
  }
};
// const getRingsById = async (id, callback) => {
//   try {
//     // Establish the connection
//     let pool = await sql.connect(config);

//     // Prepare the query
//     let result = await pool
//       .request()
//       .input("id", sql.Int, id)
//       .query("SELECT * FROM DiamondRings WHERE DiamondRingsID = @id");

//     // Return the result
//     callback(null, result.recordset[0]);
//   } catch (err) {
//     callback(err, null);
//   } finally {
//     // Close the connection
//     sql.close();
//   }
// };

const getRingsById = async (id, callback) => {
  try {
    // Establish the connection
    let pool = await sql.connect(config);

    // Prepare the query
    let result = await pool.request().input("id", sql.Int, id)
      .query(`SELECT dr.DiamondRingsID,
	dr.RingStyle,
	dr.NameRings,
	dr.Category,
	dr.BrandName,
	dr.CenterGemstone,
	dr.CenterGemstoneShape,
	dr.Width,
	dr.CenterDiamondDimension,
	dr.Weight,
	dr.GemstoneWeight,
	dr.CenterDiamondColor,
	dr.CenterDiamondClarity,
	dr.CenterDiamondCaratWeight,
	dr.Gender,
	dr.Fluorescence,
	dr.Description,
	dr.ImageRings,
	dr.ImageBrand,
	dr.Inventory
	FROM DiamondRings dr
WHERE dr.DiamondRingsID = @id;`);

    // Return the result
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  } finally {
    // Close the connection
    sql.close();
  }
};

const getTimepiecesById = async (id, callback) => {
  try {
    // Establish the connection
    let pool = await sql.connect(config);

    // Prepare the query
    let result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM DiamondTimepieces WHERE DiamondTimepiecesID = @id");

    // Return the result
    callback(null, result.recordset[0]);
  } catch (err) {
    callback(err, null);
  } finally {
    // Close the connection
    sql.close();
  }
};

async function getRingDetailByMaterialAndSize(material, ringSize) {
  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("material", sql.NVarChar, material)
      .input("ringSize", sql.Decimal, parseFloat(ringSize))
      .query(
        `SELECT TOP 1 DiamondRingsID FROM DiamondRings WHERE Material = @material AND RingSize = @ringSize`
      );

    if (result.recordset.length > 0) {
      return result.recordset[0].DiamondRingsID;
    } else {
      return null; // Return null if no matching ring found
    }
  } catch (error) {
    console.error("Error fetching ring detail", error);
    throw error;
  }
}

//----Bridal Material / Size-----//
// async function getBridalByMaterial() {
//   try {
//     let pool = await sql.connect(config);
//     let products = await pool.request().query("SELECT * FROM Material");
//     return products.recordsets;
//   } catch (error) {
//     console.error("SQL error", error);
//     throw error;
//   }
// }

// async function getBridalByRingSize() {
//   try {
//     let pool = await sql.connect(config);
//     let products = await pool.request().query("SELECT * FROM RingSize");
//     return products.recordsets;
//   } catch (error) {
//     console.error("SQL error", error);
//     throw error;
//   }
// }


// Function to fetch material details
const getMaterialDetails = async () => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Material"); // Replace with your actual query
    return result.recordset;
  } catch (error) {
    throw new Error(`Error fetching material details: ${error.message}`);
  }
};

// Function to fetch ring size details
const getRingSizeDetails = async () => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM RingSize"); // Replace with your actual query
    return result.recordset;
  } catch (error) {
    throw new Error(`Error fetching ring size details: ${error.message}`);
  }
};

async function getBridalAccessory() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
    .query(`SELECT
      m.MaterialName,
      rs.RingSize,
	    rp.Price
  FROM RingsAccessory ra
  JOIN Material m ON ra.MaterialID = m.MaterialID
  JOIN RingSize rs ON ra.RingSizeID = rs.RingSizeID
  JOIN RingsPrice rp ON ra.PriceID = rp.PriceID`)
  return result.recordset;
  } catch(error){
    console.log("error")
  }
}

module.exports = {
  getAllBridals,
  getAllBrands,
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
};
