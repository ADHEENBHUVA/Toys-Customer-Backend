const Category = require('../models/Category');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ status: 'Active' }).sort({ displayOrder: 1, createdAt: -1 }).lean();
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getTopCategories = async (req, res) => {
    try {
        const Product = require('../models/Product');
        const Category = require('../models/Category');

        const topCategoryStats = await Product.aggregate([
            { $match: { status: { $in: ['Active', 'Out of Stock'] } } },
            { $group: { _id: '$category', productCount: { $sum: 1 } } },
            { $sort: { productCount: -1 } },
            { $limit: 4 }
        ]);

        const catIds = topCategoryStats.map(c => c._id);
        
        const topCategories = await Category.find({ _id: { $in: catIds }, status: 'Active' }).lean();

        // Sort them to match the aggregate order
        topCategories.sort((a, b) => {
            return catIds.findIndex(id => id && id.toString() === a._id.toString()) - catIds.findIndex(id => id && id.toString() === b._id.toString());
        });

        res.status(200).json({ success: true, data: topCategories });
    } catch (error) {
        console.error('Error fetching top categories:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
