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
                        Descriptions = @Description,
                        Date = @Date,
                        PlaceToBuy = @PlaceToBuy,
                        Period = @Period,
                        WarrantyType = @WarrantyType,
                        WarrantyConditions = @WarrantyConditions,
                        AccompaniedService = @AccompaniedService,
                        Condition = @Condition,
                        OrderDetailId = @OrderDetailID
                    WHERE ReportNo = @ReportNo
                `);
        return results;
    } catch (err) {
        console.error("Database query error:", err);
        throw new Error("Database query error");
    }
};

async function getWarrantyByReportNoOrderDetails(reportNo) {
    try {
        const pool = await sql.connect(config);
        const results = await pool.request()
            .input('reportNo', sql.VarChar, reportNo)  // Use parameterized query
            .query(`
                SELECT 
                    o.OrderDate,
                    o.Quantity,
                    o.OrderStatus,
                    o.TotalPrice,
                    a.FirstName,
                    a.LastName,
                    a.Email,
                    od.AttachedAccessories,
                    od.Shipping,
                    od.OrderStatus AS OrderDetailStatus,
                    w.ReportNo,
                    w.Descriptions,
                    w.Date,
                    w.PlaceToBuy,
                    w.Period,
                    w.WarrantyType,
                    w.WarrantyConditions,
                    w.AccompaniedService,
                    w.Condition
                FROM 
                    Orders o
                JOIN 
                    Account a ON o.AccountID = a.AccountID
                JOIN 
                    OrderDetails od ON o.OrderID = od.OrderID
                JOIN 
                    WarrantyReceipt w ON od.OrderDetailID = w.OrderDetailID
                WHERE 
                    w.ReportNo = @reportNo
            `);  // Use @reportNo as the parameter
        return results.recordset;  // use recordset instead of recordsets[0]
    } catch (error) {
        console.error('Error fetching Warranty:', error);
        throw error;
    }
}

//View Warranty Status Proccessing
async function viewWarrantyStatusProcessing() {
    try{
        let pool = await sql.connect(config)
        let results = await pool
        .request()
        .query(`SELECT
            o.OrderID,
            od.FirstName,
            od.LastName,
            od.PhoneNumber,
            o.OrderDate,
            o.Quantity,
            o.OrderStatus,
            o.TotalPrice,
            od.RequestWarranty,
            od.WarrantyStatus,
            od.AttachedAccessories,
            od.Shipping,
            od.DeliveryAddress
            FROM
                Orders o
            JOIN
                OrderDetails od ON o.OrderID = od.OrderID
            WHERE od.WarrantyStatus IN ('Processing')
            `);
        return results.recordsets;
    }catch (error) {
        console.error("Connection SQL error:", error);
        throw error;
    }};

//View Warranty Status ("Completed")
async function viewWarrantyStatusCompleted() {
    try{
        let pool = await sql.connect(config)
        let results = await pool
        .request()
        .query(`SELECT
            o.OrderID,
            od.FirstName,
            od.LastName,
            od.PhoneNumber,
            o.OrderDate,
            o.Quantity,
            o.OrderStatus,
            o.TotalPrice,
            od.RequestWarranty,
            od.WarrantyStatus,
            od.AttachedAccessories,
            od.Shipping,
            od.DeliveryAddress
            FROM
                Orders o
            JOIN
                OrderDetails od ON o.OrderID = od.OrderID
            WHERE od.WarrantyStatus IN ('Completed')
            `);
        return results.recordsets;
    }catch (error) {
        console.error("Connection SQL error:", error);
        throw error;
    }};

module.exports = {
    getWarranty,
    getWarrantybyReportNo,
    createWarranty,
    updateWarranty,
    getWarrantyByReportNoOrderDetails,
    viewWarrantyStatusProcessing,
    viewWarrantyStatusCompleted,
}