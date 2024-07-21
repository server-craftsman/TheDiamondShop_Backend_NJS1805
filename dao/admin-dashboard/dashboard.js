const dbConfig = require('../../config/dbconfig');
const sql = require('mssql');

async function getConnection() {
    try {
        const pool = await sql.connect(dbConfig); // Use dbConfig here
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}

//test first dashboard || tổng sổ lượng từng loại sản phẩm, số lượng bán ra tất cả sản phẩm, tổng doanh thu
async function getDashboardData() {
    const pool = await getConnection();

    const query = `
    SELECT
      (SELECT COUNT(*) FROM Diamond) AS TotalDiamonds,
      (SELECT COUNT(*) FROM Bridal) AS TotalBridal,
      (SELECT COUNT(*) FROM DiamondRings) AS TotalDiamondRings,
      (SELECT COUNT(*) FROM DiamondTimepieces) AS TotalDiamondTimepieces,
      (SELECT COUNT(*) FROM Orders WHERE OrderStatus = 'Completed') AS TotalCompletedOrders,
      (SELECT SUM(TotalPrice) FROM Orders) AS TotalRevenue
  `;

    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

// tổng doanh thu ngày, tuần, tháng nhen
async function getTotalRevenuePerDayWeekMonth() {
    const pool = await getConnection();

    const query = `
    SELECT
    CAST(SUM(CASE WHEN OrderDate = CAST(GETDATE() AS DATE) THEN TotalPrice ELSE 0 END) AS DECIMAL(18,2)) AS DailyRevenue,
    CAST(SUM(CASE WHEN OrderDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0) AND OrderDate <= GETDATE() THEN TotalPrice ELSE 0 END) AS DECIMAL(18,2)) AS WeeklyRevenue,
    CAST(SUM(CASE WHEN OrderDate >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0) AND OrderDate <= GETDATE() THEN TotalPrice ELSE 0 END) AS DECIMAL(18,2)) AS MonthlyRevenue
  FROM Orders
  
    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

//Biểu đồ doanh thu (tùy theo yêu cầu, có thể là doanh thu theo ngày hoặc theo tháng) nhen
async function getRevenueChartCustom() {
    const pool = await getConnection();

    const query = `
    SELECT
    CAST(OrderDate AS DATE) AS Date,
    SUM(TotalPrice) AS Revenue
    FROM Orders
    GROUP BY CAST(OrderDate AS DATE)
    ORDER BY Date
    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

//tổng số đơn hàng theo ngày, tuần, tháng, nhen
async function getTotalOrderPerDayWeekMonth() {
    const pool = await getConnection();

    const query = `
    SELECT
    COUNT(CASE WHEN OrderDate = CAST(GETDATE() AS DATE) THEN 1 END) AS DailyOrders,
    COUNT(CASE WHEN OrderDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0) AND OrderDate <= GETDATE() THEN 1 END) AS WeeklyOrders,
    COUNT(CASE WHEN OrderDate >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0) AND OrderDate <= GETDATE() THEN 1 END) AS MonthlyOrders
    FROM Orders
    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

//Biểu đồ đơn hàng (tùy theo yêu cầu, có thể là đơn hàng theo ngày hoặc theo tháng) nhen
async function getOrderChartCustom() {
    const pool = await getConnection();

    const query = `
    SELECT
    CAST(OrderDate AS DATE) AS Date,
    COUNT(*) AS Orders
    FROM Orders
    GROUP BY CAST(OrderDate AS DATE)
    ORDER BY Date
    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

//danh sách sản phẩm bán chạy, đồng nghĩa với việc inventory = 0 nhen
async function getListOfBestSellingProducts() {
    const pool = await getConnection();

    const query = `
    -- Sản phẩm bán chạy trong bảng Diamond
    SELECT COUNT(*) AS SoldOutDiamonds
    FROM Diamond
    WHERE Inventory = 0;

    -- Sản phẩm bán chạy trong bảng Bridal
    SELECT COUNT(*) AS SoldOutBridals
    FROM Bridal
    WHERE Inventory = 0;

    -- Sản phẩm bán chạy trong bảng DiamondRings
    SELECT COUNT(*) AS SoldOutDiamondRings
    FROM DiamondRings
    WHERE Inventory = 0;

    -- Sản phẩm bán chạy trong bảng DiamondTimepieces
    SELECT COUNT(*) AS SoldOutDiamondTimepieces
    FROM DiamondTimepieces
    WHERE Inventory = 0;

    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

//danh sách tồn kho của từng loại sản phẩm nhen
async function getInventoryListOfEachProductType() {
    const pool = await getConnection();

    const query = `
    -- Quản lý tồn kho cho bảng Diamond
    SELECT 'Diamond' AS ProductType, StockNumber, CaratWeight, Color, DiamondID AS ProductID, Inventory, Image
    FROM Diamond
    WHERE Inventory = 1
    UNION ALL
    

    -- Quản lý tồn kho cho bảng Bridal
    SELECT 'Bridal' AS ProductType, BridalID AS ProductID, Inventory, NameBridal, Gender, ImageBridal 
    FROM Bridal
    WHERE Inventory = 1
    UNION ALL
    

    -- Quản lý tồn kho cho bảng DiamondRings
    SELECT 'DiamondRings' AS ProductType, DiamondRingsID AS ProductID, Inventory, NameRings, Gender, ImageRings
    FROM DiamondRings
    WHERE Inventory = 1
    UNION ALL
    

    -- Quản lý tồn kho cho bảng DiamondTimepieces
    SELECT 'DiamondTimepieces' AS ProductType, DiamondTimepiecesID AS ProductID, Inventory, NameTimepieces, Gender, ImageTimepieces
    FROM DiamondTimepieces
    WHERE Inventory = 1
    UNION ALL
    
    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset; // return the entire recordset instead of recordsets[0]
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        throw error;
    }
}

//danh sách những sản phẩm hết hàng nhen
async function getListOfOutStockProducts() {
    const pool = await getConnection();

    const query = `
    -- Quản lý tồn kho cho bảng Diamond
    SELECT 'Diamond' AS ProductType, StockNumber, CaratWeight, Color, DiamondID AS ProductID, Inventory, Image
    FROM Diamond
    WHERE Inventory = 0
    UNION ALL
    

    -- Quản lý tồn kho cho bảng Bridal
    SELECT 'Bridal' AS ProductType, BridalID AS ProductID, Inventory, NameBridal, Gender, ImageBridal 
    FROM Bridal
    WHERE Inventory = 0
    UNION ALL
    

    -- Quản lý tồn kho cho bảng DiamondRings
    SELECT 'DiamondRings' AS ProductType, DiamondRingsID AS ProductID, Inventory, NameRings, Gender, ImageRings
    FROM DiamondRings
    WHERE Inventory = 0
    UNION ALL
    

    -- Quản lý tồn kho cho bảng DiamondTimepieces
    SELECT 'DiamondTimepieces' AS ProductType, DiamondTimepiecesID AS ProductID, Inventory, NameTimepieces, Gender, ImageTimepieces
    FROM DiamondTimepieces
    WHERE Inventory = 0
    UNION ALL
    `;

    try {
        const result = await pool.request().query(query);
        return result.recordset; // return the entire recordset instead of recordsets[0]
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        throw error;
    }
}

//Số Lượng Khách Hàng Mới nhen
async function getTheNumberOfNewCustomers() {
    const pool = await getConnection();

    const query = `
    -- Số lượng khách hàng mới trong ngày
    SELECT COUNT(*) AS NewCustomersToday
    FROM Account
    JOIN Roles ON Account.RoleID = Roles.RoleID
    WHERE Roles.RoleName = 'Customer'
    AND CONVERT(DATE, Account.CreatedAt) = CONVERT(DATE, GETDATE());

    -- Số lượng khách hàng mới trong tuần
    SELECT COUNT(*) AS NewCustomersThisWeek
    FROM Account
    JOIN Roles ON Account.RoleID = Roles.RoleID
    WHERE Roles.RoleName = 'Customer'
    AND DATEPART(WEEK, Account.CreatedAt) = DATEPART(WEEK, GETDATE())
    AND YEAR(Account.CreatedAt) = YEAR(GETDATE());

    -- Số lượng khách hàng mới trong tháng
    SELECT COUNT(*) AS NewCustomersThisMonth
    FROM Account
    JOIN Roles ON Account.RoleID = Roles.RoleID
    WHERE Roles.RoleName = 'Customer'
    AND MONTH(Account.CreatedAt) = MONTH(GETDATE())
    AND YEAR(Account.CreatedAt) = YEAR(GETDATE());
    `;
    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

//Số lượng phản hồi và đánh giá trung bình nhen
async function getAverageTheNumberOfResponsesAndReviews() {
    const pool = await getConnection();

    const query = `
    SELECT
    COUNT(*) AS TotalFeedback,
    AVG(r.Rating) AS AverageRating
    FROM Feedback r
    `;
    try {
        const result = await pool.request().query(query);
        return result.recordset[0];
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

module.exports = {
    getDashboardData, 
    getTotalRevenuePerDayWeekMonth, 
    getRevenueChartCustom, 
    getTotalOrderPerDayWeekMonth, 
    getOrderChartCustom, 
    getListOfBestSellingProducts, 
    getInventoryListOfEachProductType, 
    getListOfOutStockProducts,
    getTheNumberOfNewCustomers, 
    getAverageTheNumberOfResponsesAndReviews
};
