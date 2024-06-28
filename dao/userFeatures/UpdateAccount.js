const dbConfig = require("../../config/dbconfig");
const sql = require('mssql');

async function UpdateAccount(accountId, userData) {
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
            Image
        } = userData;

        if (!FirstName || !LastName || !Gender || !Birthday || !PhoneNumber || !Address || !Country || !City || !Province || !PostalCode) {
            return { status: false, message: 'Please input required fields' };
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
            .input("Image", sql.NVarChar, Image)
            .input("AccountID", sql.Int, accountId);

        const query = `UPDATE Account 
                       SET 
                           FirstName = @FirstName,
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
                       WHERE AccountID = @AccountID`;

        const result = await updateAccount.query(query);

        if (result.rowsAffected[0] > 0) {
            return { status: true, message: 'Account updated successfully' };
        } else {
            return { status: false, message: 'Account not found' };
        }
    } catch (error) {
        console.error("Database query error:", error);
        throw new Error("Database query error");
    }
}


// 0: activated  1: deactivated
async function accountStatus(account) {
    try {
        const { email, status } = account;
        const db = await sql.connect(dbConfig);
        const check = await db.request()
            .input("Email", sql.NVarChar, email)
            .query("SELECT RoleName FROM Roles r JOIN Account AS a ON r.RoleID = a.RoleID WHERE a.Email = @Email");

        const recordset = check.recordset;

        if (recordset.length === 0) {
            return { status: false, message: 'User Not Found' };
        }

        const role = recordset[0].RoleName;

        if (role === "Admin") {
            return { status: false, message: 'Admin cannot be disabled' };
        } else {
            let query;
            let responseMessage;

            if (status === 1) {
                query = "UPDATE Account SET Status = 'Deactivate' WHERE Email = @Email";
                responseMessage = 'Account Deactivated';
            } else if (status === 0) {
                query = "UPDATE Account SET Status = 'Activate' WHERE Email = @Email";
                responseMessage = 'Account Activated';
            } else {
                return { status: false, message: 'Invalid status value' };
            }

            await db.request()
                .input("Email", sql.NVarChar, email)
                .query(query);

            return { status: true, message: responseMessage };
        }

    } catch (error) {
        console.error("Database query error:", error);
        throw new Error("Database query error");
    }
}

async function deleteAccount(account) {
    try {
        const { email } = account;
        const db = await sql.connect(dbConfig);
        const check = await db.request()
            .input("Email", sql.NVarChar, email)
            .query("SELECT RoleName FROM Roles r JOIN Account a ON r.RoleID = a.RoleID WHERE a.Email = @Email ");
        if (check === "Admin") {
            return { status: false, message: 'Admin cannot be Deleted' };
        } else {
            const deleteAccount = await db.request()
                .input("Email", sql.NVarChar, email)
                .query("DELETE FROM Account WHERE Email = @Email ; DELETE FROM Roles WHERE RoleID NOT IN (SELECT RoleID FROM Account);");

            if (deleteAccount.rowsAffected[0] > 0) {
                return { status: true, message: 'Account Deleted' };
            } else {
                return { status: false, message: 'Account Not Found or Already Deleted' };
            }
        }
    } catch (error) {
        console.error("Database query error:", error);
        throw new Error("Database query error");
    }
}

module.exports = {
    UpdateAccount,
    accountStatus,
    deleteAccount
};
