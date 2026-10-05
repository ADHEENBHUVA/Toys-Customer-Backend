const Product = require('../models/Product');
const SubCategory = require('../models/SubCategory'); // Required for population
const Review = require('../models/Review');
const Order = require('../models/Order');

// Get trending products (Active and Featured/Best Seller, or just recent Active)
exports.getTrendingProducts = async (req, res) => {
    try {
        // Aggregate the most ordered products from the Order collection
        const topSelling = await Order.aggregate([
            { $unwind: '$orderItems' },
            { $group: { _id: '$orderItems.product', totalSold: { $sum: '$orderItems.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 8 }
        ]);

        let productIds = topSelling.map(item => item._id);
        
        let products = [];
        if (productIds.length > 0) {
            // Fetch the products matching these IDs
            products = await Product.find({ _id: { $in: productIds }, status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } }).lean();
            
            // Sort them in the order of topSelling
            products.sort((a, b) => {
                return productIds.findIndex(id => id.toString() === a._id.toString()) - productIds.findIndex(id => id.toString() === b._id.toString());
            });
        }

        // If less than 24 products found, fill the rest with featured or bestSeller
        if (products.length < 24) {
            const excludeIds = products.map(p => p._id);
            const additionalProducts = await Product.find({ _id: { $nin: excludeIds }, status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } })
                .sort({ status: 1, featuredProduct: -1, bestSeller: -1, createdAt: -1 })
                .limit(24 - products.length)
                .lean();
            products = [...products, ...additionalProducts];
        }

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

// Get Best Sellers (Top 30 products ordered in the last 30 days)
exports.getBestSellers = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const topSelling = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $unwind: '$orderItems' },
            { $group: { _id: '$orderItems.product', totalSold: { $sum: '$orderItems.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 30 },
            { $sort: { totalSold: 1 } } // Ascending order as requested
        ]);

        let productIds = topSelling.map(item => item._id);

        let products = [];
        if (productIds.length > 0) {
            products = await Product.find({ _id: { $in: productIds }, status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } }).lean();
            products.sort((a, b) => {
                return productIds.findIndex(id => id.toString() === a._id.toString()) - productIds.findIndex(id => id.toString() === b._id.toString());
            });
        }

        const Category = require('../models/Category');
        const categories = await Category.find().lean();
        const catMap = {};
        categories.forEach(c => catMap[c._id.toString()] = c.name);

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
        console.error('Error fetching best sellers:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// Get all active and out of stock products
exports.getAllProducts = async (req, res) => {
    try {
        let products = await Product.find({ status: { $in: ['Active', 'Out of Stock'] } }, { images: { $slice: 5 } })
            .populate('subCategory', 'name')
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
        const product = await Product.findById(req.params.id).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const reviews = await Review.find({ product: product._id, status: 'Approved' }).populate('customer', 'firstName lastName').sort({ createdAt: -1 });
        product.reviews = reviews;
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

        // Check if user has purchased the product
        const purchasedOrdersCount = await Order.countDocuments({
            customer: customerId,
            'orderItems.product': productId
        });

        if (purchasedOrdersCount === 0) {
            return res.status(403).json({ message: 'You can only rate products you have purchased.' });
        }

        // Check if user already reviewed
        const existingReviewsCount = await Review.countDocuments({ product: productId, customer: customerId });
        if (existingReviewsCount >= purchasedOrdersCount) {
            return res.status(400).json({ message: 'You have already reviewed this product for all your purchases.' });
        }

        const review = new Review({
            product: productId,
            customer: customerId,
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

// Check review eligibility
exports.checkReviewEligibility = async (req, res) => {
    try {
        const productId = req.params.id;
        const customerId = req.user.id;
        
        const purchasedOrdersCount = await Order.countDocuments({ customer: customerId, 'orderItems.product': productId });
        const existingReviewsCount = await Review.countDocuments({ product: productId, customer: customerId });
        
        res.status(200).json({ 
            canReview: purchasedOrdersCount > existingReviewsCount,
            hasPurchased: purchasedOrdersCount > 0,
            hasReviewed: existingReviewsCount > 0
        });
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        res.status(500).json({ message: 'Server error' });
    }
};