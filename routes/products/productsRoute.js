const express = require('express');
const router = express.Router();
const { getAllBrands, getAllBridal, getAllDiamond, getAllDiamondRings, getAllTimePieces } = require('../../dao/products/manageProducts');

// View Bridal
router.get('/bridals', async (req, res) => {
    try {
        const result = await getAllBridal();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching bridals:', error);
        res.status(500).send('Error fetching bridals');
    }
});

// View diamond
router.get('/diamonds', async (req, res) => {
    try {
        const result = await getAllDiamond();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching diamonds:', error);
        res.status(500).send('Error fetching diamonds');
    }
});

// View brands
router.get('/brands', async (req, res) => {
    try {
        const brands = await getAllBrands();
        res.status(200).json(brands);
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// View timepieces
router.get('/timepieces', async (req, res) => {
    try {
        const result = await getAllTimePieces();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching timepieces:', error);
        res.status(500).send('Error fetching timepieces');
    }
});

// View Diamond Rings
router.get('/diamond-rings', async (req, res) => {
    try {
        const result = await getAllDiamondRings();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching diamond rings:', error);
        res.status(500).send('Error fetching diamond rings');
    }
});

module.exports = router;
