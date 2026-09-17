const Brand = require('../models/Brand');

// Get active brands for Customer Frontend
exports.getActiveBrands = async (req, res) => {
    try {
        const brands = await Brand.find({ status: 'Active' }).sort({ name: 1 });
        res.status(200).json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
