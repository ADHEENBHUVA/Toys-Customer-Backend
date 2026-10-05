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
        const Category = require('../models/Category');
        const Order = require('../models/Order');

        const topCategoryStats = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderItems.product',
                    foreignField: '_id',
                    as: 'productDoc'
                }
            },
            { $unwind: '$productDoc' },
            { $match: { 'productDoc.category': { $ne: null }, 'productDoc.category': { $ne: '' } } },
            { $group: { _id: '$productDoc.category', totalSold: { $sum: '$orderItems.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 4 },
            { $sort: { totalSold: 1 } } // Ascending order
        ]);

        if (topCategoryStats.length === 0) {
            const fallbackCategories = await Category.find({ status: 'Active' })
                .sort({ displayOrder: 1, createdAt: -1 })
                .limit(4)
                .lean();
            return res.status(200).json({ success: true, data: fallbackCategories });
        }

        const catNames = topCategoryStats.map(c => c._id).filter(name => name);
        
        const topCategories = await Category.find({ name: { $in: catNames }, status: 'Active' }).lean();

        // Sort them to match the aggregate order
        topCategories.sort((a, b) => {
            return catNames.indexOf(a.name) - catNames.indexOf(b.name);
        });

        // Ensure we still have 4 categories if possible
        if (topCategories.length < 4) {
            const existingNames = topCategories.map(c => c.name);
            const additionalCategories = await Category.find({ name: { $nin: existingNames }, status: 'Active' })
                .sort({ displayOrder: 1, createdAt: -1 })
                .limit(4 - topCategories.length)
                .lean();
            topCategories.push(...additionalCategories);
        }

        res.status(200).json({ success: true, data: topCategories });
    } catch (error) {
        console.error('Error fetching top categories:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
