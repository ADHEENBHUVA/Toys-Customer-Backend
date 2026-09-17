const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/orders
// @desc    Get all orders for the logged-in customer
router.get('/', authMiddleware, async (req, res) => {
    try {
        // req.user.id holds the customer/user ID
        const orders = await Order.find({ customer: req.user.id })
            .populate('orderItems.product')
            .sort({ createdAt: -1 }); // Newest first
            
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching orders' });
    }
});

module.exports = router;
