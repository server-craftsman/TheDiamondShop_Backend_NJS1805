const express = require("express");
const router = express.Router();
const {
  getAllBrands,
  getAllBridals,
  getAllDiamonds,
  getAllDiamondRings,
  getAllTimePieces,
} = require("../../dao/products/manageProducts");

// View Bridal
router.get("/bridals", async (req, response) => {
  getAllBridals()
    .then((result) => {
      response.json(result[0]);
    })
    .catch((error) => {
      console.error("Error fetching bridals: ", error);
      response.status(500).send("Error fetching bridals");
    });
});

// View diamonds
router.get("/diamonds", async (req, response) => {
  getAllDiamonds()
    .then((result) => {
      response.json(result[0]);
    })
    .catch((error) => {
      console.error("Error fetching diamonds: ", error);
      response.status(500).send("Error fetching diamonds");
    });
});

// View brands
router.get("/brands", async (req, res) => {
  try {
    const brands = await getAllBrands();
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// View timepieces
router.get("/timepieces", async (req, response) => {
    getAllTimePieces().then(result => {
        response.json(result[0]);
    }).catch(error => {
        console.error('Error fetching timepieces: ', error);
        response.status(500).send('Error fetching timepieces');
    });
});

// View Diamond Rings
router.get("/diamond-rings", async (req, response) => {
    getAllDiamondRings().then(result => {
        response.json(result[0]);
    }).catch(error => {
        console.error('Error fetching diamond rings: ', error);
        response.status(500).send('Error fetching diamond rings');
    });
});

module.exports = router;
