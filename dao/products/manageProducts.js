const config = require("../../config/dbconfig");
const sql = require("mssql");

async function getAllBridals() {
  try {
    let pool = await sql.connect(config);
    let products = await pool.request().query("SELECT * FROM Bridal");
    return products.recordsets;
  } catch (error) {
    console.error("SQL error", error);
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
      result.recordset.forEach(record => {
          if (!uniqueBrands.has(record.BrandName)) {
              uniqueBrands.set(record.BrandName, record.ImageBrand);
          }
      });

      // Convert the map back to an array of objects
      const uniqueBrandsArray = Array.from(uniqueBrands, ([BrandName, ImageBrand]) => ({ BrandName, ImageBrand }));

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
    let product = await pool.request().query("SELECT * FROM DiamondRings");
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
    const results = await pool
    .request()
    .query("SELECT * FROM Banner");
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
      inventory,
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
      .input("Inventory", sql.Int, inventory).query(`
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
      diamondId,
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
    } = diamondData;

    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("DiamondID", sql.Int, diamondId)
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
      .input("Inventory", sql.Int, inventory)
      .query(`
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
          StockNumber = @StockNumber,
          LabReportNumber = @LabReportNumber,
          Gemstone = @Gemstone,
          GradingReport = @GradingReport,
          Descriptors = @Descriptors,
          Fluorescence = @Fluorescence,
          Inventory = @Inventory
        WHERE DiamondID = @DiamondID
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
    const{
      diamondId
    } = dataSource;
    
    let pool = await sql.connect(config);
    let results = await pool
      .request()
      .input("diamondId", sql.Int, diamondId)
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


module.exports = {
  getAllBridals,
  getAllBrands,
  getAllDiamonds,
  getAllDiamondRings,
  getAllTimePieces,
  getAllBanner,
  insertDiamond,
  updateDiamond,
  deleteDiamond,
};
