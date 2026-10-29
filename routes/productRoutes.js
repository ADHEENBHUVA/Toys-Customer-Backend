const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');

// Public route to get trending products
router.get('/trending', productController.getTrendingProducts);

// Public route to get all products
router.get('/', productController.getAllProducts);

// Public route to get new arrivals (last 30 days)
router.get('/new-arrivals', productController.getNewArrivals);

// Public route to get best sellers (last 30 days)
router.get('/best-sellers', productController.getBestSellers);

// Public route to get single product by ID
router.get('/:id', productController.getProductById);

// Protected route to add a review
router.post('/:id/reviews', protect, productController.addReview);

// Protected route to check review eligibility
router.get('/:id/review-eligibility', protect, productController.checkReviewEligibility);

// Public route to toggle helpful vote on a review (Dynamic)
router.post('/:id/reviews/:reviewId/helpful', productController.toggleReviewHelpful);

module.exports = router;
