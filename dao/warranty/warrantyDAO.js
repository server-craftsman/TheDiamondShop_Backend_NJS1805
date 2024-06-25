const sql = require('mssql');
const config = require('../../config/dbconfig');
async function getWarranty() {
    try {
        const pool = await sql.connect(config);
        const results = await pool.request()
        .query('SELECT * FROM WarrantyReceipt');
        return results.recordsets;
    }catch (error) {
            console.error('Error fetching vouchers:', error);
            throw error;
        }
}

async function getWarrantybyReportNo(reportNo) {
    try {
        const pool = await sql.connect(config);
        const results = await pool.request()
            .input('reportNo', sql.VarChar, reportNo) // Use parameterized query
            .query('SELECT * FROM WarrantyReceipt WHERE ReportNo = @reportNo'); // Use @reportNo as the parameter
        return results.recordset; // use recordset instead of recordsets[0]
    } catch (error) {
        console.error('Error fetching Warranty:', error);
        throw error;
    }
}

const createWarranty = async (warrantyData) => {
    try {
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
            orderDetailId
        } = warrantyData;
        let pool = await sql.connect(config);
        let results = await pool.request()
        .request()
        .input("ReportNo", sql.VarChar, reportNo)
        .input("Description", sql.VarChar, description)
        .input("Date", sql.Date, date)
        .input("PlaceToBuy", sql.VarChar, placeToBuy)
        .input("Period", sql.Date, period)
        .input("WarrantyType", sql.VarChar, warrantyType)
        .input("WarrantyConditions", sql.VarChar, warrantyConditions)
        .input("AccompaniedService", sql.VarChar, accompaniedService)
        .input("Condition", sql.VarChar, condition)
        .input("OrderDetailID", sql.Int, orderDetailId)
        .query(`INSERT INTO WarrantyReceipt (ReportNo, Description, Date, PlaceToBuy, Period, WarrantyType, WarrantyConditions, AccompaniedService, Condition, OrderDetailId)
                VALUES (@ReportNo, @Description, @Date, @PlaceToBuy, @Period, @WarrantyType, @WarrantyConditions, @AccompaniedService, @Condition, @OrderDetailId)
            `);
            return results;
    }catch (err) {
        console.error("Database query error:", err);
        throw new Error("Database query error");
      }
};

const updateWarranty = async (warrantyData) => {
    try {
        const {
            description,
            date,
            placeToBuy,
            period,
            warrantyType,
            warrantyConditions,
            accompaniedService,
            condition,
            orderDetailId
        } = warrantyData;

        let pool = await sql.connect(config);
        let results = await pool
        .request()
        .input("ReportNo", sql.VarChar, reportNo)
        .input("Description", sql.VarChar, description)
        .input("Date", sql.Date, date)
        .input("PlaceToBuy", sql.VarChar, placeToBuy)
        .input("Period", sql.Date, period)
        .input("WarrantyType", sql.VarChar, warrantyType)
        .input("WarrantyConditions", sql.VarChar, warrantyConditions)
        .input("AccompaniedService", sql.VarChar, accompaniedService)
        .input("Condition", sql.VarChar, condition)
        .input("OrderDetailID", sql.Int, orderDetailId)
        .query(`UPDATE WarrantyReceipt
                SET
                    Description = @Description,
                    Date = @Date,
                    PlaceToBuy = @PlaceToBuy,
                    Period = @Period,
                    WarrantyType = @WarrantyType,
                    WarrantyConditions = @WarrantyConditions,
                    AccompaniedService = @AccompaniedService,
                    Condition = @Condition
                    OrderDetailId = @OrderDetailID
                WHERE ReportNo = @ReportNo
                `);
        return results;
    }catch (err) {
        console.error("Database query error:", err);
        throw new Error("Database query error");
      }
};
module.exports = {
    getWarranty,
    getWarrantybyReportNo,
    createWarranty,
    updateWarranty,
    
}