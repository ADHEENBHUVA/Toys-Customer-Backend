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
        const reviewCounts = {};
        userReviews.forEach(r => {
            const pid = r.product.toString();
            reviewCounts[pid] = (reviewCounts[pid] || 0) + 1;
        });

        // Assign hasReviewed flag to each item, prioritizing oldest orders
        for (let i = orders.length - 1; i >= 0; i--) {
            const order = orders[i];
            order.orderItems.forEach(item => {
                if (item.product) {
                    const pid = item.product._id.toString();
                    if (reviewCounts[pid] > 0) {
                        item.hasReviewed = true;
                        reviewCounts[pid]--;
                    } else {
                        item.hasReviewed = false;
                    }
                }
            });
        }
            
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching orders' });
    }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order (only if not delivered)
router.put('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, customer: req.user.id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.orderStatus !== 'Pending') {
            return res.status(400).json({ message: 'Only Pending orders can be cancelled.' });
        }
        
        order.orderStatus = 'Cancelled';
        await order.save();
        
        res.json({ success: true, order });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ message: 'Server error while cancelling order' });
    }
});

// @route   PUT /api/orders/:id/return
// @desc    Return an order (if returnable and within return window)
router.put('/:id/return', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, customer: req.user.id }).populate('orderItems.product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({ message: 'Order must be delivered before it can be returned.' });
        }
        
        // Check if any product in the order is returnable
        let isReturnable = false;
        let maxReturnDays = 0;
        
        order.orderItems.forEach(item => {
            if (item.product && item.product.isReturnable) {
                isReturnable = true;
                if (item.product.returnDays > maxReturnDays) {
                    maxReturnDays = item.product.returnDays;
                }
            }
        });
        
        if (!isReturnable) {
            return res.status(400).json({ message: 'This order does not contain any returnable products.' });
        }
        
        // Check timeframe
        if (order.deliveredAt) {
            const deliveryDate = new Date(order.deliveredAt);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate - deliveryDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > maxReturnDays) {
                return res.status(400).json({ message: `Return window of ${maxReturnDays} days has expired.` });
            }
        }
        
        order.orderStatus = 'Returned';
        await order.save();
        
        res.json({ success: true, order });
    } catch (error) {
        console.error("Error returning order:", error);
        res.status(500).json({ message: 'Server error while returning order' });
    }
});

module.exports = router;
