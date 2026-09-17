const Product = require('../models/Product');

// Get trending products (Active and Featured/Best Seller, or just recent Active)
exports.getTrendingProducts = async (req, res) => {
    try {
        // Fetch up to 8 active products. Prioritize featured or bestSeller if applicable.
        const products = await Product.find({ status: 'Active' }, { images: { $slice: 1 } })
            .sort({ featuredProduct: -1, bestSeller: -1, createdAt: -1 })
            .limit(8);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching trending products:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// Get all active products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: 'Active' }, { images: { $slice: 1 } }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};
