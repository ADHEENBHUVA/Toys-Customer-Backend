const Product = require('../models/Product');
const SubCategory = require('../models/SubCategory'); // Required for population
const Brand = require('../models/Brand'); // Required for population
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User'); // Required for population

// Get trending products (Top 20 most ordered items across all orders)
exports.getTrendingProducts = async (req, res) => {
    try {
        // Aggregate the most ordered products from all non-cancelled, non-returned orders
        const topSelling = await Order.aggregate([
            { $match: { orderStatus: { $nin: ['Cancelled', 'Returned'] } } },
            { $unwind: '$orderItems' },
            { $group: { 
                _id: '$orderItems.product', 
                totalSold: { $sum: '$orderItems.quantity' },
                orderCount: { $sum: 1 }
            } },
            { $sort: { totalSold: -1, orderCount: -1 } },
            { $limit: 30 }
        ]);

        let productIds = topSelling.map(item => item._id).filter(Boolean);
        const soldMap = {};
        const countMap = {};
        topSelling.forEach(item => {
            if (item._id) {
                soldMap[item._id.toString()] = item.totalSold;
                countMap[item._id.toString()] = item.orderCount;
            }
        });
        
        let products = [];
        if (productIds.length > 0) {
            // Fetch the products matching these IDs
            products = await Product.find({ _id: { $in: productIds }, status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } })
                .populate('subCategory', 'name')
                .populate('brand', 'name logo')
                .lean();
            
            // Sort strictly in the order of total sold
            products.sort((a, b) => {
                const aSold = soldMap[a._id.toString()] || 0;
                const bSold = soldMap[b._id.toString()] || 0;
                return bSold - aSold;
            });
        }

        // If less than 20 products found, fill the rest to guarantee Top 20 Best Sellers
        if (products.length < 20) {
            const excludeIds = products.map(p => p._id);
            const additionalProducts = await Product.find({ _id: { $nin: excludeIds }, status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } })
                .populate('subCategory', 'name')
                .populate('brand', 'name logo')
                .sort({ bestSeller: -1, featuredProduct: -1, createdAt: -1 })
                .limit(20 - products.length)
                .lean();
            products = [...products, ...additionalProducts];
        }

        // Limit strictly to Top 20
        products = products.slice(0, 20);

        const finalProductIds = products.map(p => p._id);
        
        const Category = require('../models/Category');
        const categories = await Category.find().lean();
        const catMap = {};
        categories.forEach(c => catMap[c._id.toString()] = c.name);
        
        const reviewStats = await Review.aggregate([
            { $match: { product: { $in: finalProductIds }, status: 'Approved' } },
            { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const reviewMap = {};
        reviewStats.forEach(stat => {
            reviewMap[stat._id.toString()] = { rating: stat.avgRating, count: stat.count };
        });

        products = products.map((p, idx) => {
            const stats = reviewMap[p._id.toString()] || { rating: 0, count: 0 };
            let catName = p.category;
            if (p.category && catMap[p.category.toString()]) {
                catName = catMap[p.category.toString()];
            }
            return { 
                ...p, 
                totalSold: soldMap[p._id.toString()] || (p.bestSeller ? 25 - idx : 15 - idx),
                orderCount: countMap[p._id.toString()] || 1,
                salesRank: idx + 1,
                category: catName, 
                rating: stats.rating, 
                reviewCount: stats.count 
            };
        });

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching trending products:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// Get New Arrivals (Products added in the last 30 days)
exports.getNewArrivals = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let products = await Product.find({
            status: { $in: ['Active', 'Out of Stock'] },
            createdAt: { $gte: thirtyDaysAgo }
        }, { images: { $slice: 5 } })
            .populate('subCategory', 'name')
            .populate('brand', 'name logo')
            .sort({ createdAt: -1 })
            .lean();

        // Include Category name and Ratings, just like other endpoints
        const Category = require('../models/Category');
        const categories = await Category.find().lean();
        const catMap = {};
        categories.forEach(c => { catMap[c._id.toString()] = c.name; });

        const productIds = products.map(p => p._id);
        const reviews = await Review.aggregate([
            { $match: { product: { $in: productIds }, status: 'Approved' } },
            { $group: { _id: '$product', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const reviewMap = {};
        reviews.forEach(r => {
            reviewMap[r._id.toString()] = { rating: r.averageRating, count: r.count };
        });

        products = products.map(p => {
            const stats = reviewMap[p._id.toString()] || { rating: 0, count: 0 };
            let catName = 'Uncategorized';
            if (p.category && catMap[p.category.toString()]) {
                catName = catMap[p.category.toString()];
            }
            return { ...p, category: catName, rating: stats.rating, reviewCount: stats.count };
        });

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching new arrivals:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// Get Best Sellers (Top 20 most ordered products)
exports.getBestSellers = async (req, res) => {
    try {
        const topSelling = await Order.aggregate([
            { $match: { orderStatus: { $nin: ['Cancelled', 'Returned'] } } },
            { $unwind: '$orderItems' },
            { $group: { 
                _id: '$orderItems.product', 
                totalSold: { $sum: '$orderItems.quantity' },
                orderCount: { $sum: 1 }
            } },
            { $sort: { totalSold: -1, orderCount: -1 } },
            { $limit: 30 }
        ]);

        let productIds = topSelling.map(item => item._id).filter(Boolean);
        const soldMap = {};
        const countMap = {};
        topSelling.forEach(item => {
            if (item._id) {
                soldMap[item._id.toString()] = item.totalSold;
                countMap[item._id.toString()] = item.orderCount;
            }
        });

        let products = [];
        if (productIds.length > 0) {
            products = await Product.find({ _id: { $in: productIds }, status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } })
                .populate('subCategory', 'name')
                .populate('brand', 'name logo')
                .lean();
            products.sort((a, b) => {
                const aSold = soldMap[a._id.toString()] || 0;
                const bSold = soldMap[b._id.toString()] || 0;
                return bSold - aSold;
            });
        }

        // Fill remaining up to 20 products
        if (products.length < 20) {
            const excludeIds = products.map(p => p._id);
            const additionalProducts = await Product.find({ _id: { $nin: excludeIds }, status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } })
                .populate('subCategory', 'name')
                .populate('brand', 'name logo')
                .sort({ bestSeller: -1, featuredProduct: -1, createdAt: -1 })
                .limit(20 - products.length)
                .lean();
            products = [...products, ...additionalProducts];
        }

        // Strictly Top 20
        products = products.slice(0, 20);

        const finalProductIds = products.map(p => p._id);

        const Category = require('../models/Category');
        const categories = await Category.find().lean();
        const catMap = {};
        categories.forEach(c => catMap[c._id.toString()] = c.name);

        const reviewStats = await Review.aggregate([
            { $match: { product: { $in: finalProductIds }, status: 'Approved' } },
            { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const reviewMap = {};
        reviewStats.forEach(stat => {
            reviewMap[stat._id.toString()] = { rating: stat.avgRating, count: stat.count };
        });

        products = products.map((p, idx) => {
            const stats = reviewMap[p._id.toString()] || { rating: 0, count: 0 };
            let catName = p.category;
            if (p.category && catMap[p.category.toString()]) {
                catName = catMap[p.category.toString()];
            }
            return { 
                ...p, 
                category: catName, 
                rating: stats.rating, 
                reviewCount: stats.count,
                totalSold: soldMap[p._id.toString()] || (p.bestSeller ? 25 - idx : 15 - idx),
                salesRank: idx + 1
            };
        });

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// Get all active and out of stock products
exports.getAllProducts = async (req, res) => {
    try {
        let products = await Product.find({ status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } })
            .populate('subCategory', 'name')
            .populate('brand', 'name logo')
            .sort({ bestSeller: -1, createdAt: -1 })
            .lean();
        
        // Sort Active first, Out of Stock last
        products.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return 0;
        });
        
        const Category = require('../models/Category');
        const categories = await Category.find().lean();
        const catMap = {};
        categories.forEach(c => catMap[c._id.toString()] = c.name);

        const productIds = products.map(p => p._id);
        const reviewStats = await Review.aggregate([
            { $match: { product: { $in: productIds }, status: 'Approved' } },
            { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const reviewMap = {};
        reviewStats.forEach(stat => {
            reviewMap[stat._id.toString()] = { rating: stat.avgRating, count: stat.count };
        });

        products = products.map(p => {
            const stats = reviewMap[p._id.toString()] || { rating: 0, count: 0 };
            let catName = p.category;
            if (p.category && catMap[p.category.toString()]) {
                catName = catMap[p.category.toString()];
            }
            return { ...p, category: catName, rating: stats.rating, reviewCount: stats.count };
        });

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('subCategory', 'name')
            .populate('brand', 'name logo')
            .lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const reviews = await Review.find({ product: product._id, status: 'Approved' })
            .populate('customer', 'name email firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        product.reviews = reviews.map(r => ({
            ...r,
            customerName: r.customerName || r.customer?.name || (r.customer?.firstName ? `${r.customer.firstName} ${r.customer?.lastName || ''}`.trim() : '') || 'Happy Customer',
            helpfulCount: typeof r.helpfulCount === 'number' ? r.helpfulCount : 0,
            helpfulUsers: r.helpfulUsers || []
        }));
        product.reviewCount = reviews.length;
        product.rating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;

        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Server error fetching product' });
    }
};

// Add a review
exports.addReview = async (req, res) => {
    try {
        const { rating, reviewText } = req.body;
        const productId = req.params.id;
        const customerId = req.user.id;

        // Check if user has a DELIVERED order containing this product
        const deliveredOrdersCount = await Order.countDocuments({
            customer: customerId,
            'orderItems.product': productId,
            orderStatus: 'Delivered'
        });

        if (deliveredOrdersCount === 0) {
            return res.status(403).json({ message: 'You can only rate products from delivered orders.' });
        }

        // Check if user already reviewed (max 1 review per delivered order)
        const existingReviewsCount = await Review.countDocuments({ product: productId, customer: customerId });
        if (existingReviewsCount >= deliveredOrdersCount) {
            return res.status(400).json({ message: 'You have already reviewed this product for all your delivered orders.' });
        }

        // Fetch user & delivered order to capture customer name from the booked order
        const deliveredOrder = await Order.findOne({
            customer: customerId,
            'orderItems.product': productId,
            orderStatus: 'Delivered'
        }).sort({ createdAt: -1 });

        const User = require('../models/User');
        const user = await User.findById(customerId);
        const bookedCustomerName = deliveredOrder?.shippingAddress?.fullName || user?.name || 'Valued Customer';

        const review = new Review({
            product: productId,
            customer: customerId,
            customerName: bookedCustomerName,
            rating,
            reviewText,
            status: 'Pending' // Requires admin approval
        });

        await review.save();

        res.status(201).json({ message: 'Review submitted successfully.' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Server error adding review' });
    }
};

// Check review eligibility - only DELIVERED orders count
exports.checkReviewEligibility = async (req, res) => {
    try {
        const productId = req.params.id;
        const customerId = req.user.id;
        
        // Only count delivered orders for eligibility
        const deliveredOrdersCount = await Order.countDocuments({
            customer: customerId,
            'orderItems.product': productId,
            orderStatus: 'Delivered'
        });
        const existingReviewsCount = await Review.countDocuments({ product: productId, customer: customerId });
        
        res.status(200).json({ 
            canReview: deliveredOrdersCount > existingReviewsCount,
            hasPurchased: deliveredOrdersCount > 0,
            hasReviewed: existingReviewsCount > 0
        });
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle Helpful vote on a review (Dynamic)
exports.toggleReviewHelpful = async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        const { visitorId } = req.body;
        const voterId = visitorId || req.ip || 'guest';

        const review = await Review.findOne({ _id: reviewId, product: id });
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (!Array.isArray(review.helpfulUsers)) {
            review.helpfulUsers = [];
        }

        const userIndex = review.helpfulUsers.indexOf(voterId);
        let hasVoted = false;

        if (userIndex > -1) {
            review.helpfulUsers.splice(userIndex, 1);
            review.helpfulCount = Math.max(0, (review.helpfulCount || 1) - 1);
            hasVoted = false;
        } else {
            review.helpfulUsers.push(voterId);
            review.helpfulCount = (review.helpfulCount || 0) + 1;
            hasVoted = true;
        }

        await review.save();

        res.json({
            success: true,
            helpfulCount: review.helpfulCount,
            hasVoted
        });
    } catch (error) {
        console.error('Error toggling helpful vote:', error);
        res.status(500).json({ message: 'Server error updating helpful count' });
    }
};