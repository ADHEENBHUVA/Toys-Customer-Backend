const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public route to get trending products
router.get('/trending', productController.getTrendingProducts);

// Public route to get all products
router.get('/', productController.getAllProducts);

module.exports = router;
