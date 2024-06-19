const sql = require('mssql');
const config = require('../../config/dbconfig');

class certificateDAO {
    async addCertificate(cert){
        try {
            let pool = await sql.connect(config);
            let addcert = await pool.request()
            .input('InspectionDate', sql.Date, cert.InspectionDate)
            .input('ClarityGrade', sql.VarChar, cert.ClarityGrade)
            .input('ShapeAndCuttingStyle', sql.VarChar, cert.ShapeAndCuttingStyle)
            .input('GIAReportNumber', sql.VarChar, cert.GIAReportNumber)
            .input('Measurements', sql.VarChar, cert.Measurements)
            .input('CaratWeight', sql.VarChar, cert.CaratWeight)
            .input('ColorGrade', sql.VarChar, cert.ColorGrade)
            .input('SymmetryGrade', sql.VarChar, cert.SymmetryGrade)
            .input('CutGrade', sql.VarChar, cert.CutGrade)
            .input('PolishGrade', sql.VarChar, cert.PolishGrade)
            .input('Fluorescence', sql.VarChar, cert.Fluorescence)
            .query("INSERT INTO Certificate(InspectionDate, ClarityGrade, ShapeAndCuttingStyle, GIAReportNumber, Measurements, CaratWeight, ColorGrade, SymmetryGrade, CutGrade, PolishGrade, Fluorescence, ImageLogoCertificate) VALUES(@InspectionDate, @ClarityGrade, @ShapeAndCuttingStyle, @GIAReportNumber, @Measurements, @CaratWeight, @ColorGrade, @SymmetryGrade, @CutGrade, @PolishGrade, @Fluorescence, 'https://firebasestorage.googleapis.com/v0/b/the-diamond-anh3.appspot.com/o/Logo%2FGIA-Logo.jpg?alt=media&token=f43782e9-589b-4e3f-b35c-5c11a36950d0')");
            if (addcert.rowsAffected[0] > 0) {
                return { status: true, message: 'The certificate has been added successfully' };
            } else {
                return { status: false, message: 'The certificate cannot be added' };
            }
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }
    async getcertByNum(reportNO) {
        try {
            const pool = await sql.connect(config);
            const certNO = await pool.request()
                .input('GIAReportNumber', sql.NVarChar, reportNO.GIAReportNumber)
                .query('SELECT GIAReportNumber, InspectionDate, ClarityGrade, ShapeAndCuttingStyle, Measurements, CaratWeight, ColorGrade, SymmetryGrade, CutGrade, PolishGrade, Fluorescence FROM Certificate WHERE GIAReportNumber = @GIAReportNumber');
            return certNO.recordset;

        } catch (err) {
            console.log(err);
            return { message: 'cert not Available' };
        }
    }
    async updatecert (ReportNumber, cert){
        try {
            let pool = await sql.connect(config);
            let updatecert = await pool.request()
            .input('ClarityGrade', sql.VarChar, cert.ClarityGrade)
            .input('ShapeAndCuttingStyle', sql.VarChar, cert.ShapeAndCuttingStyle)
            .input('GIAReportNumber', sql.VarChar, ReportNumber)
            .input('Measurements', sql.VarChar, cert.Measurements)
            .input('CaratWeight', sql.VarChar, cert.CaratWeight)
            .input('ColorGrade', sql.VarChar, cert.ColorGrade)
            .input('SymmetryGrade', sql.VarChar, cert.SymmetryGrade)
            .input('CutGrade', sql.VarChar, cert.CutGrade)
            .input('PolishGrade', sql.VarChar, cert.PolishGrade)
            .input('Fluorescence', sql.VarChar, cert.Fluorescence)
            .query("UPDATE Certificate SET ClarityGrade =@ClarityGrade, ShapeAndCuttingStyle = @ShapeAndCuttingStyle,  Measurements = @Measurements, CaratWeight = @CaratWeight, ColorGrade = @ColorGrade, SymmetryGrade = @SymmetryGrade, CutGrade = @CutGrade, PolishGrade = @PolishGrade, Fluorescence = @Fluorescence WHERE GIAReportNumber = @GIAReportNumber");
            if (updatecert.rowsAffected[0] > 0) {
                return { status: true, message: 'The certificate has been updated successfully' };
            } else {
                return { status: false, message: 'The certificate cannot be updated' };
            }
        } catch (err) {
            console.log(err);
            return { message: 'cert not Available' };
        }
    }
    
}

module.exports = new certificateDAO();