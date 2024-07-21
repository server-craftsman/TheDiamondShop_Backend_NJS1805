const express = require('express');
const router = express.Router();
const path = require('path');
const dashboard =require('../../dao/admin-dashboard/dashboard')

//test || tổng sổ lượng từng loại sản phẩm, số lượng bán ra tất cả sản phẩm, tổng doanh thu
router.get('/dashboard', async (req, res) => {
    try {
      const data = await dashboard.getDashboardData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

// tổng doanh thu ngày, tuần, tháng nhen
router.get('/revenue', async (req, res) => {
    try {
      const data = await dashboard.getTotalRevenuePerDayWeekMonth();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

//Biểu đồ doanh thu (tùy theo yêu cầu, có thể là doanh thu theo ngày hoặc theo tháng) nhen
router.get('/revenue-chart', async (req, res) => {
  try {
    const data = await dashboard.getRevenueChartCustom();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

//tổng số đơn hàng theo ngày, tuần, tháng, nhen
router.get('/total-order', async (req, res) => {
  try {
    const data = await dashboard.getTotalOrderPerDayWeekMonth();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

//Biểu đồ đơn hàng (tùy theo yêu cầu, có thể là đơn hàng theo ngày hoặc theo tháng) nhen
router.get('/order-chart', async (req, res) => {
  try {
    const data = await dashboard.getOrderChartCustom();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

//danh sách sản phẩm bán chạy, đồng nghĩa với việc inventory = 0 nhen
router.get('/best-seller', async (req, res) => {
  try {
    const data = await dashboard.getListOfBestSellingProducts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

//danh sách tồn kho của từng loại sản phẩm nhen
router.get('/inventory-list', async (req, res) => {
  try {
    const data = await dashboard.getInventoryListOfEachProductType();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

//danh sách sản phẩm hết hàng nhen
router.get('/out-stock-list', async (req, res) => {
  try {
    const data = await dashboard.getListOfOutStockProducts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

//Số Lượng Khách Hàng Mới nhen
router.get('/new-customer', async (req, res) => {
  try {
    const data = await dashboard.getTheNumberOfNewCustomers();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

//Số lượng phản hồi và đánh giá trung bình nhen
router.get('/average-reviews', async (req, res) => {
  try {
    const data = await dashboard.getAverageTheNumberOfResponsesAndReviews();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

  module.exports = router;