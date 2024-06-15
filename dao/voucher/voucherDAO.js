const sql = require('mssql');
const config = require('../../config/dbconfig');

class VoucherDAO {
    async getVouchers() {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request().query('SELECT * FROM Voucher');
            return result.recordset;
        } catch (error) {
            console.error('Error fetching vouchers:', error);
            throw error;
        }
    }

    async getVoucherByName(voucherName) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('VoucherName', sql.VarChar, voucherName)
                .query('SELECT * FROM Voucher WHERE VoucherName = @VoucherName');
            return result.recordset[0];
        } catch (error) {
            console.error('Error fetching voucher:', error);
            throw error;
        }
    }

    async createVoucher(voucher) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('VoucherName', sql.VarChar, voucher.VoucherName)
                .input('UsagedQuantity', sql.Int, voucher.UsagedQuantity)
                .input('TotalQuantity', sql.Int, voucher.TotalQuantity)
                .input('Type', sql.VarChar, voucher.Type)
                .input('ValidFrom', sql.Date, voucher.ValidFrom)
                .input('ExpirationDate', sql.Date, voucher.ExpirationDate)
                .input('Condition', sql.NVarChar, voucher.Condition)
                .input('Prerequisites', sql.Decimal(10, 2), voucher.Prerequisites)
                .input('Discount', sql.Float, voucher.Discount)
                .query(`INSERT INTO Voucher (VoucherName, UsagedQuantity, TotalQuantity, Type, ValidFrom, ExpirationDate, Condition, Prerequisites, Discount) 
                        VALUES (@VoucherName, @UsagedQuantity, @TotalQuantity, @Type, @ValidFrom, @ExpirationDate, @Condition, @Prerequisites, @Discount)`);
            return result.recordset;
        } catch (error) {
            console.error('Error creating voucher:', error);
            throw error;
        }
    }

    async updateVoucher(id, voucher) {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('VoucherID', sql.Int, id)
                .input('VoucherName', sql.VarChar, voucher.VoucherName)
                .input('UsagedQuantity', sql.Int, voucher.UsagedQuantity)
                .input('TotalQuantity', sql.Int, voucher.TotalQuantity)
                .input('Type', sql.VarChar, voucher.Type)
                .input('ValidFrom', sql.Date, voucher.ValidFrom)
                .input('ExpirationDate', sql.Date, voucher.ExpirationDate)
                .input('Condition', sql.NVarChar, voucher.Condition)
                .input('Prerequisites', sql.Decimal(10, 2), voucher.Prerequisites)
                .input('Discount', sql.Float, voucher.Discount)
                .query(`UPDATE Voucher SET 
                        VoucherName = @VoucherName,
                        UsagedQuantity = @UsagedQuantity,
                        TotalQuantity = @TotalQuantity,
                        Type = @Type,
                        ValidFrom = @ValidFrom,
                        ExpirationDate = @ExpirationDate,
                        Condition = @Condition,
                        Prerequisites = @Prerequisites,
                        Discount = @Discount
                        WHERE VoucherID = @VoucherID`);
            return result.recordset;
        } catch (error) {
            console.error('Error updating voucher:', error);
            throw error;
        }
    }
}

module.exports = new VoucherDAO();
