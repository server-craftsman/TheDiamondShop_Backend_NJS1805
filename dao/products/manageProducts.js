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

module.exports = {
  getAllBridals,
  getAllBrands,
  getAllDiamonds,
  getAllDiamondRings,
  getAllTimePieces,
};
