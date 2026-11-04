const InstagramFeed = require('../models/InstagramFeed');

// GET active Instagram items for customer frontend
exports.getActiveFeed = async (req, res) => {
    try {
        const items = await InstagramFeed.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .limit(20);
        res.json({ success: true, count: items.length, data: items });
    } catch (error) {
        console.error('Error fetching active Instagram feed:', error);
        res.status(500).json({ success: false, message: 'Server error fetching Instagram feed' });
    }
};

