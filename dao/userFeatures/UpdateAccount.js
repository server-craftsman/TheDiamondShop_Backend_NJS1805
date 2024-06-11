const dbConfig = require("../../config/dbconfig");
const sql = require('mssql');

async function UpdateAccount(userData) {
    try {
        const {
            FirstName,
            LastName,
            Gender,
            Birthday,
            PhoneNumber,
            Address,
            Country,
            City,
            Province,
            PostalCode,
            Email,
            RoleName,
            Image
        } = userData;

        if (!FirstName || !LastName || !Gender || !Birthday || !Email || !PhoneNumber || !Address || !Country || !City || !Province || !PostalCode || !RoleName) {
            return { status: false, message: 'Please Input Required field' };
        }

        const db = await sql.connect(dbConfig);
        const updateAccount = await db.request()
            .input("FirstName", sql.NVarChar, FirstName)
            .input("LastName", sql.NVarChar, LastName)
            .input("Gender", sql.NVarChar, Gender)
            .input("Birthday", sql.Date, Birthday)
            .input("PhoneNumber", sql.NVarChar, PhoneNumber)
            .input("Address", sql.NVarChar, Address)
            .input("Country", sql.NVarChar, Country)
            .input("City", sql.NVarChar, City)
            .input("Province", sql.NVarChar, Province)
            .input("PostalCode", sql.NVarChar, PostalCode)
            .input("Image", sql.VarChar, Image)
            .input("Email", sql.NVarChar, Email)
            .input("RoleName", sql.NVarChar, RoleName) 
            .query(`UPDATE Account 
                    SET FirstName = @FirstName,
                        LastName = @LastName,
                        Gender = @Gender,
                        Birthday = @Birthday,
                        PhoneNumber = @PhoneNumber,
                        Address = @Address,
                        Country = @Country,
                        City = @City,
                        Province = @Province,
                        PostalCode = @PostalCode,
                        Image = @Image
                    FROM Account a
                    JOIN Roles r ON a.RoleID = r.RoleID
                    WHERE a.Email = @Email AND r.RoleName = @RoleName;`);

        if (updateAccount.rowsAffected[0] > 0) {
            return { status: true, message: 'Account Updated Successfully' };
        } else {
            return { status: false, message: 'Account Not Found' };
        }

    } catch (error) {
        console.error("Database query error:", error);
        throw new Error("Database query error");
    }
}

module.exports = {
    UpdateAccount
};
