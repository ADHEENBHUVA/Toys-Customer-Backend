const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public route to get trending products
router.get('/trending', productController.getTrendingProducts);

// Public route to get all products
router.get('/', productController.getAllProducts);

// Public route to get single product by ID
router.get('/:id', productController.getProductById);

module.exports = router;
