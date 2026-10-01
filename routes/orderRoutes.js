const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/orders
// @desc    Get all orders for the logged-in customer
router.get('/', authMiddleware, async (req, res) => {
    try {
        const Review = require('../models/Review');
        
        // req.user.id holds the customer/user ID
        const orders = await Order.find({ customer: req.user.id })
            .populate('orderItems.product')
            .sort({ createdAt: -1 }) // Newest first
            .lean();
            
        // Fetch all reviews by this user
        const userReviews = await Review.find({ customer: req.user.id }).lean();
        const reviewedProductIds = new Set(userReviews.map(r => r.product.toString()));

        // Attach hasReviewed flag to each item
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                if (item.product && reviewedProductIds.has(item.product._id.toString())) {
                    item.hasReviewed = true;
                }
            });
        });
            
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching orders' });
    }
});

module.exports = router;
