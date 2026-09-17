const Banner = require('../models/Banner');

const getActiveBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ status: 'Active' }).sort({ displayOrder: 1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching banners', error: error.message });
    }
};

module.exports = { getActiveBanners };
